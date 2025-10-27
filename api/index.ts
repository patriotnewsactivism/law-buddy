// api/index.ts
import express from 'express';
import { createServer } from 'http';
import { storage } from '../server/storage';
import {
  insertCaseSchema,
  insertDocumentSchema,
  insertDeadlineSchema,
} from '../shared/schema';
import {
  analyzeLegalDocument,
  checkRule12b6Compliance,
  getLegalGuidance,
  learnFromDocument,
} from '../server/openai';
import { upload, extractTextFromFile } from '../server/upload';

// Create express app
const app = express();

// Middleware
app.use(express.json({
  verify: (req: any, _res: any, buf: any) => {
    req.rawBody = buf;
  }
}));

app.use(express.urlencoded({ extended: false }));

// Logging middleware
app.use((req, res, next) => {
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
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      console.log(logLine);
    }
  });

  next();
});

// ============================================================================
// ROUTES - Inlined to avoid module resolution issues in Vercel
// ============================================================================

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

// Document upload with file handling - FIXED VERSION
app.post("/api/documents/upload", upload.single("file"), async (req, res) => {
  console.log("\n=== Document Upload Request ===");
  console.log("Body:", JSON.stringify(req.body, null, 2));
  console.log("File:", req.file ? {
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size
  } : "No file uploaded");
  
  try {
    const { caseId, title, documentType, content } = req.body;

    // Validate required fields
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

    console.log(`Processing document: ${title} (${documentType}) for case ${caseId}`);

    // Verify case exists
    console.log("Verifying case exists...");
    const caseItem = await storage.getCase(caseId);
    if (!caseItem) {
      console.log(`✗ Case not found: ${caseId}`);
      return res.status(404).json({ error: "Case not found" });
    }
    console.log(`✓ Case found: ${caseItem.title} (${caseItem.jurisdiction})`);

    let extractedText = "";

    // Handle manual text input (no file)
    if (!req.file && content) {
      console.log("Using manually entered content");
      extractedText = content;
    }
    // Handle file upload
    else if (req.file) {
      console.log("Extracting text from uploaded file...");
      try {
        extractedText = await extractTextFromFile(
          req.file.buffer, 
          req.file.mimetype,
          req.file.originalname
        );
        console.log(`✓ Text extracted successfully (${extractedText.length} characters)`);
      } catch (extractError: any) {
        console.error("✗ Text extraction failed:", extractError.message);
        return res.status(400).json({ 
          error: "Failed to extract text from file",
          details: extractError.message 
        });
      }
    }
    // No file and no content
    else {
      console.log("✗ No file uploaded and no content provided");
      return res.status(400).json({ 
        error: "No file uploaded and no content provided" 
      });
    }

    // Validate we have text
    if (!extractedText || extractedText.trim().length === 0) {
      console.log("✗ No text content extracted");
      return res.status(400).json({ 
        error: "Could not extract text from file or no content provided" 
      });
    }

    console.log(`✓ Document has ${extractedText.length} characters of text`);

    // AI Analysis
    let aiAnalysis = null;
    let complianceCheck = null;

    console.log("Starting AI analysis...");
    try {
      console.log("  - Analyzing document structure and content...");
      aiAnalysis = await analyzeLegalDocument(
        extractedText,
        documentType,
        caseItem.jurisdiction
      );
      console.log("  ✓ Document analysis complete");

      // Check compliance for complaints
      if (documentType.toLowerCase().includes("complaint")) {
        console.log("  - Checking Rule 12(b)(6) compliance...");
        complianceCheck = await checkRule12b6Compliance(
          extractedText,
          caseItem.jurisdiction
        );
        console.log(`  ✓ Compliance check complete (score: ${complianceCheck.score || "N/A"})`);

        // Learn from this document
        console.log("  - Extracting learning patterns...");
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
          console.log("  ✓ Learning patterns saved");
        }
      }
    } catch (aiError: any) {
      console.error("⚠ AI analysis error (continuing without analysis):", aiError.message);
      // Continue without AI analysis if it fails
    }

    // Save to database
    console.log("Saving document to database...");
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

    console.log(`✓ Document saved successfully (ID: ${newDocument.id})`);
    console.log("=== Upload Complete ===\n");

    res.status(201).json(newDocument);
  } catch (error: any) {
    console.error("✗ Upload failed:", error.message);
    console.error("Stack trace:", error.stack);
    res.status(500).json({ 
      error: "Upload failed",
      details: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
});

// Fallback for text-only document creation
app.post("/api/documents", async (req, res) => {
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
    res.status(500).json({ error: error.message });
  }
});

// Error handler
app.use((err: any, _req: any, res: any, _next: any) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
  console.error(err);
});

// ============================================================================
// VERCEL SERVERLESS FUNCTION HANDLER
// ============================================================================

// Export as Vercel serverless function
export default async function handler(req: any, res: any) {
  console.log(`[Vercel] ${req.method} ${req.url}`);
  return app(req, res);
}
