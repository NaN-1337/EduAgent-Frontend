import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Plus, BookOpen, ArrowRight } from "lucide-react";
import { LearningPath } from "@/types/learningPath";

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
      },
      {
        id: "1-2",
        title: "Geometrie - Triunghiuri",
        description: "Proprietăți și teoreme despre triunghiuri",
        status: "in_progress",
        order: 2,
      },
      {
        id: "1-3",
        title: "Funcții",
        description: "Funcții liniare și pătratice",
        status: "unlocked",
        order: 3,
      },
      {
        id: "1-4",
        title: "Probabilități",
        description: "Noțiuni de bază despre probabilități",
        status: "locked",
        order: 4,
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
      },
      {
        id: "2-2",
        title: "Evul Mediu",
        description: "Perioada medievală în Europa",
        status: "completed",
        order: 2,
      },
      {
        id: "2-3",
        title: "Renașterea",
        description: "Renașterea și Reforma",
        status: "unlocked",
        order: 3,
      },
    ],
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-18"),
    userId: "user1",
    progress: {
      completed: 2,
      total: 3,
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
      },
      {
        id: "3-2",
        title: "Sistemul de reproducere",
        description: "Reproducerea la plante și animale",
        status: "in_progress",
        order: 2,
      },
      {
        id: "3-3",
        title: "Genetica mendeliană",
        description: "Legile lui Mendel și moștenirea trăsăturilor",
        status: "unlocked",
        order: 3,
      },
      {
        id: "3-4",
        title: "Evoluție și biodiversitate",
        description: "Teoriile evoluției și diversitatea speciilor",
        status: "locked",
        order: 4,
      },
      {
        id: "3-5",
        title: "Ecologie și mediu",
        description: "Ecosisteme, poluare și protecția mediului",
        status: "locked",
        order: 5,
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

export default function LearningPathsPage() {
  const navigate = useNavigate();
  const { user, userData, loading } = useAuth();
  const { t } = useLanguage();
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [loadingPaths, setLoadingPaths] = useState(true);

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
    
    // Mock data loading - will be replaced with Firebase/API call
    const loadLearningPaths = async () => {
      setLoadingPaths(true);
      try {
        // TODO: Replace with actual API call
        // const response = await fetch(`/api/learning-paths?role=${userData.role}&userId=${user.uid}`);
        // const data = await response.json();
        // setLearningPaths(data);
        
        // Check if we have a newly created learning path in sessionStorage
        const newPathData = sessionStorage.getItem('newLearningPath');
        let pathsToDisplay = [...mockLearningPaths];
        
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
            // Add new path at the end of the list
            pathsToDisplay = [...mockLearningPaths, newPath];
            sessionStorage.removeItem('newLearningPath'); // Clear after use
          } catch (e) {
            console.error("Error parsing new learning path:", e);
          }
        }
        
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500));
        // Set learning paths - new ones will always be at the end
        setLearningPaths(pathsToDisplay);
      } catch (error) {
        console.error("Error loading learning paths:", error);
        setLearningPaths([]);
      } finally {
        setLoadingPaths(false);
      }
    };

    loadLearningPaths();
  }, [userData, user, loading]);

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
                          <div>
                            <CardTitle className="text-xl">{path.title}</CardTitle>
                            <CardDescription className="mt-1">
                              {path.subject} • {t.individual.learningPaths.view.chaptersCompleted(path.progress.completed, path.progress.total)}
                            </CardDescription>
                          </div>
                          <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {path.chapters.map((chapter) => (
                            <div
                              key={chapter.id}
                              className={`
                                px-3 py-1.5 rounded-full text-sm font-medium
                                ${
                                  chapter.status === "completed"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                    : chapter.status === "in_progress"
                                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                    : chapter.status === "unlocked"
                                    ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                                    : "bg-gray-50 text-gray-400 dark:bg-gray-900 dark:text-gray-600"
                                }
                              `}
                            >
                              {chapter.title}
                              {chapter.status === "unlocked" && (
                                <span className="ml-1 text-xs">({t.individual.learningPaths.unlocked})</span>
                              )}
                            </div>
                          ))}
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
