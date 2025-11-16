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

// Mock data - will be replaced with backend API calls
const mockLearningPaths: LearningPath[] = [
  {
    id: "1",
    title: "Evaluare Națională",
    subject: "Matematică",
    subjectStorage: "matematica",
    goal: "Evaluare Națională",
    chapters: [
      {
        id: "1-1",
        title: "Algebră - Ecuații",
        description: "Învață să rezolvi ecuații de gradul I și II",
        status: "completed",
        order: 1,
        lessonId: "lesson-1",
      },
      {
        id: "1-2",
        title: "Geometrie - Triunghiuri",
        description: "Proprietăți și teoreme despre triunghiuri",
        status: "in_progress",
        order: 2,
        lessonId: "lesson-2",
      },
      {
        id: "1-3",
        title: "Funcții",
        description: "Funcții liniare și pătratice",
        status: "unlocked",
        order: 3,
        lessonId: "lesson-3",
      },
      {
        id: "1-4",
        title: "Probabilități",
        description: "Noțiuni de bază despre probabilități",
        status: "locked",
        order: 4,
        lessonId: "lesson-4",
      },
    ],
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-20"),
    userId: "user1",
    progress: {
      completed: 1,
      total: 4,
    },
  },
  {
    id: "2",
    title: "Bacalaureat",
    subject: "Istorie",
    subjectStorage: "istorie",
    goal: "Bacalaureat",
    chapters: [
      {
        id: "2-1",
        title: "Antichitate",
        description: "Istoria Greciei și Romei antice",
        status: "completed",
        order: 1,
        lessonId: "lesson-2-1",
      },
      {
        id: "2-2",
        title: "Evul Mediu",
        description: "Perioada medievală în Europa",
        status: "completed",
        order: 2,
        lessonId: "lesson-2-2",
      },
      {
        id: "2-3",
        title: "Renașterea",
        description: "Renașterea și Reforma",
        status: "unlocked",
        order: 3,
        lessonId: "lesson-2-3",
      },
      {
        id: "2-4",
        title: "Revoluții și modernitate",
        description: "Revoluțiile din secolul XVIII-XIX",
        status: "locked",
        order: 4,
        lessonId: "lesson-2-4",
      },
      {
        id: "2-5",
        title: "Secolul XX",
        description: "Primul și al Doilea Război Mondial",
        status: "locked",
        order: 5,
        lessonId: "lesson-2-5",
      },
    ],
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-18"),
    userId: "user1",
    progress: {
      completed: 2,
      total: 5,
    },
  },
  {
    id: "3",
    title: "Bacalaureat",
    subject: "Biologie",
    subjectStorage: "biologie",
    goal: "Bacalaureat",
    chapters: [
      {
        id: "3-1",
        title: "Celula - Structură și funcții",
        description: "Structura celulei, organitele și funcțiile lor",
        status: "completed",
        order: 1,
        lessonId: "lesson-3-1",
      },
      {
        id: "3-2",
        title: "Sistemul de reproducere",
        description: "Reproducerea la plante și animale",
        status: "in_progress",
        order: 2,
        lessonId: "lesson-3-2",
      },
      {
        id: "3-3",
        title: "Genetica mendeliană",
        description: "Legile lui Mendel și moștenirea trăsăturilor",
        status: "unlocked",
        order: 3,
        lessonId: "lesson-3-3",
      },
      {
        id: "3-4",
        title: "Evoluție și biodiversitate",
        description: "Teoriile evoluției și diversitatea speciilor",
        status: "locked",
        order: 4,
        lessonId: "lesson-3-4",
      },
      {
        id: "3-5",
        title: "Ecologie și mediu",
        description: "Ecosisteme, poluare și protecția mediului",
        status: "locked",
        order: 5,
        lessonId: "lesson-3-5",
      },
    ],
    createdAt: new Date("2024-01-12"),
    updatedAt: new Date("2024-01-19"),
    userId: "user1",
    progress: {
      completed: 1,
      total: 5,
    },
  },
];

export default function LearningPathViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, userData, loading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [loading, setLoading] = useState(true);
  const [completingChapterId, setCompletingChapterId] = useState<string | null>(null);

  // Determine base path based on role
  const basePath = userData?.role === "student" ? "/student/learning-paths" : "/individual/learning-paths";

  useEffect(() => {
    if (!authLoading && (!user || (userData?.role !== "individual" && userData?.role !== "student"))) {
      navigate("/login");
    }
  }, [user, userData, authLoading, navigate]);

  useEffect(() => {
    const loadLearningPath = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/learning-paths/${id}?role=${userData?.role}&userId=${user?.uid}`);
      // const data = await response.json();
      // setLearningPath(data);
      
      // Mock data loading - find the learning path by ID
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      // Get all mock learning paths (including newly created ones from sessionStorage)
      let allPaths = [...mockLearningPaths];
      
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
          allPaths = [...mockLearningPaths, newPath];
        } catch (e) {
          console.error("Error parsing new learning path:", e);
        }
      }
      
      // Find the learning path by ID
      const foundPath = allPaths.find((path) => path.id === id);
      
      if (foundPath) {
        setLearningPath(foundPath);
      } else {
        setLearningPath(null);
      }
      
      setLoading(false);
    };

    if (userData?.role === "individual" || userData?.role === "student") {
      loadLearningPath();
    }
  }, [id, userData]);

  const handleCompleteChapter = async (chapterId: string) => {
    if (!learningPath) return;

    setCompletingChapterId(chapterId);
    
    try {
      // TODO: Replace with actual API call
      // await fetch(`/api/learning-paths/${id}/chapters/${chapterId}/complete`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     role: userData?.role,
      //     userId: user?.uid,
      //   }),
      // });

      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update local state
      const updatedChapters = learningPath.chapters.map((chapter) => {
        if (chapter.id === chapterId) {
          return { ...chapter, status: "completed" as ChapterStatus };
        }
        // Unlock next chapter if this one is completed
        if (chapter.order === learningPath.chapters.find((c) => c.id === chapterId)!.order + 1) {
          if (chapter.status === "locked") {
            return { ...chapter, status: "unlocked" as ChapterStatus };
          }
        }
        return chapter;
      });

      const completedCount = updatedChapters.filter((c) => c.status === "completed").length;

      setLearningPath({
        ...learningPath,
        chapters: updatedChapters,
        progress: {
          completed: completedCount,
          total: updatedChapters.length,
        },
      });
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
                          handleChapterClick(chapter);
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
                        {t.individual.learningPaths.continueLesson}
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

