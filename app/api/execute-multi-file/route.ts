import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { files, language = 'python', entry_point = 'test' } = body;

    if (!files || typeof files !== 'object' || Object.keys(files).length === 0) {
      return NextResponse.json(
        { error: 'No files provided', success: false },
        { status: 400 }
      );
    }

    if (!(entry_point in files)) {
      return NextResponse.json(
        { error: `Entry point '${entry_point}' not found in provided files`, success: false },
        { status: 400 }
      );
    }

    // Call Modal multi-file endpoint
    const modalResponse = await fetch(
      `https://playground-hackmit--code-executor-execute-multi-file-endpoint.modal.run/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files,
          language,
          entry_point
        }),
      }
    );

    if (!modalResponse.ok) {
      const errorText = await modalResponse.text();
      return NextResponse.json(
        { error: `Modal API error: ${errorText}`, success: false },
        { status: 500 }
      );
    }

    const result = await modalResponse.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error('Multi-file execution error:', error);
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}
