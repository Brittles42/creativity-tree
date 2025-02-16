import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  baseURL: "https://api.studio.nebius.ai/v1/",
  apiKey: process.env["NEBIUS_API_KEY"],
});

export async function POST(request: Request) {
  try {
    const { context, currentNode, depth } = await request.json();

    const prompt = `
      You are a creative AI specializing in generating innovative ideas based on given context. 
      Context: ${context} 
      Current Focus: ${currentNode} 
      Depth Level: ${depth} 
      Generate exactly 3-4 unique and relevant ideas based on the given focus and context.
      Each idea must be only 2-3 words long.
      Respond only with a numbered list and nothing else.
    `;

    const response = await openai.chat.completions.create({
      model: "meta-llama/Llama-3.3-70B-Instruct",
      messages: [{ role: 'system', content: prompt }],
      temperature: 0.7,
    });

    const idea = response.choices?.[0]?.message?.content || 'Generated Idea';

    return NextResponse.json({ text: idea });
  } catch (error) {
    console.error('Error generating idea:', error);
    return NextResponse.json({ text: 'Failed to generate idea' }, { status: 500 });
  }
}