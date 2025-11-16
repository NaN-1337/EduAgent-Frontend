import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Users, TrendingUp, FileText, ChevronRight } from "lucide-react";
import { db } from "@/lib/firebaseConfig";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QuizDisplayReadOnly } from "@/components/quiz/QuizDisplayReadOnly";

interface Quiz {
  id: string;
  lectureId: string;
  teacherId: string;
  title: string;
  subject: string;
  grade: number;
  totalQuestions: number;
  createdAt: any;
  questions: any[];
}

interface Lesson {
  id: string;
  title: string;
  subject: string;
  grade: string;
}

interface QuizStats {
  quizId: string;
  totalSubmissions: number;
  questionStats: {
    questionId: string;
    questionText: string;
    correctCount: number;
    incorrectCount: number;
    correctPercentage: number;
  }[];
}

export default function TeacherQuizzesPage() {
  const { user, userData, loading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [lessons, setLessons] = useState<Record<string, Lesson>>({});
  const [stats, setStats] = useState<Record<string, QuizStats>>({});
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [selectedStats, setSelectedStats] = useState<QuizStats | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    if (!loading && (!user || userData?.role !== "teacher")) {
      navigate("/login");
    }
  }, [user, userData, loading, navigate]);

  useEffect(() => {
    const fetchQuizzes = async () => {
      if (!user) return;

      try {
        setLoadingQuizzes(true);

        // Fetch all quizzes created by this teacher
        const quizzesQuery = query(
          collection(db, "quizzes"),
          where("teacherId", "==", user.uid)
        );
        const quizzesSnapshot = await getDocs(quizzesQuery);

        const quizzesData: Quiz[] = [];
        const lessonsMap: Record<string, Lesson> = {};

        for (const quizDoc of quizzesSnapshot.docs) {
          const quizData = quizDoc.data();
          quizzesData.push({
            id: quizDoc.id,
            ...quizData,
          } as Quiz);

          // Fetch lesson data if not already fetched
          if (!lessonsMap[quizData.lectureId]) {
            try {
              const lessonDoc = await getDoc(doc(db, "lessons", quizData.lectureId));
              if (lessonDoc.exists()) {
                const lessonData = lessonDoc.data();
                lessonsMap[quizData.lectureId] = {
                  id: lessonDoc.id,
                  title: lessonData.title || "Untitled Lesson",
                  subject: lessonData.subject || "",
                  grade: lessonData.grade || "",
                };
              }
            } catch (error) {
              console.error(`Error fetching lesson ${quizData.lectureId}:`, error);
            }
          }
        }

        setQuizzes(quizzesData);
        setLessons(lessonsMap);

        // Fetch stats for each quiz
        const statsMap: Record<string, QuizStats> = {};
        for (const quiz of quizzesData) {
          try {
            // Fetch all submissions for this quiz
            const submissionsQuery = query(
              collection(db, "quiz_submissions"),
              where("quizId", "==", quiz.id)
            );
            const submissionsSnapshot = await getDocs(submissionsQuery);

            const totalSubmissions = submissionsSnapshot.size;
            const questionStatsMap: Record<string, { correct: number; incorrect: number }> = {};

            // Initialize question stats
            quiz.questions.forEach((q: any) => {
              questionStatsMap[q.id] = { correct: 0, incorrect: 0 };
            });

            // Count correct/incorrect for each question
            submissionsSnapshot.forEach((subDoc) => {
              const submission = subDoc.data();
              submission.answers?.forEach((answer: any) => {
                if (questionStatsMap[answer.questionId]) {
                  if (answer.isCorrect) {
                    questionStatsMap[answer.questionId].correct++;
                  } else {
                    questionStatsMap[answer.questionId].incorrect++;
                  }
                }
              });
            });

            // Calculate percentages
            const questionStats = quiz.questions.map((q: any) => {
              const stats = questionStatsMap[q.id] || { correct: 0, incorrect: 0 };
              const total = stats.correct + stats.incorrect;
              return {
                questionId: q.id,
                questionText: q.text,
                correctCount: stats.correct,
                incorrectCount: stats.incorrect,
                correctPercentage: total > 0 ? Math.round((stats.correct / total) * 100) : 0,
              };
            });

            statsMap[quiz.id] = {
              quizId: quiz.id,
              totalSubmissions,
              questionStats,
            };
          } catch (error) {
            console.error(`Error fetching stats for quiz ${quiz.id}:`, error);
            statsMap[quiz.id] = {
              quizId: quiz.id,
              totalSubmissions: 0,
              questionStats: [],
            };
          }
        }

        setStats(statsMap);
      } catch (error) {
        console.error("Error fetching quizzes:", error);
      } finally {
        setLoadingQuizzes(false);
      }
    };

    if (user) {
      fetchQuizzes();
    }
  }, [user]);

  const handleViewDetails = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setSelectedStats(stats[quiz.id] || null);
    setShowDetailsDialog(true);
  };

  if (loading || loadingQuizzes) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar role="teacher" />
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              {t.teacher.quizzes?.title || "My Quizzes"}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t.teacher.quizzes?.description || "View and manage all your quizzes"}
            </p>
          </div>

          {quizzes.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">
                    {t.teacher.quizzes?.emptyTitle || "No quizzes yet"}
                  </p>
                  <p className="text-muted-foreground">
                    {t.teacher.quizzes?.emptyDescription || 
                     "Create quizzes for your lessons to track student progress"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.map((quiz) => {
                const lesson = lessons[quiz.lectureId];
                const quizStats = stats[quiz.id];
                const completionCount = quizStats?.totalSubmissions || 0;

                return (
                  <Card key={quiz.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-1">{quiz.title}</CardTitle>
                          <CardDescription>
                            {lesson?.title || "Unknown Lesson"}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {t.teacher.quizzes?.questions || "Questions"}
                          </span>
                          <span className="font-medium">{quiz.totalQuestions}</span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {t.teacher.quizzes?.completed || "Completed"}
                          </span>
                          <span className="font-medium">{completionCount}</span>
                        </div>

                        {quizStats && quizStats.questionStats.length > 0 && (
                          <div className="pt-2 border-t">
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span className="text-muted-foreground">
                                {t.teacher.quizzes?.averageScore || "Average Score"}
                              </span>
                              <span className="font-medium">
                                {Math.round(
                                  quizStats.questionStats.reduce(
                                    (sum, q) => sum + q.correctPercentage,
                                    0
                                  ) / quizStats.questionStats.length
                                )}%
                              </span>
                            </div>
                          </div>
                        )}

                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => handleViewDetails(quiz)}
                        >
                          {t.teacher.quizzes?.viewDetails || "View Details"}
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Quiz Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedQuiz?.title || "Quiz Details"}
            </DialogTitle>
            <DialogDescription>
              {lessons[selectedQuiz?.lectureId || ""]?.title || "Lesson details"}
            </DialogDescription>
          </DialogHeader>

          {selectedQuiz && (
            <div className="space-y-6 mt-4">
              {/* Statistics Summary */}
              {selectedStats && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {t.teacher.quizzes?.statistics || "Statistics"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {t.teacher.quizzes?.totalSubmissions || "Total Submissions"}
                        </p>
                        <p className="text-2xl font-bold">{selectedStats.totalSubmissions}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {t.teacher.quizzes?.averageScore || "Average Score"}
                        </p>
                        <p className="text-2xl font-bold">
                          {selectedStats.questionStats.length > 0
                            ? Math.round(
                                selectedStats.questionStats.reduce(
                                  (sum, q) => sum + q.correctPercentage,
                                  0
                                ) / selectedStats.questionStats.length
                              )
                            : 0}
                          %
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Question Statistics */}
              {selectedStats && selectedStats.questionStats.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {t.teacher.quizzes?.questionStatistics || "Question Statistics"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedStats.questionStats.map((qStat, index) => (
                        <div key={qStat.questionId} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <p className="font-medium">
                              {t.teacher.quizzes?.question || "Question"} {index + 1}: {qStat.questionText}
                            </p>
                            <Badge
                              variant={qStat.correctPercentage >= 70 ? "default" : "secondary"}
                              className={cn(
                                qStat.correctPercentage >= 70
                                  ? "bg-green-600"
                                  : qStat.correctPercentage >= 50
                                  ? "bg-yellow-600"
                                  : "bg-red-600"
                              )}
                            >
                              {qStat.correctPercentage}%
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-4 w-4 text-green-600" />
                              {qStat.correctCount} {t.teacher.quizzes?.correct || "Correct"}
                            </span>
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
                              {qStat.incorrectCount} {t.teacher.quizzes?.incorrect || "Incorrect"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quiz Questions (Read-only) */}
              <QuizDisplayReadOnly
                questions={selectedQuiz.questions}
                title={selectedQuiz.title}
                totalQuestions={selectedQuiz.totalQuestions}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

