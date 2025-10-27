import multer from "multer";
import path from "path";
import fs from "fs/promises";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads");
    try {
      await fs.mkdir(uploadDir, { recursive: true });
    } catch (error) {
      console.error("Error creating upload directory:", error);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
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

export async function extractTextFromFile(filePath: string, mimetype: string): Promise<string> {
  try {
    // Read the file buffer
    const buffer = await fs.readFile(filePath);

    // Extract text based on file type
    if (mimetype === "application/pdf") {
      const data = await pdfParse(buffer);
      return data.text;
    } else if (mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      // DOCX files only - mammoth doesn't support legacy .doc
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } else if (mimetype === "text/plain") {
      return buffer.toString("utf-8");
    } else {
      throw new Error("Unsupported file type. Please use TXT, PDF, or DOCX format.");
    }
  } catch (error: any) {
    console.error("Error extracting text from file:", error);
    throw new Error(`Failed to extract text: ${error.message}`);
  }
}

export async function cleanupFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error("Error cleaning up file:", error);
  }
}
