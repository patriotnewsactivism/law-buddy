// Add this improved upload endpoint to server/routes.ts
// Replace the existing /api/documents/upload endpoint with this version

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
