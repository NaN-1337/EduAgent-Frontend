import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Minus, Plus, Volume2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { doc, getDoc, updateDoc, serverTimestamp, collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { translations } from "@/lib/translations";
import { convertLessonFromStorage, gradeToStorage, teachingFieldToStorage } from "@/lib/dataConverters";
import { PDFSlideViewer } from "@/components/pdf-viewer/PDFSlideViewer";
import { generateQuiz, QuizQuestion, generateHomeworkQuestions, generateHomework, HomeworkQuestion } from "@/lib/api";
import { GenerateQuizModal } from "@/components/quiz/GenerateQuizModal";
import { QuizDisplayReadOnly } from "@/components/quiz/QuizDisplayReadOnly";
import { GenerateHomeworkModal } from "@/components/homework/GenerateHomeworkModal";
import { HomeworkDisplay } from "@/components/homework/HomeworkDisplay";
import { Loader2 } from "lucide-react";

interface Slide {
  id?: string;
  title: string;
  content: string;
  hasIssue?: boolean;
  speakerNote?: string;
  slideIndex?: number;
}

interface LessonData {
  id: string;
  title: string;
  subject: string;
  grade: string;
  status: "draft" | "fact-check pending" | "ready";
  studentSummary: string;
  slides: Slide[];
  presentationFileUrl?: string;
  presentationFileType?: "pdf";
  quizId?: string | null;
  homeworkId?: string | null;
  teacherGuidelines?: {
    content?: string; // HTML content from API
    objectives?: string;
    timing?: string;
    questions?: string;
    differentiation?: string;
    assessment?: string;
  };
}

export default function LessonViewer() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { user, userData, loading } = useAuth();
  const { t, language } = useLanguage();
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [loadingLesson, setLoadingLesson] = useState(true);
  const [activeTab, setActiveTab] = useState("summary");
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [fontSize, setFontSize] = useState(16);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quiz, setQuiz] = useState<{ questions: QuizQuestion[]; title: string; totalQuestions: number } | null>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [generateQuizModalOpen, setGenerateQuizModalOpen] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [homework, setHomework] = useState<{ html: string; title: string } | null>(null);
  const [loadingHomework, setLoadingHomework] = useState(false);
  const [generateHomeworkModalOpen, setGenerateHomeworkModalOpen] = useState(false);
  const [isGeneratingHomework, setIsGeneratingHomework] = useState(false);
  const [homeworkQuestions, setHomeworkQuestions] = useState<HomeworkQuestion[]>([]);
  const [isMarkingAsReady, setIsMarkingAsReady] = useState(false);

  useEffect(() => {
    if (!loading && (!user || userData?.role !== "teacher")) {
      navigate("/login");
    }
  }, [user, userData, loading, navigate]);

  useEffect(() => {
    const fetchLesson = async () => {
      if (!lessonId || !user) {
        setLoadingLesson(false);
        return;
      }

      try {
        setLoadingLesson(true);
        const lessonDocRef = doc(db, "lessons", lessonId);
        const lessonDocSnap = await getDoc(lessonDocRef);

        if (!lessonDocSnap.exists()) {
          console.error("Lesson not found");
          navigate("/teacher/dashboard");
          return;
        }

        const data = lessonDocSnap.data();
        
        // Parse slides from Firestore
        let slides: Slide[] = [];
        if (data.slides) {
          if (Array.isArray(data.slides)) {
            slides = data.slides.map((slide: any) => ({
              id: slide.id || `slide-${slide.slideIndex || 0}`,
              title: slide.title || `Slide ${(slide.slideIndex || 0) + 1}`,
              content: slide.content || "",
              hasIssue: slide.hasIssue || false,
              speakerNote: slide.speakerNote || slide.speaker_note || "",
              slideIndex: slide.slideIndex !== undefined ? slide.slideIndex : slide.slide_index,
            }));
          } else if (typeof data.slides === 'object') {
            slides = Object.values(data.slides).map((slide: any) => ({
              id: slide.id || `slide-${slide.slideIndex || 0}`,
              title: slide.title || `Slide ${(slide.slideIndex || 0) + 1}`,
              content: slide.content || "",
              hasIssue: slide.hasIssue || false,
              speakerNote: slide.speakerNote || slide.speaker_note || "",
              slideIndex: slide.slideIndex !== undefined ? slide.slideIndex : slide.slide_index,
            }));
          }
        }

        // Parse teacher guidelines
        let teacherGuidelines: any = {};
        if (data.teacherGuidelines) {
          if (typeof data.teacherGuidelines === 'object') {
            teacherGuidelines = {
              content: data.teacherGuidelines.content || "", // HTML content from API
              objectives: data.teacherGuidelines.objectives || "",
              timing: data.teacherGuidelines.timing || "",
              questions: data.teacherGuidelines.questions || "",
              differentiation: data.teacherGuidelines.differentiation || "",
              assessment: data.teacherGuidelines.assessment || "",
            };
          }
        }

        // Convert from storage format to display format
        const converted = convertLessonFromStorage(data, {
          grades: translations[language].grades,
          teachingFields: translations[language].teachingFields,
        });
        
        const lessonData: LessonData = {
          id: lessonDocSnap.id,
          title: converted.title || "Untitled Lesson",
          subject: converted.subject || "Unknown",
          grade: converted.grade || "Unknown",
          status: data.status || "draft",
          studentSummary: data.studentSummary || "",
          slides: slides,
          presentationFileUrl: data.presentationFileUrl,
          presentationFileType: data.presentationFileType,
          quizId: data.quizId || null,
          teacherGuidelines: teacherGuidelines,
        };

        setLesson(lessonData);
      } catch (error) {
        console.error("Error fetching lesson:", error);
        navigate("/teacher/dashboard");
      } finally {
        setLoadingLesson(false);
      }
    };

    if (lessonId && user) {
      fetchLesson();
    }
  }, [lessonId, user, navigate, language]);

  // Fetch quiz data when quizId is available
  useEffect(() => {
    const fetchQuiz = async () => {
      if (!lesson?.quizId || !user) {
        setQuiz(null);
        return;
      }

      try {
        setLoadingQuiz(true);
        const quizDocRef = doc(db, "quizzes", lesson.quizId);
        const quizDocSnap = await getDoc(quizDocRef);

        if (quizDocSnap.exists()) {
          const quizData = quizDocSnap.data();
          setQuiz({
            questions: quizData.questions || [],
            title: quizData.title || "Quiz",
            totalQuestions: quizData.totalQuestions || quizData.questions?.length || 0,
          });
        } else {
          setQuiz(null);
        }
      } catch (error) {
        console.error("Error fetching quiz:", error);
        setQuiz(null);
      } finally {
        setLoadingQuiz(false);
      }
    };

    fetchQuiz();
  }, [lesson?.quizId, user]);

  // Handle marking lesson as ready
  const handleMarkAsReady = async () => {
    if (!lesson || !lessonId) return;

    try {
      setIsMarkingAsReady(true);
      const lessonDocRef = doc(db, "lessons", lessonId);
      await updateDoc(lessonDocRef, {
        status: "ready",
        updatedAt: serverTimestamp(),
        lastModified: serverTimestamp(),
      });

      // Update local state
      setLesson({ ...lesson, status: "ready" });
    } catch (error) {
      console.error("Error marking lesson as ready:", error);
      alert("Failed to mark lesson as ready. Please try again.");
    } finally {
      setIsMarkingAsReady(false);
    }
  };

  useEffect(() => {
    const fetchHomework = async () => {
      if (!lesson?.homeworkId || !user) {
        setHomework(null);
        return;
      }

      try {
        setLoadingHomework(true);
        const homeworkDocRef = doc(db, "homeworks", lesson.homeworkId);
        const homeworkDocSnap = await getDoc(homeworkDocRef);

        if (homeworkDocSnap.exists()) {
          const homeworkData = homeworkDocSnap.data();
          setHomework({
            html: homeworkData.htmlContent || "",
            title: homeworkData.title || "Homework",
          });
        } else {
          setHomework(null);
        }
      } catch (error) {
        console.error("Error fetching homework:", error);
        setHomework(null);
      } finally {
        setLoadingHomework(false);
      }
    };

    fetchHomework();
  }, [lesson?.homeworkId, user]);

  // Handle quiz generation
  const handleGenerateQuiz = async (title: string, numQuestions: number) => {
    if (!lesson || !user) return;

    try {
      setIsGeneratingQuiz(true);

      // Convert grade and subject for API
      const gradeNum = gradeToStorage(lesson.grade);
      const subjectStorage = teachingFieldToStorage(lesson.subject);

      if (gradeNum === null || !subjectStorage) {
        throw new Error("Invalid grade or subject");
      }

      // Generate quiz from API
      const quizData = await generateQuiz({
        student_version: lesson.studentSummary,
        num_questions: numQuestions,
      });

      // Create quiz document in Firestore
      const quizDocData = {
        lectureId: lesson.id,
        teacherId: user.uid,
        title: title,
        subject: subjectStorage,
        grade: gradeNum,
        totalQuestions: quizData.questions.length,
        createdAt: serverTimestamp(),
        questions: quizData.questions.map((q) => ({
          id: q.id,
          text: q.text,
          options: q.options.map((opt) => ({
            id: opt.id,
            text: opt.text,
          })),
          correctAnswerId: q.correctAnswerId,
        })),
      };

      const quizDocRef = await addDoc(collection(db, "quizzes"), quizDocData);
      const quizId = quizDocRef.id;

      // Update lesson with quizId
      const lessonDocRef = doc(db, "lessons", lesson.id);
      await updateDoc(lessonDocRef, {
        quizId: quizId,
        updatedAt: serverTimestamp(),
      });

      // Update local state
      setLesson((prev) => (prev ? { ...prev, quizId } : null));
      setQuiz({
        questions: quizData.questions,
        title: title,
        totalQuestions: quizData.questions.length,
      });
    } catch (error: any) {
      console.error("Error generating quiz:", error);
      throw error;
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  // Handle homework generation - Step 1: Open modal and generate questions
  const handleOpenHomeworkModal = async () => {
    if (!lesson || !user) return;

    setGenerateHomeworkModalOpen(true);
    setHomeworkQuestions([]); // Clear previous questions
    
    try {
      // Convert grade and subject for API
      const gradeNum = gradeToStorage(lesson.grade);
      const subjectStorage = teachingFieldToStorage(lesson.subject);

      if (gradeNum === null || !subjectStorage) {
        throw new Error("Invalid grade or subject");
      }

      // Generate clarifying questions
      const questionsData = await generateHomeworkQuestions({
        lesson_content: lesson.studentSummary,
        num_exercises: 5,
        subject: subjectStorage,
        grade: gradeNum,
      });

      setHomeworkQuestions(questionsData.questions);
    } catch (error: any) {
      console.error("Error generating homework questions:", error);
      setGenerateHomeworkModalOpen(false);
    }
  };

  // Handle homework generation - Step 2: Generate actual homework
  const handleGenerateHomework = async (
    title: string,
    numExercises: number,
    questions: HomeworkQuestion[],
    answers: Record<string, string>
  ) => {
    if (!lesson || !user) return;

    try {
      setIsGeneratingHomework(true);

      // Convert grade and subject for API
      const gradeNum = gradeToStorage(lesson.grade);
      const subjectStorage = teachingFieldToStorage(lesson.subject);

      if (gradeNum === null || !subjectStorage) {
        throw new Error("Invalid grade or subject");
      }

      // Generate homework from API
      const homeworkData = await generateHomework({
        lesson_content: lesson.studentSummary,
        num_exercises: numExercises,
        subject: subjectStorage,
        grade: gradeNum,
        questions: questions,
        answers: answers,
      });

      // Create homework document in Firestore
      const homeworkDocData = {
        lectureId: lesson.id,
        teacherId: user.uid,
        title: title,
        subject: subjectStorage,
        grade: gradeNum,
        numExercises: numExercises,
        htmlContent: homeworkData.homework,
        createdAt: serverTimestamp(),
      };

      const homeworkDocRef = await addDoc(collection(db, "homeworks"), homeworkDocData);
      const homeworkId = homeworkDocRef.id;

      // Update lesson with homeworkId
      const lessonDocRef = doc(db, "lessons", lesson.id);
      await updateDoc(lessonDocRef, {
        homeworkId: homeworkId,
        updatedAt: serverTimestamp(),
      });

      // Update local state
      setLesson((prev) => (prev ? { ...prev, homeworkId } : null));
      setHomework({
        html: homeworkData.homework,
        title: title,
      });
    } catch (error: any) {
      console.error("Error generating homework:", error);
      throw error;
    } finally {
      setIsGeneratingHomework(false);
    }
  };

  const formatSummary = (text: string) => {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800";
      case "fact-check pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800";
      case "draft":
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/30 dark:text-gray-300 dark:border-gray-700";
      default:
        return "";
    }
  };

  if (loading || loadingLesson || !lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Lesson Info */}
            <div className="flex-1">
              <h1 className="text-base sm:text-lg font-semibold truncate">
                {lesson.title}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {lesson.subject} · {translations[language].grades[lesson.grade as keyof typeof translations.ro.grades] || lesson.grade}
              </p>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              <Badge className={cn(getStatusColor(lesson.status), "border")}>
                {lesson.status === "ready" ? t.common.status.sentToStudents : (t.common.status[lesson.status as keyof typeof t.common.status] || lesson.status)}
              </Badge>
              {lesson.status !== "ready" && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleMarkAsReady}
                  disabled={isMarkingAsReady}
                >
                  {isMarkingAsReady ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t.teacher.lessonEditor.markReadyForStudents || "Marking as ready..."}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      {t.teacher.lessonEditor.markReadyForStudents || "Mark as ready for students"}
                    </>
                  )}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/teacher/dashboard")}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                {t.common.back}
              </Button>
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
                  {t.teacher.lessonEditor.tabs.studentSummary}
                </TabsTrigger>
                <TabsTrigger value="slides" className="flex-1">
                  {t.teacher.lessonEditor.tabs.slides}
                </TabsTrigger>
                <TabsTrigger value="guidelines" className="flex-1">
                  {t.teacher.lessonEditor.tabs.teacherGuidelines}
                </TabsTrigger>
                <TabsTrigger value="quiz" className="flex-1">
                  {t.teacher.lessonEditor.tabs.quiz || "Quiz"}
                </TabsTrigger>
                <TabsTrigger value="homework" className="flex-1">
                  {t.teacher.lessonEditor.tabs.homework || "Temă"}
                </TabsTrigger>
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
                        aria-label="Decrease font size"
                      >
                        <Minus className="h-4 w-4" />
                        <span className="ml-1 hidden sm:inline">A-</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFontSize(Math.min(24, fontSize + 2))}
                        aria-label="Increase font size"
                      >
                        <Plus className="h-4 w-4" />
                        <span className="ml-1 hidden sm:inline">A+</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                        aria-label="Listen"
                        title="Text-to-speech (coming soon)"
                      >
                        <Volume2 className="h-4 w-4" />
                        <span className="ml-1 hidden sm:inline">Listen</span>
                      </Button>
                    </div>
                  </div>

                  {/* Main Content */}
                  <div
                    className="max-w-none prose prose-lg dark:prose-invert max-w-none"
                    style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}
                  >
                    <style>{`
                      .prose h1 {
                        font-size: 2em;
                        font-weight: bold;
                        margin-top: 1em;
                        margin-bottom: 0.5em;
                      }
                      .prose h2 {
                        font-size: 1.5em;
                        font-weight: 600;
                        margin-top: 0.75em;
                        margin-bottom: 0.5em;
                      }
                      .prose h3 {
                        font-size: 1.25em;
                        font-weight: 600;
                        margin-top: 0.5em;
                        margin-bottom: 0.25em;
                      }
                      .prose p {
                        margin-bottom: 1em;
                      }
                      .prose ul, .prose ol {
                        margin-bottom: 1em;
                        padding-left: 1.5em;
                      }
                      .prose li {
                        margin-bottom: 0.5em;
                      }
                      .prose strong {
                        font-weight: 600;
                      }
                      .prose em {
                        font-style: italic;
                      }
                    `}</style>
                    {lesson.studentSummary && lesson.studentSummary.startsWith("<") ? (
                      // Render HTML content
                      <div
                        dangerouslySetInnerHTML={{ __html: lesson.studentSummary }}
                        className="space-y-4"
                      />
                    ) : (
                      // Render plain text with formatting
                      <div className="space-y-4">{formatSummary(lesson.studentSummary || "")}</div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Slides View */}
              <TabsContent value="slides" className="mt-0">
                <div className="space-y-6">
                  {/* Show PDF viewer if presentation file is available */}
                  {lesson.presentationFileUrl && lesson.presentationFileType === "pdf" ? (
                    <PDFSlideViewer
                      fileUrl={lesson.presentationFileUrl}
                      currentPage={currentSlideIndex}
                      onPageChange={(page) => setCurrentSlideIndex(page)}
                    />
                  ) : lesson.slides && lesson.slides.length > 0 ? (
                    <>
                      {/* Slide Counter */}
                      <div className="text-center text-sm text-muted-foreground">
                        {t.teacher.lessonViewer?.slideCounter?.(currentSlideIndex + 1, lesson.slides.length) || 
                         `Slide ${currentSlideIndex + 1} of ${lesson.slides.length}`}
                      </div>

                      {/* Slide Player */}
                      <Card className="min-h-[400px] flex flex-col border-2">
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
                          {t.teacher.lessonViewer?.previous || "Previous"}
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
                              aria-label={`Go to slide ${index + 1}`}
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
                          {t.teacher.lessonViewer?.next || "Next"}
                          <ChevronRight className="h-5 w-5" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <p className="text-center text-muted-foreground py-12">
                      {t.teacher.lessonViewer?.noSlides || "No slides available"}
                    </p>
                  )}
                </div>
              </TabsContent>

              {/* Teacher Guidelines View */}
              <TabsContent value="guidelines" className="mt-0">
                <div className="space-y-6">
                  {lesson.teacherGuidelines?.content ? (
                    // Render HTML content from API
                    <div
                      className="prose prose-lg dark:prose-invert max-w-none"
                      style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}
                    >
                      <style>{`
                        .teacher-note {
                          background-color: #fff3cd;
                          border-left: 4px solid #ffc107;
                          padding: 15px;
                          margin: 20px 0;
                          font-style: italic;
                          border-radius: 4px;
                        }
                        .dark .teacher-note {
                          background-color: rgba(255, 243, 205, 0.1);
                          border-left-color: #ffc107;
                        }
                        .emphasis {
                          font-weight: bold;
                          color: #d32f2f;
                        }
                        .dark .emphasis {
                          color: #ef5350;
                        }
                      `}</style>
                      <div
                        dangerouslySetInnerHTML={{ __html: lesson.teacherGuidelines.content }}
                      />
                    </div>
                  ) : (
                    // Fallback to structured fields
                    lesson.teacherGuidelines && (
                      <>
                        {lesson.teacherGuidelines.objectives && (
                          <Card>
                            <CardContent className="pt-6">
                              <h3 className="text-lg font-semibold mb-3">Objectives</h3>
                              <p className="whitespace-pre-wrap">{lesson.teacherGuidelines.objectives}</p>
                            </CardContent>
                          </Card>
                        )}
                        {lesson.teacherGuidelines.timing && (
                          <Card>
                            <CardContent className="pt-6">
                              <h3 className="text-lg font-semibold mb-3">Timing</h3>
                              <p>{lesson.teacherGuidelines.timing}</p>
                            </CardContent>
                          </Card>
                        )}
                        {lesson.teacherGuidelines.questions && (
                          <Card>
                            <CardContent className="pt-6">
                              <h3 className="text-lg font-semibold mb-3">Questions</h3>
                              <p className="whitespace-pre-wrap">{lesson.teacherGuidelines.questions}</p>
                            </CardContent>
                          </Card>
                        )}
                        {lesson.teacherGuidelines.differentiation && (
                          <Card>
                            <CardContent className="pt-6">
                              <h3 className="text-lg font-semibold mb-3">Differentiation</h3>
                              <p className="whitespace-pre-wrap">{lesson.teacherGuidelines.differentiation}</p>
                            </CardContent>
                          </Card>
                        )}
                        {lesson.teacherGuidelines.assessment && (
                          <Card>
                            <CardContent className="pt-6">
                              <h3 className="text-lg font-semibold mb-3">Assessment</h3>
                              <p className="whitespace-pre-wrap">{lesson.teacherGuidelines.assessment}</p>
                            </CardContent>
                          </Card>
                        )}
                      </>
                    )
                  )}
                </div>
              </TabsContent>

              {/* Quiz View */}
              <TabsContent value="quiz" className="mt-0">
                <div className="space-y-6">
                  {loadingQuiz ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : quiz ? (
                    <QuizDisplayReadOnly
                      questions={quiz.questions}
                      title={quiz.title}
                      totalQuestions={quiz.totalQuestions}
                    />
                  ) : (
                    <div className="text-center py-12 space-y-4">
                      <p className="text-muted-foreground">
                        {t.teacher.lessonEditor.quiz?.noQuiz || "No quiz has been generated for this lesson yet."}
                      </p>
                      <Button
                        onClick={() => setGenerateQuizModalOpen(true)}
                        size="lg"
                        disabled={isGeneratingQuiz}
                      >
                        {isGeneratingQuiz ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t.teacher.lessonEditor.quiz?.generating || "Generating..."}
                          </>
                        ) : (
                          t.teacher.lessonEditor.quiz?.generateButton || "Generate Quiz"
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Homework View */}
              <TabsContent value="homework" className="mt-0">
                <div className="space-y-6">
                  {loadingHomework ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : homework ? (
                    <HomeworkDisplay
                      homeworkHtml={homework.html}
                      title={homework.title}
                    />
                  ) : (
                    <div className="text-center py-12 space-y-4">
                      <p className="text-muted-foreground">
                        {t.teacher.lessonEditor.homework?.noHomework || "No homework has been generated for this lesson yet."}
                      </p>
                      <Button
                        size="lg"
                        onClick={handleOpenHomeworkModal}
                        disabled={isGeneratingHomework}
                      >
                        {isGeneratingHomework ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t.teacher.lessonEditor.homework?.generating || "Generating..."}
                          </>
                        ) : (
                          t.teacher.lessonEditor.homework?.generateButton || "Generate Homework"
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>

        {/* Right Side Panel - Slide-specific Information */}
        {activeTab === "slides" ? (
          <aside className="hidden lg:block w-80 border-l bg-muted/30 overflow-y-auto">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {t.teacher.lessonViewer?.slideInfo?.title || "Slide Information"}
                </h3>
              </div>

              {(() => {
                // Only show slide-specific info if we're viewing text-based slides (not PDF)
                const isViewingPDF = lesson.presentationFileUrl && lesson.presentationFileType === "pdf";
                
                // If viewing PDF, show slide-specific info based on current page
                if (isViewingPDF) {
                  const slideNumber = currentSlideIndex + 1;
                  
                  // Find the current slide's speaker note from the slides array
                  const currentSlide = lesson.slides.find(
                    (s) => s.slideIndex === currentSlideIndex || s.id === `slide-${currentSlideIndex}`
                  );
                  
                  // Use speaker note from presentation API if available
                  const notes = currentSlide?.speakerNote || 
                    `Slide ${slideNumber}: ${lesson.teacherGuidelines?.objectives ? `Obiective: ${lesson.teacherGuidelines.objectives}` : "Informații despre acest slide"}`;
                  
                  const tips: string[] = [];
                  const resources: string[] = [];
                  
                  // Add slide-specific tips based on position
                  if (slideNumber === 1) {
                    tips.push("Începe cu o întrebare provocatoare pentru a capta atenția elevilor");
                    tips.push("Folosește exemple concrete din viața de zi cu zi");
                    if (lesson.teacherGuidelines?.questions) {
                      tips.push(lesson.teacherGuidelines.questions);
                    }
                  } else {
                    tips.push("Folosește diagrame și ilustrații pentru claritate");
                    tips.push("Permite elevilor să pună întrebări");
                    if (lesson.teacherGuidelines?.differentiation) {
                      tips.push(lesson.teacherGuidelines.differentiation);
                    }
                  }
                  
                  // Add resources if available
                  if (lesson.teacherGuidelines?.assessment) {
                    resources.push(lesson.teacherGuidelines.assessment);
                  }
                  
                  return (
                    <div className="space-y-4">
                      {/* Notes */}
                      <div>
                        <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                          {t.teacher.lessonViewer?.slideInfo?.notes || "Notes"}
                        </h4>
                        <p className="text-sm leading-relaxed">
                          {notes}
                        </p>
                      </div>

                      {/* Tips */}
                      {tips.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                            {t.teacher.lessonViewer?.slideInfo?.tips || "Tips"}
                          </h4>
                          <ul className="space-y-2">
                            {tips.map((tip, index) => (
                              <li key={index} className="text-sm flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Resources */}
                      {resources.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                            {t.teacher.lessonViewer?.slideInfo?.resources || "Resources"}
                          </h4>
                          <ul className="space-y-2">
                            {resources.map((resource, index) => (
                              <li key={index} className="text-sm flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                <span>{resource}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                }
                
                // For text-based slides, show slide-specific info
                const currentSlide = lesson.slides?.[currentSlideIndex];
                if (!currentSlide) {
                  // Fallback if slide doesn't exist
                  const fallbackNotes = lesson.teacherGuidelines?.objectives || "";
                  const fallbackTips = lesson.teacherGuidelines?.questions ? [lesson.teacherGuidelines.questions] : [];
                  const fallbackResources = lesson.teacherGuidelines?.assessment ? [lesson.teacherGuidelines.assessment] : [];
                  
                  return (
                    <div className="space-y-4">
                      {/* Notes */}
                      <div>
                        <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                          {t.teacher.lessonViewer?.slideInfo?.notes || "Notes"}
                        </h4>
                        <p className="text-sm leading-relaxed">
                          {fallbackNotes}
                        </p>
                      </div>

                      {/* Tips */}
                      {fallbackTips.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                            {t.teacher.lessonViewer?.slideInfo?.tips || "Tips"}
                          </h4>
                          <ul className="space-y-2">
                            {fallbackTips.map((tip, index) => (
                              <li key={index} className="text-sm flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Resources */}
                      {fallbackResources.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                            {t.teacher.lessonViewer?.slideInfo?.resources || "Resources"}
                          </h4>
                          <ul className="space-y-2">
                            {fallbackResources.map((resource, index) => (
                              <li key={index} className="text-sm flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                <span>{resource}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                }
                
                const slideNumber = currentSlideIndex + 1;
                const totalSlides = lesson.slides.length;
                
                // Generate slide-specific notes based on position and content
                let notes = "";
                let tips: string[] = [];
                let resources: string[] = [];

                if (currentSlideIndex === 0) {
                  // First slide
                  notes = lesson.teacherGuidelines?.objectives || 
                    `Acesta este primul slide despre ${currentSlide.title}. ${lesson.teacherGuidelines?.timing ? `Durata estimată: ${lesson.teacherGuidelines.timing}.` : ""}`;
                  if (lesson.teacherGuidelines?.questions) {
                    tips.push(lesson.teacherGuidelines.questions);
                  }
                  tips.push("Începe cu o întrebare provocatoare pentru a capta atenția elevilor");
                  tips.push("Folosește exemple concrete din viața de zi cu zi");
                } else if (currentSlideIndex === totalSlides - 1) {
                  // Last slide
                  notes = lesson.teacherGuidelines?.assessment || 
                    `Slide-ul final pentru consolidare. ${lesson.teacherGuidelines?.questions ? `Întrebări de discuție: ${lesson.teacherGuidelines.questions}` : ""}`;
                  if (lesson.teacherGuidelines?.questions) {
                    tips.push(lesson.teacherGuidelines.questions);
                  }
                  tips.push("Rezolvă împreună câteva exemple");
                  tips.push("Asigură-te că toți elevii înțeleg înainte de a continua");
                  if (lesson.teacherGuidelines?.assessment) {
                    resources.push(lesson.teacherGuidelines.assessment);
                  }
                } else {
                  // Middle slides
                  notes = `Slide ${slideNumber}: ${currentSlide.title}. ${lesson.teacherGuidelines?.differentiation ? `Diferențiere: ${lesson.teacherGuidelines.differentiation}` : ""}`;
                  if (lesson.teacherGuidelines?.differentiation) {
                    tips.push(lesson.teacherGuidelines.differentiation);
                  }
                  tips.push("Folosește diagrame și ilustrații pentru claritate");
                  tips.push("Permite elevilor să pună întrebări");
                }

                return (
                  <div className="space-y-4">
                    {/* Notes */}
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                        {t.teacher.lessonViewer?.slideInfo?.notes || "Notes"}
                      </h4>
                      <p className="text-sm leading-relaxed">
                        {notes}
                      </p>
                    </div>

                    {/* Tips */}
                    {tips.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                          {t.teacher.lessonViewer?.slideInfo?.tips || "Tips"}
                        </h4>
                        <ul className="space-y-2">
                          {tips.map((tip, index) => (
                            <li key={index} className="text-sm flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Resources */}
                    {resources.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                          {t.teacher.lessonViewer?.slideInfo?.resources || "Resources"}
                        </h4>
                        <ul className="space-y-2">
                          {resources.map((resource, index) => (
                            <li key={index} className="text-sm flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              <span>{resource}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </aside>
        ) : (
          <aside className="hidden lg:block w-80 border-l bg-muted/30 overflow-y-auto">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {t.teacher.lessonViewer?.slideInfo?.title || "Teaching Notes"}
                </h3>
              </div>

              {lesson.teacherGuidelines && (
                <div className="space-y-4">
                  {lesson.teacherGuidelines.objectives && (
                    <div className="space-y-1">
                      <h4 className="font-semibold text-sm">Objectives</h4>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {lesson.teacherGuidelines.objectives}
                      </p>
                    </div>
                  )}
                  {lesson.teacherGuidelines.questions && (
                    <div className="space-y-1">
                      <h4 className="font-semibold text-sm">Questions</h4>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {lesson.teacherGuidelines.questions}
                      </p>
                    </div>
                  )}
                  {lesson.teacherGuidelines.differentiation && (
                    <div className="space-y-1">
                      <h4 className="font-semibold text-sm">Differentiation</h4>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {lesson.teacherGuidelines.differentiation}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Mobile Sidebar */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="fixed bottom-4 right-4 lg:hidden z-40"
            >
              {t.teacher.lessonViewer?.slideInfo?.title || "Teaching Notes"}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px]">
            <SheetHeader>
              <SheetTitle>{t.teacher.lessonViewer?.slideInfo?.title || "Teaching Notes"}</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              {activeTab === "slides" ? (
                (() => {
                  // Only show slide-specific info if we're viewing text-based slides (not PDF)
                  const isViewingPDF = lesson.presentationFileUrl && lesson.presentationFileType === "pdf";
                  // If viewing PDF, show slide-specific info based on current page
                  if (isViewingPDF) {
                    const slideNumber = currentSlideIndex + 1;
                    
                    // Find the current slide's speaker note from the slides array
                    const currentSlide = lesson.slides.find(
                      (s) => s.slideIndex === currentSlideIndex || s.id === `slide-${currentSlideIndex}`
                    );
                    
                    // Use speaker note from presentation API if available
                    const notes = currentSlide?.speakerNote || 
                      `Slide ${slideNumber}: ${lesson.teacherGuidelines?.objectives ? `Obiective: ${lesson.teacherGuidelines.objectives}` : "Informații despre acest slide"}`;
                    const tips: string[] = [];
                    const resources: string[] = [];
                    
                    // Add slide-specific tips based on position
                    if (slideNumber === 1) {
                      tips.push("Începe cu o întrebare provocatoare pentru a capta atenția elevilor");
                      tips.push("Folosește exemple concrete din viața de zi cu zi");
                      if (lesson.teacherGuidelines?.questions) {
                        tips.push(lesson.teacherGuidelines.questions);
                      }
                    } else {
                      tips.push("Folosește diagrame și ilustrații pentru claritate");
                      tips.push("Permite elevilor să pună întrebări");
                      if (lesson.teacherGuidelines?.differentiation) {
                        tips.push(lesson.teacherGuidelines.differentiation);
                      }
                    }
                    
                    // Add resources if available
                    if (lesson.teacherGuidelines?.assessment) {
                      resources.push(lesson.teacherGuidelines.assessment);
                    }
                    
                    return (
                      <>
                        {/* Notes */}
                        <div>
                          <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                            {t.teacher.lessonViewer?.slideInfo?.notes || "Notes"}
                          </h4>
                          <p className="text-sm leading-relaxed">
                            {notes}
                          </p>
                        </div>

                        {/* Tips */}
                        {tips.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                              {t.teacher.lessonViewer?.slideInfo?.tips || "Tips"}
                            </h4>
                            <ul className="space-y-2">
                              {tips.map((tip, index) => (
                                <li key={index} className="text-sm flex items-start gap-2">
                                  <span className="text-primary mt-1">•</span>
                                  <span>{tip}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Resources */}
                        {resources.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                              {t.teacher.lessonViewer?.slideInfo?.resources || "Resources"}
                            </h4>
                            <ul className="space-y-2">
                              {resources.map((resource, index) => (
                                <li key={index} className="text-sm flex items-start gap-2">
                                  <span className="text-primary mt-1">•</span>
                                  <span>{resource}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    );
                  }
                  
                  // For text-based slides, show slide-specific info
                  if (!lesson.slides || lesson.slides.length === 0) {
                    const fallbackNotes = lesson.teacherGuidelines?.objectives || "";
                    const fallbackTips = lesson.teacherGuidelines?.questions ? [lesson.teacherGuidelines.questions] : [];
                    const fallbackResources = lesson.teacherGuidelines?.assessment ? [lesson.teacherGuidelines.assessment] : [];
                    
                    return (
                      <>
                        {/* Notes */}
                        <div>
                          <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                            {t.teacher.lessonViewer?.slideInfo?.notes || "Notes"}
                          </h4>
                          <p className="text-sm leading-relaxed">
                            {fallbackNotes}
                          </p>
                        </div>

                        {/* Tips */}
                        {fallbackTips.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                              {t.teacher.lessonViewer?.slideInfo?.tips || "Tips"}
                            </h4>
                            <ul className="space-y-2">
                              {fallbackTips.map((tip, index) => (
                                <li key={index} className="text-sm flex items-start gap-2">
                                  <span className="text-primary mt-1">•</span>
                                  <span>{tip}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Resources */}
                        {fallbackResources.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                              {t.teacher.lessonViewer?.slideInfo?.resources || "Resources"}
                            </h4>
                            <ul className="space-y-2">
                              {fallbackResources.map((resource, index) => (
                                <li key={index} className="text-sm flex items-start gap-2">
                                  <span className="text-primary mt-1">•</span>
                                  <span>{resource}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    );
                  }
                  
                  const currentSlide = lesson.slides[currentSlideIndex];
                  if (!currentSlide) {
                    // Fallback if slide doesn't exist
                    const fallbackNotes = lesson.teacherGuidelines?.objectives || "";
                    const fallbackTips = lesson.teacherGuidelines?.questions ? [lesson.teacherGuidelines.questions] : [];
                    const fallbackResources = lesson.teacherGuidelines?.assessment ? [lesson.teacherGuidelines.assessment] : [];
                    
                    return (
                      <>
                        {/* Notes */}
                        <div>
                          <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                            {t.teacher.lessonViewer?.slideInfo?.notes || "Notes"}
                          </h4>
                          <p className="text-sm leading-relaxed">
                            {fallbackNotes}
                          </p>
                        </div>

                        {/* Tips */}
                        {fallbackTips.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                              {t.teacher.lessonViewer?.slideInfo?.tips || "Tips"}
                            </h4>
                            <ul className="space-y-2">
                              {fallbackTips.map((tip, index) => (
                                <li key={index} className="text-sm flex items-start gap-2">
                                  <span className="text-primary mt-1">•</span>
                                  <span>{tip}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Resources */}
                        {fallbackResources.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                              {t.teacher.lessonViewer?.slideInfo?.resources || "Resources"}
                            </h4>
                            <ul className="space-y-2">
                              {fallbackResources.map((resource, index) => (
                                <li key={index} className="text-sm flex items-start gap-2">
                                  <span className="text-primary mt-1">•</span>
                                  <span>{resource}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    );
                  }
                  
                  const slideNumber = currentSlideIndex + 1;
                  const totalSlides = lesson.slides.length;
                  
                  // Generate slide-specific notes based on position and content
                  let notes = "";
                  let tips: string[] = [];
                  let resources: string[] = [];

                  if (currentSlideIndex === 0) {
                    notes = lesson.teacherGuidelines?.objectives || 
                      `Acesta este primul slide despre ${currentSlide.title}. ${lesson.teacherGuidelines?.timing ? `Durata estimată: ${lesson.teacherGuidelines.timing}.` : ""}`;
                    if (lesson.teacherGuidelines?.questions) {
                      tips.push(lesson.teacherGuidelines.questions);
                    }
                    tips.push("Începe cu o întrebare provocatoare pentru a capta atenția elevilor");
                    tips.push("Folosește exemple concrete din viața de zi cu zi");
                  } else if (currentSlideIndex === totalSlides - 1) {
                    notes = lesson.teacherGuidelines?.assessment || 
                      `Slide-ul final pentru consolidare. ${lesson.teacherGuidelines?.questions ? `Întrebări de discuție: ${lesson.teacherGuidelines.questions}` : ""}`;
                    if (lesson.teacherGuidelines?.questions) {
                      tips.push(lesson.teacherGuidelines.questions);
                    }
                    tips.push("Rezolvă împreună câteva exemple");
                    tips.push("Asigură-te că toți elevii înțeleg înainte de a continua");
                    if (lesson.teacherGuidelines?.assessment) {
                      resources.push(lesson.teacherGuidelines.assessment);
                    }
                  } else {
                    notes = `Slide ${slideNumber}: ${currentSlide.title}. ${lesson.teacherGuidelines?.differentiation ? `Diferențiere: ${lesson.teacherGuidelines.differentiation}` : ""}`;
                    if (lesson.teacherGuidelines?.differentiation) {
                      tips.push(lesson.teacherGuidelines.differentiation);
                    }
                    tips.push("Folosește diagrame și ilustrații pentru claritate");
                    tips.push("Permite elevilor să pună întrebări");
                  }

                  return (
                    <>
                      {/* Notes */}
                      <div>
                        <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                          {t.teacher.lessonViewer?.slideInfo?.notes || "Notes"}
                        </h4>
                        <p className="text-sm leading-relaxed">
                          {notes}
                        </p>
                      </div>

                      {/* Tips */}
                      {tips.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                            {t.teacher.lessonViewer?.slideInfo?.tips || "Tips"}
                          </h4>
                          <ul className="space-y-2">
                            {tips.map((tip, index) => (
                              <li key={index} className="text-sm flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Resources */}
                      {resources.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                            {t.teacher.lessonViewer?.slideInfo?.resources || "Resources"}
                          </h4>
                          <ul className="space-y-2">
                            {resources.map((resource, index) => (
                              <li key={index} className="text-sm flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                <span>{resource}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  );
                })()
              ) : (
                lesson.teacherGuidelines && (
                  <>
                    {lesson.teacherGuidelines.objectives && (
                      <div className="space-y-1">
                        <h4 className="font-semibold text-sm">Objectives</h4>
                        <p className="text-sm text-muted-foreground">
                          {lesson.teacherGuidelines.objectives}
                        </p>
                      </div>
                    )}
                    {lesson.teacherGuidelines.questions && (
                      <div className="space-y-1">
                        <h4 className="font-semibold text-sm">Questions</h4>
                        <p className="text-sm text-muted-foreground">
                          {lesson.teacherGuidelines.questions}
                        </p>
                      </div>
                    )}
                    {lesson.teacherGuidelines.differentiation && (
                      <div className="space-y-1">
                        <h4 className="font-semibold text-sm">Differentiation</h4>
                        <p className="text-sm text-muted-foreground">
                          {lesson.teacherGuidelines.differentiation}
                        </p>
                      </div>
                    )}
                  </>
                )
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Generate Quiz Modal */}
      <GenerateQuizModal
        open={generateQuizModalOpen}
        onOpenChange={setGenerateQuizModalOpen}
        onGenerate={handleGenerateQuiz}
        defaultTitle={lesson ? `Test: ${lesson.title}` : ""}
      />
      
      <GenerateHomeworkModal
        open={generateHomeworkModalOpen}
        onOpenChange={setGenerateHomeworkModalOpen}
        onGenerate={handleGenerateHomework}
        defaultTitle={lesson ? `Temă: ${lesson.title}` : ""}
        questions={homeworkQuestions}
      />
    </div>
  );
}
