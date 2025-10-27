import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

(async () => {
  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ No API key found");
    process.exit(1);
  }

  console.log("✓ API key found");
  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: "Say hello from Law Buddy" }],
  });

  console.log("✓ Connected successfully");
  console.log("Response:", res.choices[0].message.content);
})();
