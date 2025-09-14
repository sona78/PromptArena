import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(request: NextRequest) {
  try {
    const { files } = await request.json();

    if (!files || typeof files !== 'object' || Object.keys(files).length === 0) {
      return NextResponse.json(
        { error: 'Files are required for code evaluation' },
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

    // Combine all file contents into a single string
    const allCode = Object.entries(files)
      .map(([filename, content]) => `// File: ${filename}\n${content}`)
      .join('\n\n');

    const evaluationPrompt = `You are a code style evaluator. You will be given a code snippet. 
Your task is to analyze the code and assign a score (0–1) for each of the following metrics, along with a short justification: 

1. Conciseness → Is the code free of redundancy and unnecessary verbosity? 
   (0 = overly verbose or repetitive, 1 = minimal and clear)

2. Abstraction & Complexity → Does the code use appropriate abstractions without being too convoluted?
   (0 = poor abstraction or excessive complexity, 1 = clean, balanced use of abstraction)

3. Security → Does the code avoid common vulnerabilities (e.g., injection risks, unsafe memory access, poor validation)?
   (0 = insecure patterns present, 1 = no major security issues)

4. Developer Effort / Edit Distance → How much additional work would be required to adapt this code for real-world production use? 
   (0 = major rewriting required, 1 = ready to use with minimal edits)

5. Comprehensibility → How easy would it be for another developer to understand, maintain, and debug this code? 
   (0 = confusing or opaque, 1 = very easy to follow)

After scoring each metric, compute a **FinalScore** as the average of the five metrics.

Return your response in **strict JSON format** like this:

{
  "Conciseness": {"score": 0.8, "justification": "Short and to the point, but some redundancy remains."},
  "AbstractionComplexity": {"score": 0.6, "justification": "Good use of functions, but some over-engineering present."},
  "Security": {"score": 0.9, "justification": "No obvious vulnerabilities."},
  "DeveloperEffort": {"score": 0.7, "justification": "Mostly production-ready but requires error handling improvements."},
  "Comprehensibility": {"score": 0.85, "justification": "Readable variable names and structure, but lacks comments."},
  "FinalScore": 0.77
}

Here is the code to evaluate:

${allCode}`;

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: claudeApiKey,
    });

    // Call Claude API for code evaluation
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
    console.error('Code evaluation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
