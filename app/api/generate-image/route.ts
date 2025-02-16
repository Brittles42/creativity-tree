import { NextResponse } from 'next/server';

const BLACK_FOREST_API_KEY = process.env["BLACK_FOREST_API_KEY"];

const BLACK_FOREST_API_URL = 'https://api.blackforestai.com/v1/images/generations';

export async function POST(request: Request) {
  try {
    const { message, response, context } = await request.json();

    const prompt = `Create an anime-style image of Hatsune Miku in a professional outfit 
    (white blazer, brown vest, white shirt) with long turquoise twin-tails. 
    She should express emotion based on this message: "${message}".
    If the message contains a question, show her looking curious and engaged.
    If she's explaining something, show her looking enthusiastic and helpful.
    If she's suggesting an idea, show her looking excited and inspired.
    Always maintain a warm and positive expression, but vary her:
    - Eye expressions (wide and curious, gentle and warm, bright and excited)
    - Smile (gentle smile, broad grin, enthusiastic beam)
    - Head tilt (slight tilt for curiosity, straight on for explanations)
    - Hand gestures (subtle pointing, open palms, energetic gestures)
    High quality, detailed, professional lighting, facing forward with clear view of expression.`;

    const imageResponse = await fetch(BLACK_FOREST_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BLACK_FOREST_API_KEY}`
      },
      body: JSON.stringify({
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        style: 'anime'  // Using anime style for Miku
      })
    });

    const data = await imageResponse.json();
    return NextResponse.json({ imageUrl: data.data[0].url });
  } catch (error) {
    console.error('Error generating image:', error);
    return NextResponse.json(
      { imageUrl: null, error: 'Failed to generate image' },
      { status: 500 }
    );
  }
} 