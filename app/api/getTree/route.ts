import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  baseURL: "https://api.studio.nebius.ai/v1/",
  apiKey: process.env["NEBIUS_API_KEY"],
});

async function fetchCompletion(prompt: string) {
  let attempts = 0;
  while (attempts < 3) {
    try {
      const responseChunks = [];
      const chatCompletion = await openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You generate **structured JSON decision trees** to organize **creative ideas, projects, and plans**. Every response follows this format:
            
            \`\`\`json
            [
              {
                "name": "Branch 1",
                "children": [{ "name": "Leaf 1.1" }, { "name": "Leaf 1.2" }]
              },
              {
                "name": "Branch 2",
                "children": [{ "name": "Leaf 2.1" }, { "name": "Leaf 2.2" }]
              }
            ]
            \`\`\`
            
            Keep it **structured, clear, and creative.** 🚀`
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "meta-llama/Llama-3.3-70B-Instruct",
        max_tokens: 8192,
        temperature: 0.6,
        top_p: 0.95,
        stream: true,
      });

      for await (const chunk of chatCompletion) {
        const content = chunk.choices[0]?.delta?.content || "";
        responseChunks.push(content);
      }

      return responseChunks.join("").trim();
    } catch (error) {
      console.error(`API Request Error (Attempt ${attempts + 1}):`, error);
      attempts++;
    }
  }
  throw new Error("Failed to fetch API response after 3 attempts.");
}

export async function POST(req: Request) {
  const { prompt } = await req.json();
  if (!prompt || prompt.trim() === "") {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  try {
    const fullResponse = await fetchCompletion(prompt);
    const jsonMatch = fullResponse.match(/```json([\s\S]*?)```/);
    let jsonString = jsonMatch ? jsonMatch[1].trim() : fullResponse;
    
    return NextResponse.json(JSON.parse(jsonString));
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to retrieve a valid API response." },
      { status: 500 }
    );
  }
}
