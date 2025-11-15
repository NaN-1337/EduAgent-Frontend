import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Minus, Plus, Volume2, Edit, FileCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { translations } from "@/lib/translations";
import { convertLessonFromStorage } from "@/lib/dataConverters";

interface Slide {
  id?: string;
  title: string;
  content: string;
  hasIssue?: boolean;
}

interface LessonData {
  id: string;
  title: string;
  subject: string;
  grade: string;
  status: "draft" | "fact-check pending" | "ready";
  studentSummary: string;
  slides: Slide[];
  teacherGuidelines?: {
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
            slides = data.slides;
          } else if (typeof data.slides === 'object') {
            slides = Object.values(data.slides);
          }
        }

        // Parse teacher guidelines
        let teacherGuidelines: any = {};
        if (data.teacherGuidelines) {
          if (typeof data.teacherGuidelines === 'object') {
            teacherGuidelines = {
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
  }, [lessonId, user, navigate]);

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
      <Navbar role="teacher" />
      
      {/* Top Bar */}
      <header className="sticky top-16 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
                {t.common.status[lesson.status as keyof typeof t.common.status] || lesson.status}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/teacher/lessons/${lessonId}/fact-check`)}
              >
                <FileCheck className="h-4 w-4 mr-2" />
                {t.teacher.lessonEditor.runFactCheck}
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate(`/teacher/lessons/${lessonId}/edit`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                {t.common.edit}
              </Button>
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
                  {lesson.teacherGuidelines && (
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
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>

        {/* Right Side Panel - Teacher Guidelines Summary */}
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
              {lesson.teacherGuidelines && (
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
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
