"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trophy, Settings, Upload, FileText, Code, Target } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function CreateTaskPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: 0,
    criteria: "",
    entry_file: "",
    test_file: ""
  });

  const taskTypes = [
    { value: 0, label: "Code Generation", description: "Generate code based on requirements" },
    { value: 1, label: "Text Processing", description: "Process and analyze text content" },
    { value: 2, label: "Problem Solving", description: "Solve algorithmic or logical problems" },
    { value: 3, label: "Creative Writing", description: "Generate creative content" }
  ];

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.error || 'Error creating task. Please try again.');
        return;
      }

      alert('Task created successfully!');
      router.push('/challenges');
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Error creating task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-white">
        <Navigation />

        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">Create New Task</h1>
            <p className="text-gray-600">Design a new challenge for the community to tackle.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5" />
                  <span>Basic Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Task Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter a descriptive name for your task"
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Provide a detailed description of what the task requires"
                    required
                    rows={4}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="type">Task Type *</Label>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {taskTypes.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => handleInputChange('type', type.value)}
                        className={`p-4 border rounded-lg text-left transition-colors ${
                          formData.type === type.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-medium text-gray-900">{type.label}</div>
                        <div className="text-sm text-gray-600 mt-1">{type.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Evaluation Criteria</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="criteria">Judging Criteria</Label>
                  <Textarea
                    id="criteria"
                    value={formData.criteria}
                    onChange={(e) => handleInputChange('criteria', e.target.value)}
                    placeholder="Describe how submissions will be evaluated (e.g., correctness, efficiency, creativity)"
                    rows={3}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Code className="w-5 h-5" />
                  <span>Technical Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="entry_file">Entry File Name</Label>
                  <Input
                    id="entry_file"
                    type="text"
                    value={formData.entry_file}
                    onChange={(e) => handleInputChange('entry_file', e.target.value)}
                    placeholder="e.g., main.py, solution.js (optional)"
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    The default file name participants should use for their solution
                  </p>
                </div>

                <div>
                  <Label htmlFor="test_file">Test File Content</Label>
                  <Textarea
                    id="test_file"
                    value={formData.test_file}
                    onChange={(e) => handleInputChange('test_file', e.target.value)}
                    placeholder="Enter test cases or validation logic"
                    rows={6}
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Test cases or validation code to evaluate submissions
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !formData.name || !formData.description}
                className="bg-gray-900 hover:bg-gray-800 text-white"
              >
                {loading ? "Creating..." : "Create Task"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AuthGuard>
  );
}
