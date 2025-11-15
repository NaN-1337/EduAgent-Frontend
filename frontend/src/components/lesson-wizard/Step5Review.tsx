import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";
import { convertLessonFromStorage, gradeToStorage, teachingFieldToStorage } from "@/lib/dataConverters";
import { CheckCircle2, Save, FileCheck, ChevronLeft, ChevronRight, Minus, Plus, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { PDFSlideViewer } from "@/components/pdf-viewer/PDFSlideViewer";

interface Step5ReviewProps {
  lessonId: string;
  onComplete?: () => void;
}

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
  presentationFileUrl?: string;
  presentationFileType?: "pdf" | "ppt";
  teacherGuidelines?: {
    objectives?: string;
    timing?: string;
    questions?: string;
    differentiation?: string;
    assessment?: string;
  };
}

export function Step5Review({ lessonId, onComplete }: Step5ReviewProps) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [loadingLesson, setLoadingLesson] = useState(true);
  const [activeTab, setActiveTab] = useState("summary");
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [fontSize, setFontSize] = useState(16);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchLesson = async () => {
      if (!lessonId) {
        setLoadingLesson(false);
        return;
      }

      try {
        setLoadingLesson(true);
        const lessonDocRef = doc(db, "lessons", lessonId);
        const lessonDocSnap = await getDoc(lessonDocRef);

        if (!lessonDocSnap.exists()) {
          console.error("Lesson not found");
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
          presentationFileUrl: data.presentationFileUrl,
          presentationFileType: data.presentationFileType,
          teacherGuidelines: teacherGuidelines,
        };

        setLesson(lessonData);
      } catch (error) {
        console.error("Error fetching lesson:", error);
      } finally {
        setLoadingLesson(false);
      }
    };

    if (lessonId) {
      fetchLesson();
    }
  }, [lessonId]);

  const handleTitleChange = (title: string) => {
    if (lesson) {
      setLesson({ ...lesson, title });
    }
  };

  const handleSave = async (newStatus?: "draft" | "fact-check pending" | "ready") => {
    if (!lesson || !lessonId) return;
    
    setIsSaving(true);
    try {
      const lessonDocRef = doc(db, "lessons", lessonId);
      const statusToSave = newStatus || lesson.status;
      
      // Convert grade and subject back to storage format before saving
      const gradeStorage = gradeToStorage(lesson.grade);
      const subjectStorage = teachingFieldToStorage(lesson.subject);
      
      await updateDoc(lessonDocRef, {
        title: lesson.title,
        grade: gradeStorage !== null ? gradeStorage : lesson.grade,
        subject: subjectStorage || lesson.subject,
        status: statusToSave,
        studentSummary: lesson.studentSummary,
        slides: lesson.slides,
        teacherGuidelines: lesson.teacherGuidelines,
        updatedAt: serverTimestamp(),
        lastModified: serverTimestamp(),
      });
      
      // Update local state with the saved status
      if (newStatus) {
        setLesson({ ...lesson, status: newStatus });
      }

      // If marked as ready, call onComplete callback
      if (newStatus === "ready" && onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error("Error saving lesson:", error);
    } finally {
      setIsSaving(false);
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

  if (loadingLesson || !lesson) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <Input
              value={lesson.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="text-2xl font-bold border-none shadow-none p-0 h-auto focus-visible:ring-0 bg-transparent"
              placeholder={t.teacher.lessonEditor.placeholder}
            />
            <p className="text-sm text-muted-foreground mt-1">
              {lesson.subject} · {translations[language].grades[lesson.grade as keyof typeof translations.ro.grades] || lesson.grade}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={cn(getStatusColor(lesson.status), "border")}>
              {lesson.status === "ready" && <CheckCircle2 className="h-3 w-3 mr-1" />}
              {t.common.status[lesson.status as keyof typeof t.common.status] || (lesson.status.charAt(0).toUpperCase() + lesson.status.slice(1))}
            </Badge>
            <Button
              variant="outline"
              onClick={() => navigate(`/teacher/lessons/${lessonId}/fact-check`)}
              size="sm"
            >
              <FileCheck className="h-4 w-4 mr-2" />
              {t.teacher.lessonEditor.runFactCheck}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden gap-6">
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
                  {/* Show PDF viewer if presentation file is available */}
                  {lesson.presentationFileUrl && lesson.presentationFileType === "pdf" ? (
                    <PDFSlideViewer
                      fileUrl={lesson.presentationFileUrl}
                      currentPage={currentSlideIndex}
                      onPageChange={(page) => setCurrentSlideIndex(page)}
                    />
                  ) : lesson.presentationFileUrl && lesson.presentationFileType === "ppt" ? (
                    <Card className="min-h-[400px] flex flex-col border-2">
                      <CardContent className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12">
                        <div className="text-center space-y-4">
                          <p className="text-lg text-muted-foreground">
                            PowerPoint viewer coming soon. For now, please convert your PPT to PDF.
                          </p>
                          <a
                            href={lesson.presentationFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            Download presentation file
                          </a>
                        </div>
                      </CardContent>
                    </Card>
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
                const isViewingPPT = lesson.presentationFileUrl && lesson.presentationFileType === "ppt";
                
                // If viewing PDF/PPT, show general guidelines instead of slide-specific info
                if (isViewingPDF || isViewingPPT) {
                  const notes = lesson.teacherGuidelines?.objectives || "";
                  const tips: string[] = [];
                  const resources: string[] = [];
                  
                  if (lesson.teacherGuidelines?.questions) {
                    tips.push(lesson.teacherGuidelines.questions);
                  }
                  if (lesson.teacherGuidelines?.differentiation) {
                    tips.push(lesson.teacherGuidelines.differentiation);
                  }
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
              {t.teacher.lessonViewer?.slideInfo?.title || "Slide Information"}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px]">
            <SheetHeader>
              <SheetTitle>{t.teacher.lessonViewer?.slideInfo?.title || "Slide Information"}</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              {activeTab === "slides" ? (
                (() => {
                  // Only show slide-specific info if we're viewing text-based slides (not PDF)
                  const isViewingPDF = lesson.presentationFileUrl && lesson.presentationFileType === "pdf";
                  const isViewingPPT = lesson.presentationFileUrl && lesson.presentationFileType === "ppt";
                  
                  // If viewing PDF/PPT, show general guidelines instead of slide-specific info
                  if (isViewingPDF || isViewingPPT) {
                    const notes = lesson.teacherGuidelines?.objectives || "";
                    const tips: string[] = [];
                    const resources: string[] = [];
                    
                    if (lesson.teacherGuidelines?.questions) {
                      tips.push(lesson.teacherGuidelines.questions);
                    }
                    if (lesson.teacherGuidelines?.differentiation) {
                      tips.push(lesson.teacherGuidelines.differentiation);
                    }
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

      {/* Bottom Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t sticky bottom-0 bg-background z-30">
        <Button
          variant="outline"
          onClick={() => handleSave()}
          disabled={isSaving}
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? t.teacher.lessonEditor.saving : t.teacher.lessonEditor.saveDraft}
        </Button>
        <Button
          onClick={async () => {
            await handleSave("ready");
          }}
          disabled={lesson.status === "ready" || isSaving}
          size="lg"
        >
          <CheckCircle2 className="h-4 w-4 mr-2" />
          {t.teacher.lessonEditor.markReadyForStudents}
        </Button>
      </div>
    </div>
  );
}
