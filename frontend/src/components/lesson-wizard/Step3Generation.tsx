import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface GenerationStep {
  id: string;
  label: string;
  description?: string;
  status: "pending" | "in-progress" | "completed" | "failed";
}

interface Step3GenerationProps {
  onComplete: () => void;
  onContinue?: () => void;
  canContinue?: boolean;
}

export function Step3Generation({ onComplete, onContinue, canContinue }: Step3GenerationProps) {
  const { t } = useLanguage();
  
  const initialSteps = useMemo<GenerationStep[]>(() => [
    {
      id: "understanding",
      label: t.teacher.newLesson.step3.steps?.understanding || "Understanding request",
      status: "pending",
    },
    {
      id: "researching",
      label: t.teacher.newLesson.step3.steps?.researching || "Researching topic",
      status: "pending",
    },
    {
      id: "drafting",
      label: t.teacher.newLesson.step3.steps?.drafting || "Drafting student summary",
      status: "pending",
    },
    {
      id: "slides",
      label: t.teacher.newLesson.step3.steps?.slides || "Creating slides outline",
      status: "pending",
    },
    {
      id: "guidelines",
      label: t.teacher.newLesson.step3.steps?.guidelines || "Writing teacher guidelines",
      status: "pending",
    },
    {
      id: "factcheck",
      label: t.teacher.newLesson.step3.steps?.factcheck || "Running fact-check checks",
      status: "pending",
    },
  ], [t]);

  const stepDescriptions = useMemo<Record<string, string>>(() => ({
    understanding: t.teacher.newLesson.step3.descriptions?.understanding || "Analyzing your lesson requirements and objectives...",
    researching: t.teacher.newLesson.step3.descriptions?.researching || "Scanning your uploaded PDF and trusted sources...",
    drafting: t.teacher.newLesson.step3.descriptions?.drafting || "Creating a clear, age-appropriate summary for students...",
    slides: t.teacher.newLesson.step3.descriptions?.slides || "Organizing content into structured presentation slides...",
    guidelines: t.teacher.newLesson.step3.descriptions?.guidelines || "Preparing teaching notes and activity suggestions...",
    factcheck: t.teacher.newLesson.step3.descriptions?.factcheck || "Verifying facts against trusted sources...",
  }), [t]);

  const [steps, setSteps] = useState<GenerationStep[]>(initialSteps);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(false);

  // Update steps when language changes
  useEffect(() => {
    setSteps(initialSteps);
  }, [initialSteps]);

  useEffect(() => {
    if (currentStepIndex >= initialSteps.length) {
      return;
    }

    // Mark first step as in-progress immediately
    if (currentStepIndex === 0) {
      setSteps((prevSteps) => {
        const newSteps = [...prevSteps];
        newSteps[0] = {
          ...newSteps[0],
          status: "in-progress",
          description: stepDescriptions[newSteps[0].id],
        };
        return newSteps;
      });
    }

    // Simulate generation progress
    const timeout = setTimeout(() => {
      setSteps((prevSteps) => {
        const newSteps = [...prevSteps];
        
        // Complete current step
        if (currentStepIndex < newSteps.length) {
          newSteps[currentStepIndex] = {
            ...newSteps[currentStepIndex],
            status: "completed",
            description: undefined,
          };
        }

        // Start next step if available
        if (currentStepIndex < initialSteps.length - 1) {
          const nextIndex = currentStepIndex + 1;
          newSteps[nextIndex] = {
            ...newSteps[nextIndex],
            status: "in-progress",
            description: stepDescriptions[newSteps[nextIndex].id],
          };
          setCurrentStepIndex(nextIndex);
        } else {
          // All steps completed - only call onComplete once
          if (!hasCompleted) {
            setHasCompleted(true);
            setTimeout(() => {
              onComplete();
            }, 500);
          }
        }

        return newSteps;
      });
    }, 2000);

    return () => clearTimeout(timeout);
  }, [currentStepIndex, onComplete, initialSteps.length, stepDescriptions, hasCompleted]);

  const getStepIcon = (status: GenerationStep["status"]) => {
    switch (status) {
      case "in-progress":
        return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "failed":
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />;
    }
  };

  const allCompleted = steps.every((step) => step.status === "completed");

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="border-2 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-center">
            {t.teacher.newLesson.step3.title}
          </CardTitle>
          <CardDescription className="text-center">
            {t.teacher.newLesson.step3.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-lg transition-colors",
                  step.status === "in-progress" && "bg-primary/5 border border-primary/20"
                )}
              >
                <div className="mt-0.5 shrink-0">{getStepIcon(step.status)}</div>
                <div className="flex-1 min-w-0">
                  <div
                    className={cn(
                      "font-semibold text-base",
                      step.status === "completed" && "text-muted-foreground",
                      step.status === "in-progress" && "text-primary"
                    )}
                  >
                    {step.label}
                  </div>
                  {step.description && (
                    <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {allCompleted && (
            <>
              <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-sm text-muted-foreground text-center">
                  You can review and adjust all content before sharing with students.
                </p>
              </div>
              {onContinue && (
                <div className="mt-6 flex justify-end">
                  <Button onClick={onContinue} size="lg" disabled={!canContinue}>
                    {t.teacher.newLesson.step3.continueButton}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

