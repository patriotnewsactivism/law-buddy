import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertCaseSchema,
  insertDocumentSchema,
  insertDeadlineSchema,
  insertChatMessageSchema,
} from "@shared/schema";
import {
  analyzeLegalDocument,
  checkRule12b6Compliance,
  getLegalGuidance,
  learnFromDocument,
} from "./openai";
import { upload, extractTextFromFile, cleanupFile } from "./upload";

export async function registerRoutes(app: Express): Promise<Server> {
  // Cases endpoints
  app.get("/api/cases", async (req, res) => {
    try {
      const cases = await storage.getCases();
      res.json(cases);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/cases/:id", async (req, res) => {
    try {
      const caseItem = await storage.getCase(req.params.id);
      if (!caseItem) {
        return res.status(404).json({ error: "Case not found" });
      }
      res.json(caseItem);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/cases", async (req, res) => {
    try {
      const data = insertCaseSchema.parse(req.body);
      const newCase = await storage.createCase(data);
      res.status(201).json(newCase);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/cases/:id", async (req, res) => {
    try {
      const updated = await storage.updateCase(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Case not found" });
      }
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Case-specific documents
  app.get("/api/cases/:id/documents", async (req, res) => {
    try {
      const documents = await storage.getCaseDocuments(req.params.id);
      res.json(documents);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Case-specific deadlines
  app.get("/api/cases/:id/deadlines", async (req, res) => {
    try {
      const deadlines = await storage.getCaseDeadlines(req.params.id);
      res.json(deadlines);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Documents endpoints
  app.get("/api/documents", async (req, res) => {
    try {
      const documents = await storage.getDocuments();
      res.json(documents);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/documents/:id", async (req, res) => {
    try {
      const document = await storage.getDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.json(document);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Document upload with file handling
  app.post("/api/documents/upload", upload.single("file"), async (req, res) => {
    let filePath: string | undefined;
    
    try {
      const { caseId, title, documentType, content, fileName, fileSize } = req.body;

      if (!caseId || !title || !documentType) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // If no file but has content, treat as manual text input
      if (!req.file && content) {
        const caseItem = await storage.getCase(caseId);
        if (!caseItem) {
          return res.status(404).json({ error: "Case not found" });
        }

        // Analyze manually entered document with AI
        let aiAnalysis = null;
        let complianceCheck = null;

        try {
          aiAnalysis = await analyzeLegalDocument(
            content,
            documentType,
            caseItem.jurisdiction
          );

          if (documentType.toLowerCase().includes("complaint")) {
            complianceCheck = await checkRule12b6Compliance(
              content,
              caseItem.jurisdiction
            );

            const learningPatterns = await learnFromDocument(
              documentType,
              caseItem.jurisdiction,
              content,
              complianceCheck
            );

            if (learningPatterns) {
              await storage.createLearningData({
                category: "document_quality",
                jurisdiction: caseItem.jurisdiction,
                documentType: documentType,
                patterns: learningPatterns,
                successMetrics: complianceCheck,
              });
            }
          }
        } catch (aiError) {
          console.error("AI analysis error:", aiError);
        }

        const newDocument = await storage.createDocument({
          caseId,
          title,
          documentType,
          content,
          fileName: null,
          fileSize: null,
          aiAnalysis,
          complianceCheck,
        });

        return res.status(201).json(newDocument);
      }

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded and no content provided" });
      }

      filePath = req.file.path;

      // Get case info for context
      const caseItem = await storage.getCase(caseId);
      if (!caseItem) {
        return res.status(404).json({ error: "Case not found" });
      }

      // Extract text from the uploaded file
      const extractedText = await extractTextFromFile(req.file.path, req.file.mimetype);

      if (!extractedText || extractedText.trim().length === 0) {
        return res.status(400).json({ error: "Could not extract text from file" });
      }

      // Analyze document with AI
      let aiAnalysis = null;
      let complianceCheck = null;

      try {
        aiAnalysis = await analyzeLegalDocument(
          extractedText,
          documentType,
          caseItem.jurisdiction
        );

        // If it's a complaint, check Rule 12(b)(6) compliance
        if (documentType.toLowerCase().includes("complaint")) {
          complianceCheck = await checkRule12b6Compliance(
            extractedText,
            caseItem.jurisdiction
          );

          // Learn from this document
          const learningPatterns = await learnFromDocument(
            documentType,
            caseItem.jurisdiction,
            extractedText,
            complianceCheck
          );

          if (learningPatterns) {
            await storage.createLearningData({
              category: "document_quality",
              jurisdiction: caseItem.jurisdiction,
              documentType: documentType,
              patterns: learningPatterns,
              successMetrics: complianceCheck,
            });
          }
        }
      } catch (aiError) {
        console.error("AI analysis error:", aiError);
        // Continue without AI analysis if it fails
      }

      const newDocument = await storage.createDocument({
        caseId,
        title,
        documentType,
        content: extractedText,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        aiAnalysis,
        complianceCheck,
      });

      // Clean up uploaded file
      await cleanupFile(filePath);

      res.status(201).json(newDocument);
    } catch (error: any) {
      // Clean up file on error
      if (filePath) {
        await cleanupFile(filePath);
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Fallback for text-only document creation (for manual text input)
  app.post("/api/documents", async (req, res) => {
    try {
      const data = insertDocumentSchema.parse(req.body);
      
      // Get case info for context
      const caseItem = await storage.getCase(data.caseId);
      if (!caseItem) {
        return res.status(404).json({ error: "Case not found" });
      }

      // Analyze document with AI
      let aiAnalysis = null;
      let complianceCheck = null;

      try {
        aiAnalysis = await analyzeLegalDocument(
          data.content,
          data.documentType,
          caseItem.jurisdiction
        );

        // If it's a complaint, check Rule 12(b)(6) compliance
        if (data.documentType.toLowerCase().includes("complaint")) {
          complianceCheck = await checkRule12b6Compliance(
            data.content,
            caseItem.jurisdiction
          );

          // Learn from this document
          const learningPatterns = await learnFromDocument(
            data.documentType,
            caseItem.jurisdiction,
            data.content,
            complianceCheck
          );

          if (learningPatterns) {
            await storage.createLearningData({
              category: "document_quality",
              jurisdiction: caseItem.jurisdiction,
              documentType: data.documentType,
              patterns: learningPatterns,
              successMetrics: complianceCheck,
            });
          }
        }
      } catch (aiError) {
        console.error("AI analysis error:", aiError);
        // Continue without AI analysis if it fails
      }

      const newDocument = await storage.createDocument({
        ...data,
        aiAnalysis,
        complianceCheck,
      });

      res.status(201).json(newDocument);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Deadlines endpoints
  app.get("/api/deadlines", async (req, res) => {
    try {
      const deadlines = await storage.getDeadlines();
      res.json(deadlines);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/deadlines/upcoming", async (req, res) => {
    try {
      const deadlines = await storage.getUpcomingDeadlines();
      res.json(deadlines);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/deadlines", async (req, res) => {
    try {
      const data = insertDeadlineSchema.parse(req.body);
      const newDeadline = await storage.createDeadline(data);
      res.status(201).json(newDeadline);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/deadlines/:id", async (req, res) => {
    try {
      const updated = await storage.updateDeadline(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Deadline not found" });
      }
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Chat endpoints
  app.get("/api/chat/:contextId?", async (req, res) => {
    try {
      const contextId = req.params.contextId === "general" ? null : req.params.contextId;
      const messages = await storage.getChatMessages(contextId || null);
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { content, caseId } = req.body;

      if (!content) {
        return res.status(400).json({ error: "Message content is required" });
      }

      // Save user message
      const userMessage = await storage.createChatMessage({
        caseId: caseId || null,
        role: "user",
        content,
        sources: null,
        metadata: null,
      });

      // Get case context if provided
      let caseContext = null;
      let jurisdiction = "general";
      if (caseId) {
        const caseItem = await storage.getCase(caseId);
        if (caseItem) {
          caseContext = {
            title: caseItem.title,
            plaintiff: caseItem.plaintiff,
            defendant: caseItem.defendant,
            jurisdiction: caseItem.jurisdiction,
            description: caseItem.description,
          };
          jurisdiction = caseItem.jurisdiction;
        }
      }

      // Get AI response
      const { answer, sources } = await getLegalGuidance(
        content,
        jurisdiction,
        caseContext
      );

      // Save AI response
      const aiMessage = await storage.createChatMessage({
        caseId: caseId || null,
        role: "assistant",
        content: answer,
        sources,
        metadata: caseContext ? { caseContext } : null,
      });

      res.status(201).json({
        userMessage,
        aiMessage,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
