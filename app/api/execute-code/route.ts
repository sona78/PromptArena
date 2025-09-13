import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { code, language = 'python' } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
      );
    }

    // Modal endpoint URL with query parameters
    const modalEndpointUrl = new URL('https://playground-hackmit--code-executor-execute-code-endpoint.modal.run');
    modalEndpointUrl.searchParams.append('code', code);
    modalEndpointUrl.searchParams.append('language', language);

    // Call Modal execute_code endpoint
    const response = await fetch(modalEndpointUrl.toString(), {
      method: 'POST'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Modal API error:', response.status, errorText);
      return NextResponse.json(
        { error: `Modal API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    
    return NextResponse.json(result);

  } catch (error) {
    console.error('Execute code API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
