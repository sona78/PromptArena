import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(request: NextRequest) {
  try {
    const { output } = await request.json();

    if (!output || typeof output !== 'string') {
      return NextResponse.json(
        { error: 'Output string is required for code accuracy evaluation' },
        { status: 400 }
      );
    }

    // Get Claude API key from environment variables
    const claudeApiKey = process.env.CLAUDE_API_KEY;
    
    if (!claudeApiKey) {
      return NextResponse.json(
        { error: 'Claude API key not configured' },
        { status: 500 }
      );
    }

    const evaluationPrompt = `You are a code evaluation assistant. You will be given the debug output or logs from running unit tests for a code submission. 
Your task is to analyze the logs and provide structured feedback. 

Specifically:

1. **Test Pass/Fail Summary** → How many tests passed vs failed? Identify which tests failed.
2. **Failure Analysis** → For each failed test, describe the likely cause (e.g., logic error, wrong return type, missing handling of edge cases, exceptions, etc.).
3. **Severity** → Indicate the impact of the failures on overall code correctness (low/medium/high).
4. **Suggestions** → Provide actionable suggestions for fixing the failures.

Return your response in **strict JSON format** like this:

{
  "TestPassFailSummary": {"passed": 3, "failed": 2, "failedTests": ["test_edge_case", "test_validation"]},
  "FailureAnalysis": [
    {"test": "test_edge_case", "cause": "Logic error in handling empty input"},
    {"test": "test_validation", "cause": "Missing input validation for negative numbers"}
  ],
  "Severity": "medium",
  "Suggestions": [
    "Add input validation to handle edge cases",
    "Implement proper error handling for invalid inputs"
  ],
  "AccuracyScore": 0.6
}

Here is the execution output to evaluate:

${output}`;

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: claudeApiKey,
    });

    // Call Claude API for code accuracy evaluation
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: evaluationPrompt
        }
      ]
    });

    // Extract the response content
    if (response.content && response.content.length > 0) {
      const content = response.content[0];
      
      if (content.type === 'text') {
        try {
          // Try to parse the JSON response
          const evaluation = JSON.parse(content.text);
          return NextResponse.json({
            success: true,
            evaluation,
            usage: {
              input_tokens: response.usage.input_tokens,
              output_tokens: response.usage.output_tokens
            }
          });
        } catch (parseError) {
          console.error('Failed to parse Claude response as JSON:', parseError);
          return NextResponse.json({
            success: false,
            error: 'Failed to parse evaluation response',
            rawResponse: content.text
          });
        }
      }
    }

    return NextResponse.json(
      { error: 'No content received from Claude API' },
      { status: 500 }
    );

  } catch (error) {
    console.error('Code accuracy evaluation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
