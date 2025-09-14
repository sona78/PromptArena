import { NextRequest, NextResponse } from 'next/server';

interface BestPractice {
  id: string;
  title: string;
  description: string;
  category: string;
  model: string;
  effectiveness_score: number;
  sample_count: number;
  example_prompt: string;
  key_insights: string[];
  tags: string[];
  last_updated: string;
}

interface ModelStats {
  model: string;
  total_practices: number;
  avg_effectiveness: number;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const model = searchParams.get('model');
    const category = searchParams.get('category');

    // In a real implementation, you would:
    // 1. Query your ML analysis results from the database
    // 2. Filter by model/category if specified
    // 3. Return the processed best practices data
    
    // For now, we'll return mock data that simulates what your ML backend would produce
    const mockBestPractices: BestPractice[] = [
      {
        id: "1",
        title: "Step-by-step Reasoning for Complex Problems",
        description: "Breaking down complex problems into smaller, sequential steps dramatically improves accuracy across all models.",
        category: "ML",
        model: "Claude-3.5-Sonnet",
        effectiveness_score: 94.2,
        sample_count: 847,
        example_prompt: "Let's solve this step by step:\n1. First, I'll identify the key components\n2. Then I'll analyze each component\n3. Finally, I'll synthesize the solution",
        key_insights: [
          "Use numbered steps for clarity",
          "Explicitly state reasoning at each step", 
          "Build complexity gradually",
          "Validate intermediate results"
        ],
        tags: ["reasoning", "structure", "accuracy"],
        last_updated: "2024-01-15"
      },
      {
        id: "2", 
        title: "Context-Rich Code Generation",
        description: "Providing comprehensive context about the codebase, requirements, and constraints leads to more maintainable code.",
        category: "Backend",
        model: "GPT-4",
        effectiveness_score: 91.8,
        sample_count: 1203,
        example_prompt: "Given this React TypeScript project with these dependencies [...], create a component that handles [...] while following our coding standards [...]",
        key_insights: [
          "Include relevant dependencies and versions",
          "Specify coding standards upfront",
          "Mention existing patterns to follow",
          "Clarify error handling requirements"
        ],
        tags: ["context", "maintainability", "standards"],
        last_updated: "2024-01-14"
      },
      {
        id: "3",
        title: "Persona-Driven Creative Writing",
        description: "Establishing a clear persona or voice before creative tasks results in more consistent and engaging content.",
        category: "Frontend", 
        model: "GPT-3.5-Turbo",
        effectiveness_score: 88.5,
        sample_count: 692,
        example_prompt: "You are a seasoned travel writer with 20 years of experience. Write in your characteristic warm, observational style about [...]",
        key_insights: [
          "Define expertise level and background",
          "Specify tone and writing style",
          "Include relevant experience context",
          "Maintain consistency throughout"
        ],
        tags: ["persona", "consistency", "voice"],
        last_updated: "2024-01-13"
      },
      {
        id: "4",
        title: "Multi-Example Pattern Recognition",
        description: "Providing 3-5 diverse examples helps models understand patterns better than single examples.",
        category: "ML",
        model: "Gemini-Pro", 
        effectiveness_score: 87.3,
        sample_count: 456,
        example_prompt: "Here are several examples of the pattern I want:\nExample 1: [...]\nExample 2: [...]\nExample 3: [...]\nNow apply this pattern to: [...]",
        key_insights: [
          "Use 3-5 examples for best results",
          "Ensure examples cover edge cases",
          "Show variation within the pattern",
          "Clearly label each example"
        ],
        tags: ["examples", "patterns", "learning"],
        last_updated: "2024-01-12"
      },
      {
        id: "5",
        title: "Constraint-First Problem Definition",
        description: "Clearly defining constraints and limitations upfront prevents scope creep and improves solution quality.",
        category: "ML",
        model: "GPT-4",
        effectiveness_score: 89.1,
        sample_count: 523,
        example_prompt: "Given these constraints: [time limit], [resource limits], [requirements], solve this problem: [...]",
        key_insights: [
          "List all constraints before starting",
          "Prioritize constraints by importance",
          "Explain how constraints affect the solution",
          "Validate solutions against constraints"
        ],
        tags: ["constraints", "clarity", "validation"],
        last_updated: "2024-01-11"
      },
      {
        id: "6",
        title: "Iterative Refinement Prompting",
        description: "Starting with a basic solution and then asking for specific improvements yields better results than trying to get perfection in one shot.",
        category: "Backend",
        model: "Claude-3.5-Sonnet",
        effectiveness_score: 92.7,
        sample_count: 734,
        example_prompt: "First, create a basic version of [...]. Then, improve it by adding [...]. Finally, optimize for [...]",
        key_insights: [
          "Start simple, then iterate",
          "Be specific about improvements needed",
          "Focus on one aspect per iteration",
          "Build complexity incrementally"
        ],
        tags: ["iteration", "refinement", "incremental"],
        last_updated: "2024-01-10"
      }
    ];

    const mockModelStats: ModelStats[] = [
      { model: "Claude-3.5-Sonnet", total_practices: 23, avg_effectiveness: 92.1 },
      { model: "GPT-4", total_practices: 31, avg_effectiveness: 89.7 },
      { model: "GPT-3.5-Turbo", total_practices: 18, avg_effectiveness: 85.2 },
      { model: "Gemini-Pro", total_practices: 15, avg_effectiveness: 83.9 },
    ];

    // Filter practices based on query parameters
    let filteredPractices = mockBestPractices;
    
    if (model && model !== 'All Models') {
      filteredPractices = filteredPractices.filter(p => p.model === model);
    }
    
    if (category && category !== 'All Categories') {
      filteredPractices = filteredPractices.filter(p => p.category === category);
    }

    return NextResponse.json({
      practices: filteredPractices,
      model_stats: mockModelStats,
      total_count: filteredPractices.length,
      last_updated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching best practices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch best practices' },
      { status: 500 }
    );
  }
}

// Future endpoint for when ML analysis is ready
export async function POST(_request: NextRequest) {
  try {
    // This would be called by your ML pipeline to update best practices
    // const { practices, model_stats } = await request.json();
    
    // In production, you would:
    // 1. Validate the ML analysis data
    // 2. Store updated best practices in the database
    // 3. Update model statistics
    // 4. Trigger cache invalidation if needed
    
    return NextResponse.json({ 
      message: 'Best practices updated successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating best practices:', error);
    return NextResponse.json(
      { error: 'Failed to update best practices' },
      { status: 500 }
    );
  }
}
