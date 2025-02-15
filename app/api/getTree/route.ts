import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  baseURL: "https://api.studio.nebius.ai/v1/",
  apiKey: process.env["NEBIUS_API_KEY"],
});

export async function POST(req: Request) {
  const { prompt } = await req.json();

  if (!prompt || prompt.trim() === "") {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  const responseChunks: string[] = [];

  const chatCompletion = await openai.chat.completions.create({
    messages: [
        {
            "role": "system",
            "content": "You generate **structured JSON decision trees** to organize **creative ideas, projects, and plans**. Every response follows this format:  \n\n```json\n[\n  {\n    \"name\": \"Branch 1\",\n    \"children\": [{ \"name\": \"Leaf 1.1\" }, { \"name\": \"Leaf 1.2\" }]\n  },\n  {\n    \"name\": \"Branch 2\",\n    \"children\": [{ \"name\": \"Leaf 2.1\" }, { \"name\": \"Leaf 2.2\" }]\n  }\n]\n```\n\n### **Rules:**  \n- **Always return JSON.** No extra text.  \n- **Expand broad ideas into structured branches.**  \n- **Each branch must have meaningful, actionable child nodes.**  \n- **If a branch has no children, omit the `\"children\"` field.**  \n\n### **Example:**  \n#### **User Input:** *\"Plan a sci-fi novel\"*  \n#### **AI JSON Response:**  \n```json\n[\n  {\n    \"name\": \"Worldbuilding\",\n    \"children\": [\n      { \"name\": \"Technology & AI\" },\n      { \"name\": \"Interstellar Travel\" }\n    ]\n  },\n  {\n    \"name\": \"Characters\",\n    \"children\": [\n      { \"name\": \"Protagonist: Rebel Scientist\" },\n      { \"name\": \"Antagonist: Corrupt AI\" }\n    ]\n  }\n]\n```\n\nKeep it **structured, clear, and creative.** 🚀"
        },
        {
            role: "user",
            content: prompt,
        },
    ],
    model: "deepseek-ai/DeepSeek-R1-Distill-Llama-70B",
    max_tokens: 8192,
    temperature: 0.6,
    top_p: 0.95,
    stream: true,
  });

  for await (const chunk of chatCompletion) {
    const content = chunk.choices[0]?.delta?.content || "";
    responseChunks.push(content);
  }

  const fullResponse = responseChunks.join("").trim();

  const jsonMatch = fullResponse.match(/```json([\s\S]*?)```/);
  let jsonString = jsonMatch ? jsonMatch[1].trim() : fullResponse;

  let parsedJSON;
  let attempts = 0;
  while (attempts < 3) {
    try {
      parsedJSON = JSON.parse(jsonString);
      return NextResponse.json(parsedJSON);
    } catch (error) {
      console.error(`JSON Parsing Error (Attempt ${attempts + 1}):`, error);
      attempts++;
    }
  }

  return NextResponse.json(
    { error: "Failed to parse JSON from response after 3 attempts." },
    { status: 500 }
  );
}