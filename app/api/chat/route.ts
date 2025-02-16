import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: Request) {
  try {
    const { message, context, messageHistory } = await request.json();
    
    // Convert message history to OpenAI format
    const conversationMessages = messageHistory.map((msg: { text: string, sender: string }) => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));

    // Create a system message that sets up the context
    const systemMessage = `You are a helpful and friendly AI assistant discussing: "${context}".
    Keep responses concise (1-2 sentences) and end with a brief question to encourage discussion.
    Be engaging and show personality while staying focused on the topic.`;

    // Get response from OpenAI with full conversation context
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemMessage },
        ...conversationMessages,
        { role: "user", content: message }
      ],
      temperature: 0.7,
      max_tokens: 80,  // Reduced token limit for shorter responses
      presence_penalty: 0.6  // Encourages more focused responses
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