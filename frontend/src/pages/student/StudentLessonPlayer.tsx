import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Minus, Plus, Volume2, CheckCircle2, Loader2, ChevronsRight, ChevronsLeft, Bot, Download, Headphones } from "lucide-react";
import { cn } from "@/lib/utils";
import { doc, updateDoc, arrayUnion, serverTimestamp, getDoc } from "firebase/firestore";
import { db, storage } from "@/lib/firebaseConfig";
import { ref, getDownloadURL } from "firebase/storage";
import { translations } from "@/lib/translations";
import { convertLessonFromStorage } from "@/lib/dataConverters";
import { PDFSlideViewer } from "@/components/pdf-viewer/PDFSlideViewer";
import { LessonChatbot, LessonChatbotRef } from "@/components/chatbot/LessonChatbot";
import { TextSelectionHandler } from "@/components/chatbot/TextSelectionHandler";
import { FlashcardItem } from "@/components/flashcards/FlashcardItem";
import { generateFlashcards, Flashcard } from "@/lib/api";

export default function StudentLessonPlayer() {
  const { id: lessonId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  
  const [lesson, setLesson] = useState<any>(null);
  const [loadingLesson, setLoadingLesson] = useState(true);
  const [activeTab, setActiveTab] = useState("summary");
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [fontSize, setFontSize] = useState(16); // base font size in pixels
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const chatbotRef = useRef<LessonChatbotRef>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isUserStoppingRef = useRef(false);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loadingFlashcards, setLoadingFlashcards] = useState(false);
  const [numFlashcards, setNumFlashcards] = useState(10);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  // Fetch lesson data from Firestore
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
          navigate("/student/dashboard");
          return;
        }

        const data = lessonDocSnap.data();
        
        // Parse slides from Firestore
        let slides: any[] = [];
        if (data.slides) {
          if (Array.isArray(data.slides)) {
            slides = data.slides.map((slide: any) => ({
              id: slide.id || `slide-${slide.slideIndex || 0}`,
              title: slide.title || `Slide ${(slide.slideIndex || 0) + 1}`,
              content: slide.content || "",
              speakerNote: slide.speakerNote || slide.speaker_note || "",
              slideIndex: slide.slideIndex !== undefined ? slide.slideIndex : slide.slide_index,
            }));
          } else if (typeof data.slides === 'object') {
            slides = Object.values(data.slides).map((slide: any) => ({
              id: slide.id || `slide-${slide.slideIndex || 0}`,
              title: slide.title || `Slide ${(slide.slideIndex || 0) + 1}`,
              content: slide.content || "",
              speakerNote: slide.speakerNote || slide.speaker_note || "",
              slideIndex: slide.slideIndex !== undefined ? slide.slideIndex : slide.slide_index,
            }));
          }
        }

        // Convert from storage format to display format
        const converted = convertLessonFromStorage(data, {
          grades: translations[language].grades,
          teachingFields: translations[language].teachingFields,
        });

        // Extract learning objectives from HTML if available
        let learningObjectives: string[] = [];
        if (data.studentSummary) {
          // Try to extract h2 headings as objectives (simple approach)
          const htmlContent = data.studentSummary;
          const h2Matches = htmlContent.match(/<h2[^>]*>(.*?)<\/h2>/gi);
          if (h2Matches) {
            learningObjectives = h2Matches.map(match => 
              match.replace(/<[^>]*>/g, '').trim()
            ).slice(0, 5); // Limit to 5 objectives
          }
        }
        
        // Get translated grade name
        const gradeDisplay = converted.grade 
          ? (translations[language].grades[converted.grade as keyof typeof translations.ro.grades] || converted.grade)
          : t.common.messages.noData;
        
        const lessonData = {
          id: lessonDocSnap.id,
          title: converted.title || "Untitled Lesson",
          subject: converted.subject || "Unknown",
          subjectRaw: data.subject || "", // Raw subject for API (e.g., "biologie", "matematica")
          grade: gradeDisplay,
          gradeRaw: data.grade || 1, // Raw grade number for API (e.g., 5, 6)
          studentSummary: data.studentSummary || "",
          contentStudent: data.studentSummary || "", // Alias for chatbot
          slides: slides,
          presentationFileUrl: data.presentationFileUrl,
          presentationFileType: data.presentationFileType,
          podcastUrl: data.podcastUrl, // Legacy: keep for backward compatibility
          podcastPath: data.podcastPath,
          podcastDuration: data.podcastDuration,
          learningObjectives: learningObjectives.length > 0 ? learningObjectives : [
            "Understand the main concepts",
            "Apply knowledge to examples",
            "Complete the lesson activities"
          ],
        };

        // If we have a podcast path, get a fresh download URL using Firebase SDK
        // This ensures proper CORS and range request support for audio streaming
        if (lessonData.podcastPath && !lessonData.podcastUrl) {
          try {
            const storageRef = ref(storage, lessonData.podcastPath);
            const downloadURL = await getDownloadURL(storageRef);
            lessonData.podcastUrl = downloadURL;
          } catch (error) {
            console.error("Error getting podcast download URL:", error);
          }
        }

        setLesson(lessonData);
      } catch (error) {
        console.error("Error fetching lesson:", error);
        navigate("/student/dashboard");
      } finally {
        setLoadingLesson(false);
      }
    };

    if (lessonId) {
      fetchLesson();
    }
  }, [lessonId, language, navigate]);

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

  // Stop speech when switching away from summary tab
  useEffect(() => {
    if (activeTab !== "summary" && isPlaying) {
      isUserStoppingRef.current = true;
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      speechSynthesisRef.current = null;
    }
  }, [activeTab, isPlaying]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Load voices when available (some browsers load voices asynchronously)
  useEffect(() => {
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };
    
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  if (authLoading || loadingLesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Lesson not found</p>
          <Button onClick={() => navigate("/student/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
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

  // Extract plain text from HTML or plain text content
  const extractTextContent = (content: string): string => {
    if (!content) return "";
    
    // If it's HTML, extract text
    if (content.startsWith("<")) {
      // Create a temporary div to parse HTML
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = content;
      
      // Remove script and style elements
      const scripts = tempDiv.querySelectorAll("script, style");
      scripts.forEach(el => el.remove());
      
      // Get text content and clean it up
      let text = tempDiv.textContent || tempDiv.innerText || "";
      
      // Clean up extra whitespace
      text = text
        .replace(/\s+/g, " ") // Replace multiple spaces with single space
        .replace(/\n\s*\n/g, "\n") // Replace multiple newlines with single newline
        .trim();
      
      return text;
    }
    
    // If it's plain text, return as is (with some cleanup)
    return content
      .replace(/\s+/g, " ")
      .replace(/\n\s*\n/g, "\n")
      .trim();
  };

  // Handle text-to-speech
  const handleGenerateFlashcards = async () => {
    if (!lesson || loadingFlashcards) return;

    try {
      setLoadingFlashcards(true);
      
      const flashcardsData = await generateFlashcards({
        student_version: lesson.studentSummary || "",
        num_flashcards: numFlashcards,
        subject: lesson.subject,
        grade: lesson.grade ? parseInt(lesson.grade) : undefined,
      });

      setFlashcards(flashcardsData.flashcards);
    } catch (error: any) {
      console.error("Error generating flashcards:", error);
    } finally {
      setLoadingFlashcards(false);
    }
  };

  const handleTextToSpeech = () => {
    if (!lesson?.studentSummary) return;

    // Check if browser supports speech synthesis
    if (!("speechSynthesis" in window)) {
      alert(t.student.lessonPlayer.summary.fontControls.ttsNotSupported || "Text-to-speech is not supported in your browser.");
      return;
    }

    // Cancel any ongoing speech
    isUserStoppingRef.current = true;
    window.speechSynthesis.cancel();
    isUserStoppingRef.current = false; // Reset since we're starting new speech

    // Extract text content
    const textToRead = extractTextContent(lesson.studentSummary);
    
    if (!textToRead) {
      alert(t.student.lessonPlayer.summary.fontControls.noContent || "No content available to read.");
      return;
    }

    // Create speech utterance
    const utterance = new SpeechSynthesisUtterance(textToRead);
    
    // Set language based on current language context
    utterance.lang = language === "ro" ? "ro-RO" : "en-US";
    
    // Set voice properties
    utterance.rate = 1.0; // Normal speed
    utterance.pitch = 1.0; // Normal pitch
    utterance.volume = 1.0; // Full volume

    // Try to find a Romanian voice if available
    if (language === "ro") {
      const voices = window.speechSynthesis.getVoices();
      const romanianVoice = voices.find(voice => 
        voice.lang.startsWith("ro") || voice.name.toLowerCase().includes("romanian")
      );
      if (romanianVoice) {
        utterance.voice = romanianVoice;
      }
    }

    // Event handlers
    utterance.onstart = () => {
      setIsPlaying(true);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      speechSynthesisRef.current = null;
      isUserStoppingRef.current = false;
    };

    utterance.onerror = (event) => {
      // Don't show error if user manually stopped
      if (isUserStoppingRef.current) {
        setIsPlaying(false);
        speechSynthesisRef.current = null;
        isUserStoppingRef.current = false;
        return;
      }

      // Only show error for actual errors (not cancellations)
      if (event.error !== 'interrupted' && event.error !== 'canceled') {
        console.error("Speech synthesis error:", event);
        alert(t.student.lessonPlayer.summary.fontControls.ttsError || "An error occurred while reading the text.");
      }
      
      setIsPlaying(false);
      speechSynthesisRef.current = null;
    };

    // Store reference and start speaking
    speechSynthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };


  return (
    <div className="min-h-screen bg-background flex flex-col w-full overflow-x-hidden">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 w-full left-0 right-0">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo */}
            <Link to="/student/dashboard" className="flex items-center space-x-3">
              <img 
                src="/logo.png" 
                alt="EduAgent" 
                className="w-30 h-30 object-contain"
              />
            </Link>

            {/* Middle: Lesson Title */}
            <div className="flex-1 text-center px-4">
              <h1 className="text-base sm:text-lg font-semibold truncate">
                {lesson.title}
              </h1>
            </div>

            {/* Right: Back Link */}
            <div className="flex items-center gap-4">
              {user && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/student/lessons")}
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
      <div className="flex-1 flex relative">
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto w-full">
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
                <TabsTrigger value="podcast" className="flex-1">
                  {t.student.lessonPlayer.tabs.podcast || "Podcast"}
                </TabsTrigger>
                <TabsTrigger value="flashcards" className="flex-1">
                  {t.student.lessonPlayer.tabs.flashcards || "Flashcards"}
                </TabsTrigger>
              </TabsList>

              {/* Summary View */}
              <TabsContent value="summary" className="mt-0 !mt-0">
                <TextSelectionHandler
                  enabled={activeTab === "summary"}
                  onExplain={async (selectedText) => {
                    // Open chatbot if collapsed
                    if (sidebarCollapsed) {
                      setSidebarCollapsed(false);
                      // Wait a bit for the sidebar to open
                      await new Promise(resolve => setTimeout(resolve, 300));
                    }
                    
                    // Format prompt in Romanian
                    const prompt = `Explica-mi te rog mai multe despre: ${selectedText}`;
                    
                    // Send message to chatbot
                    if (chatbotRef.current) {
                      await chatbotRef.current.sendMessage(prompt);
                    }
                  }}
                />
                <div className="space-y-6 w-full">
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
                        variant={isPlaying ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          if (isPlaying) {
                            // Stop playback
                            isUserStoppingRef.current = true;
                            if (speechSynthesisRef.current) {
                              window.speechSynthesis.cancel();
                              speechSynthesisRef.current = null;
                            }
                            setIsPlaying(false);
                          } else {
                            // Start playback
                            isUserStoppingRef.current = false;
                            handleTextToSpeech();
                          }
                        }}
                        aria-label={t.student.lessonPlayer.summary.fontControls.listen}
                        title={isPlaying ? (t.student.lessonPlayer.summary.fontControls.stop || "Stop") : (t.student.lessonPlayer.summary.fontControls.listen || "Listen")}
                      >
                        <Volume2 className={cn("h-4 w-4", isPlaying && "animate-pulse")} />
                        <span className="ml-1 hidden sm:inline">
                          {isPlaying ? (t.student.lessonPlayer.summary.fontControls.stop || "Stop") : (t.student.lessonPlayer.summary.fontControls.listen || "Listen")}
                        </span>
                      </Button>
                    </div>
                  </div>

                  {/* Main Content */}
                  <div
                    className="prose prose-lg dark:prose-invert max-w-none"
                    data-summary-content
                    style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}
                  >
                    <style>{`
                      .prose {
                        max-width: 100% !important;
                        margin-left: 0 !important;
                        margin-right: 0 !important;
                      }
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
                  {/* Download Button */}
                  {lesson.presentationFileUrl && (
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        onClick={() => {
                          const link = document.createElement("a");
                          link.href = lesson.presentationFileUrl;
                          link.download = `${lesson.title || "presentation"}.pdf`;
                          link.click();
                        }}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        {t.student.lessonPlayer.downloadSlides || "Download Slides"}
                      </Button>
                    </div>
                  )}
                  
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
                        {t.student.lessonPlayer.slides.counter(currentSlideIndex + 1, lesson.slides.length)}
                      </div>

                      {/* Slide Player */}
                      <Card className="min-h-[400px] flex flex-col">
                        <CardContent className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12">
                          <div className="w-full max-w-3xl">
                            <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-center">
                              {lesson.slides[currentSlideIndex]?.title || `Slide ${currentSlideIndex + 1}`}
                            </h2>
                            <div className="text-xl sm:text-2xl space-y-3">
                              {formatSlideContent(lesson.slides[currentSlideIndex]?.content || "")}
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

              {/* Podcast View */}
              <TabsContent value="podcast" className="mt-0">
                <div className="space-y-6">
                  {lesson.podcastUrl ? (
                    <Card className="border-2">
                      <CardContent className="p-6 space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Headphones className="h-6 w-6 text-primary" />
                            <div>
                              <h3 className="text-lg font-semibold">
                                {t.student.lessonPlayer.podcast?.title || "Educational Podcast"}
                              </h3>
                              {lesson.podcastDuration && (
                                <p className="text-sm text-muted-foreground">
                                  {t.student.lessonPlayer.podcast?.duration || "Duration"}:{" "}
                                  {Math.floor(lesson.podcastDuration / 60)}:
                                  {String(Math.floor(lesson.podcastDuration % 60)).padStart(2, "0")}
                                </p>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => {
                              const link = document.createElement("a");
                              link.href = lesson.podcastUrl;
                              link.download = `${lesson.title || "podcast"}.mp3`;
                              link.click();
                            }}
                            className="flex items-center gap-2"
                          >
                            <Download className="h-4 w-4" />
                            {t.student.lessonPlayer.podcast?.download || "Download"}
                          </Button>
                        </div>
                        
                        <div className="w-full">
                          <audio
                            controls
                            className="w-full"
                            src={lesson.podcastUrl ? `${lesson.podcastUrl}?t=${Date.now()}` : undefined}
                            preload="metadata"
                          >
                            {t.student.lessonPlayer.podcast?.notSupported || "Your browser does not support the audio element."}
                          </audio>
                        </div>
                        
                        <p className="text-sm text-muted-foreground">
                          {t.student.lessonPlayer.podcast?.description || 
                           "Listen to an educational dialogue about this lesson. The podcast features a conversation between a teacher and student, making complex topics easier to understand."}
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="text-center py-12">
                      <Headphones className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        {t.student.lessonPlayer.podcast?.notAvailable || "Podcast not available for this lesson."}
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Flashcards View */}
              <TabsContent value="flashcards" className="mt-0">
                <div className="space-y-6">
                  {flashcards.length === 0 ? (
                    <Card className="border-2">
                      <CardContent className="p-6 space-y-6">
                        <div className="text-center">
                          <h3 className="text-lg font-semibold mb-4">
                            {t.student.lessonPlayer.flashcards?.title || "Generate Flashcards"}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-6">
                            {t.student.lessonPlayer.flashcards?.description || 
                             "Create flashcards to help you memorize key concepts from this lesson."}
                          </p>
                          
                          <div className="flex flex-col items-center gap-4 max-w-sm mx-auto">
                            <div className="w-full space-y-2">
                              <label className="text-sm font-medium">
                                {t.student.lessonPlayer.flashcards?.numCardsLabel || "Number of flashcards"}
                              </label>
                              <Select
                                value={numFlashcards.toString()}
                                onValueChange={(value) => setNumFlashcards(parseInt(value))}
                                disabled={loadingFlashcards}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select number" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="5">5 {t.student.lessonPlayer.flashcards?.cards || "cards"}</SelectItem>
                                  <SelectItem value="10">10 {t.student.lessonPlayer.flashcards?.cards || "cards"}</SelectItem>
                                  <SelectItem value="15">15 {t.student.lessonPlayer.flashcards?.cards || "cards"}</SelectItem>
                                  <SelectItem value="20">20 {t.student.lessonPlayer.flashcards?.cards || "cards"}</SelectItem>
                                  <SelectItem value="25">25 {t.student.lessonPlayer.flashcards?.cards || "cards"}</SelectItem>
                                  <SelectItem value="30">30 {t.student.lessonPlayer.flashcards?.cards || "cards"}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <Button
                              onClick={handleGenerateFlashcards}
                              disabled={loadingFlashcards}
                              className="w-full"
                              size="lg"
                            >
                              {loadingFlashcards ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  {t.student.lessonPlayer.flashcards?.generating || "Generating..."}
                                </>
                              ) : (
                                t.student.lessonPlayer.flashcards?.generateButton || "Generate Flashcards"
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">
                          {t.student.lessonPlayer.flashcards?.cardsGenerated || "Flashcards"} ({flashcards.length})
                        </h3>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setFlashcards([]);
                            setNumFlashcards(10);
                          }}
                          size="sm"
                        >
                          {t.student.lessonPlayer.flashcards?.regenerate || "Generate New"}
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {flashcards.map((card, index) => (
                          <FlashcardItem
                            key={index}
                            question={card.flashcard_text}
                            answer={card.answer}
                            index={index}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>

        {/* Right Side Panel - Chatbot (Fixed to viewport, slides in/out) */}
        <aside className={cn(
          "hidden lg:flex flex-col fixed right-0 border-l bg-background transition-transform duration-300 ease-in-out z-30",
          "top-16 bottom-0 w-96",
          sidebarCollapsed ? "translate-x-full" : "translate-x-0"
        )}>
          <div className="flex flex-col h-full w-full">
            <div className="px-4 py-3 border-b bg-muted/30 flex-shrink-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-sm">
                    {t.student.chatbot?.title || "Learning Assistant"}
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarCollapsed(true)}
                  className="h-8 w-8 -mr-2"
                  aria-label="Collapse sidebar"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground pl-7">
                {t.student.chatbot?.subtitle || "Ask me anything about this lesson"}
              </p>
            </div>
            
            {lesson && user && (
              <LessonChatbot
                ref={chatbotRef}
                lessonContent={lesson.contentStudent || lesson.studentSummary || ""}
                subject={lesson.subjectRaw || lesson.subject || ""}
                grade={lesson.gradeRaw || lesson.grade || 1}
                lessonId={lessonId || ""}
                studentId={user.uid}
              />
            )}
          </div>
        </aside>

        {/* Collapse Button - Visible when sidebar is hidden */}
        {sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="hidden lg:flex fixed right-4 top-20 z-30 h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
            aria-label={t.student.chatbot?.title || "Show Learning Assistant"}
          >
            <ChevronsLeft className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}

