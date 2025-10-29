// api/index.ts
import express from 'express';
import { createServer } from 'http';
import { storage } from '../server/storage.js';
import {
  insertCaseSchema,
  insertDocumentSchema,
  insertDeadlineSchema,
} from '../shared/schema.js';
import {
  analyzeLegalDocument,
  checkRule12b6Compliance,
  getLegalGuidance,
  learnFromDocument,
} from '../server/openai.js';
import { upload, extractTextFromFile } from '../server/upload.js';

let app: express.Express | null = null;
let initializationError: Error | null = null;

/**
 * Initialize the Express app (runs only once)
 */
async function initializeApp(): Promise<express.Express> {
  if (app) {
    console.log('[Init] Using cached app instance');
    return app;
  }
  if (initializationError) {
    console.error('[Init] Initialization previously failed:', initializationError);
    throw initializationError;
  }

  console.log('[Init] Initializing Express app...');
  try {
    const newApp = express();

    // Middleware
    newApp.use(express.json({
      verify: (req: any, _res: any, buf: any) => {
        req.rawBody = buf;
      }
    }));
    newApp.use(express.urlencoded({ extended: false }));

    // Logging middleware (optional, but helpful for debugging)
    newApp.use((req, res, next) => {
      const start = Date.now();
      const path = req.path;
      let capturedJsonResponse: any = undefined;

      const originalResJson = res.json;
      res.json = function (bodyJson, ...args) {
        capturedJsonResponse = bodyJson;
        return originalResJson.apply(res, [bodyJson, ...args]);
      };

      res.on("finish", () => {
        const duration = Date.now() - start;
        if (path.startsWith("/api")) {
          let logLine = `[API Log] ${req.method} ${path} ${res.statusCode} in ${duration}ms`;
          // Optionally log response body (can be verbose)
          // if (capturedJsonResponse) {
          //   logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
          // }
          // if (logLine.length > 150) { // Increased length limit
          //   logLine = logLine.slice(0, 149) + "…";
          // }
          console.log(logLine);
        }
      });

      next();
    });

    // ============================================================================
    // ROUTES
    // ============================================================================

    // Health check endpoint
    newApp.get("/api/health", (req, res) => {
      res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        environment: process.env.VERCEL ? "vercel" : "local"
      });
    });

    // Cases endpoints
    newApp.get("/api/cases", async (req, res) => {
      try {
        console.log('[API] GET /api/cases');
        const cases = await storage.getCases();
        res.json(cases);
      } catch (error: any) {
        console.error('[API] Error fetching cases:', error);
        res.status(500).json({ error: error.message });
      }
    });

    newApp.get("/api/cases/:id", async (req, res) => {
      try {
        console.log(`[API] GET /api/cases/${req.params.id}`);
        const caseItem = await storage.getCase(req.params.id);
        if (!caseItem) {
          return res.status(404).json({ error: "Case not found" });
        }
        res.json(caseItem);
      } catch (error: any) {
        console.error(`[API] Error fetching case ${req.params.id}:`, error);
        res.status(500).json({ error: error.message });
      }
    });

    newApp.post("/api/cases", async (req, res) => {
      try {
        console.log('[API] POST /api/cases', JSON.stringify(req.body, null, 2));
        const data = insertCaseSchema.parse(req.body);
        const newCase = await storage.createCase(data);
        console.log(`[API] ✓ Case created: ${newCase.id}`);
        res.status(201).json(newCase);
      } catch (error: any) {
        console.error('[API] Error creating case:', error);
        res.status(400).json({
          error: error.message,
          details: (error as any).errors || undefined // More robust error handling
        });
      }
    });


    newApp.patch("/api/cases/:id", async (req, res) => {
      try {
        console.log(`[API] PATCH /api/cases/${req.params.id}`);
        const updated = await storage.updateCase(req.params.id, req.body);
        if (!updated) {
          return res.status(404).json({ error: "Case not found" });
        }
        res.json(updated);
      } catch (error: any) {
        console.error(`[API] Error updating case ${req.params.id}:`, error);
        res.status(400).json({ error: error.message });
      }
    });

    // Case-specific documents
    newApp.get("/api/cases/:id/documents", async (req, res) => {
      try {
        const documents = await storage.getCaseDocuments(req.params.id);
        res.json(documents);
      } catch (error: any) {
        console.error(`[API] Error fetching case documents:`, error);
        res.status(500).json({ error: error.message });
      }
    });

    // Case-specific deadlines
    newApp.get("/api/cases/:id/deadlines", async (req, res) => {
      try {
        const deadlines = await storage.getCaseDeadlines(req.params.id);
        res.json(deadlines);
      } catch (error: any) {
        console.error(`[API] Error fetching case deadlines:`, error);
        res.status(500).json({ error: error.message });
      }
    });

    // Documents endpoints
    newApp.get("/api/documents", async (req, res) => {
      try {
        const documents = await storage.getDocuments();
        res.json(documents);
      } catch (error: any) {
        console.error('[API] Error fetching documents:', error);
        res.status(500).json({ error: error.message });
      }
    });

    newApp.get("/api/documents/:id", async (req, res) => {
      try {
        const document = await storage.getDocument(req.params.id);
        if (!document) {
          return res.status(404).json({ error: "Document not found" });
        }
        res.json(document);
      } catch (error: any) {
        console.error(`[API] Error fetching document:`, error);
        res.status(500).json({ error: error.message });
      }
    });

    // Document upload with file handling
    newApp.post("/api/documents/upload", upload.single("file"), async (req, res) => {
      console.log("\n=== Document Upload Request ===");
      console.log("Body:", JSON.stringify(req.body, null, 2));
      console.log("File:", req.file ? {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      } : "No file uploaded");

      try {
        const { caseId, title, documentType, content } = req.body;

        if (!caseId || !title || !documentType) {
          console.log("✗ Missing required fields");
          return res.status(400).json({
            error: "Missing required fields",
            details: {
              caseId: !caseId ? "required" : "present",
              title: !title ? "required" : "present",
              documentType: !documentType ? "required" : "present"
            }
          });
        }

        const caseItem = await storage.getCase(caseId);
        if (!caseItem) {
          console.log(`✗ Case not found: ${caseId}`);
          return res.status(404).json({ error: "Case not found" });
        }

        let extractedText = "";

        if (!req.file && content) {
          extractedText = content;
        } else if (req.file) {
          try {
            extractedText = await extractTextFromFile(
              req.file.buffer,
              req.file.mimetype,
              req.file.originalname
            );
          } catch (extractError: any) {
            console.error("✗ Text extraction failed:", extractError.message);
            return res.status(400).json({
              error: "Failed to extract text from file",
              details: extractError.message
            });
          }
        } else {
          return res.status(400).json({
            error: "No file uploaded and no content provided"
          });
        }

        if (!extractedText || extractedText.trim().length === 0) {
          return res.status(400).json({
            error: "Could not extract text from file or no content provided"
          });
        }

        let aiAnalysis = null;
        let complianceCheck = null;

        try {
          aiAnalysis = await analyzeLegalDocument(
            extractedText,
            documentType,
            caseItem.jurisdiction
          );

          if (documentType.toLowerCase().includes("complaint")) {
            complianceCheck = await checkRule12b6Compliance(
              extractedText,
              caseItem.jurisdiction
            );

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
        } catch (aiError: any) {
          console.error("⚠ AI analysis error:", aiError.message);
        }

        const newDocument = await storage.createDocument({
          caseId,
          title,
          documentType,
          content: extractedText,
          fileName: req.file?.originalname || null,
          fileSize: req.file?.size || null,
          aiAnalysis,
          complianceCheck,
        });

        console.log(`✓ Document saved: ${newDocument.id}`);
        res.status(201).json(newDocument);
      } catch (error: any) {
        console.error("✗ Upload failed:", error);
        res.status(500).json({
          error: "Upload failed",
          details: error.message
        });
      }
    });

    // Fallback for text-only document creation
    newApp.post("/api/documents", async (req, res) => {
      try {
        const data = insertDocumentSchema.parse(req.body);
        const caseItem = await storage.getCase(data.caseId);

        if (!caseItem) {
          return res.status(404).json({ error: "Case not found" });
        }

        let aiAnalysis = null;
        let complianceCheck = null;

        try {
          aiAnalysis = await analyzeLegalDocument(
            data.content,
            data.documentType,
            caseItem.jurisdiction
          );

          if (data.documentType.toLowerCase().includes("complaint")) {
            complianceCheck = await checkRule12b6Compliance(
              data.content,
              caseItem.jurisdiction
            );

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
        }

        const newDocument = await storage.createDocument({
          ...data,
          aiAnalysis,
          complianceCheck,
        });

        res.status(201).json(newDocument);
      } catch (error: any) {
        console.error('[API] Error creating document:', error);
        res.status(400).json({ error: error.message });
      }
    });

    // Deadlines endpoints
    newApp.get("/api/deadlines", async (req, res) => {
      try {
        const deadlines = await storage.getDeadlines();
        res.json(deadlines);
      } catch (error: any) {
        console.error('[API] Error fetching deadlines:', error);
        res.status(500).json({ error: error.message });
      }
    });

    newApp.get("/api/deadlines/upcoming", async (req, res) => {
      try {
        const deadlines = await storage.getUpcomingDeadlines();
        res.json(deadlines);
      } catch (error: any) {
        console.error('[API] Error fetching upcoming deadlines:', error);
        res.status(500).json({ error: error.message });
      }
    });

    newApp.post("/api/deadlines", async (req, res) => {
      try {
        const data = insertDeadlineSchema.parse(req.body);
        const newDeadline = await storage.createDeadline(data);
        res.status(201).json(newDeadline);
      } catch (error: any) {
        console.error('[API] Error creating deadline:', error);
        res.status(400).json({ error: error.message });
      }
    });

    newApp.patch("/api/deadlines/:id", async (req, res) => {
      try {
        const updated = await storage.updateDeadline(req.params.id, req.body);
        if (!updated) {
          return res.status(404).json({ error: "Deadline not found" });
        }
        res.json(updated);
      } catch (error: any) {
        console.error('[API] Error updating deadline:', error);
        res.status(400).json({ error: error.message });
      }
    });

    // Chat endpoints
    newApp.get("/api/chat/:contextId?", async (req, res) => {
      try {
        const contextId = req.params.contextId === "general" ? null : req.params.contextId;
        const messages = await storage.getChatMessages(contextId || null);
        res.json(messages);
      } catch (error: any) {
        console.error('[API] Error fetching chat messages:', error);
        res.status(500).json({ error: error.message });
      }
    });

    newApp.post("/api/chat", async (req, res) => {
      try {
        const { content, caseId } = req.body;

        if (!content) {
          return res.status(400).json({ error: "Message content is required" });
        }

        const userMessage = await storage.createChatMessage({
          caseId: caseId || null,
          role: "user",
          content,
          sources: null,
          metadata: null,
        });

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

        const { answer, sources } = await getLegalGuidance(
          content,
          jurisdiction,
          caseContext
        );

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
        console.error('[API] Error in chat:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Error handler
    newApp.use((err: any, _req: any, res: any, _next: any) => {
      console.error('[API] Unhandled error:', err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });

    console.log('[Init] ✓ App initialized successfully');
    app = newApp; // Cache the initialized app
    return newApp; // **THIS IS THE FIX: Return inside the function**

  } catch (error: any) {
    console.error('[Init] ✗ Initialization failed:', error);
    initializationError = error; // Cache the error
    throw error; // Rethrow to fail the handler
  }
} // **THIS IS THE FIX: Closing brace for initializeApp**

/**
 * Vercel Serverless Function Handler
 * This is called on every request and reuses the initialized app
 */
export default async function handler(req: any, res: any) {
  const startTime = Date.now();
  console.log(`[Handler] ${req.method} ${req.url}`);

  try {
    const expressApp = await initializeApp(); // Get or initialize the app
    // Use the Express app instance directly as the handler
    expressApp(req, res);

    // Logging completion can be tricky if response ends asynchronously
    // Using res.on('finish') might be more reliable if needed
    // res.on('finish', () => {
    //   const duration = Date.now() - startTime;
    //   console.log(`[Handler] Completed ${req.method} ${req.url} with status ${res.statusCode} in ${duration}ms`);
    // });

  } catch (error: any) {
    console.error('[Handler] Request failed during initialization or routing:', error);

    // Send error response if headers not sent yet
    if (!res.headersSent) {
      res.status(500).json({
        error: "Server error",
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
}
