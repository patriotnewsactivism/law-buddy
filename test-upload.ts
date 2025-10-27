// test-upload.ts
// Run with: npx tsx test-upload.ts

import fs from "fs";
import path from "path";

const API_BASE = "http://localhost:5000";

// Color codes for console
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function createTestCase() {
  log("\n1. Creating test case...", colors.blue);
  
  const response = await fetch(`${API_BASE}/api/cases`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Upload Test Case",
      plaintiff: "Test Plaintiff",
      defendant: "Test Defendant",
      jurisdiction: "Federal",
      status: "Active",
      description: "Test case for document upload testing",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create case: ${error}`);
  }

  const caseData = await response.json();
  log(`✓ Case created: ${caseData.id}`, colors.green);
  return caseData.id;
}

async function uploadTextFile(caseId: string) {
  log("\n2. Testing text content upload (no file)...", colors.blue);

  const response = await fetch(`${API_BASE}/api/documents/upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      caseId,
      title: "Test Manual Document",
      documentType: "Motion",
      content: `UNITED STATES DISTRICT COURT
SOUTHERN DISTRICT OF FLORIDA

Test Plaintiff,
    Plaintiff,
v.                                  Case No. 1:24-cv-12345
Test Defendant,
    Defendant.

MOTION TO TEST DOCUMENT UPLOAD

Plaintiff hereby submits this test motion to verify the document upload 
functionality of the legal AI assistant system.

This document contains sufficient text to test:
1. Text extraction and storage
2. AI analysis capabilities
3. Document retrieval
4. Compliance checking

The system should successfully process this text and return a document 
object with AI analysis results.

Respectfully submitted,
Test Attorney`,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to upload text: ${error}`);
  }

  const doc = await response.json();
  log(`✓ Text document uploaded: ${doc.id}`, colors.green);
  log(`  Content length: ${doc.content?.length || 0} characters`, colors.green);
  log(`  AI Analysis: ${doc.aiAnalysis ? "Yes" : "No"}`, colors.green);
  return doc;
}

async function uploadFileFromDisk(caseId: string, filePath: string) {
  log(`\n3. Testing file upload: ${path.basename(filePath)}...`, colors.blue);

  if (!fs.existsSync(filePath)) {
    log(`⚠ File not found: ${filePath}`, colors.yellow);
    log(`  Skipping file upload test`, colors.yellow);
    return null;
  }

  const formData = new FormData();
  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer]);
  
  formData.append("file", blob, path.basename(filePath));
  formData.append("caseId", caseId);
  formData.append("title", `Test File Upload - ${path.basename(filePath)}`);
  formData.append("documentType", "Complaint");

  const response = await fetch(`${API_BASE}/api/documents/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to upload file: ${error}`);
  }

  const doc = await response.json();
  log(`✓ File uploaded: ${doc.id}`, colors.green);
  log(`  Original filename: ${doc.fileName}`, colors.green);
  log(`  File size: ${doc.fileSize} bytes`, colors.green);
  log(`  Content length: ${doc.content?.length || 0} characters`, colors.green);
  log(`  AI Analysis: ${doc.aiAnalysis ? "Yes" : "No"}`, colors.green);
  return doc;
}

async function verifyDocument(documentId: string) {
  log(`\n4. Verifying document ${documentId}...`, colors.blue);

  const response = await fetch(`${API_BASE}/api/documents/${documentId}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch document: ${response.statusText}`);
  }

  const doc = await response.json();
  log(`✓ Document retrieved successfully`, colors.green);
  log(`  Title: ${doc.title}`, colors.green);
  log(`  Type: ${doc.documentType}`, colors.green);
  log(`  Created: ${new Date(doc.createdAt).toLocaleString()}`, colors.green);
  
  if (doc.aiAnalysis) {
    log(`  AI Analysis Summary: ${doc.aiAnalysis.summary?.substring(0, 100)}...`, colors.green);
  }
  
  if (doc.complianceCheck) {
    log(`  Compliance: ${doc.complianceCheck.overallAssessment} (${doc.complianceCheck.score}/100)`, colors.green);
  }
  
  return doc;
}

async function runTests() {
  log("=".repeat(60), colors.blue);
  log("Document Upload Test Suite", colors.blue);
  log("=".repeat(60), colors.blue);

  try {
    // Test 1: Create case
    const caseId = await createTestCase();

    // Test 2: Upload text content
    const textDoc = await uploadTextFile(caseId);
    await verifyDocument(textDoc.id);

    // Test 3: Upload file (if available)
    const testFilePath = process.argv[2] || "./test-document.pdf";
    if (process.argv[2]) {
      await uploadFileFromDisk(caseId, testFilePath);
    } else {
      log("\n3. Skipping file upload test", colors.yellow);
      log("   To test file upload, run: npx tsx test-upload.ts /path/to/file.pdf", colors.yellow);
    }

    log("\n" + "=".repeat(60), colors.green);
    log("✓ All tests passed!", colors.green);
    log("=".repeat(60), colors.green);
    
  } catch (error: any) {
    log("\n" + "=".repeat(60), colors.red);
    log("✗ Test failed:", colors.red);
    log(error.message, colors.red);
    if (error.stack) {
      log("\nStack trace:", colors.red);
      log(error.stack, colors.red);
    }
    log("=".repeat(60), colors.red);
    process.exit(1);
  }
}

// Run tests
runTests();
