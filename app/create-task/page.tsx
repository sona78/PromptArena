"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import { Navigation } from "@/components/navigation";
import { FileUpload } from "@/components/ui/file-upload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trophy, Settings, Upload, Code, Target } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function CreateTaskPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: 0,
    test_file_name: ""
  });
  const [challengeFiles, setChallengeFiles] = useState<File[]>([]);
  const [fileStructure, setFileStructure] = useState<Record<string, string>>({});

  const taskTypes = [
    { value: 0, label: "Frontend", description: "Build user interfaces, components, and client-side applications" },
    { value: 1, label: "Backend", description: "Create APIs, databases, and server-side logic" },
    { value: 2, label: "ML", description: "Machine learning, data analysis, and AI model development" }
  ];

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFolderSelect = (files: File[], structure: Record<string, string>) => {
    setChallengeFiles(files);
    setFileStructure(structure);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare the data with file structure
      const submitData = {
        ...formData,
        file_structure: fileStructure,
        has_files: challengeFiles.length > 0
      };

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
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
            <h1 className="text-title-lg text-gray-900 mb-2">Create New Task</h1>
            <p className="text-body-lg text-gray-600">Design a new challenge for the community to tackle.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-subtitle">
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
                        <div className="text-subtitle text-gray-900">{type.label}</div>
                        <div className="text-body-sm text-gray-600 mt-1">{type.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>


            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-subtitle">
                  <Code className="w-5 h-5" />
                  <span>Challenge Files</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="challenge_folder">Challenge Folder</Label>
                  <div className="mt-1">
                    <FileUpload
                      onFolderSelect={handleFolderSelect}
                      placeholder="Drag and drop your entire challenge folder here, or click to browse"
                      accept={{
                        'text/*': ['.py', '.js', '.ts', '.txt', '.json', '.md', '.yml', '.yaml'],
                        'application/json': ['.json']
                      }}
                      allowFolders={true}
                    />
                  </div>
                  <p className="text-body-sm text-gray-500 mt-1">
                    Upload your complete challenge folder including test files, starter code, and any supporting files
                  </p>
                </div>


                <div>
                  <Label htmlFor="test_file_name">Test File Name</Label>
                  <Input
                    id="test_file_name"
                    type="text"
                    value={formData.test_file_name}
                    onChange={(e) => handleInputChange('test_file_name', e.target.value)}
                    placeholder="e.g., test.py, test_cases.js, tests/test_main.py"
                    className="mt-1"
                  />
                  <p className="text-body-sm text-gray-500 mt-1">
                    The path to the test file within your uploaded folder
                  </p>
                </div>

                {/* Show available files if folder is uploaded */}
                {challengeFiles.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="text-body-sm font-medium text-blue-900 mb-2">Available files in your folder:</h4>
                    <div className="text-body-sm text-blue-700 space-y-1 max-h-32 overflow-y-auto">
                      {Object.keys(fileStructure).map((filePath, index) => (
                        <div key={index} className="flex justify-between">
                          <span>{filePath}</span>
                          <button
                            type="button"
                            onClick={() => handleInputChange('test_file_name', filePath)}
                            className="text-blue-600 hover:text-blue-800 underline ml-2"
                          >
                            Use as test file
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                disabled={loading || !formData.name || !formData.description || (challengeFiles.length > 0 && !formData.test_file_name)}
                className="bg-gray-900 hover:bg-gray-800 text-white text-body"
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
