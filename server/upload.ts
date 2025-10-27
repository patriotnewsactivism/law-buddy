// server/upload.ts
import multer from "multer";
import pdfParse from "pdf-parse"; // FIX 1: This import will now work
import mammoth from "mammoth";
import { Request } from "express";

// FIX 2: Use memoryStorage for Vercel. diskStorage will fail.
const storage = multer.memoryStorage();

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Only accept formats we can reliably extract text from
    const allowedTypes = [
      "text/plain",
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // DOCX only
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only TXT, PDF, and DOCX are supported."));
    }
  },
});

/**
 * Extracts text content from a file buffer.
 * @param buffer The file buffer from multer.
 *Signature @param mimetype The mimetype of the file.
 * @returns A promise that resolves to the extracted text.
 */
export async function extractTextFromFile(
  buffer: Buffer,
  mimetype: string
): Promise<string> {
  try {
    // Extract text based on file type
    if (mimetype === "application/pdf") {
      // This call is now correct
      const data = await pdfParse(buffer);
      return data.text;
    } else if (
      mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      // DOCX files only
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } else if (mimetype === "text/plain") {
      return buffer.toString("utf-8");
    } else {
      throw new Error(
        "Unsupported file type. Please use TXT, PDF, or DOCX format."
      );
    }
  } catch (error: any) {
    console.error("Error extracting text from file:", error);
    throw new Error(`Failed to extract text: ${error.message}`);
  }
}

// NOTE: cleanupFile is not needed because we are using memoryStorage.
