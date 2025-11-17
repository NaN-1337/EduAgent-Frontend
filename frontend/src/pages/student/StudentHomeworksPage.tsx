import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { db } from "@/lib/firebaseConfig";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";

interface Homework {
  id: string;
  lectureId: string;
  teacherId: string;
  title: string;
  subject: string;
  grade: number;
  numExercises: number;
  htmlContent: string;
  createdAt: any;
}

interface Lesson {
  id: string;
  title: string;
  subject: string;
  grade: string;
}

export default function StudentHomeworksPage() {
  const { user, userData, loading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [lessons, setLessons] = useState<Record<string, Lesson>>({});
  const [loadingHomeworks, setLoadingHomeworks] = useState(true);
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);
  const [showHomeworkDialog, setShowHomeworkDialog] = useState(false);

  useEffect(() => {
    if (!loading && (!user || userData?.role !== "student")) {
      navigate("/login");
    }
  }, [user, userData, loading, navigate]);

  useEffect(() => {
    const fetchHomeworks = async () => {
      if (!user || !userData?.enrolledTeachers || userData.enrolledTeachers.length === 0) {
        setLoadingHomeworks(false);
        return;
      }

      try {
        setLoadingHomeworks(true);

        // Fetch all lessons from enrolled teachers
        const lessonsQuery = query(
          collection(db, "lessons"),
          where("teacherId", "in", userData.enrolledTeachers.slice(0, 10))
        );
        const lessonsSnapshot = await getDocs(lessonsQuery);

        const lessonsMap: Record<string, Lesson> = {};
        const homeworkIds: string[] = [];

        lessonsSnapshot.forEach((lessonDoc) => {
          const lessonData = lessonDoc.data();
          if (lessonData.homeworkId) {
            homeworkIds.push(lessonData.homeworkId);
            lessonsMap[lessonDoc.id] = {
              id: lessonDoc.id,
              title: lessonData.title || "Untitled Lesson",
              subject: lessonData.subject || "",
              grade: lessonData.grade || "",
            };
          }
        });

        // Handle more than 10 teachers by batching
        if (userData.enrolledTeachers.length > 10) {
          for (let i = 10; i < userData.enrolledTeachers.length; i += 10) {
            const batch = userData.enrolledTeachers.slice(i, i + 10);
            const batchQuery = query(
              collection(db, "lessons"),
              where("teacherId", "in", batch)
            );
            const batchSnapshot = await getDocs(batchQuery);
            batchSnapshot.forEach((lessonDoc) => {
              const lessonData = lessonDoc.data();
              if (lessonData.homeworkId) {
                homeworkIds.push(lessonData.homeworkId);
                lessonsMap[lessonDoc.id] = {
                  id: lessonDoc.id,
                  title: lessonData.title || "Untitled Lesson",
                  subject: lessonData.subject || "",
                  grade: lessonData.grade || "",
                };
              }
            });
          }
        }

        // Remove duplicates
        const uniqueHomeworkIds = Array.from(new Set(homeworkIds));

        // Fetch all homeworks
        const homeworksData: Homework[] = [];
        for (const homeworkId of uniqueHomeworkIds) {
          try {
            const homeworkDoc = await getDoc(doc(db, "homeworks", homeworkId));
            if (homeworkDoc.exists()) {
              const homeworkData = homeworkDoc.data();
              const homework = {
                id: homeworkDoc.id,
                ...homeworkData,
              } as Homework;
              homeworksData.push(homework);
              
              if (homework.lectureId && !lessonsMap[homework.lectureId]) {
                try {
                  const lessonDoc = await getDoc(doc(db, "lessons", homework.lectureId));
                  if (lessonDoc.exists()) {
                    const lessonData = lessonDoc.data();
                    lessonsMap[homework.lectureId] = {
                      id: lessonDoc.id,
                      title: lessonData.title || "Untitled Lesson",
                      subject: lessonData.subject || "",
                      grade: lessonData.grade || "",
                    };
                  }
                } catch (error) {
                  console.error(`Error fetching lesson ${homework.lectureId}:`, error);
                }
              }
            }
          } catch (error) {
            console.error(`Error fetching homework ${homeworkId}:`, error);
          }
        }

        setHomeworks(homeworksData);
        setLessons(lessonsMap);
      } catch (error) {
        console.error("Error fetching homeworks:", error);
      } finally {
        setLoadingHomeworks(false);
      }
    };

    if (user && userData) {
      fetchHomeworks();
    }
  }, [user, userData]);

  const handleViewHomework = (homework: Homework) => {
    setSelectedHomework(homework);
    setShowHomeworkDialog(true);
  };

  if (loading || loadingHomeworks) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar role="student" />
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              {t.student.homeworks?.title || "Temele mele"}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t.student.homeworks?.description || "Completează temele pentru lecțiile tale"}
            </p>
          </div>

          {/* Available Homeworks */}
          {homeworks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {homeworks.map((homework) => {
                const lesson = lessons[homework.lectureId];
                return (
                  <Card key={homework.id} className="hover:shadow-lg transition-shadow border-2 border-primary/20">
                    <CardHeader>
                      <CardTitle className="text-lg mb-1">{homework.title}</CardTitle>
                      <CardDescription>
                        {lesson?.title || "Unknown Lesson"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Exerciții
                          </span>
                          <span className="font-medium">{homework.numExercises}</span>
                        </div>
                        <Button
                          className="w-full"
                          onClick={() => handleViewHomework(homework)}
                        >
                          Vezi tema
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">
                    {t.student.homeworks?.emptyTitle || "Nicio temă disponibilă"}
                  </p>
                  <p className="text-muted-foreground">
                    {t.student.homeworks?.emptyDescription || 
                     "Temele vor apărea aici când profesorii tăi le vor crea pentru lecții"}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Homework Dialog */}
      <Dialog open={showHomeworkDialog} onOpenChange={setShowHomeworkDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedHomework?.title || "Homework"}
            </DialogTitle>
            <DialogDescription>
              {lessons[selectedHomework?.lectureId || ""]?.title || "Lesson homework"}
            </DialogDescription>
          </DialogHeader>

          {selectedHomework && (
            <div className="mt-4">
              <div
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: selectedHomework.htmlContent }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
