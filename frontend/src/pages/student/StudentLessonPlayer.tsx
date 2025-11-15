import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getMockLessonData } from "@/lib/translations";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Minus, Plus, Volume2, X, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { doc, updateDoc, arrayUnion, serverTimestamp, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

export default function StudentLessonPlayer() {
  const { id: lessonId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  
  // Get mock lesson data based on current language
  const lesson = useMemo(() => getMockLessonData(language), [language]);
  
  // TODO: Fetch lesson data from Firestore using lessonId
  console.log("Loading lesson:", lessonId);
  const [activeTab, setActiveTab] = useState("summary");
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [fontSize, setFontSize] = useState(16); // base font size in pixels
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number | null>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<{ correct: number; total: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  // Mark lesson as completed when student views it
  useEffect(() => {
    const markLessonAsCompleted = async () => {
      if (!user || !lessonId) return;

      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const completedLessons = userData.completedLessons || [];
          
          // Only update if lesson is not already marked as completed
          if (!completedLessons.includes(lessonId)) {
            await updateDoc(userDocRef, {
              completedLessons: arrayUnion(lessonId),
              updatedAt: serverTimestamp(),
            });
          }
        }
      } catch (error) {
        console.error("Error marking lesson as completed:", error);
      }
    };

    if (user && lessonId) {
      markLessonAsCompleted();
    }
  }, [user, lessonId]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const formatSummary = (text: string) => {
    // Simple markdown-like formatting
    const lines = text.split("\n");
    return lines.map((line, index) => {
      if (line.startsWith("# ")) {
        return (
          <h1 key={index} className="text-3xl font-bold mb-4 mt-6 first:mt-0">
            {line.substring(2)}
          </h1>
        );
      }
      if (line.startsWith("## ")) {
        return (
          <h2 key={index} className="text-2xl font-semibold mb-3 mt-5">
            {line.substring(3)}
          </h2>
        );
      }
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return (
          <li key={index} className="ml-6 mb-2 list-disc">
            {line.substring(2)}
          </li>
        );
      }
      if (line.startsWith("**") && line.endsWith("**")) {
        return (
          <strong key={index} className="font-semibold">
            {line.substring(2, line.length - 2)}
          </strong>
        );
      }
      if (line.trim() === "") {
        return <br key={index} />;
      }
      return (
        <p key={index} className="mb-4">
          {line}
        </p>
      );
    });
  };

  const formatSlideContent = (content: string) => {
    return content.split("\n").map((line, index) => {
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return (
          <li key={index} className="mb-2 text-lg">
            {line.substring(2)}
          </li>
        );
      }
      if (line.trim() === "") {
        return <br key={index} />;
      }
      return (
        <p key={index} className="mb-2 text-lg">
          {line}
        </p>
      );
    });
  };

  const handleQuizSubmit = async () => {
    if (!user || !lesson.quiz || lesson.quiz.length === 0) return;

      // Check if all questions are answered
      const allAnswered = lesson.quiz.every((q) => quizAnswers[q.id] !== null && quizAnswers[q.id] !== undefined);
      if (!allAnswered) {
        alert(t.student.lessonPlayer.quiz.errors.notAllAnswered);
        return;
      }

    setIsSubmitting(true);

    try {
      // Calculate score
      let correct = 0;
      const total = lesson.quiz.length;

      lesson.quiz.forEach((question) => {
        if (quizAnswers[question.id] === question.correctAnswer) {
          correct++;
        }
      });

      const score = { correct, total };
      setQuizScore(score);

      // Save to Firestore in student's document
      const studentDocRef = doc(db, "users", user.uid);
      
      const quizSubmission = {
        lessonId: lessonId || lesson.id,
        lessonTitle: lesson.title,
        answers: quizAnswers,
        score: score,
        submittedAt: serverTimestamp(),
        status: "pending", // pending, reviewed
      };

      await updateDoc(studentDocRef, {
        quizSubmissions: arrayUnion(quizSubmission),
        updatedAt: serverTimestamp(),
      });

      setQuizSubmitted(true);
    } catch (error) {
      console.error("Error submitting quiz:", error);
      alert(t.student.lessonPlayer.quiz.errors.submitFailed);
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo */}
            <Link to="/student/dashboard" className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                EA
              </div>
              <span className="text-lg font-semibold hidden sm:inline">EduAgent</span>
            </Link>

            {/* Middle: Lesson Title */}
            <div className="flex-1 text-center px-4">
              <h1 className="text-base sm:text-lg font-semibold truncate">
                {lesson.title}
              </h1>
            </div>

            {/* Right: Class/Teacher & Back Link */}
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm text-muted-foreground">
                  {lesson.teacherName} · {lesson.className}
                </p>
              </div>
              {user && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/student/dashboard")}
                  className="text-sm"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  {t.student.lessonPlayer.backToLessons}
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            {/* Section Navigation Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full mb-6">
                <TabsTrigger value="summary" className="flex-1">
                  {t.student.lessonPlayer.tabs.summary}
                </TabsTrigger>
                <TabsTrigger value="slides" className="flex-1">
                  {t.student.lessonPlayer.tabs.slides}
                </TabsTrigger>
                {lesson.quiz && lesson.quiz.length > 0 && (
                  <TabsTrigger value="quiz" className="flex-1">
                    {t.student.lessonPlayer.tabs.quiz}
                  </TabsTrigger>
                )}
              </TabsList>

              {/* Summary View */}
              <TabsContent value="summary" className="mt-0">
                <div className="space-y-6">
                  {/* Controls */}
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">{lesson.title}</h2>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFontSize(Math.max(12, fontSize - 2))}
                        aria-label={t.student.lessonPlayer.summary.fontControls.decrease}
                      >
                        <Minus className="h-4 w-4" />
                        <span className="ml-1 hidden sm:inline">A-</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFontSize(Math.min(24, fontSize + 2))}
                        aria-label={t.student.lessonPlayer.summary.fontControls.increase}
                      >
                        <Plus className="h-4 w-4" />
                        <span className="ml-1 hidden sm:inline">A+</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                        aria-label={t.student.lessonPlayer.summary.fontControls.listen}
                        title={t.student.lessonPlayer.summary.fontControls.listenTooltip}
                      >
                        <Volume2 className="h-4 w-4" />
                        <span className="ml-1 hidden sm:inline">{t.student.lessonPlayer.summary.fontControls.listen}</span>
                      </Button>
                    </div>
                  </div>

                  {/* Learning Objectives */}
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="pt-6">
                      <h3 className="text-lg font-semibold mb-3">
                        {t.student.lessonPlayer.summary.learningObjectives}
                      </h3>
                      <ul className="space-y-2">
                        {lesson.learningObjectives.map((objective, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span>{objective}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Main Content */}
                  <div
                    className="max-w-none"
                    style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}
                  >
                    <div className="space-y-4">{formatSummary(lesson.studentSummary)}</div>
                  </div>
                </div>
              </TabsContent>

              {/* Slides View */}
              <TabsContent value="slides" className="mt-0">
                <div className="space-y-6">
                  {lesson.slides && lesson.slides.length > 0 ? (
                    <>
                      {/* Slide Counter */}
                      <div className="text-center text-sm text-muted-foreground">
                        {t.student.lessonPlayer.slides.counter(currentSlideIndex + 1, lesson.slides.length)}
                      </div>

                      {/* Slide Player */}
                      <Card className="min-h-[400px] flex flex-col">
                        <CardContent className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12">
                          <div className="w-full max-w-3xl">
                            <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-center">
                              {lesson.slides[currentSlideIndex].title}
                            </h2>
                            <div className="text-xl sm:text-2xl space-y-3">
                              {formatSlideContent(lesson.slides[currentSlideIndex].content)}
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Navigation Controls */}
                      <div className="flex items-center justify-between gap-4">
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={() =>
                            setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))
                          }
                          disabled={currentSlideIndex === 0}
                          className="flex items-center gap-2"
                        >
                          <ChevronLeft className="h-5 w-5" />
                          {t.student.lessonPlayer.slides.previous}
                        </Button>

                        <div className="flex gap-2">
                          {lesson.slides.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentSlideIndex(index)}
                              className={cn(
                                "w-2 h-2 rounded-full transition-colors",
                                index === currentSlideIndex
                                  ? "bg-primary"
                                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                              )}
                              aria-label={t.student.lessonPlayer.slides.goToSlide(index + 1)}
                            />
                          ))}
                        </div>

                        <Button
                          variant="outline"
                          size="lg"
                          onClick={() =>
                            setCurrentSlideIndex(
                              Math.min(lesson.slides.length - 1, currentSlideIndex + 1)
                            )
                          }
                          disabled={currentSlideIndex === lesson.slides.length - 1}
                          className="flex items-center gap-2"
                        >
                          {t.student.lessonPlayer.slides.next}
                          <ChevronRight className="h-5 w-5" />
                        </Button>
                      </div>

                      {/* Slide Text for Accessibility */}
                      <Card className="bg-muted/50">
                        <CardContent className="pt-6">
                          <h3 className="text-sm font-semibold mb-2">{t.student.lessonPlayer.slides.textVersion}</h3>
                          <div className="text-sm space-y-2">
                            {formatSlideContent(lesson.slides[currentSlideIndex].content)}
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    <p className="text-center text-muted-foreground py-12">
                      {t.student.lessonPlayer.slides.emptyState}
                    </p>
                  )}
                </div>
              </TabsContent>

              {/* Quiz View */}
              <TabsContent value="quiz" className="mt-0">
                <div className="space-y-8">
                  {lesson.quiz && lesson.quiz.length > 0 ? (
                    <>
                      {quizSubmitted ? (
                        /* Success Message */
                        <Card className="border-2 border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
                          <CardContent className="pt-6">
                            <div className="flex flex-col items-center text-center space-y-4">
                              <CheckCircle2 className="h-16 w-16 text-green-600" />
                              <div>
                                <h3 className="text-2xl font-bold text-green-800 dark:text-green-300 mb-2">
                                  {t.student.lessonPlayer.quiz.success.title}
                                </h3>
                                {quizScore && (
                                  <p className="text-lg text-green-700 dark:text-green-400 mb-4">
                                    {t.student.lessonPlayer.quiz.success.score(
                                      quizScore.correct,
                                      quizScore.total,
                                      Math.round((quizScore.correct / quizScore.total) * 100)
                                    )}
                                  </p>
                                )}
                                <p className="text-base text-muted-foreground">
                                  {t.student.lessonPlayer.quiz.success.message}
                                </p>
                                <p className="text-sm text-muted-foreground mt-2">
                                  {t.student.lessonPlayer.quiz.success.feedbackMessage}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        /* Quiz Questions */
                        <>
                          {lesson.quiz.map((question, questionIndex) => (
                            <Card key={question.id} className="border-2">
                              <CardContent className="pt-6">
                                <div className="space-y-4">
                                  <div className="flex items-start justify-between gap-4">
                                    <h3 className="text-xl font-semibold">
                                      {t.student.lessonPlayer.quiz.questionLabel(questionIndex + 1, question.question)}
                                    </h3>
                                  </div>

                                  <div className="space-y-3">
                                    {question.options.map((option, optionIndex) => (
                                      <button
                                        key={optionIndex}
                                        onClick={() => {
                                          setQuizAnswers({
                                            ...quizAnswers,
                                            [question.id]: optionIndex,
                                          });
                                        }}
                                        className={cn(
                                          "w-full text-left p-4 rounded-lg border-2 transition-colors",
                                          quizAnswers[question.id] === optionIndex
                                            ? "border-primary bg-primary/5"
                                            : "border-border hover:border-primary/50"
                                        )}
                                      >
                                        <div className="flex items-center gap-3">
                                          <div
                                            className={cn(
                                              "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                                              quizAnswers[question.id] === optionIndex
                                                ? "border-primary bg-primary"
                                                : "border-muted-foreground"
                                            )}
                                          >
                                            {quizAnswers[question.id] === optionIndex && (
                                              <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                                            )}
                                          </div>
                                          <span className="flex-1">{option}</span>
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}

                          {/* Submit Button */}
                          <Card className="border-2">
                            <CardContent className="pt-6">
                              <div className="flex flex-col items-center space-y-4">
                                <p className="text-sm text-muted-foreground text-center">
                                  {t.student.lessonPlayer.quiz.answeredCount(
                                    lesson.quiz.filter((q) => quizAnswers[q.id] !== null && quizAnswers[q.id] !== undefined).length,
                                    lesson.quiz.length
                                  )}
                                </p>
                                <Button
                                  onClick={handleQuizSubmit}
                                  disabled={
                                    isSubmitting ||
                                    lesson.quiz.some((q) => quizAnswers[q.id] === null || quizAnswers[q.id] === undefined)
                                  }
                                  size="lg"
                                  className="w-full sm:w-auto min-w-[200px]"
                                >
                                  {isSubmitting ? (
                                    <>
                                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                      {t.student.lessonPlayer.quiz.submitButtonLoading}
                                    </>
                                  ) : (
                                    t.student.lessonPlayer.quiz.submitButton
                                  )}
                                </Button>
                                {lesson.quiz.some((q) => quizAnswers[q.id] === null || quizAnswers[q.id] === undefined) && (
                                  <p className="text-xs text-muted-foreground text-center">
                                    {t.student.lessonPlayer.quiz.submitWarning}
                                  </p>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </>
                      )}
                    </>
                  ) : (
                    <p className="text-center text-muted-foreground py-12">
                      {t.student.lessonPlayer.quiz.emptyState}
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>

        {/* Right Side Panel - Key Terms */}
        <aside className="hidden lg:block w-80 border-l bg-muted/30 overflow-y-auto">
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{t.student.lessonPlayer.keyTerms.title}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {lesson.keyTerms.map((item, index) => (
                <div key={index} className="space-y-1">
                  <h4 className="font-semibold text-sm">{item.term}</h4>
                  <p className="text-sm text-muted-foreground">{item.definition}</p>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t">
              <p className="text-xs text-muted-foreground">
                {t.student.lessonPlayer.keyTerms.footer}
              </p>
            </div>
          </div>
        </aside>

        {/* Mobile Sidebar */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="fixed bottom-4 right-4 lg:hidden z-40"
            >
              {t.student.lessonPlayer.keyTerms.title}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px]">
            <SheetHeader>
              <SheetTitle>{t.student.lessonPlayer.keyTerms.title}</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              {lesson.keyTerms.map((item, index) => (
                <div key={index} className="space-y-1">
                  <h4 className="font-semibold text-sm">{item.term}</h4>
                  <p className="text-sm text-muted-foreground">{item.definition}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t">
              <p className="text-xs text-muted-foreground">
                {t.student.lessonPlayer.keyTerms.footer}
              </p>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}

