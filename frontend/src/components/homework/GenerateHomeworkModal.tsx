import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { HomeworkQuestion } from "@/lib/api";

interface GenerateHomeworkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (
    title: string,
    numExercises: number,
    questions: HomeworkQuestion[],
    answers: Record<string, string>
  ) => Promise<void>;
  defaultTitle?: string;
  questions?: HomeworkQuestion[];
}

export function GenerateHomeworkModal({
  open,
  onOpenChange,
  onGenerate,
  defaultTitle = "",
  questions: externalQuestions = [],
}: GenerateHomeworkModalProps) {
  const { t } = useLanguage();
  const [title, setTitle] = useState(defaultTitle);
  const [numExercises, setNumExercises] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"input" | "questions">("input");
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Update step when external questions are provided
  useEffect(() => {
    if (externalQuestions.length > 0 && open) {
      setStep("questions");
      setIsLoadingQuestions(false);
    }
  }, [externalQuestions, open]);

  const handleGenerateQuestions = async () => {
    if (!title.trim()) {
      setError(
        t.teacher.lessonEditor.homework?.generateModal?.errors?.titleRequired ||
          "Homework title is required"
      );
      return;
    }

    if (numExercises < 1 || numExercises > 20) {
      setError(
        t.teacher.lessonEditor.homework?.generateModal?.errors
          ?.invalidExerciseCount ||
          "Number of exercises must be between 1 and 20"
      );
      return;
    }

    setError(null);
    setIsLoadingQuestions(true);

    // Parent component will handle the actual question generation
    // and provide questions via props
    try {
      // Wait for parent to generate questions
      // The useEffect will handle the transition when questions arrive
    } catch (err: any) {
      setError(
        err.message ||
          t.teacher.lessonEditor.homework?.generateModal?.errors
            ?.questionsGenerationFailed ||
          "Failed to generate questions"
      );
      setIsLoadingQuestions(false);
    }
  };

  const handleGenerate = async () => {
    // Check if all questions are answered
    const unansweredQuestions = externalQuestions.filter((q) => !answers[q.id]);
    if (unansweredQuestions.length > 0) {
      setError(
        t.teacher.lessonEditor.homework?.generateModal?.errors
          ?.allQuestionsRequired || "Please answer all questions"
      );
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      await onGenerate(title.trim(), numExercises, externalQuestions, answers);
      onOpenChange(false);
      // Reset form
      setTitle(defaultTitle);
      setNumExercises(5);
      setStep("input");
      setAnswers({});
    } catch (err: any) {
      setError(
        err.message ||
          t.teacher.lessonEditor.homework?.generateModal?.errors
            ?.generationFailed ||
          "Failed to generate homework"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    if (!isGenerating) {
      onOpenChange(false);
      setError(null);
      setStep("input");
      setAnswers({});
    }
  };

  const handleBack = () => {
    setStep("input");
    setAnswers({});
    setError(null);
  };

  const handleAnswerChange = (questionId: number, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleMultipleChoiceChange = (
    questionId: number,
    option: string,
    checked: boolean
  ) => {
    const currentAnswer = answers[questionId] || "";
    const currentOptions = currentAnswer ? currentAnswer.split(", ") : [];

    let newOptions: string[];
    if (checked) {
      newOptions = [...currentOptions, option];
    } else {
      newOptions = currentOptions.filter((o) => o !== option);
    }

    setAnswers((prev) => ({
      ...prev,
      [questionId]: newOptions.join(", "),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === "input"
              ? t.teacher.lessonEditor.homework?.generateModal?.title ||
                "Generate Homework"
              : t.teacher.lessonEditor.homework?.generateModal
                  ?.questionsTitle || "Clarifying Questions"}
          </DialogTitle>
          <DialogDescription>
            {step === "input"
              ? t.teacher.lessonEditor.homework?.generateModal?.description ||
                "Create homework based on the lesson content. The homework will contain various types of exercises."
              : t.teacher.lessonEditor.homework?.generateModal
                  ?.questionsDescription ||
                "Please answer these questions to help us generate the best homework for your students."}
          </DialogDescription>
        </DialogHeader>

        {isLoadingQuestions ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {t.teacher.lessonEditor.homework?.generateModal?.generatingQuestions || "Generating questions..."}
            </p>
          </div>
        ) : step === "input" ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="homework-title">
                {t.teacher.lessonEditor.homework?.generateModal?.titleLabel ||
                  "Homework Title"}
              </Label>
              <Input
                id="homework-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  t.teacher.lessonEditor.homework?.generateModal
                    ?.titlePlaceholder ||
                  "e.g., Temă: Celula - Structura și funcțiile"
                }
                disabled={isGenerating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="num-exercises">
                {t.teacher.lessonEditor.homework?.generateModal
                  ?.exercisesLabel || "Number of Exercises"}
              </Label>
              <Input
                id="num-exercises"
                type="number"
                min={1}
                max={20}
                value={numExercises}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10);
                  if (!isNaN(value) && value >= 1 && value <= 20) {
                    setNumExercises(value);
                  }
                }}
                disabled={isGenerating}
              />
              <p className="text-sm text-muted-foreground">
                {t.teacher.lessonEditor.homework?.generateModal
                  ?.exercisesHint || "Between 1 and 20 exercises"}
              </p>
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {externalQuestions.map((question) => (
              <div key={question.id} className="space-y-3">
                <Label className="text-base font-medium">
                  {question.question}
                </Label>

                {question.type === "single-choice" && (
                  <RadioGroup
                    value={answers[question.id] || ""}
                    onValueChange={(value) =>
                      handleAnswerChange(question.id, value)
                    }
                  >
                    {question.options.map((option) => (
                      <div
                        key={option}
                        className="flex items-center space-x-2"
                      >
                        <RadioGroupItem
                          value={option}
                          id={`q${question.id}-${option}`}
                        />
                        <Label
                          htmlFor={`q${question.id}-${option}`}
                          className="font-normal cursor-pointer"
                        >
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {question.type === "multiple-choice" && (
                  <div className="space-y-2">
                    {question.options.map((option) => {
                      const currentAnswer = answers[question.id] || "";
                      const currentOptions = currentAnswer
                        ? currentAnswer.split(", ")
                        : [];
                      const isChecked = currentOptions.includes(option);

                      return (
                        <div
                          key={option}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`q${question.id}-${option}`}
                            checked={isChecked}
                            onCheckedChange={(checked) =>
                              handleMultipleChoiceChange(
                                question.id,
                                option,
                                checked as boolean
                              )
                            }
                          />
                          <Label
                            htmlFor={`q${question.id}-${option}`}
                            className="font-normal cursor-pointer"
                          >
                            {option}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                )}

                {question.type === "yes-no" && (
                  <RadioGroup
                    value={answers[question.id] || ""}
                    onValueChange={(value) =>
                      handleAnswerChange(question.id, value)
                    }
                  >
                    {question.options.map((option) => (
                      <div
                        key={option}
                        className="flex items-center space-x-2"
                      >
                        <RadioGroupItem
                          value={option}
                          id={`q${question.id}-${option}`}
                        />
                        <Label
                          htmlFor={`q${question.id}-${option}`}
                          className="font-normal cursor-pointer"
                        >
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
              </div>
            ))}

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {!isLoadingQuestions && step === "questions" && (
            <Button variant="outline" onClick={handleBack} disabled={isGenerating}>
              {t.common.back}
            </Button>
          )}
          {!isLoadingQuestions && (
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isGenerating}
            >
              {t.common.cancel}
            </Button>
          )}
          {!isLoadingQuestions && (
            <Button
              onClick={
                step === "input" ? handleGenerateQuestions : handleGenerate
              }
              disabled={
                isGenerating ||
                (step === "input" && !title.trim()) ||
                (step === "questions" &&
                  externalQuestions.some((q) => !answers[q.id]))
              }
            >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {step === "input"
                  ? t.teacher.lessonEditor.homework?.generateModal
                      ?.generatingQuestions || "Generating..."
                  : t.teacher.lessonEditor.homework?.generateModal
                      ?.generating || "Generating..."}
              </>
            ) : step === "input" ? (
              t.common.next || "Next"
            ) : (
              t.teacher.lessonEditor.homework?.generateModal?.generateButton ||
              "Generate Homework"
            )}
          </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
