import { NextRequest, NextResponse } from 'next/server';

interface ExecuteCodeRequest {
  code: string;
  language?: string;
}

interface ExecuteCodeResponse {
  success: boolean;
  output: string;
  error: string;
  execution_time?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: ExecuteCodeRequest = await request.json();
    
    if (!body.code) {
      return NextResponse.json(
        { error: 'No code provided', success: false },
        { status: 400 }
      );
    }

    // Get Modal endpoint URL from environment variables
    const modalEndpoint = process.env.MODAL_ENDPOINT_URL;
    
    if (!modalEndpoint) {
      return NextResponse.json(
        { error: 'Modal endpoint not configured', success: false },
        { status: 500 }
      );
    }

    // Call the Modal endpoint
    const modalResponse = await fetch(modalEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: body.code,
        language: body.language || 'python'
      }),
    });

    if (!modalResponse.ok) {
      throw new Error(`Modal API responded with status: ${modalResponse.status}`);
    }

    const result: ExecuteCodeResponse = await modalResponse.json();
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error executing code:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Code execution API endpoint. Use POST to execute code.' },
    { status: 200 }
  );
}
