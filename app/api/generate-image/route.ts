import { NextResponse } from 'next/server';

const BFL_API_KEY = process.env["BLACK_FOREST_API_KEY"];
const BFL_API_URL = 'https://api.us1.bfl.ai/v1/flux-pro-1.1';

export async function POST(request: Request) {
  try {
    // Read and log the request body
    const rawBody = await request.text();
    console.log("Raw request body:", rawBody);

    let jsonBody;
    try {
      jsonBody = JSON.parse(rawBody);
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return NextResponse.json(
        { error: "Invalid JSON format in request body." },
        { status: 400 }
      );
    }

    // Try to extract prompt from different fields
    const prompt = jsonBody.prompt || jsonBody.message || jsonBody.response;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      console.error("Invalid prompt received:", prompt);
      return NextResponse.json(
        { error: "Invalid prompt: A non-empty string is required." },
        { status: 400 }
      );
    }

    const response = await fetch(BFL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(BFL_API_KEY ? { 'x-key': BFL_API_KEY } : {})
      },
      body: JSON.stringify({
        prompt,
        width: 1024,
        height: 768
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log('Image response:', data);

    return NextResponse.json({ request_id: data.polling_url });
  } catch (error) {
    console.error('Error generating image:', error);
    
    // Type narrowing for error
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'string' 
        ? error 
        : 'Failed to generate image';

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
