import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { ProgressIndicator } from "@/components/lesson-wizard/ProgressIndicator";
import { Step1DefineLesson } from "@/components/lesson-wizard/Step1DefineLesson";
import { Step2Sources } from "@/components/lesson-wizard/Step2Sources";
import { Step3Generation } from "@/components/lesson-wizard/Step3Generation";
import { Step4FactCheck } from "@/components/lesson-wizard/Step4FactCheck";
import { Step5Review } from "@/components/lesson-wizard/Step5Review";
import { ChevronLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

const steps = [
  { number: 1, label: "Define lesson" },
  { number: 2, label: "Sources" },
  { number: 3, label: "Generation" },
  { number: 4, label: "Fact-check" },
  { number: 5, label: "Review & finish" },
];

interface Step1Data {
  title: string;
  grade: string;
  subject: string;
  duration: string;
  objectives: string[];
}

interface Step2Data {
  files: File[];
  textContent: string;
  useCurriculumStandards: boolean;
  useReputableSites: boolean;
  customUrls: string;
}

export default function NewLessonPage() {
  const navigate = useNavigate();
  const { user, userData, loading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [lessonId, setLessonId] = useState<string | null>(null);

  const [step1Data, setStep1Data] = useState<Step1Data>({
    title: "",
    grade: "",
    subject: "",
    duration: "",
    objectives: [],
  });

  const [step2Data, setStep2Data] = useState<Step2Data>({
    files: [],
    textContent: "",
    useCurriculumStandards: false,
    useReputableSites: false,
    customUrls: "",
  });

  useEffect(() => {
    if (!loading && (!user || userData?.role !== "teacher")) {
      navigate("/login");
    }
  }, [user, userData, loading, navigate]);

  const handleStep1Change = (data: Partial<Step1Data>) => {
    setStep1Data((prev) => ({ ...prev, ...data }));
  };

  const handleStep2Change = (data: Partial<Step2Data>) => {
    setStep2Data((prev) => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    if (currentStep < 5) {
      if (currentStep === 2) {
        // After step 2, move to generation
        setCurrentStep(3);
        setGenerationComplete(false);
      } else if (currentStep === 3) {
        // Step 3 auto-advances when complete, but allow manual continue
        if (generationComplete) {
          setCurrentStep(4);
        }
      } else if (currentStep === 4) {
        // Step 4 continues to Step 5
        setCurrentStep(5);
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

  const handleGenerationComplete = () => {
    setGenerationComplete(true);
    // In a real app, this would create the lesson and get an ID
    setLessonId("mock-lesson-id-" + Date.now());
    // Auto-advance to fact-check after a brief delay
    setTimeout(() => {
      setCurrentStep(4);
    }, 1000);
  };

  const handleOpenEditor = () => {
    if (lessonId) {
      navigate(`/teacher/lessons/${lessonId}/edit`);
    } else {
      navigate("/teacher/dashboard");
    }
  };

  const isStep1Valid = step1Data.title.trim() && step1Data.grade && step1Data.subject;
  const isStep2Valid =
    step2Data.files.length > 0 ||
    step2Data.textContent.trim() ||
    step2Data.useCurriculumStandards ||
    step2Data.useReputableSites;

  const canProceed =
    (currentStep === 1 && isStep1Valid) ||
    (currentStep === 2 && isStep2Valid) ||
    (currentStep === 3 && generationComplete) ||
    currentStep === 4 ||
    currentStep === 5;

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
              <Step2Sources data={step2Data} onChange={handleStep2Change} />
            )}
            {currentStep === 3 && (
              <Step3Generation
                onComplete={handleGenerationComplete}
                onContinue={() => setCurrentStep(4)}
                canContinue={generationComplete}
              />
            )}
            {currentStep === 4 && (
              <Step4FactCheck
                onContinue={() => setCurrentStep(5)}
                onRegenerate={() => {
                  setGenerationComplete(false);
                  setCurrentStep(2);
                }}
                onBack={() => setCurrentStep(3)}
              />
            )}
            {currentStep === 5 && (
              <Step5Review lessonId={lessonId || ""} onOpenEditor={handleOpenEditor} />
            )}
          </div>

          {/* Bottom navigation bar (steps 1-2 only, steps 3-5 have their own controls) */}
          {currentStep < 3 && (
            <div className="flex items-center justify-between pt-6 border-t">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>

              <Button
                onClick={handleNext}
                disabled={!canProceed}
                className="ml-auto"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

