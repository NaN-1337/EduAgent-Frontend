import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { QuizQuestion } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface QuizInteractiveProps {
  questions: QuizQuestion[];
  title: string;
  onSubmit: (answers: Record<string, string>) => Promise<void>;
  isSubmitting?: boolean;
}

export function QuizInteractive({
  questions,
  title,
  onSubmit,
  isSubmitting = false,
}: QuizInteractiveProps) {
  const { t } = useLanguage();
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleAnswerChange = (questionId: string, answerId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answerId,
    }));
  };

  const handleSubmit = async () => {
    // Check if all questions are answered
    const allAnswered = questions.every((q) => answers[q.id]);
    if (!allAnswered) {
      alert(t.student.lessonPlayer.quiz?.errors?.notAllAnswered || "Please answer all questions before submitting.");
      return;
    }

    await onSubmit(answers);
  };

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questions.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t.student.lessonPlayer.quiz?.answeredCount?.(answeredCount, totalQuestions) || `Answered: ${answeredCount} / ${totalQuestions}`}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {questions.map((question, index) => (
          <Card key={question.id} className="border-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-start gap-2">
                <span className="text-muted-foreground">#{index + 1}</span>
                <span>{question.text}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={answers[question.id] || ""}
                onValueChange={(value) => handleAnswerChange(question.id, value)}
                disabled={isSubmitting}
              >
                <div className="space-y-3">
                  {question.options.map((option) => (
                    <div
                      key={option.id}
                      className={cn(
                        "flex items-center space-x-3 p-3 rounded-lg border-2 transition-colors",
                        answers[question.id] === option.id
                          ? "border-primary bg-primary/5"
                          : "border-muted hover:border-primary/50"
                      )}
                    >
                      <RadioGroupItem value={option.id} id={`${question.id}-${option.id}`} />
                      <Label
                        htmlFor={`${question.id}-${option.id}`}
                        className="flex-1 cursor-pointer font-normal"
                      >
                        <span className="font-medium mr-2">{option.id.toUpperCase()}.</span>
                        {option.text}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || answeredCount < totalQuestions}
          size="lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t.student.lessonPlayer.quiz?.submitButtonLoading || "Submitting..."}
            </>
          ) : (
            t.student.lessonPlayer.quiz?.submitButton || "Submit Quiz"
          )}
        </Button>
      </div>
    </div>
  );
}

