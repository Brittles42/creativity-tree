import { NextResponse } from 'next/server';

const BFL_API_KEY = process.env["BLACK_FOREST_API_KEY"];
const BFL_API_URL = 'https://api.us1.bfl.ai/v1/flux-pro-1.1';

interface ImageGenerationRequest {
  prompt: string;
  width: number;
  height: number;
  prompt_upsampling: boolean;
  seed: number;
  safety_tolerance: number;
  output_format: 'jpeg' | 'png';
}

interface ImageGenSubmitResponse {
    id: string;
    polling_url: string;

}
interface ImageGenerationResponse {
  success: boolean;
  data?: {
    pulling_url?: string;
  };
  error?: {
    message: string;
    code: string;
  };
}

interface PollResponse {
  status: string;
  result?: {
    sample?: string;
    error?: string;
  };
}

interface EmotionState {
  expression: string;
  gesture: string;
  intensity: 'subtle' | 'moderate' | 'strong';
}

const getEmotionState = (response: string): EmotionState => {
  // Check for question patterns
  if (response.includes('?')) {
    const isThinkingQuestion = /hmm|let me think|interesting question/i.test(response);
    const isExcitedQuestion = /great question|ooh|fascinating/i.test(response);
    
    if (isThinkingQuestion) {
      return {
        expression: 'curious and contemplative, with a gentle thoughtful smile and interested eyes',
        gesture: 'head tilted slightly upward and to the right (about 15 degrees), one finger delicately touching chin',
        intensity: 'subtle'
      };
    } else if (isExcitedQuestion) {
      return {
        expression: 'enthusiastically curious, with bright eyes and an eager smile',
        gesture: 'head tilted slightly to the left (about 20 degrees) with an energetic forward lean',
        intensity: 'moderate'
      };
    } else {
      return {
        expression: 'inquisitive and engaging, with raised eyebrows and an encouraging smile',
        gesture: 'head tilted slightly to the right (about 10 degrees), maintaining eye contact with a warm expression',
        intensity: 'subtle'
      };
    }
  }

  // Check for excitement/enthusiasm
  if (response.includes('!') || /great|amazing|wonderful|fantastic/i.test(response)) {
    return {
      expression: 'professionally enthusiastic with brightened eyes and a warm, genuine smile',
      gesture: 'slightly more animated posture while maintaining elegance, hands gracefully expressing enthusiasm',
      intensity: 'moderate'
    };
  }

  // Check for teaching/explaining
  if (/let me explain|for example|this means|in other words/i.test(response)) {
    return {
      expression: 'professionally confident with a gentle, knowledgeable smile and focused eyes',
      gesture: 'one hand raised in an elegant explaining gesture, maintaining perfect posture',
      intensity: 'moderate'
    };
  }

  // Check for empathy/understanding
  if (/understand|feel|I see|that must be/i.test(response)) {
    return {
      expression: 'empathetic yet professional, with softened eyes and a understanding smile',
      gesture: 'slight forward lean showing attention, hands clasped professionally',
      intensity: 'subtle'
    };
  }

  // Check for thinking/contemplating
  if (/hmm|well|perhaps|maybe|let's see/i.test(response)) {
    return {
      expression: 'thoughtfully professional with a slight contemplative look, eyes showing careful consideration',
      gesture: 'one hand elegantly positioned near chin, head tilted slightly in thought',
      intensity: 'subtle'
    };
  }

  // Default professional friendly state
  return {
    expression: 'warmly professional with a gentle, welcoming smile and attentive eyes',
    gesture: 'poised and elegant default stance with perfect professional posture',
    intensity: 'subtle'
  };
};

async function pollForImage(pullingUrl: string): Promise<string> {
  const maxAttempts = 60;
  const delayMs = 2000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(pullingUrl, {
      headers: {
        'Content-Type': 'application/json',
        'X-Key': BFL_API_KEY
      }
    });
    
    const data: PollResponse = await response.json();
    console.log(`Poll attempt ${attempt + 1}:`, data);

    if (data.status === 'Ready' && data.result?.sample) {
      return data.result.sample;
    }

    await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  throw new Error('Timeout waiting for image generation');
}

export async function POST(request: Request) {
  try {
    const { message, response, context } = await request.json();
    const emotionState = getEmotionState(response);

    const params: ImageGenerationRequest = {
      prompt: `Create a high-quality anime-style portrait of Hatsune Miku as a professional assistant.
      She is responding to: "${response}"

      Current Emotional State (${emotionState.intensity} intensity):
      Expression: ${emotionState.expression}
      Gesture: ${emotionState.gesture}

      Essential Style Elements:
      - Professional outfit: Pristine white blazer, brown vest, crisp white shirt
      - Signature long turquoise twin-tails, perfectly styled
      - Clean, professional studio lighting emphasizing her face
      - Dynamic pose with natural head tilt
      - High-quality anime art style with attention to detail
      - Professional office/study background with subtle depth

      Head Tilt Details:
      - Natural and fluid head positioning
      - Maintain eye contact despite the tilt
      - Twin-tails following the head movement naturally
      - Slight shadows adjusting to head position
      - Neck and shoulders aligned naturally with tilt

      Expression Details:
      - Maintain her professional composure while showing genuine emotion
      - Eyes should convey emotion while staying clear and focused
      - Subtle changes in eyebrow position to enhance expression
      - Natural, professional-looking smile variations
      - Elegant hand gestures that complement her expression

      Key Focus:
      - Natural and dynamic head positioning
      - Fluid and graceful movement suggestion
      - Maintaining professional appearance
      - Clear emotional engagement
      - Consistent high-quality detail`,
      width: 1024,
      height: 768,
      prompt_upsampling: false,
      seed: 42,
      safety_tolerance: 2,
      output_format: 'jpeg'
    };

    console.log('Sending request with params:', params);

    const imageResponse = await fetch(BFL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Key': BFL_API_KEY
      },
      body: JSON.stringify(params)
    });

    // Log the raw response
    console.log('Response status:', imageResponse.status);
    console.log('Response headers:', Object.fromEntries(imageResponse.headers.entries()));
    
    const responseText = await imageResponse.text();
    console.log('Raw response text:', responseText);
    
    // Parse the response text back to JSON
    const data: ImageGenSubmitResponse = JSON.parse(responseText);
    console.log('Parsed response data:', data);

    console.log('Bazinga 1 polling_url:', data.polling_url);

    // Poll for the actual image URL
    const imageUrl = await pollForImage(data.polling_url);

    
    console.log('Final image URL:', imageUrl);

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error('Detailed error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error
    });
    return NextResponse.json(
      { imageUrl: null, error: error instanceof Error ? error.message : 'Failed to generate image' },
      { status: 500 }
    );
  }
}