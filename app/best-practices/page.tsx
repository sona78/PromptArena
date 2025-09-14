"use client";

import { useState, useEffect } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  Brain,
  Lightbulb,
  Users,
  Target,
  CheckCircle,
  ArrowRight,
  Sparkles
} from "lucide-react";

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
  color: string;
}

export default function BestPracticesPage() {
  const [practices, setPractices] = useState<BestPractice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState("All Models");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");

  const models = ["All Models", "Claude-3.5-Sonnet", "GPT-4", "GPT-3.5-Turbo", "Gemini-Pro"];
  const categories = ["All Categories", "Frontend", "Backend", "ML"];

  // Mock data - in production this would come from your ML backend
  const mockPractices: BestPractice[] = [
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
    }
  ];

  const modelStats: ModelStats[] = [
    { model: "Claude-3.5-Sonnet", total_practices: 23, avg_effectiveness: 92.1, color: "bg-orange-100 text-orange-800" },
    { model: "GPT-4", total_practices: 31, avg_effectiveness: 89.7, color: "bg-green-100 text-green-800" },
    { model: "GPT-3.5-Turbo", total_practices: 18, avg_effectiveness: 85.2, color: "bg-blue-100 text-blue-800" },
    { model: "Gemini-Pro", total_practices: 15, avg_effectiveness: 83.9, color: "bg-purple-100 text-purple-800" },
  ];

  useEffect(() => {
    fetchBestPractices();
  }, []); // fetchBestPractices is defined inside the component and will cause infinite re-renders if added

  const fetchBestPractices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/best-practices');
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Error fetching best practices:', data.error);
        // Fall back to mock data if API fails
        setPractices(mockPractices);
        return;
      }
      
      setPractices(data.practices || []);
    } catch (error) {
      console.error('Error fetching best practices:', error);
      // Fall back to mock data if API fails
      setPractices(mockPractices);
    } finally {
      setLoading(false);
    }
  };

  const filteredPractices = practices.filter(practice => {
    const matchesModel = selectedModel === "All Models" || practice.model === selectedModel;
    const matchesCategory = selectedCategory === "All Categories" || practice.category === selectedCategory;
    return matchesModel && matchesCategory;
  });

  const getEffectivenessColor = (score: number) => {
    if (score >= 90) return "text-emerald-600";
    if (score >= 80) return "text-amber-600"; 
    return "text-red-500";
  };

  const getEffectivenessBadgeColor = (score: number) => {
    if (score >= 90) return "bg-emerald-100 text-emerald-800";
    if (score >= 80) return "bg-amber-100 text-amber-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-white">
        <Navigation />

        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <Sparkles className="w-8 h-8 text-purple-600" />
              <h1 className="text-3xl font-semibold text-gray-900">Best Practices</h1>
            </div>
            <p className="text-gray-600 text-lg">
              Discover proven techniques extracted from the highest-performing prompts across different models.
            </p>
          </div>

          {/* Model Statistics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {modelStats.map((stat) => (
              <Card key={stat.model} className="bg-white border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={stat.color} variant="secondary">
                      {stat.model}
                    </Badge>
                    <Brain className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-gray-900">{stat.total_practices}</div>
                    <div className="text-sm text-gray-500">Practices</div>
                    <div className="text-sm">
                      <span className={getEffectivenessColor(stat.avg_effectiveness)}>
                        {stat.avg_effectiveness}% avg effectiveness
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filter Controls */}
          <Card className="bg-white border border-gray-200 mb-6">
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-4 justify-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="min-w-[180px] justify-between">
                      {selectedModel}
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {models.map((model) => (
                      <DropdownMenuItem key={model} onClick={() => setSelectedModel(model)}>
                        {model}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="min-w-[180px] justify-between">
                      {selectedCategory}
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {categories.map((category) => (
                      <DropdownMenuItem key={category} onClick={() => setSelectedCategory(category)}>
                        {category}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>

          {/* Best Practices List */}
          {loading ? (
            <div className="flex items-center justify-center min-h-64">
              <div className="text-gray-500">Loading best practices...</div>
            </div>
          ) : filteredPractices.length === 0 ? (
            <Card className="bg-white border border-gray-200">
              <CardContent className="p-12 text-center">
                <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <div className="text-gray-500">No best practices found for the selected filters.</div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {filteredPractices.map((practice) => (
                <Card key={practice.id} className="bg-white border border-gray-200 hover:border-gray-300 transition-colors">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Lightbulb className="w-6 h-6 text-amber-500" />
                        <div>
                          <CardTitle className="text-xl text-gray-900 mb-1">
                            {practice.title}
                          </CardTitle>
                          <p className="text-gray-600">{practice.description}</p>
                        </div>
                      </div>
                      <Badge className={getEffectivenessBadgeColor(practice.effectiveness_score)}>
                        {practice.effectiveness_score}% effective
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant="outline" className="text-xs">
                        {practice.model}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {practice.category}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Users className="w-3 h-3 mr-1" />
                        {practice.sample_count} samples
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {/* Example Prompt */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Example Prompt Pattern:</h4>
                        <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                          <code className="text-sm text-gray-700 whitespace-pre-wrap">
                            {practice.example_prompt}
                          </code>
                        </div>
                      </div>

                      {/* Key Insights */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Key Insights:</h4>
                        <div className="space-y-2">
                          {practice.key_insights.map((insight, index) => (
                            <div key={index} className="flex items-start space-x-2">
                              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-700">{insight}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2">
                        {practice.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs bg-blue-50 text-blue-700">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <span className="text-xs text-gray-500">
                          Updated {new Date(practice.last_updated).toLocaleDateString()}
                        </span>
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                          Try this pattern
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
