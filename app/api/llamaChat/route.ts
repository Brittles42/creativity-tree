import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  baseURL: "https://api.studio.nebius.ai/v1/",
  apiKey: process.env["NEBIUS_API_KEY"],
});

export async function POST(request: Request) {
  try {
    const { message, context, messageHistory } = await request.json();
    
    const conversationMessages = messageHistory.map((msg: { text: string, sender: string }) => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));

    const systemMessage = `You are a helpful and friendly AI assistant discussing: "${context}".
    Keep responses concise (1-2 sentences) and end with a brief question to encourage discussion.
    Be engaging and show personality while staying focused on the topic.`;

    const completion = await openai.chat.completions.create({
      model: "meta-llama/Llama-3.3-70B-Instruct",
      messages: [
        { role: "system", content: systemMessage },
        ...conversationMessages,
        { role: "user", content: message }
      ],
      temperature: 0.7,
      max_tokens: 80,
      presence_penalty: 0.6
    });

    const response = completion.choices[0]?.message?.content || "Could you tell me more about what you'd like to know?";
    
    return NextResponse.json({ response });
  } catch (error) {
    console.error('Error in chat route:', error);
    return NextResponse.json(
      { response: 'Could you rephrase that? I want to help you plan this better.' },
      { status: 500 }
    );
  }
}