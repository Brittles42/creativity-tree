import { NextResponse } from 'next/server';

const ELEVEN_LABS_API_KEY = process.env.ELEVEN_LABS_API_KEY;
const MIKU_VOICE_ID = "m7dvBJNSAB0scDjhPYgk"; // Replace with actual Miku voice ID

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    
    console.log('Generating speech for:', text);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${MIKU_VOICE_ID}/stream`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVEN_LABS_API_KEY || '',
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    // Stream the audio data directly
    return new Response(response.body, {
      headers: {
        'Content-Type': 'audio/mpeg'
      }
    });

  } catch (error) {
    console.error('Text-to-speech error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate speech' },
      { status: 500 }
    );
  }
} 