// server/upload.ts
import multer from "multer";
import mammoth from "mammoth";
import { Request } from "express";

// Import pdf-parse properly for ESM
let pdfParse: any;
try {
  pdfParse = require("pdf-parse");
  console.log("✓ pdf-parse loaded successfully");
} catch (error) {
  console.error("✗ Failed to load pdf-parse:", error);
  throw new Error("pdf-parse module is required but could not be loaded");
}

// Use memoryStorage for Vercel compatibility
const storage = multer.memoryStorage();

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    console.log(`File upload attempt: ${file.originalname}, type: ${file.mimetype}`);
    
    // Accept these MIME types
    const allowedTypes = [
      "text/plain",
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // DOCX
    ];
    
    // Also accept common variations
    const allowedExtensions = [".txt", ".pdf", ".docx"];
    const fileExtension = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf("."));
    
    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      console.log(`✓ File accepted: ${file.originalname}`);
      cb(null, true);
    } else {
      console.log(`✗ File rejected: ${file.originalname} (type: ${file.mimetype})`);
      cb(new Error(`Invalid file type: ${file.mimetype}. Only TXT, PDF, and DOCX are supported.`));
    }
  },
});

/**
 * Extracts text content from a file buffer.
 * @param buffer The file buffer from multer.
 * @param mimetype The mimetype of the file.
 * @param filename Original filename for better error messages.
 * @returns A promise that resolves to the extracted text.
 */
export async function extractTextFromFile(
  buffer: Buffer,
  mimetype: string,
  filename: string = "unknown"
): Promise<string> {
  console.log(`\n=== Extracting text from: ${filename} ===`);
  console.log(`   MIME type: ${mimetype}`);
  console.log(`   Buffer size: ${buffer.length} bytes`);

  try {
    let extractedText = "";

    // PDF files
    if (mimetype === "application/pdf" || filename.toLowerCase().endsWith(".pdf")) {
      console.log("   Processing as PDF...");
      
      if (!pdfParse) {
        throw new Error("pdf-parse module not available");
      }
      
      const data = await pdfParse(buffer);
      extractedText = data.text;
      console.log(`   ✓ Extracted ${extractedText.length} characters from PDF`);
      console.log(`   PDF has ${data.numpages} pages`);
    }
    // DOCX files
    else if (
      mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      filename.toLowerCase().endsWith(".docx")
    ) {
      console.log("   Processing as DOCX...");
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
      console.log(`   ✓ Extracted ${extractedText.length} characters from DOCX`);
      
      if (result.messages && result.messages.length > 0) {
        console.log(`   Warnings: ${result.messages.map(m => m.message).join(", ")}`);
      }
    }
    // Plain text files
    else if (mimetype === "text/plain" || filename.toLowerCase().endsWith(".txt")) {
      console.log("   Processing as TXT...");
      extractedText = buffer.toString("utf-8");
      console.log(`   ✓ Extracted ${extractedText.length} characters from TXT`);
    }
    // Unsupported type
    else {
      throw new Error(
        `Unsupported file type: ${mimetype}. Please use TXT, PDF, or DOCX format.`
      );
    }

    // Validate we got some text
    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error("No text content found in file. The file may be empty or corrupted.");
    }

    // Log a preview of the extracted text
    const preview = extractedText.trim().substring(0, 200).replace(/\s+/g, " ");
    console.log(`   Text preview: "${preview}${extractedText.length > 200 ? "..." : ""}"`);
    console.log(`=== Extraction complete ===\n`);

    return extractedText;
  } catch (error: any) {
    console.error(`✗ Error extracting text from ${filename}:`, error.message);
    console.error(`   Stack trace:`, error.stack);
    throw new Error(`Failed to extract text from ${filename}: ${error.message}`);
  }
}
