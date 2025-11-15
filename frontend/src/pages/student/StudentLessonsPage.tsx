import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";
import { convertLessonFromStorage, gradeToStorage } from "@/lib/dataConverters";
import { BookOpen, ArrowRight, CheckCircle2 } from "lucide-react";
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";

interface Lesson {
  id: string;
  title: string;
  subject: string;
  grade: string;
  teacherName: string;
  teacherId: string;
  createdAt?: any;
  lastModified?: any;
  isCompleted?: boolean;
}

export default function StudentLessonsPage() {
  const navigate = useNavigate();
  const { user, userData, loading } = useAuth();
  const { t, language } = useLanguage();
  const [myLessons, setMyLessons] = useState<Lesson[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(true);

  useEffect(() => {
    if (!loading && (!user || userData?.role !== "student")) {
      navigate("/login");
    }
  }, [user, userData, loading, navigate]);

  useEffect(() => {
    const fetchLessons = async () => {
      if (!userData || userData.role !== "student" || !userData.enrolledTeachers || !userData.grade) {
        setLoadingLessons(false);
        return;
      }

      try {
        setLoadingLessons(true);
        const enrolledTeacherIds = userData.enrolledTeachers;
        // Convert student grade to integer for querying (storage format)
        const studentGradeStorage = gradeToStorage(userData.grade || "");
        const studentGrade = studentGradeStorage !== null ? studentGradeStorage : userData.grade;

        if (enrolledTeacherIds.length === 0) {
          setMyLessons([]);
          setLoadingLessons(false);
          return;
        }

        // Fetch lessons for enrolled teachers that match the student's grade and are ready
        const lessonsRef = collection(db, "lessons");
        const lessonsData: Lesson[] = [];
        const teacherMap = new Map<string, string>(); // Map teacherId to teacher name

        // First, fetch all teacher names
        const teacherPromises = enrolledTeacherIds.map(async (teacherId) => {
          const teacherDocRef = doc(db, "users", teacherId);
          const teacherDocSnap = await getDoc(teacherDocRef);
          if (teacherDocSnap.exists()) {
            const data = teacherDocSnap.data();
            teacherMap.set(teacherId, data.name || "Unknown Teacher");
          }
        });
        await Promise.all(teacherPromises);

        // Query lessons for each enrolled teacher
        const lessonPromises = enrolledTeacherIds.map(async (teacherId) => {
          try {
            const q = query(
              lessonsRef,
              where("teacherId", "==", teacherId),
              where("grade", "==", studentGrade),
              where("status", "==", "ready"),
              orderBy("lastModified", "desc")
            );
            const querySnapshot = await getDocs(q);
            
            querySnapshot.forEach((doc) => {
              const data = doc.data();
              // Convert from storage format to display format
              const converted = convertLessonFromStorage(data, {
                grades: translations[language].grades,
                teachingFields: translations[language].teachingFields,
              });
              lessonsData.push({
                id: doc.id,
                title: converted.title || "Untitled Lesson",
                subject: converted.subject || "Unknown",
                grade: converted.grade || "Unknown",
                teacherName: teacherMap.get(teacherId) || "Unknown Teacher",
                teacherId: teacherId,
                createdAt: data.createdAt,
                lastModified: data.lastModified,
              });
            });
          } catch (error) {
            // If orderBy fails, try without it
            try {
              const q = query(
                lessonsRef,
                where("teacherId", "==", teacherId),
                where("grade", "==", studentGrade),
                where("status", "==", "ready")
              );
              const querySnapshot = await getDocs(q);
              
              querySnapshot.forEach((doc) => {
                const data = doc.data();
                // Convert from storage format to display format
                const converted = convertLessonFromStorage(data, {
                  grades: translations[language].grades,
                  teachingFields: translations[language].teachingFields,
                });
                lessonsData.push({
                  id: doc.id,
                  title: converted.title || "Untitled Lesson",
                  subject: converted.subject || "Unknown",
                  grade: converted.grade || "Unknown",
                  teacherName: teacherMap.get(teacherId) || "Unknown Teacher",
                  teacherId: teacherId,
                  createdAt: data.createdAt,
                  lastModified: data.lastModified,
                });
              });
            } catch (fallbackError) {
              console.error(`Error fetching lessons for teacher ${teacherId}:`, fallbackError);
            }
          }
        });

        await Promise.all(lessonPromises);

        // Sort by lastModified (most recent first)
        lessonsData.sort((a, b) => {
          const dateA = a.lastModified?.toDate?.() || a.createdAt?.toDate?.() || new Date(0);
          const dateB = b.lastModified?.toDate?.() || b.createdAt?.toDate?.() || new Date(0);
          return dateB.getTime() - dateA.getTime();
        });

        // Check which lessons are completed
        const completedLessons = userData.completedLessons || [];
        const lessonsWithCompletion = lessonsData.map((lesson) => ({
          ...lesson,
          isCompleted: completedLessons.includes(lesson.id),
        }));

        setMyLessons(lessonsWithCompletion);
      } catch (error) {
        console.error("Error fetching lessons:", error);
      } finally {
        setLoadingLessons(false);
      }
    };

    if (userData && userData.role === "student" && userData.enrolledTeachers && userData.grade) {
      fetchLessons();
    }
  }, [userData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar role="student" />
      
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{t.student.lessons.title}</h1>
            <p className="text-lg text-muted-foreground">
              {t.student.lessons.description}
            </p>
          </div>

          <Card className="border-2 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                {t.student.lessons.allLessons}
              </CardTitle>
              <CardDescription>
                {t.student.lessons.clickToStart}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingLessons ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : myLessons.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  {t.student.lessons.emptyState}
                </p>
              ) : (
                myLessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-lg border hover:bg-accent/50 transition-colors duration-200 cursor-pointer focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
                    onClick={() => navigate(`/lesson/${lesson.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigate(`/lesson/${lesson.id}`);
                      }
                    }}
                    aria-label={t.student.lessons.lessonAriaLabel(lesson.title)}
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{lesson.title}</h3>
                        {lesson.isCompleted && (
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            {t.student.lessons.completed || "Completed"}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span>{lesson.subject}</span>
                        <span>·</span>
                        <span>{translations[language].grades[lesson.grade as keyof typeof translations.ro.grades] || lesson.grade}</span>
                        <span>·</span>
                        <span>{lesson.teacherName}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/lesson/${lesson.id}`);
                        }}
                        aria-label={t.student.lessons.openAriaLabel(lesson.title)}
                      >
                        {t.student.lessons.openButton}
                        <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

