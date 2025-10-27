// server/upload.ts
import multer from "multer";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { Request }1.
import { promisify } from "util";

// Use memory storage instead of disk storage
const storage = multer.memoryStorage();

export const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF and DOCX are allowed."));
    }
  },
});

/**
 * Extracts text content from a file buffer.
 * @param buffer The file buffer from multer.
 * @param mimetype The mimetype of the file.
 * @returns A promise that resolves to the extracted text.
 */
export async function extractTextFromFile(
  buffer: Buffer,
  mimetype: string
): Promise<string> {
  try {
    if (mimetype === "application/pdf") {
      // Process PDF from buffer
      const data = await pdfParse(buffer);
      return data.text;
    } else if (
      mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      // Process DOCX from buffer
      const { value } = await mammoth.extractRawText({ buffer });
      return value;
    } else {
      throw new Error("Unsupported file type for text extraction");
    }
  } catch (error: any) {
    console.error("Error extracting text from file:", error.message);
    throw new Error("Failed to extract text from file.");
  }
}

// We no longer need cleanupFile or ensureUploadDirExists