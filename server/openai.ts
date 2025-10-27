// server/openai.ts
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// System prompt template - consistent across all functions
const LEGAL_ASSISTANT_SYSTEM_PROMPT = `You are an expert litigator and paralegal with a specialization in the US Constitution and civil rights law under 42 U.S.C. 1983. Your task is to analyze legal documents, identify key arguments, cite specific facts from the provided text, and draft compelling, aggressive, and precise legal arguments. All responses must be formatted for use in federal court filings. Do not be conversational; be professional, adversarial, and meticulous.`;

export async function analyzeLegalDocument(
  content: string,
  documentType: string,
  jurisdiction: string
): Promise<any> {
  console.log(`[OpenAI] Analyzing ${documentType} document (${content.length} chars)`);
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: LEGAL_ASSISTANT_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: `Analyze this ${documentType} document from ${jurisdiction} jurisdiction and provide a comprehensive analysis in JSON format.

Document Content:
${content}

Provide analysis in this exact JSON structure:
{
  "summary": "Brief overview of the document",
  "keyIssues": ["List of key legal issues identified"],
  "parties": {"plaintiff": "name or unknown", "defendant": "name or unknown"},
  "legalClaims": ["List of legal claims or causes of action"],
  "citations": ["Relevant case law and statutes cited in the document"],
  "strengths": ["Strong points in the document"],
  "weaknesses": ["Potential weaknesses or issues"],
  "recommendations": ["Specific recommendations for improvement"]
}`,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 4096,
    });

    const content_text = response.choices[0].message.content;
    if (!content_text) {
      throw new Error("OpenAI returned empty response");
    }

    console.log(`[OpenAI] Analysis complete (${content_text.length} chars)`);
    return JSON.parse(content_text);
  } catch (error: any) {
    console.error("[OpenAI] Analysis error:", error.message);
    if (error.response) {
      console.error("[OpenAI] API Response:", error.response.data);
    }
    throw new Error(`Failed to analyze document: ${error.message}`);
  }
}

export async function checkRule12b6Compliance(
  content: string,
  jurisdiction: string
): Promise<any> {
  console.log(`[OpenAI] Checking Rule 12(b)(6) compliance (${content.length} chars)`);
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: LEGAL_ASSISTANT_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: `Analyze this complaint from ${jurisdiction} jurisdiction for Rule 12(b)(6) compliance under the Twombly/Iqbal plausibility standard.

Complaint Content:
${content}

Provide analysis in this exact JSON structure:
{
  "overallAssessment": "pass" or "fail" or "needs_improvement",
  "score": 75,
  "findings": [
    {
      "claim": "name of claim",
      "assessment": "pass or fail or needs_improvement",
      "reasoning": "detailed explanation",
      "plausibility": "whether claim is plausible under Twombly/Iqbal",
      "suggestions": ["specific improvements needed"]
    }
  ],
  "requiredElements": [
    {
      "element": "element name",
      "present": true,
      "explanation": "why it is or is not adequately pled"
    }
  ],
  "recommendations": ["Overall recommendations to strengthen the complaint"]
}`,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 4096,
    });

    const content_text = response.choices[0].message.content;
    if (!content_text) {
      throw new Error("OpenAI returned empty response");
    }

    console.log(`[OpenAI] Compliance check complete`);
    return JSON.parse(content_text);
  } catch (error: any) {
    console.error("[OpenAI] Compliance check error:", error.message);
    if (error.response) {
      console.error("[OpenAI] API Response:", error.response.data);
    }
    throw new Error(`Failed to check compliance: ${error.message}`);
  }
}

