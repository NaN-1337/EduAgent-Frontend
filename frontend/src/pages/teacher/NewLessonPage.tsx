import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { ProgressIndicator } from "@/components/lesson-wizard/ProgressIndicator";
import { Step1DefineLesson } from "@/components/lesson-wizard/Step1DefineLesson";
import { Step2Questions } from "@/components/lesson-wizard/Step2Questions";
import { Step3Generation } from "@/components/lesson-wizard/Step3Generation";
import { Step5Review } from "@/components/lesson-wizard/Step5Review";
import { Question } from "@/lib/api";
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
}

interface Step2QuestionsData {
  questions: Question[];
  answers: Record<string, string>;
  customAnswers: Record<string, string>;
}

export default function NewLessonPage() {
  const navigate = useNavigate();
  const { user, userData, loading } = useAuth();
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(1);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [isCreatingLesson, setIsCreatingLesson] = useState(false);

  const steps = [
    { number: 1, label: t.teacher.newLesson.steps.defineLesson },
    { number: 2, label: t.teacher.newLesson.steps.questions || "Questions" },
    { number: 3, label: t.teacher.newLesson.steps.generation },
    { number: 4, label: t.teacher.newLesson.steps.reviewFinish },
  ];

  const [step1Data, setStep1Data] = useState<Step1Data>({
    title: "",
    grade: "",
    subject: "",
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

  const handleStep1Change = (data: Partial<Step1Data>) => {
    setStep1Data((prev) => ({ ...prev, ...data }));
  };

  const handleStep2Change = (data: Partial<Step2QuestionsData>) => {
    setStep2Data((prev) => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    if (currentStep < 4) {
      if (currentStep === 2) {
        // After step 2, move to generation
        setCurrentStep(3);
        setGenerationComplete(false);
      } else if (currentStep === 3) {
        // Step 3 auto-advances when complete, but allow manual continue
        if (generationComplete) {
          setCurrentStep(4);
        }
      } else {
        setCurrentStep((prev) => prev + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1 && currentStep !== 3) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleGenerationComplete = (finalLessonId: string) => {
    setLessonId(finalLessonId);
    setGenerationComplete(true);
    
    // Auto-advance to review after a brief delay
    setTimeout(() => {
      setCurrentStep(4);
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
    (currentStep === 1 && isStep1Valid) ||
    (currentStep === 2 && isStep2Valid) ||
    (currentStep === 3 && generationComplete) ||
    currentStep === 4;

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
          {/* Progress indicator */}
          <ProgressIndicator currentStep={currentStep} steps={steps} />

          {/* Step content */}
          <div className="mb-8">
            {currentStep === 1 && (
              <Step1DefineLesson data={step1Data} onChange={handleStep1Change} />
            )}
            {currentStep === 2 && (
              <Step2Questions
                title={step1Data.title}
                subject={step1Data.subject}
                grade={step1Data.grade}
                data={step2Data}
                onChange={handleStep2Change}
              />
            )}
            {currentStep === 3 && (
              <Step3Generation
                title={step1Data.title}
                subject={step1Data.subject}
                grade={step1Data.grade}
                questions={step2Data.questions}
                answers={step2Data.answers}
                onComplete={handleGenerationComplete}
                onContinue={() => setCurrentStep(4)}
                canContinue={generationComplete}
              />
            )}
            {currentStep === 4 && (
              <Step5Review lessonId={lessonId || ""} onComplete={handleLessonComplete} />
            )}
          </div>

          {/* Bottom navigation bar (steps 1-2 only, steps 3-4 have their own controls) */}
          {currentStep < 3 && (
            <div className="flex items-center justify-between pt-6 border-t">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
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
                {t.teacher.newLesson.next}
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

