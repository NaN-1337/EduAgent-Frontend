import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebaseConfig";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { BookOpen, GraduationCap, ArrowRight, Plus } from "lucide-react";

interface Lesson {
  uid: string;
  title: string;
  grade: string;
  subject: string;
  duration?: string;
  status: "draft" | "fact-check needed" | "ready";
  lastModified?: any;
  createdAt?: any;
}

export default function MyLessons() {
  const navigate = useNavigate();
  const { user, userData, loading } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(true);
  const [lessonsByGrade, setLessonsByGrade] = useState<Record<string, Lesson[]>>({});

  useEffect(() => {
    if (!loading && (!user || userData?.role !== "teacher")) {
      navigate("/login");
    }
  }, [user, userData, loading, navigate]);

  useEffect(() => {
    const fetchLessons = async () => {
      if (!user || userData?.role !== "teacher") {
        setLoadingLessons(false);
        return;
      }

      try {
        setLoadingLessons(true);
        
        // Query lessons for this teacher
        const lessonsRef = collection(db, "lessons");
        const q = query(
          lessonsRef,
          where("teacherId", "==", user.uid),
          orderBy("lastModified", "desc")
        );

        const querySnapshot = await getDocs(q);
        const lessonsData: Lesson[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          lessonsData.push({
            uid: doc.id,
            title: data.title || "Untitled Lesson",
            grade: data.grade || "Unknown",
            subject: data.subject || "Unknown",
            duration: data.duration,
            status: data.status || "draft",
            lastModified: data.lastModified,
            createdAt: data.createdAt,
          });
        });

        setLessons(lessonsData);

        // Group by grade
        const grouped: Record<string, Lesson[]> = {};
        lessonsData.forEach((lesson) => {
          const grade = lesson.grade || "Unknown";
          if (!grouped[grade]) {
            grouped[grade] = [];
          }
          grouped[grade].push(lesson);
        });

        setLessonsByGrade(grouped);
      } catch (error) {
        console.error("Error fetching lessons:", error);
        // If query fails (e.g., missing index), try without orderBy
        try {
          const lessonsRef = collection(db, "lessons");
          const q = query(lessonsRef, where("teacherId", "==", user.uid));
          const querySnapshot = await getDocs(q);
          const lessonsData: Lesson[] = [];

          querySnapshot.forEach((doc) => {
            const data = doc.data();
            lessonsData.push({
              uid: doc.id,
              title: data.title || "Untitled Lesson",
              grade: data.grade || "Unknown",
              subject: data.subject || "Unknown",
              duration: data.duration,
              status: data.status || "draft",
              lastModified: data.lastModified,
              createdAt: data.createdAt,
            });
          });

          // Sort by lastModified manually
          lessonsData.sort((a, b) => {
            const dateA = a.lastModified?.toDate?.() || a.createdAt?.toDate?.() || new Date(0);
            const dateB = b.lastModified?.toDate?.() || b.createdAt?.toDate?.() || new Date(0);
            return dateB.getTime() - dateA.getTime();
          });

          setLessons(lessonsData);

          // Group by grade
          const grouped: Record<string, Lesson[]> = {};
          lessonsData.forEach((lesson) => {
            const grade = lesson.grade || "Unknown";
            if (!grouped[grade]) {
              grouped[grade] = [];
            }
            grouped[grade].push(lesson);
          });

          setLessonsByGrade(grouped);
        } catch (fallbackError) {
          console.error("Error in fallback query:", fallbackError);
        }
      } finally {
        setLoadingLessons(false);
      }
    };

    if (user && userData && userData.role === "teacher") {
      fetchLessons();
    }
  }, [user, userData]);

  if (loading || loadingLessons) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || userData?.role !== "teacher") {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800";
      case "fact-check needed":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800";
      case "draft":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800";
      default:
        return "";
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Unknown date";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
  };

  const handleLessonClick = (lessonId: string) => {
    navigate(`/teacher/lessons/${lessonId}/edit`);
  };

  const gradeOrder = Object.keys(lessonsByGrade).sort((a, b) => {
    const gradeA = parseInt(a.replace(/\D/g, "")) || 0;
    const gradeB = parseInt(b.replace(/\D/g, "")) || 0;
    return gradeA - gradeB;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar role="teacher" />

      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">My Lessons</h1>
              <p className="text-muted-foreground">
                View and manage all your lessons, organized by grade level.
              </p>
            </div>
            <Button onClick={() => navigate("/teacher/new-lesson")} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Lesson
            </Button>
          </div>

          {lessons.length === 0 ? (
            <Card className="border-2">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No lessons yet</h3>
                <p className="text-muted-foreground text-center max-w-md mb-6">
                  You haven't created any lessons yet. Create your first lesson to get started with EduAgent.
                </p>
                <Button onClick={() => navigate("/teacher/new-lesson")} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Your First Lesson
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {gradeOrder.map((grade) => (
                <Card key={grade} className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-primary" />
                      {grade}
                      <span className="text-base font-normal text-muted-foreground">
                        ({lessonsByGrade[grade].length} {lessonsByGrade[grade].length === 1 ? "lesson" : "lessons"})
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {lessonsByGrade[grade].map((lesson) => (
                        <div
                          key={lesson.uid}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                          onClick={() => handleLessonClick(lesson.uid)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleLessonClick(lesson.uid);
                            }
                          }}
                        >
                          <div className="flex-1 space-y-1">
                            <h3 className="font-semibold text-lg">{lesson.title}</h3>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                              <span>{lesson.subject}</span>
                              {lesson.duration && (
                                <>
                                  <span>·</span>
                                  <span>{lesson.duration}</span>
                                </>
                              )}
                              <span>·</span>
                              <span>
                                {formatDate(lesson.lastModified || lesson.createdAt)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge
                              className={`${getStatusColor(lesson.status)} border capitalize`}
                            >
                              {lesson.status}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLessonClick(lesson.uid);
                              }}
                            >
                              Open
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

