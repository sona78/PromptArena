import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(request: NextRequest) {
  try {
    const { prompts } = await request.json();

    if (!prompts || !Array.isArray(prompts) || prompts.length === 0) {
      return NextResponse.json(
        { error: 'Prompts array is required for prompt sequence evaluation' },
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

    const evaluationPrompt = `You are an evaluator of a sequence of user prompts used to generate or refine code. 
Your task is to analyze the prompt chain and assign a score (0–1) for PromptChainingScore, along with a justification.

Consider the following criteria:

1. Progression / Building on Each Other → Do the prompts build logically on previous prompts? Does each step improve or refine the output?
2. Generality to Specificity → Does the user start with broad, high-level prompts and gradually move to more specific, targeted prompts?
3. Clarity of Chain of Thought → Is there a clear reasoning or strategy connecting the prompts? Is it easy to understand why each prompt follows from the previous one?

Return your response in **strict JSON format** like this:

Example Input (Prompt Chain):
[
  "Write a Python function to sort a list of numbers.",
  "Now modify it to sort in descending order.",
  "Add support for sorting a list of strings alphabetically.",
  "Optimize the function for large lists using built-in sort."
]

Example Output:
{
  "PromptChainingScore": 0.9,
  "justification": "The user starts with a broad task (sort numbers), then incrementally adds complexity (descending order, string sorting, optimization). Each step builds on the previous, showing a clear, logical chain of thought."
}

Here is the prompt chain to evaluate:

${JSON.stringify(prompts, null, 2)}`;

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: claudeApiKey,
    });

    // Call Claude API for prompt sequence evaluation
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
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
    console.error('Prompt sequence evaluation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
