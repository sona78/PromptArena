"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Target, ChevronLeft, ChevronRight, Search, Monitor, Server, Brain } from "lucide-react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { createClient } from "@/lib/supabase/client";

interface Task {
  task_id: string;
  name: string;
  description: string;
  type: number;
  testcases: string;
  leaderboard: string[] | null;
}

interface CategoryConfig {
  title: string;
  icon: React.ElementType;
  taskTypes: number[];
  searchPlaceholder: string;
  iconColor: string;
}

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingTask, setStartingTask] = useState<string | null>(null);
  const [searchQueries, setSearchQueries] = useState({
    frontend: "",
    backend: "",
    ml: ""
  });
  const router = useRouter();

  // Recursive function to search for task ID folder in templates bucket
  const findTaskTemplateFolder = async (taskId: string, currentPath: string = ''): Promise<string | null> => {
    try {
      const supabase = createClient();
      const { data: items, error } = await supabase.storage
        .from('Templates')
        .list(currentPath, {
          limit: 100,
          offset: 0,
        });

      if (error) {
        console.error(`Error listing path '${currentPath}':`, error);
        return null;
      }

      if (!items || items.length === 0) {
        return null;
      }

      // Check if current folder name matches task ID
      const pathSegments = currentPath.split('/').filter(Boolean);
      if (pathSegments.length > 0 && pathSegments[pathSegments.length - 1] === taskId) {
        return currentPath;
      }

      // Check if any direct child folder matches task ID
      for (const item of items) {
        if (!item.metadata && item.name === taskId) {
          // This is a folder and its name matches taskId
          const foundPath = currentPath ? `${currentPath}/${item.name}` : item.name;
          return foundPath;
        }
      }

      // Recursively search in subfolders
      for (const item of items) {
        if (!item.metadata) { // This is a folder
          const subPath = currentPath ? `${currentPath}/${item.name}` : item.name;
          const result = await findTaskTemplateFolder(taskId, subPath);
          if (result) {
            return result;
          }
        }
      }

      return null;
    } catch (error) {
      console.error(`Error in findTaskTemplateFolder for path '${currentPath}':`, error);
      return null;
    }
  };

  // Recursive function to get all files from a folder
  const getAllFilesFromFolder = async (folderPath: string): Promise<Array<{ path: string; name: string }>> => {
    const allFiles: Array<{ path: string; name: string }> = [];

    const collectFiles = async (currentPath: string): Promise<void> => {
      try {
        const supabase = createClient();
        const { data: items, error } = await supabase.storage
          .from('Templates')
          .list(currentPath, {
            limit: 100,
            offset: 0,
          });

        if (error) {
          console.error(`Error listing files in '${currentPath}':`, error);
          return;
        }

        if (!items) return;

        for (const item of items) {
          const itemPath = currentPath ? `${currentPath}/${item.name}` : item.name;

          if (item.metadata) {
            // This is a file
            allFiles.push({
              path: itemPath,
              name: item.name
            });
          } else {
            // This is a folder, recurse into it
            await collectFiles(itemPath);
          }
        }
      } catch (error) {
        console.error(`Error collecting files from '${currentPath}':`, error);
      }
    };

    await collectFiles(folderPath);
    return allFiles;
  };

  // Function to copy template files to session folder
  const copyTemplateFiles = async (taskId: string, sessionId: string): Promise<{ success: boolean; filesCopied: number; message: string }> => {
    try {
      console.log(`Starting template copy for task ${taskId} to session ${sessionId}`);

      // Step 1: Find the task template folder recursively
      const templateFolderPath = await findTaskTemplateFolder(taskId);

      if (!templateFolderPath) {
        console.log(`No template folder found for task ${taskId}`);
        return {
          success: true,
          filesCopied: 0,
          message: `No template found for task ${taskId}`
        };
      }

      console.log(`Found template folder at: ${templateFolderPath}`);

      // Step 2: Get all files from the template folder recursively
      const templateFiles = await getAllFilesFromFolder(templateFolderPath);

      if (templateFiles.length === 0) {
        console.log(`No files found in template folder ${templateFolderPath}`);
        return {
          success: true,
          filesCopied: 0,
          message: `Template folder found but no files to copy`
        };
      }

      console.log(`Found ${templateFiles.length} files in template:`, templateFiles.map(f => f.path));

      // Step 3: Copy each file to the session folder
      let successCount = 0;

      for (const file of templateFiles) {
        try {
          console.log(`Copying file: ${file.path}`);

          // Download the file from templates bucket
          const supabase = createClient();
          const { data: fileData, error: downloadError } = await supabase.storage
            .from('Templates')
            .download(file.path);

          if (downloadError) {
            console.error(`Error downloading ${file.path}:`, downloadError);
            continue;
          }

          // Calculate relative path within the template folder
          const relativePath = file.path.replace(templateFolderPath + '/', '');
          const destinationPath = `${sessionId}/${relativePath}`;

          console.log(`Uploading to: ${destinationPath}`);

          // Upload the file to sessions bucket
          const { error: uploadError } = await supabase.storage
            .from('Sessions')
            .upload(destinationPath, fileData, {
              cacheControl: '3600',
              upsert: true // This will overwrite if file already exists
            });

          if (uploadError) {
            console.error(`Error uploading ${destinationPath}:`, uploadError);
          } else {
            console.log(`Successfully copied: ${file.path} -> ${destinationPath}`);
            successCount++;
          }
        } catch (error) {
          console.error(`Error processing file ${file.path}:`, error);
        }
      }

      return {
        success: true,
        filesCopied: successCount,
        message: `Successfully copied ${successCount} out of ${templateFiles.length} files`
      };

    } catch (error) {
      console.error('Copy template error:', error);
      return {
        success: false,
        filesCopied: 0,
        message: 'Failed to copy template files'
      };
    }
  };

  const categories: CategoryConfig[] = [
    {
      title: "BACKEND",
      icon: Server,
      taskTypes: [0], // Frontend tasks
      searchPlaceholder: "Search frontend challenges...",
      iconColor: "#C5AECF"
    },
    {
      title: "FRONTEND", 
      icon: Monitor,
      taskTypes: [1], // Backend tasks
      searchPlaceholder: "Search backend challenges...",
      iconColor: "#46295A"
    },
    {
      title: "MACHINE LEARNING",
      icon: Brain,
      taskTypes: [2], // ML tasks
      searchPlaceholder: "Search ML challenges...",
      iconColor: "#D79D00"
    }
  ];

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('Tasks')
        .select('*')
        .order('name');

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredTasks = (category: CategoryConfig, searchQuery: string) => {
    return tasks.filter(task => {
      const matchesType = category.taskTypes.includes(task.type);
      const matchesSearch = searchQuery === "" || 
        task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesType && matchesSearch;
    });
  };

  const handleSearchChange = (categoryKey: string, value: string) => {
    setSearchQueries(prev => ({
      ...prev,
      [categoryKey]: value
    }));
  };

  const handleStartTask = async (taskId: string) => {
    setStartingTask(taskId);

    try {
      // Get current user
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('User not authenticated:', userError);
        return;
      }

      // Create session_id in format {user_id}/{task_id}
      const sessionId = `${user.id}/${taskId}`;

      // Check if session already exists
      const { data: existingSession, error: sessionError } = await supabase
        .from('Sessions')
        .select('session_id')
        .eq('session_id', sessionId)
        .single();

      if (sessionError && sessionError.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is expected when no session exists
        console.error('Error checking session:', sessionError);
        return;
      }

      if (!existingSession) {
        // Create new session
        const { error: createError } = await supabase
          .from('Sessions')
          .insert({
            session_id: sessionId,
            user_id: user.id,
            task_id: taskId,
            prompts: [],
            feedback: [],
            score: 0
          });

        if (createError) {
          console.error('Error creating session:', createError);
          return;
        }

        // Try to copy template files for this task
        const templateResult = await copyTemplateFiles(taskId, sessionId);
        console.log(`Template copy result:`, templateResult);

        // If no template files were found or copied, create a default starter file
        if (templateResult.filesCopied === 0) {
          const task = tasks.find(t => t.task_id === taskId);
          const shouldCreatePython = task && (task.type === 0 || task.type === 2);

          const fileName = shouldCreatePython ? 'main.py' : '.keep';
          const fileContent = shouldCreatePython ? '# Write your code here\n' : '';

          const { error: storageError } = await supabase.storage
            .from('Sessions')
            .upload(`${sessionId}/${fileName}`, new Blob([fileContent], { type: 'text/plain' }));

          if (storageError) {
            console.error('Error creating default starter file:', storageError);
          } else {
            console.log(`Created default starter file: ${fileName}`);
          }
        }
      }

      // Navigate to editor with session
      router.push(`/editor?session=${sessionId}`);
    } catch (error) {
      console.error('Error starting task:', error);
    } finally {
      setStartingTask(null);
    }
  };

  const getTaskIcon = (taskType: number) => {
    switch (taskType) {
      case 0: // Frontend
        return <Monitor className="w-4 h-4 text-white" />;
      case 1: // Backend
        return <Server className="w-4 h-4 text-white" />;
      case 2: // Machine Learning
        return <Brain className="w-4 h-4 text-white" />;
      default:
        return <Target className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTaskIconBackground = (taskType: number) => {
    switch (taskType) {
      case 0: // Frontend
        return "bg-[#C5AECF]";
      case 1: // Backend
        return "bg-[#46295A]";
      case 2: // Machine Learning
        return "bg-[#D79D00]";
      default:
        return "bg-gray-100";
    }
  };

  const getTaskHoverClasses = (taskType: number) => {
    switch (taskType) {
      case 0: // Frontend
        return "hover:shadow-lg hover:shadow-[#C5AECF]/30 hover:scale-105";
      case 1: // Backend
        return "hover:shadow-lg hover:shadow-[#46295A]/30 hover:scale-105";
      case 2: // Machine Learning
        return "hover:shadow-lg hover:shadow-[#D79D00]/30 hover:scale-105";
      default:
        return "hover:shadow-lg hover:shadow-gray-300/30 hover:scale-105";
    }
  };

  const renderChallengeCard = (task: Task) => (
    <Card key={task.task_id} className={`flex-shrink-0 w-80 bg-white border border-gray-200 hover:border-gray-300 transition-all duration-300 ease-in-out ${getTaskHoverClasses(task.type)}`}>
      <CardHeader className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-8 h-8 rounded-full ${getTaskIconBackground(task.type)} flex items-center justify-center`}>
            {getTaskIcon(task.type)}
          </div>
        </div>
        <CardTitle className="text-subtitle text-[#28282D] line-clamp-2">
          {task.name}
        </CardTitle>
        <p className="text-serif-sm text-[#79797C] line-clamp-3 mt-2">
          {task.description}
        </p>
      </CardHeader>

      <CardContent className="p-4 pt-0">
        <Button
          className="w-full bg-[#28282D] hover:bg-gray-800 text-white font-display-serif !text-white rounded-full tracking-wide text-sm font-bold"
          onClick={() => handleStartTask(task.task_id)}
          disabled={startingTask === task.task_id}
        >
          {startingTask === task.task_id ? "BEGIN" : "BEGIN"}
        </Button>
      </CardContent>
    </Card>
  );

  const renderCategory = (category: CategoryConfig, categoryKey: string) => {
    const IconComponent = category.icon;
    const searchQuery = searchQueries[categoryKey as keyof typeof searchQueries];
    const filteredTasks = getFilteredTasks(category, searchQuery);

    return (
      <div key={categoryKey} className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <IconComponent className="w-6 h-6 text-gray-700" />
            <h2 className="text-section-header text-[#28282D]">
              {category.title}
            </h2>
          </div>
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#28282D]/70 w-4 h-4" />
            <Input
              type="text"
              placeholder={category.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => handleSearchChange(categoryKey, e.target.value)}
              className="pl-10 bg-[#79797C]/50 border-none focus:border-none focus:ring-0 rounded-full text-[#28282D] placeholder:text-[#28282D]/70"
            />
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 text-serif text-[#79797C]">
            {searchQuery ? `No challenges found matching "${searchQuery}"` : "No challenges available in this category"}
          </div>
        ) : (
          <div className="relative">
            <div className="flex space-x-6 overflow-x-auto scrollbar-hide pb-4">
              {filteredTasks.map(renderChallengeCard)}
            </div>
            
            {filteredTasks.length > 3 && (
              <>
                <button className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 bg-white border border-gray-200 rounded-full p-2 shadow-sm hover:shadow-md transition-shadow">
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <button className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 bg-white border border-gray-200 rounded-full p-2 shadow-sm hover:shadow-md transition-shadow">
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <Navigation />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-section-header-lg text-[#28282D] mb-2">CHALLENGES</h1>
          <p className="text-serif-lg text-[#79797C]">Test your prompt engineering skills with these organized challenges.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-64">
            <div className="text-serif text-[#79797C]">Loading challenges...</div>
          </div>
        ) : (
          <div className="space-y-8">
            {categories.map((category, index) => 
              renderCategory(category, ['frontend', 'backend', 'ml'][index])
            )}
          </div>
        )}
      </div>
    </div>
  );
}