import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, CheckCircle2, Clock, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { db } from "@/lib/firebaseConfig";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { QuizInteractive } from "@/components/quiz/QuizInteractive";
import { QuizResults } from "@/components/quiz/QuizResults";
import { QuizQuestion } from "@/lib/api";
import { addDoc, serverTimestamp } from "firebase/firestore";

interface Quiz {
  id: string;
  lectureId: string;
  teacherId: string;
  title: string;
  subject: string;
  grade: number;
  totalQuestions: number;
  createdAt: any;
  questions: QuizQuestion[];
}

interface Lesson {
  id: string;
  title: string;
  subject: string;
  grade: string;
}

interface QuizSubmission {
  id: string;
  quizId: string;
  submittedAt: any;
  correctAnswers: number;
  incorrectAnswers: number;
  answers: any[];
}

export default function StudentQuizzesPage() {
  const { user, userData, loading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [lessons, setLessons] = useState<Record<string, Lesson>>({});
  const [submissions, setSubmissions] = useState<Record<string, QuizSubmission>>({});
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<QuizSubmission | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQuizDialog, setShowQuizDialog] = useState(false);

  useEffect(() => {
    if (!loading && (!user || userData?.role !== "student")) {
      navigate("/login");
    }
  }, [user, userData, loading, navigate]);

  useEffect(() => {
    const fetchQuizzes = async () => {
      if (!user || !userData?.enrolledTeachers || userData.enrolledTeachers.length === 0) {
        setLoadingQuizzes(false);
        return;
      }

      try {
        setLoadingQuizzes(true);

        // Fetch all lessons from enrolled teachers
        const lessonsQuery = query(
          collection(db, "lessons"),
          where("teacherId", "in", userData.enrolledTeachers.slice(0, 10)) // Firestore 'in' limit is 10
        );
        const lessonsSnapshot = await getDocs(lessonsQuery);

        const lessonsMap: Record<string, Lesson> = {};
        const quizIds: string[] = [];

        lessonsSnapshot.forEach((lessonDoc) => {
          const lessonData = lessonDoc.data();
          if (lessonData.quizId) {
            quizIds.push(lessonData.quizId);
            // Store lesson by lectureId (lessonDoc.id) for later lookup
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
              if (lessonData.quizId) {
                quizIds.push(lessonData.quizId);
                // Store lesson by lectureId (lessonDoc.id) for later lookup
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

        // Remove duplicates from quizIds
        const uniqueQuizIds = Array.from(new Set(quizIds));

        // Fetch all quizzes
        const quizzesData: Quiz[] = [];
        for (const quizId of uniqueQuizIds) {
          try {
            const quizDoc = await getDoc(doc(db, "quizzes", quizId));
            if (quizDoc.exists()) {
              const quizData = quizDoc.data();
              const quiz = {
                id: quizDoc.id,
                ...quizData,
              } as Quiz;
              quizzesData.push(quiz);
              
              // Store lesson mapping by lectureId if not already stored
              if (quiz.lectureId && !lessonsMap[quiz.lectureId]) {
                try {
                  const lessonDoc = await getDoc(doc(db, "lessons", quiz.lectureId));
                  if (lessonDoc.exists()) {
                    const lessonData = lessonDoc.data();
                    lessonsMap[quiz.lectureId] = {
                      id: lessonDoc.id,
                      title: lessonData.title || "Untitled Lesson",
                      subject: lessonData.subject || "",
                      grade: lessonData.grade || "",
                    };
                  }
                } catch (error) {
                  console.error(`Error fetching lesson ${quiz.lectureId}:`, error);
                }
              }
            }
          } catch (error) {
            console.error(`Error fetching quiz ${quizId}:`, error);
          }
        }

        setQuizzes(quizzesData);
        setLessons(lessonsMap);

        // Fetch existing submissions
        const submissionsMap: Record<string, QuizSubmission> = {};
        for (const quiz of quizzesData) {
          try {
            const submissionsQuery = query(
              collection(db, "quiz_submissions"),
              where("quizId", "==", quiz.id),
              where("studentId", "==", user.uid)
            );
            const submissionsSnapshot = await getDocs(submissionsQuery);

            if (!submissionsSnapshot.empty) {
              const submissionDoc = submissionsSnapshot.docs[0];
              submissionsMap[quiz.id] = {
                id: submissionDoc.id,
                ...submissionDoc.data(),
              } as QuizSubmission;
            }
          } catch (error) {
            console.error(`Error fetching submission for quiz ${quiz.id}:`, error);
          }
        }

        setSubmissions(submissionsMap);
      } catch (error) {
        console.error("Error fetching quizzes:", error);
      } finally {
        setLoadingQuizzes(false);
      }
    };

    if (user && userData) {
      fetchQuizzes();
    }
  }, [user, userData]);

  const handleStartQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setSelectedSubmission(submissions[quiz.id] || null);
    setShowQuizDialog(true);
  };

  const handleQuizSubmit = async (answers: Record<string, string>) => {
    if (!selectedQuiz || !user) return;

    try {
      setIsSubmitting(true);

      // Calculate results
      const submissionAnswers = selectedQuiz.questions.map((question) => {
        const selectedAnswerId = answers[question.id];
        const isCorrect = selectedAnswerId === question.correctAnswerId;
        return {
          questionId: question.id,
          selectedAnswerId: selectedAnswerId || "",
          correctAnswerId: question.correctAnswerId,
          isCorrect: isCorrect,
        };
      });

      const correctAnswers = submissionAnswers.filter((a) => a.isCorrect).length;
      const incorrectAnswers = submissionAnswers.filter((a) => !a.isCorrect).length;

      // Get teacherId from quiz document
      const quizDoc = await getDoc(doc(db, "quizzes", selectedQuiz.id));
      const quizData = quizDoc.data();

      // Create submission document
      const submissionData = {
        quizId: selectedQuiz.id,
        lectureId: selectedQuiz.lectureId,
        studentId: user.uid,
        teacherId: quizData?.teacherId || "",
        correctAnswers: correctAnswers,
        incorrectAnswers: incorrectAnswers,
        answers: submissionAnswers,
        submittedAt: serverTimestamp(),
      };

      const submissionDocRef = await addDoc(collection(db, "quiz_submissions"), submissionData);
      const submissionDoc = await getDoc(submissionDocRef);
      
      setSelectedSubmission(submissionDoc.data() as QuizSubmission);
      setSubmissions((prev) => ({
        ...prev,
        [selectedQuiz.id]: submissionDoc.data() as QuizSubmission,
      }));
    } catch (error: any) {
      console.error("Error submitting quiz:", error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || loadingQuizzes) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingQuizzes = quizzes.filter((q) => !submissions[q.id]);
  const completedQuizzes = quizzes.filter((q) => submissions[q.id]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar role="student" />
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              {t.student.quizzes?.title || "My Quizzes"}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t.student.quizzes?.description || "Complete quizzes for your lessons"}
            </p>
          </div>

          {/* Pending Quizzes */}
          {pendingQuizzes.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-6 w-6" />
                {t.student.quizzes?.pending || "Pending Quizzes"}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingQuizzes.map((quiz) => {
                  const lesson = lessons[quiz.lectureId];
                  return (
                    <Card key={quiz.id} className="hover:shadow-lg transition-shadow border-2 border-primary/20">
                      <CardHeader>
                        <CardTitle className="text-lg mb-1">{quiz.title}</CardTitle>
                        <CardDescription>
                          {lesson?.title || "Unknown Lesson"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              {t.student.quizzes?.questions || "Questions"}
                            </span>
                            <span className="font-medium">{quiz.totalQuestions}</span>
                          </div>
                          <Button
                            className="w-full"
                            onClick={() => handleStartQuiz(quiz)}
                          >
                            {t.student.quizzes?.startQuiz || "Start Quiz"}
                            <ChevronRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Completed Quizzes */}
          {completedQuizzes.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                {t.student.quizzes?.completed || "Completed Quizzes"}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedQuizzes.map((quiz) => {
                  const lesson = lessons[quiz.lectureId];
                  const submission = submissions[quiz.id];
                  const percentage = submission
                    ? Math.round((submission.correctAnswers / quiz.totalQuestions) * 100)
                    : 0;

                  return (
                    <Card key={quiz.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-lg mb-1">{quiz.title}</CardTitle>
                        <CardDescription>
                          {lesson?.title || "Unknown Lesson"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              {t.student.quizzes?.score || "Score"}
                            </span>
                            <Badge
                              variant={percentage >= 70 ? "default" : percentage >= 50 ? "secondary" : "destructive"}
                              className={cn(
                                percentage >= 70
                                  ? "bg-green-600"
                                  : percentage >= 50
                                  ? "bg-yellow-600"
                                  : "bg-red-600"
                              )}
                            >
                              {submission?.correctAnswers || 0} / {quiz.totalQuestions} ({percentage}%)
                            </Badge>
                          </div>
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => handleStartQuiz(quiz)}
                          >
                            {t.student.quizzes?.viewResults || "View Results"}
                            <ChevronRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty State */}
          {quizzes.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">
                    {t.student.quizzes?.emptyTitle || "No quizzes available"}
                  </p>
                  <p className="text-muted-foreground">
                    {t.student.quizzes?.emptyDescription || 
                     "Quizzes will appear here when your teachers create them for lessons"}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Quiz Dialog */}
      <Dialog open={showQuizDialog} onOpenChange={setShowQuizDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedQuiz?.title || "Quiz"}
            </DialogTitle>
            <DialogDescription>
              {lessons[selectedQuiz?.lectureId || ""]?.title || "Lesson quiz"}
            </DialogDescription>
          </DialogHeader>

          {selectedQuiz && (
            <div className="mt-4">
              {selectedSubmission ? (
                <QuizResults
                  questions={selectedQuiz.questions}
                  title={selectedQuiz.title}
                  answers={selectedSubmission.answers || []}
                  correctAnswers={selectedSubmission.correctAnswers || 0}
                  incorrectAnswers={selectedSubmission.incorrectAnswers || 0}
                  totalQuestions={selectedQuiz.totalQuestions}
                />
              ) : (
                <QuizInteractive
                  questions={selectedQuiz.questions}
                  title={selectedQuiz.title}
                  onSubmit={handleQuizSubmit}
                  isSubmitting={isSubmitting}
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

