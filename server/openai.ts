// Reference: javascript_openai blueprint
import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function analyzeLegalDocument(
  content: string,
  documentType: string,
  jurisdiction: string
): Promise<any> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are an expert litigator and paralegal with a specialization in the US Constitution and civil rights law under 42 U.S.C. 1983. Your task is to analyze legal documents, identify key arguments, cite specific facts from the provided text, and draft compelling, aggressive, and precise legal arguments. All responses must be formatted for use in federal court filings. Do not be conversational; be professional, adversarial, and meticulous.`,
        },
        {
          role: "user",
          content: `Analyze this ${documentType} document and provide a comprehensive analysis in JSON format:

Document Content:
${content}

Provide analysis in this JSON structure:
{
  "summary": "Brief overview of the document",
  "keyIssues": ["List of key legal issues identified"],
  "parties": {"plaintiff": "name", "defendant": "name"},
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

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("OpenAI analysis error:", error);
    throw new Error("Failed to analyze document with AI");
  }
}

export async function checkRule12b6Compliance(
  content: string,
  jurisdiction: string
): Promise<any> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are an expert litigator and paralegal with a specialization in the US Constitution and civil rights law under 42 U.S.C. 1983. Your task is to analyze legal documents, identify key arguments, cite specific facts from the provided text, and draft compelling, aggressive, and precise legal arguments. All responses must be formatted for use in federal court filings. Do not be conversational; be professional, adversarial, and meticulous.`,
        },
        {
          role: "user",
          content: `Analyze this complaint for Rule 12(b)(6) compliance and provide your analysis in JSON format:

Complaint Content:
${content}

Provide analysis in this JSON structure:
{
  "overallAssessment": "pass" or "fail" or "needs_improvement",
  "score": number between 0-100,
  "findings": [
    {
      "claim": "name of claim",
      "assessment": "pass/fail/needs_improvement",
      "reasoning": "detailed explanation",
      "plausibility": "whether claim is plausible under Twombly/Iqbal",
      "suggestions": ["specific improvements needed"]
    }
  ],
  "requiredElements": [
    {
      "element": "element name",
      "present": true/false,
      "explanation": "why it is or isn't adequately pled"
    }
  ],
  "recommendations": ["Overall recommendations to strengthen the complaint"]
}`,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 4096,
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("Rule 12(b)(6) compliance check error:", error);
    throw new Error("Failed to check compliance");
  }
}

export async function generateLegalDocument(
  documentType: string,
  jurisdiction: string,
  parties: { plaintiff: string; defendant: string },
  caseInfo: any,
  instructions: string
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are an expert litigator and paralegal with a specialization in the US Constitution and civil rights law under 42 U.S.C. 1983. Your task is to analyze legal documents, identify key arguments, cite specific facts from the provided text, and draft compelling, aggressive, and precise legal arguments. All responses must be formatted for use in federal court filings. Do not be conversational; be professional, adversarial, and meticulous.'
- 14pt font, double-spaced body text
- 20pt centered bold H1 headers
- 18pt centered bold H2 headers
- 16pt left-justified H3 headers
- Proper case caption and title formatting
- Professional legal language and structure`,
        },
        {
          role: "user",
          content: `Generate a ${documentType} for the following case:

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

    return response.choices[0].message.content || "";
  } catch (error) {
    console.error("Document generation error:", error);
    throw new Error("Failed to generate document");
  }
}

export async function getLegalGuidance(
  question: string,
  jurisdiction: string,
  caseContext?: any
): Promise<{ answer: string; sources: string[] }> {
  try {
    const contextInfo = caseContext
      ? `\n\nCase Context:\n${JSON.stringify(caseContext, null, 2)}`
      : "";

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are an expert litigator and paralegal with a specialization in the US Constitution and civil rights law under 42 U.S.C. 1983. Your task is to analyze legal documents, identify key arguments, cite specific facts from the provided text, and draft compelling, aggressive, and precise legal arguments. All responses must be formatted for use in federal court filings. Do not be conversational; be professional, adversarial, and meticulous.`,
        },
        {
          role: "user",
          content: `${question}${contextInfo}

Provide a comprehensive answer with:
1. Clear explanation of the legal principles
2. Specific citations to statutes, rules, or case law
3. Practical steps the person should take
4. Important deadlines or considerations
5. Warnings about potential pitfalls

Format your response in JSON:
{
  "answer": "Your detailed answer",
  "sources": ["List of specific citations and authorities"],
  "nextSteps": ["Practical action items"],
  "warnings": ["Important cautions or considerations"]
}`,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 8192,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return {
      answer: result.answer || "",
      sources: result.sources || [],
    };
  } catch (error) {
    console.error("Legal guidance error:", error);
    throw new Error("Failed to get legal guidance");
  }
}

export async function learnFromDocument(
  documentType: string,
  jurisdiction: string,
  content: string,
  complianceResults: any
): Promise<any> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are a learning system that analyzes legal documents to extract patterns, best practices, and improvements for future document generation. Focus on what makes documents effective and compliant.`,
        },
        {
          role: "user",
          content: `Analyze this ${documentType} from ${jurisdiction} and extract learning patterns:

Document Content Summary:
${content.substring(0, 2000)}...

Compliance Results:
${JSON.stringify(complianceResults, null, 2)}

Extract patterns in JSON format:
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

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("Learning system error:", error);
    return null;
  }
}
