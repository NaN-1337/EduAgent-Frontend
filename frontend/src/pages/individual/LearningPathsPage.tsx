import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Plus, BookOpen, ArrowRight, Trash2 } from "lucide-react";
import { LearningPath } from "@/types/learningPath";
import { ExamData, examDataToLearningPath, findExamDataFromPath } from "@/utils/learningPathMapper";
import examDataJSON from "../../../learning_paths.json";
import { translations } from "@/lib/translations";

// Predefined learning paths - loaded from JSON
const PREDEFINED_PATHS_CONFIG = [
  {
    exam_name: "Evaluarea Națională pentru Absolvenții Clasei a VIII-a",
    exam_subject: "Matematică",
  },
  {
    exam_name: "Examenul de Bacalaureat din România",
    exam_subject: "Istorie",
  },
  {
    exam_name: "Examenul de Bacalaureat din România",
    exam_subject: "Biologie (Anatomie și Fiziologie Umană, Genetică și Ecologie Umană)",
  },
  // Removed second Bacalaureat - Matematică (M_mate-info) with 9 chapters - keeping only the one with 10 chapters
];

// Load learning paths from localStorage or create predefined ones
function loadLearningPathsFromStorage(userId: string, examDataList: ExamData[], language: "ro" | "en" = "ro"): LearningPath[] {
  const storageKey = `learning_paths_${userId}`;
  const stored = localStorage.getItem(storageKey);
  
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Convert date strings back to Date objects
      return parsed.map((path: any) => ({
        ...path,
        createdAt: new Date(path.createdAt),
        updatedAt: new Date(path.updatedAt),
      }));
    } catch (e) {
      console.error("Error parsing stored learning paths:", e);
    }
  }
  
  // Get translations
  const t = translations[language].individual.learningPaths;
  
  // Create predefined paths from JSON
  const predefinedPaths: LearningPath[] = PREDEFINED_PATHS_CONFIG.map((config) => {
    const examData = examDataList.find(
      (data) =>
        data.exam_name === config.exam_name &&
        data.exam_subject === config.exam_subject
    );
    
    if (!examData) {
      console.warn(`Could not find exam data for ${config.exam_name} - ${config.exam_subject}`);
      return null;
    }
    
    return examDataToLearningPath(examData, userId, [], t, language);
  }).filter((path): path is LearningPath => path !== null);
  
  // Save to localStorage
  localStorage.setItem(storageKey, JSON.stringify(predefinedPaths));
  
  return predefinedPaths;
}

// Save learning paths to localStorage
function saveLearningPaths(userId: string, paths: LearningPath[]) {
  const storageKey = `learning_paths_${userId}`;
  localStorage.setItem(storageKey, JSON.stringify(paths));
}

