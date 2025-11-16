import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowLeft, CheckCircle2, Lock, Unlock, PlayCircle, Loader2 } from "lucide-react";
import { LearningPath, Chapter, ChapterStatus } from "@/types/learningPath";
import { cn } from "@/lib/utils";
import { translations } from "@/lib/translations";
import { ExamData, examDataToLearningPath, findExamDataFromPath } from "@/utils/learningPathMapper";
import examDataJSON from "../../../learning_paths.json";
import { getTranslatedChapter } from "@/utils/chapterTranslations";

// Load learning paths from localStorage
function loadLearningPathsFromStorage(userId: string, examDataList: ExamData[]): LearningPath[] {
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
  
  return [];
}

// Save learning paths to localStorage
function saveLearningPathsToStorage(userId: string, paths: LearningPath[]) {
  const storageKey = `learning_paths_${userId}`;
  localStorage.setItem(storageKey, JSON.stringify(paths));
}

export default function LearningPathViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, userData, loading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [loading, setLoading] = useState(true);
  const [completingChapterId, setCompletingChapterId] = useState<string | null>(null);
  
  // Get translations
  const tLearningPaths = translations[language].individual.learningPaths;

  // Determine base path based on role
  const basePath = userData?.role === "student" ? "/student/learning-paths" : "/individual/learning-paths";

  useEffect(() => {
    if (!authLoading && (!user || (userData?.role !== "individual" && userData?.role !== "student"))) {
      navigate("/login");
    }
  }, [user, userData, authLoading, navigate]);

  useEffect(() => {
    const loadLearningPath = async () => {
      if (!id || !user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      
      try {
        // Load exam data from JSON
        const examDataList = examDataJSON as ExamData[];
        
        // Load all learning paths from localStorage
        let allPaths = loadLearningPathsFromStorage(user.uid, examDataList);
        
        // Check for newly created learning path in sessionStorage
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
            // Add lessonId to chapters if missing
            newPath.chapters = newPath.chapters.map((ch: any, idx: number) => ({
              ...ch,
              lessonId: ch.lessonId || `lesson-${newPath.id}-${idx + 1}`,
            }));
            
            // Check if path already exists
            const existingIndex = allPaths.findIndex((p) => p.id === newPath.id);
            if (existingIndex >= 0) {
              allPaths[existingIndex] = newPath;
            } else {
              allPaths = [...allPaths, newPath];
            }
            
            // Save updated paths
            saveLearningPathsToStorage(user.uid, allPaths);
            sessionStorage.removeItem('newLearningPath');
          } catch (e) {
            console.error("Error parsing new learning path:", e);
          }
        }
        
        // Find the learning path by ID
        let foundPath = allPaths.find((path) => path.id === id);
        
        if (foundPath) {
          // Apply translations to the path (title, subject, and chapters)
          // Find examData by matching title and subject
          const examData = findExamDataFromPath(foundPath, examDataList);
          
          if (examData) {
            // Re-translate the path with current language
            const translatedPath = examDataToLearningPath(examData, foundPath.userId, [], tLearningPaths, language);
            
            // Preserve progress and chapter statuses, but update titles/descriptions
            foundPath = {
              ...translatedPath,
              id: foundPath.id,
              chapters: foundPath.chapters.map((ch, idx) => {
                const newCh = translatedPath.chapters[idx];
                if (newCh) {
                  // Keep status from existing chapter, but update title and description from translation
                  return { ...newCh, status: ch.status };
                }
                return ch;
              }),
              progress: foundPath.progress,
              createdAt: foundPath.createdAt,
              updatedAt: foundPath.updatedAt,
            };
          }
          
          setLearningPath(foundPath);
        } else {
          setLearningPath(null);
        }
      } catch (error) {
        console.error("Error loading learning path:", error);
        setLearningPath(null);
      } finally {
        setLoading(false);
      }
    };

    if ((userData?.role === "individual" || userData?.role === "student") && user) {
      loadLearningPath();
    }
  }, [id, userData, user, language]);

  const handleCompleteChapter = async (chapterId: string) => {
    if (!learningPath || !user) return;

    setCompletingChapterId(chapterId);
    
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Find the chapter being completed
      const completedChapter = learningPath.chapters.find((c) => c.id === chapterId);
      if (!completedChapter) return;

      // Update local state
      const updatedChapters = learningPath.chapters.map((chapter) => {
        // Mark this chapter as completed
        if (chapter.id === chapterId) {
          return { ...chapter, status: "completed" as ChapterStatus };
        }
        // Unlock next chapter if this one is completed
        // Find the chapter with order = completedChapter.order + 1
        if (chapter.order === completedChapter.order + 1) {
          if (chapter.status === "locked") {
            return { ...chapter, status: "unlocked" as ChapterStatus };
          }
        }
        return chapter;
      });

      const completedCount = updatedChapters.filter((c) => c.status === "completed").length;

      const updatedPath: LearningPath = {
        ...learningPath,
        chapters: updatedChapters,
        updatedAt: new Date(),
        progress: {
          completed: completedCount,
          total: updatedChapters.length,
        },
      };

      setLearningPath(updatedPath);
      
      // Save to localStorage
      const examDataList = examDataJSON as ExamData[];
      const allPaths = loadLearningPathsFromStorage(user.uid, examDataList);
      const pathIndex = allPaths.findIndex((p) => p.id === learningPath.id);
      if (pathIndex >= 0) {
        allPaths[pathIndex] = updatedPath;
        saveLearningPathsToStorage(user.uid, allPaths);
      }
    } catch (error) {
      console.error("Error completing chapter:", error);
    } finally {
      setCompletingChapterId(null);
    }
  };

  const handleChapterClick = (chapter: Chapter) => {
    if (chapter.status === "locked") return;
    
    if (chapter.lessonId) {
      // Navigate to lesson page
      navigate(`/lesson/${chapter.lessonId}`);
    }
  };

  const handleStartChapter = async (chapterId: string) => {
    if (!learningPath || !user) return;

    try {
      // Update chapter status to "in_progress"
      const updatedChapters = learningPath.chapters.map((chapter) => {
        if (chapter.id === chapterId && chapter.status === "unlocked") {
          return { ...chapter, status: "in_progress" as ChapterStatus };
        }
        return chapter;
      });

      const updatedPath: LearningPath = {
        ...learningPath,
        chapters: updatedChapters,
        updatedAt: new Date(),
      };

      setLearningPath(updatedPath);
      
      // Save to localStorage
      const examDataList = examDataJSON as ExamData[];
      const allPaths = loadLearningPathsFromStorage(user.uid, examDataList);
      const pathIndex = allPaths.findIndex((p) => p.id === learningPath.id);
      if (pathIndex >= 0) {
        allPaths[pathIndex] = updatedPath;
        saveLearningPathsToStorage(user.uid, allPaths);
      }

      // Navigate to lesson if lessonId exists
      const chapter = learningPath.chapters.find((c) => c.id === chapterId);
      if (chapter?.lessonId) {
        navigate(`/lesson/${chapter.lessonId}`);
      }
    } catch (error) {
      console.error("Error starting chapter:", error);
    }
  };

  const getChapterStatusIcon = (status: ChapterStatus) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case "in_progress":
        return <PlayCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />;
      case "unlocked":
        return <Unlock className="h-5 w-5 text-gray-600 dark:text-gray-400" />;
      case "locked":
        return <Lock className="h-5 w-5 text-gray-400 dark:text-gray-600" />;
    }
  };

  const getChapterStatusColor = (status: ChapterStatus) => {
    switch (status) {
      case "completed":
        return "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800";
      case "in_progress":
        return "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800";
      case "unlocked":
        return "bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-800";
      case "locked":
        return "bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-800 opacity-60";
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!learningPath) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar role={userData?.role === "student" ? "student" : "individual"} />
        <main className="pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Calea de învățare nu a fost găsită.</p>
                <Button onClick={() => navigate(basePath)} className="mt-4">
                  {t.individual.learningPaths.view.backToPaths}
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar role={userData?.role === "student" ? "student" : "individual"} />
      
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate(basePath)}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.individual.learningPaths.view.backToPaths}
          </Button>

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{learningPath.title}</h1>
            <p className="text-lg text-muted-foreground mb-4">
              {learningPath.subject} • {learningPath.goal}
            </p>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                {t.individual.learningPaths.view.progress}:{" "}
                <span className="font-semibold text-foreground">
                  {t.individual.learningPaths.view.chaptersCompleted(
                    learningPath.progress.completed,
                    learningPath.progress.total
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {learningPath.chapters.map((chapter) => (
              <Card
                key={chapter.id}
                className={cn(
                  "transition-all cursor-pointer hover:shadow-lg",
                  getChapterStatusColor(chapter.status),
                  chapter.status === "locked" && "cursor-not-allowed"
                )}
                onClick={() => handleChapterClick(chapter)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{chapter.title}</CardTitle>
                      <CardDescription>{chapter.description}</CardDescription>
                    </div>
                    {getChapterStatusIcon(chapter.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {chapter.status === "completed" && t.individual.learningPaths.completed}
                      {chapter.status === "in_progress" && t.individual.learningPaths.inProgress}
                      {chapter.status === "unlocked" && t.individual.learningPaths.unlocked}
                      {chapter.status === "locked" && t.individual.learningPaths.locked}
                    </span>
                    {chapter.status === "in_progress" && (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCompleteChapter(chapter.id);
                        }}
                        disabled={completingChapterId === chapter.id}
                      >
                        {completingChapterId === chapter.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          t.individual.learningPaths.completeLesson
                        )}
                      </Button>
                    )}
                    {chapter.status === "unlocked" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartChapter(chapter.id);
                        }}
                      >
                        {t.individual.learningPaths.startLesson}
                      </Button>
                    )}
                    {chapter.status === "completed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleChapterClick(chapter);
                        }}
                      >
                        {t.individual.learningPaths.accessAgain}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

