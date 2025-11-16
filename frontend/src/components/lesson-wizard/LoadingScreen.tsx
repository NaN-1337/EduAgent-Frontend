import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Loader2, Sparkles, Brain, FileText, Lightbulb, CheckCircle2 } from "lucide-react";

export interface LoadingStep {
  id: string;
  label: string;
  icon?: "sparkles" | "brain" | "filetext" | "lightbulb" | "loader";
  duration?: number; // Optional: for timed steps
  status?: "pending" | "in-progress" | "completed" | "failed";
}

interface LoadingScreenProps {
  steps: LoadingStep[];
  title?: string;
  subtitle?: string;
  onComplete?: () => void;
  className?: string;
  showProgress?: boolean; // Show as persistent progress tracker
  compact?: boolean; // Compact view for progress tracker
  waitForCompletion?: boolean; // Don't auto-progress, wait for external status updates
}

const iconMap = {
  sparkles: Sparkles,
  brain: Brain,
  filetext: FileText,
  lightbulb: Lightbulb,
  loader: Loader2,
};

export function LoadingScreen({
  steps,
  title,
  subtitle,
  onComplete,
  className,
  showProgress = false,
  compact = false,
  waitForCompletion = false,
}: LoadingScreenProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (currentStepIndex < steps.length && !waitForCompletion) {
      setCompletedSteps((prev) => new Set(prev).add(currentStepIndex));
    }
  }, [currentStepIndex, steps.length, waitForCompletion]);

  // Auto-progress through steps (for visual effect) - only if not waiting for completion
  useEffect(() => {
    if (waitForCompletion) {
      return; // Don't auto-progress if waiting for external completion
    }

    if (currentStepIndex >= steps.length) {
      if (!isComplete) {
        setIsComplete(true);
        if (onComplete) {
          setTimeout(() => {
            onComplete();
          }, 500);
        }
      }
      return;
    }

    const currentStep = steps[currentStepIndex];
    const duration = currentStep.duration || 1500;

    const timer = setTimeout(() => {
      setCurrentStepIndex((prev) => prev + 1);
    }, duration);

    return () => clearTimeout(timer);
  }, [currentStepIndex, steps, onComplete, isComplete, waitForCompletion]);

  const getStepIcon = (step: LoadingStep, index: number) => {
    // If step has explicit status, use that
    if (step.status) {
      if (step.status === "completed") {
        return <CheckCircle2 className={cn("h-5 w-5 text-green-600", compact && "h-4 w-4")} />;
      }
      if (step.status === "in-progress") {
        const Icon = step.icon ? iconMap[step.icon] : Loader2;
        return <Icon className={cn("h-5 w-5 animate-spin text-primary", compact && "h-4 w-4")} />;
      }
      if (step.status === "failed") {
        return <div className={cn("h-5 w-5 rounded-full bg-destructive", compact && "h-4 w-4")} />;
      }
      if (step.status === "pending") {
        // Pending status - show grayed out circle
        return <div className={cn("h-5 w-5 rounded-full border-2 border-muted-foreground/30", compact && "h-4 w-4")} />;
      }
    }

    // Otherwise use index-based logic
    const isCompleted = completedSteps.has(index) && index < currentStepIndex;
    const isCurrent = index === currentStepIndex;

    if (isCompleted) {
      return <CheckCircle2 className={cn("h-5 w-5 text-green-600", compact && "h-4 w-4")} />;
    }

    if (isCurrent) {
      const Icon = step.icon ? iconMap[step.icon] : Loader2;
      return <Icon className={cn("h-5 w-5 animate-spin text-primary", compact && "h-4 w-4")} />;
    }

    return <div className={cn("h-5 w-5 rounded-full border-2 border-muted-foreground/30", compact && "h-4 w-4")} />;
  };

  // Compact progress tracker view
  if (showProgress && compact) {
    return (
      <div className={cn("max-w-4xl mx-auto", className)}>
        <Card className="border shadow-sm bg-muted/30">
          <CardContent className="py-4">
            <div className="flex items-center justify-center gap-6">
              {steps.map((step, index) => {
                const isCompleted = step.status === "completed";
                const isCurrent = step.status === "in-progress";
                const isFailed = step.status === "failed";

                return (
                  <div key={step.id} className="flex items-center gap-2">
                    <div className="relative shrink-0">
                      {getStepIcon(step, index)}
                    </div>
                    <span
                      className={cn(
                        "text-sm font-medium transition-colors",
                        isCompleted && "text-green-600",
                        isCurrent && "text-primary font-semibold",
                        isFailed && "text-destructive",
                        !isCompleted && !isCurrent && !isFailed && "text-muted-foreground"
                      )}
                    >
                      {step.label}
                    </span>
                    {index < steps.length - 1 && (
                      <div className="ml-2 w-8 h-0.5 bg-border" />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("max-w-3xl mx-auto", className)}>
      <Card className="border-2 shadow-lg">
        <CardContent className="pt-8 pb-8">
          {/* Header */}
          {title && (
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">{title}</h2>
              {subtitle && (
                <p className="text-muted-foreground">{subtitle}</p>
              )}
            </div>
          )}

          {/* Loading Steps */}
          <div className="space-y-1 relative">
            {/* Connection lines */}
            <div className="absolute left-[11px] top-8 bottom-8 w-0.5 bg-gradient-to-b from-primary/20 via-primary/10 to-muted" />

            {steps.map((step, index) => {
              const isCompleted = step.status === "completed" || (completedSteps.has(index) && index < currentStepIndex);
              const isCurrent = step.status === "in-progress" || index === currentStepIndex;
              const isFuture = step.status === "pending" || (!step.status && index > currentStepIndex);

              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-start gap-4 p-4 rounded-lg transition-all duration-500 relative",
                    isCurrent && "bg-primary/5 border border-primary/20 scale-[1.02]",
                    isCompleted && "opacity-60",
                    isFuture && "opacity-40"
                  )}
                  style={{
                    transitionDelay: `${index * 50}ms`,
                  }}
                >
                  {/* Icon */}
                  <div className="relative z-10 mt-0.5 shrink-0 bg-background">
                    {getStepIcon(step, index)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div
                      className={cn(
                        "font-semibold text-base transition-colors duration-300",
                        isCompleted && "text-muted-foreground line-through",
                        isCurrent && "text-primary",
                        isFuture && "text-muted-foreground"
                      )}
                    >
                      {step.label}
                    </div>
                  </div>

                  {/* Animated pulse for current step */}
                  {isCurrent && (
                    <div className="absolute inset-0 rounded-lg bg-primary/5 animate-pulse" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Completion message */}
          {isComplete && !showProgress && (
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-2 justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500" />
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  Process complete!
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