export async function generateLegalDocument(
  documentType: string,
  jurisdiction: string,
  parties: { plaintiff: string; defendant: string },
  caseInfo: any,
  instructions: string
): Promise<string> {
  console.log(`[OpenAI] Generating ${documentType} for ${jurisdiction}`);
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `${LEGAL_ASSISTANT_SYSTEM_PROMPT}

Format all legal documents with:
- 14pt font, double-spaced body text
- 20pt centered bold H1 headers
- 18pt centered bold H2 headers
- 16pt left-justified H3 headers
- Proper case caption and title formatting
- Professional legal language and structure`,
        },
        {
          role: "user",
          content: `Generate a complete ${documentType} for the following case:

Jurisdiction: ${jurisdiction}
Plaintiff: ${parties.plaintiff}
Defendant: ${parties.defendant}

Case Information:
${JSON.stringify(caseInfo, null, 2)}

Specific Instructions:
${instructions}

Generate a complete, court-ready document with proper formatting, legal citations, and structure. Include all necessary sections and ensure compliance with ${jurisdiction} court rules.`,
        },
      ],
      max_completion_tokens: 8192,
    });

    const content_text = response.choices[0].message.content;
    if (!content_text) {
      throw new Error("OpenAI returned empty response");
    }

    console.log(`[OpenAI] Document generated (${content_text.length} chars)`);
    return content_text;
  } catch (error: any) {
    console.error("[OpenAI] Document generation error:", error.message);
    if (error.response) {
      console.error("[OpenAI] API Response:", error.response.data);
    }
    throw new Error(`Failed to generate document: ${error.message}`);
  }
}

export async function getLegalGuidance(
  question: string,
  jurisdiction: string,
  caseContext?: any
): Promise<{ answer: string; sources: string[] }> {
  console.log(`[OpenAI] Getting legal guidance for ${jurisdiction}`);
  
  try {
    const contextInfo = caseContext
      ? `\n\nCase Context:\n${JSON.stringify(caseContext, null, 2)}`
      : "";

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: LEGAL_ASSISTANT_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: `${question}${contextInfo}

Provide a comprehensive answer in this exact JSON format:
{
  "answer": "Your detailed answer with legal analysis",
  "sources": ["List of specific citations and authorities"],
  "nextSteps": ["Practical action items"],
  "warnings": ["Important cautions or considerations"]
}

Include:
1. Clear explanation of the legal principles
2. Specific citations to statutes, rules, or case law
3. Practical steps the person should take
4. Important deadlines or considerations
5. Warnings about potential pitfalls`,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 8192,
    });

    const content_text = response.choices[0].message.content;
    if (!content_text) {
      throw new Error("OpenAI returned empty response");
    }

    const result = JSON.parse(content_text);
    console.log(`[OpenAI] Legal guidance provided`);
    
    return {
      answer: result.answer || "",
      sources: result.sources || [],
    };
  } catch (error: any) {
    console.error("[OpenAI] Legal guidance error:", error.message);
    if (error.response) {
      console.error("[OpenAI] API Response:", error.response.data);
    }
    throw new Error(`Failed to get legal guidance: ${error.message}`);
  }
}

export async function learnFromDocument(
  documentType: string,
  jurisdiction: string,
  content: string,
  complianceResults: any
): Promise<any> {
  console.log(`[OpenAI] Learning from ${documentType} document`);
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a learning system that analyzes legal documents to extract patterns, best practices, and improvements for future document generation. Focus on what makes documents effective and compliant.`,
        },
        {
          role: "user",
          content: `Analyze this ${documentType} from ${jurisdiction} and extract learning patterns.

Document Content Summary (first 2000 chars):
${content.substring(0, 2000)}

Compliance Results:
${JSON.stringify(complianceResults, null, 2)}

Extract patterns in this exact JSON format:
{
  "effectivePatterns": ["Patterns that worked well"],
  "issuesFound": ["Common issues to avoid"],
  "jurisdictionSpecificRules": ["Specific rules for ${jurisdiction}"],
  "documentTypeGuidelines": ["Guidelines for ${documentType}"],
  "improvementSuggestions": ["How to improve future documents"]
}`,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 2048,
    });

    const content_text = response.choices[0].message.content;
    if (!content_text) {
      throw new Error("OpenAI returned empty response");
    }

    console.log(`[OpenAI] Learning patterns extracted`);
    return JSON.parse(content_text);
  } catch (error: any) {
    console.error("[OpenAI] Learning system error:", error.message);
    // Don't throw - learning is optional
    return null;
  }
}
