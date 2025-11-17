import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Step1DefineLesson } from "@/components/lesson-wizard/Step1DefineLesson";
import { Step2Questions } from "@/components/lesson-wizard/Step2Questions";
import { Step3Generation } from "@/components/lesson-wizard/Step3Generation";
import { Step5Review } from "@/components/lesson-wizard/Step5Review";
import { LoadingScreen, LoadingStep } from "@/components/lesson-wizard/LoadingScreen";
import { Question, generateQuestions } from "@/lib/api";
import { ChevronLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { db } from "@/lib/firebaseConfig";
import { collection, addDoc, serverTimestamp, updateDoc, doc } from "firebase/firestore";
import { uploadFile, isPDF, MOCK_PRESENTATION_FILE_URL, MOCK_PRESENTATION_FILE_TYPE, getMockPresentationFileURL } from "@/lib/storage";
import { gradeToStorage, teachingFieldToStorage } from "@/lib/dataConverters";

interface Step1Data {
  title: string;
  grade: string;
  subject: string;
  numberOfSlides: number;
  template?: string;
  needsRecap?: boolean;
  previousStudentVersion?: string;
}

interface Step2QuestionsData {
  questions: Question[];
  answers: Record<string, string>;
  customAnswers: Record<string, string>;
}

type WorkflowStage = 
  | "define" 
  | "questions" 
  | "generation" 
  | "review";

export default function NewLessonPage() {
  const navigate = useNavigate();
  const { user, userData, loading } = useAuth();
  const { t } = useLanguage();
  const [currentStage, setCurrentStage] = useState<WorkflowStage>("define");
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Workflow progress tracking
  const [workflowSteps, setWorkflowSteps] = useState<LoadingStep[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [questionsLoadingSteps, setQuestionsLoadingSteps] = useState<LoadingStep[]>([]);

  const [step1Data, setStep1Data] = useState<Step1Data>({
    title: "",
    grade: "",
    subject: "",
    numberOfSlides: 10, // Default to 10 slides
    template: undefined,
  });

  const [step2Data, setStep2Data] = useState<Step2QuestionsData>({
    questions: [],
    answers: {},
    customAnswers: {},
  });

  useEffect(() => {
    if (!loading && (!user || userData?.role !== "teacher")) {
      navigate("/login");
    }
  }, [user, userData, loading, navigate]);

  // Initialize workflow steps - first step starts as in-progress
  useEffect(() => {
    setWorkflowSteps([
      {
        id: "define",
        label: t.teacher.newLesson.steps.defineLesson,
        icon: "filetext",
        status: "in-progress", // Start with first step in progress
      },
      {
        id: "questions",
        label: t.teacher.newLesson.steps.questions || "Questions",
        icon: "lightbulb",
        status: "pending",
      },
      {
        id: "generation",
        label: t.teacher.newLesson.steps.generation,
        icon: "sparkles",
        status: "pending",
      },
      {
        id: "review",
        label: t.teacher.newLesson.steps.reviewFinish,
        icon: "loader",
        status: "pending",
      },
    ]);
  }, [t]);

  // Smooth scroll to content when stage changes
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollIntoView({ 
        behavior: "smooth", 
        block: "start" 
      });
    }
  }, [currentStage]);

  const handleStep1Change = (data: Partial<Step1Data>) => {
    setStep1Data((prev) => ({ ...prev, ...data }));
  };

  const handleStep2Change = (data: Partial<Step2QuestionsData>) => {
    setStep2Data((prev) => ({ ...prev, ...data }));
  };

  const updateWorkflowStep = (stepId: string, status: LoadingStep["status"]) => {
    setWorkflowSteps((prev) =>
      prev.map((step) =>
        step.id === stepId ? { ...step, status } : step
      )
    );
  };

  const handleNext = async () => {
    if (currentStage === "define" && isStep1Valid) {
      // Mark define as complete
      updateWorkflowStep("define", "completed");
      
      // Start questions stage
      setIsProcessing(true);
      updateWorkflowStep("questions", "in-progress");
      setCurrentStage("questions");
      
      // Initialize loading steps - first step is in progress
      setQuestionsLoadingSteps([
        { 
          id: "analyze", 
          label: t.teacher.newLesson.loadingQuestions?.steps?.analyze || "Analyzing lesson parameters", 
          icon: "brain",
          status: "in-progress",
        },
        { 
          id: "context", 
          label: t.teacher.newLesson.loadingQuestions?.steps?.context || "Understanding educational context", 
          icon: "sparkles",
          status: "pending",
        },
        { 
          id: "questions", 
          label: t.teacher.newLesson.loadingQuestions?.steps?.questions || "Generating clarifying questions", 
          icon: "lightbulb",
          status: "pending",
        },
      ]);
      
      // Load questions (first step waits for this)
      try {
        setQuestionsError(null);
        const gradeNum = gradeToStorage(step1Data.grade);
        const subjectStorage = teachingFieldToStorage(step1Data.subject);
        
        if (gradeNum === null || !subjectStorage) {
          throw new Error("Invalid grade or subject");
        }

        const questions = await generateQuestions({
          title: step1Data.title,
          subject: subjectStorage,
          grade: gradeNum,
        });

        setStep2Data((prev) => ({ ...prev, questions }));
        
        // API call complete - quickly progress through remaining steps
        // Step 1 complete
        setQuestionsLoadingSteps((prev) => 
          prev.map((step, idx) => 
            idx === 0 ? { ...step, status: "completed" as const } : step
          )
        );
        
        // Small delay then step 2 in progress
        await new Promise(resolve => setTimeout(resolve, 400));
        setQuestionsLoadingSteps((prev) => 
          prev.map((step, idx) => 
            idx === 1 ? { ...step, status: "in-progress" as const } : step
          )
        );
        
        // Small delay then step 2 complete, step 3 in progress
        await new Promise(resolve => setTimeout(resolve, 600));
        setQuestionsLoadingSteps((prev) => 
          prev.map((step, idx) => 
            idx === 1 ? { ...step, status: "completed" as const } :
            idx === 2 ? { ...step, status: "in-progress" as const } : step
          )
        );
        
        // Small delay then step 3 complete
        await new Promise(resolve => setTimeout(resolve, 600));
        setQuestionsLoadingSteps((prev) => 
          prev.map((step, idx) => 
            idx === 2 ? { ...step, status: "completed" as const } : step
          )
        );
        
        // Brief delay before showing questions
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Keep questions stage as "in-progress" - it completes when user submits answers
        setIsProcessing(false);
      } catch (err: any) {
        console.error("Error loading questions:", err);
        setQuestionsError(err.message || "Failed to load questions");
        updateWorkflowStep("questions", "failed");
        setQuestionsLoadingSteps((prev) => 
          prev.map((step) => 
            step.status === "in-progress" ? { ...step, status: "failed" as const } : step
          )
        );
        setIsProcessing(false);
      }
    } else if (currentStage === "questions" && isStep2Valid && !isProcessing) {
      // User has answered all questions - NOW mark questions as complete and move to generation
      updateWorkflowStep("questions", "completed");
      updateWorkflowStep("generation", "in-progress");
      setCurrentStage("generation");
    }
  };

  const handleBack = () => {
    if (currentStage === "questions" && !isProcessing) {
      setCurrentStage("define");
      updateWorkflowStep("questions", "pending");
      setStep2Data({ questions: [], answers: {}, customAnswers: {} });
    }
  };

  const handleGenerationComplete = (finalLessonId: string) => {
    setLessonId(finalLessonId);
    updateWorkflowStep("generation", "completed");
    updateWorkflowStep("review", "in-progress");
    
    // Auto-advance to review after a brief delay
    setTimeout(() => {
      setCurrentStage("review");
    }, 1000);
  };

  const handleLessonComplete = () => {
    // Navigate to dashboard when lesson is marked as ready
    navigate("/teacher/dashboard");
  };

  const isStep1Valid = step1Data.title.trim() && step1Data.grade && step1Data.subject;
  const isStep2Valid = step2Data.questions.length > 0 && 
    step2Data.questions.every((q) => step2Data.answers[q.id.toString()]);

  const canProceed =
    (currentStage === "define" && isStep1Valid) ||
    (currentStage === "questions" && isStep2Valid && !isProcessing);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar role="teacher" />
      
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          {/* Persistent workflow progress tracker */}
          {currentStage !== "review" && workflowSteps.length > 0 && (
            <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
              <LoadingScreen
                steps={workflowSteps}
                showProgress={true}
                compact={true}
              />
            </div>
          )}

          {/* Step content with smooth transitions */}
          <div 
            ref={contentRef}
            className="mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700"
            key={currentStage}
          >
            {currentStage === "define" && (
              <>
                <Step1DefineLesson data={step1Data} onChange={handleStep1Change} />
                {questionsError && (
                  <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-sm text-destructive">{questionsError}</p>
                  </div>
                )}
              </>
            )}
            
            {currentStage === "questions" && (
              <>
                {isProcessing ? (
                  <div className="max-w-2xl mx-auto">
                    <LoadingScreen
                      title={t.teacher.newLesson.loadingQuestions?.title || "Analyzing Your Lesson"}
                      subtitle={t.teacher.newLesson.loadingQuestions?.subtitle || "Our AI is preparing clarifying questions"}
                      steps={questionsLoadingSteps}
                      waitForCompletion={true}
                    />
                  </div>
                ) : (
                  <Step2Questions
                    data={step2Data}
                    onChange={handleStep2Change}
                  />
                )}
              </>
            )}
            
            {currentStage === "generation" && (
              <Step3Generation
                title={step1Data.title}
                subject={step1Data.subject}
                grade={step1Data.grade}
                numberOfSlides={step1Data.numberOfSlides}
                template={step1Data.template}
                questions={step2Data.questions}
                answers={step2Data.answers}
                needsRecap={step1Data.needsRecap}
                previousStudentVersion={step1Data.previousStudentVersion}
                onComplete={handleGenerationComplete}
                onContinue={() => {
                  setCurrentStage("review");
                }}
                canContinue={false}
              />
            )}
            
            {currentStage === "review" && (
              <Step5Review lessonId={lessonId || ""} onComplete={handleLessonComplete} />
            )}
          </div>

          {/* Bottom navigation bar (only for define and questions stages) */}
          {(currentStage === "define" || (currentStage === "questions" && !isProcessing)) && (
            <div className="flex items-center justify-between pt-6 border-t animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStage === "define"}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                {t.teacher.newLesson.back}
              </Button>

              <Button
                onClick={handleNext}
                disabled={!canProceed}
                className="ml-auto"
              >
                {currentStage === "define" 
                  ? (t.teacher.newLesson.generateQuestions || "Generate Questions")
                  : (t.teacher.newLesson.generateLesson || "Generate Lesson")
                }
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