export default function LearningPathsPage() {
  const navigate = useNavigate();
  const { user, userData, loading } = useAuth();
  const { t, language } = useLanguage();
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [loadingPaths, setLoadingPaths] = useState(true);
  const [deletingPathId, setDeletingPathId] = useState<string | null>(null);

  // Check authentication and role
  useEffect(() => {
    if (loading) return; // Wait for auth to load
    
    if (!user) {
      navigate("/login");
      return;
    }

    // Wait for userData to load - allow it to be null initially
    if (userData === undefined) {
      return;
    }

    // Check if user has the right role only after userData is loaded
    if (userData && userData.role !== "individual" && userData.role !== "student") {
      navigate("/login");
      return;
    }
  }, [user, userData, loading, navigate]);

  // Determine base path based on role (only after userData is loaded)
  const basePath = userData?.role === "student" ? "/student/learning-paths" : "/individual/learning-paths";

  // Load learning paths data
  useEffect(() => {
    if (loading) return; // Wait for auth to load
    if (!userData || !user) {
      setLoadingPaths(false);
      return;
    }
    if (userData.role !== "individual" && userData.role !== "student") {
      setLoadingPaths(false);
      return;
    }
    
    const loadLearningPaths = async () => {
      setLoadingPaths(true);
      try {
        // Load exam data from JSON
        const examDataList = examDataJSON as ExamData[];
        
        // Get translations
        const tLearningPaths = translations[language].individual.learningPaths;
        
        // Load existing paths from localStorage
        let pathsToDisplay = loadLearningPathsFromStorage(user?.uid || "default", examDataList, language);
        
        // Apply translations to existing paths
        pathsToDisplay = pathsToDisplay.map((path) => {
          // Re-translate title and subject based on current language
          const examData = findExamDataFromPath(path, examDataList);
          
          if (examData) {
            const updatedPath = examDataToLearningPath(examData, path.userId, [], tLearningPaths, language);
            // Preserve progress and chapter statuses, but update titles/descriptions
            return {
              ...updatedPath,
              id: path.id,
              chapters: path.chapters.map((ch, idx) => {
                const newCh = updatedPath.chapters[idx];
                if (newCh) {
                  // Keep status from existing chapter, but update title and description from translation
                  return { ...newCh, status: ch.status };
                }
                return ch;
              }),
              progress: path.progress,
              createdAt: path.createdAt,
            };
          }
          return path;
        });
        
        // Check if we have a newly created learning path in sessionStorage
        const newPathData = sessionStorage.getItem('newLearningPath');
        if (newPathData) {
          try {
            const newPath = JSON.parse(newPathData);
            // Parse dates if they are strings
            if (typeof newPath.createdAt === 'string') {
              newPath.createdAt = new Date(newPath.createdAt);
            }
            if (typeof newPath.updatedAt === 'string') {
              newPath.updatedAt = new Date(newPath.updatedAt);
            }
            
            // Apply translations to new path
            let translatedNewPath = newPath;
            const examData = findExamDataFromPath(newPath, examDataList);
            
            if (examData) {
              const translatedPath = examDataToLearningPath(examData, newPath.userId, [], tLearningPaths, language);
              // Preserve progress and chapter statuses from newPath, but update titles/descriptions
              translatedNewPath = {
                ...translatedPath,
                id: newPath.id,
                chapters: newPath.chapters.map((ch: any, idx: number) => {
                  const newCh = translatedPath.chapters[idx];
                  if (newCh) {
                    // Keep status from newPath, but update title and description from translation
                    return { ...newCh, status: ch.status };
                  }
                  return ch;
                }),
                progress: newPath.progress,
                createdAt: newPath.createdAt,
                updatedAt: newPath.updatedAt,
              };
            }
            
            // Check if path already exists (by title and subject)
            const existingIndex = pathsToDisplay.findIndex(
              (p) => p.id === translatedNewPath.id
            );
            
            if (existingIndex >= 0) {
              // Replace existing
              pathsToDisplay[existingIndex] = translatedNewPath;
            } else {
              // Add new path at the end of the list
              pathsToDisplay = [...pathsToDisplay, translatedNewPath];
            }
            
            // Save updated paths
            saveLearningPaths(user?.uid || "default", pathsToDisplay);
            
            sessionStorage.removeItem('newLearningPath'); // Clear after use
          } catch (e) {
            console.error("Error parsing new learning path:", e);
          }
        }
        
        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 300));
        
        // Set learning paths
        setLearningPaths(pathsToDisplay);
      } catch (error) {
        console.error("Error loading learning paths:", error);
        setLearningPaths([]);
      } finally {
        setLoadingPaths(false);
      }
    };

    loadLearningPaths();
  }, [userData, user, loading, language]);

  const handleDeletePath = async (pathId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation to path details
    
    if (!user) return;
    
    if (!window.confirm(t.individual.learningPaths.deleteConfirm)) {
      return;
    }
    
    setDeletingPathId(pathId);
    
    try {
      // Remove path from localStorage
      const updatedPaths = learningPaths.filter((path) => path.id !== pathId);
      saveLearningPaths(user.uid, updatedPaths);
      
      // Update state
      setLearningPaths(updatedPaths);
    } catch (error) {
      console.error("Error deleting learning path:", error);
    } finally {
      setDeletingPathId(null);
    }
  };

  // Show loading spinner while auth or data is loading
  if (loading || loadingPaths) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is authenticated and has userData, render the page
  if (user && userData && (userData.role === "individual" || userData.role === "student")) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar role={userData.role === "student" ? "student" : "individual"} />
        
        <main className="pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">{t.individual.learningPaths.title}</h1>
                <p className="text-lg text-muted-foreground">
                  {t.individual.learningPaths.description}
                </p>
              </div>
              <Button onClick={() => navigate(`${basePath}/new`)}>
                <Plus className="h-4 w-4 mr-2" />
                {t.individual.learningPaths.newLearningPath}
              </Button>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">{t.individual.learningPaths.activeLearningPaths}</h2>
              
              {learningPaths.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      {t.individual.learningPaths.noActivePaths}
                    </p>
                    <Button onClick={() => navigate(`${basePath}/new`)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t.individual.learningPaths.createNewPath}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {learningPaths.map((path) => (
                    <Card 
                      key={path.id} 
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(`${basePath}/${path.id}`)}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-xl">{path.title}</CardTitle>
                            <CardDescription className="mt-1">
                              {path.subject} • {t.individual.learningPaths.view.chaptersCompleted(path.progress.completed, path.progress.total)}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={(e) => handleDeletePath(path.id, e)}
                              disabled={deletingPathId === path.id}
                              title={t.individual.learningPaths.delete}
                            >
                              {deletingPathId === path.id ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-destructive border-t-transparent" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                            <ArrowRight className="h-5 w-5 text-muted-foreground" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {path.chapters.map((chapter) => {
                            // Determine color based on status
                            let bgColor = "";
                            let textColor = "";
                            
                            if (chapter.status === "completed") {
                              bgColor = "bg-green-100 dark:bg-green-900";
                              textColor = "text-green-800 dark:text-green-200";
                            } else if (chapter.status === "in_progress") {
                              bgColor = "bg-yellow-100 dark:bg-yellow-900";
                              textColor = "text-yellow-800 dark:text-yellow-200";
                            } else if (chapter.status === "unlocked") {
                              bgColor = "bg-gray-100 dark:bg-gray-800";
                              textColor = "text-gray-600 dark:text-gray-400";
                            } else {
                              // locked
                              bgColor = "bg-gray-50 dark:bg-gray-900";
                              textColor = "text-gray-400 dark:text-gray-600";
                            }
                            
                            return (
                              <div
                                key={chapter.id}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium ${bgColor} ${textColor}`}
                              >
                                {chapter.title}
                                {chapter.status === "unlocked" && (
                                  <span className="ml-1 text-xs">(Unlocked)</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show loading if we're waiting for userData
  if (user && !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If we get here, user is not authenticated or doesn't have the right role
  return null;
}
