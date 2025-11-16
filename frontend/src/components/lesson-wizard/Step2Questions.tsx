import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Loader2, AlertCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { generateQuestions, Question } from "@/lib/api";
import { teachingFieldToStorage } from "@/lib/dataConverters";
import { gradeToStorage } from "@/lib/dataConverters";

interface Step2QuestionsData {
  questions: Question[];
  answers: Record<string, string>; // question ID -> selected answer
  customAnswers: Record<string, string>; // question ID -> custom text for "Altele"
}

interface Step2QuestionsProps {
  title: string;
  subject: string;
  grade: string;
  data: Step2QuestionsData;
  onChange: (data: Partial<Step2QuestionsData>) => void;
  onQuestionsLoaded?: (questions: Question[]) => void;
}

export function Step2Questions({
  title,
  subject,
  grade,
  data,
  onChange,
  onQuestionsLoaded,
}: Step2QuestionsProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load questions when component mounts
  useEffect(() => {
    const loadQuestions = async () => {
      if (data.questions.length > 0) {
        // Questions already loaded
        return;
      }

      if (!title || !subject || !grade) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Convert grade to number and subject to storage format (lowercase)
        const gradeNum = gradeToStorage(grade);
        const subjectStorage = teachingFieldToStorage(subject);
        
        if (gradeNum === null || !subjectStorage) {
          throw new Error("Invalid grade or subject");
        }

        const questions = await generateQuestions({
          title,
          subject: subjectStorage, // Use storage format (e.g., "biologie")
          grade: gradeNum,
        });

        onChange({ questions });
        if (onQuestionsLoaded) {
          onQuestionsLoaded(questions);
        }
      } catch (err: any) {
        console.error("Error loading questions:", err);
        setError(err.message || "Failed to load questions");
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, subject, grade]); // Only run when these change

  const handleAnswerChange = (questionId: number, answer: string) => {
    const newAnswers = { ...data.answers, [questionId.toString()]: answer };
    onChange({ answers: newAnswers });
  };

  const handleCustomAnswerChange = (questionId: number, customText: string) => {
    const newCustomAnswers = { ...data.customAnswers, [questionId.toString()]: customText };
    onChange({ customAnswers: newCustomAnswers });
    // Also update the answer to use the custom text
    handleAnswerChange(questionId, customText);
  };

  const isQuestionAnswered = (questionId: number): boolean => {
    return !!data.answers[questionId.toString()];
  };

  const allQuestionsAnswered = data.questions.every((q) => isQuestionAnswered(q.id));

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="border-2 shadow-sm">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">
                {t.teacher.newLesson.step2.loadingQuestions || "Generating questions..."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="border-2 shadow-sm border-destructive">
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
              <p className="text-sm text-destructive">{error}</p>
              <Button
                variant="outline"
                onClick={() => {
                  setError(null);
                  onChange({ questions: [] });
                }}
              >
                {t.common.retry || "Retry"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (data.questions.length === 0) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="border-2 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">
            {t.teacher.newLesson.step2.questionsTitle || "Clarifying Questions"}
          </CardTitle>
          <CardDescription>
            {t.teacher.newLesson.step2.questionsDescription ||
              "Please answer these questions to help us generate the best lesson content for your students."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {data.questions.map((question) => {
            const selectedAnswer = data.answers[question.id.toString()];
            const showCustomInput = selectedAnswer === "Altele" || selectedAnswer === "Other";

            return (
              <div key={question.id} className="space-y-3">
                <Label className="text-base font-semibold">
                  {question.id}. {question.question}
                </Label>
                <RadioGroup
                  value={selectedAnswer || ""}
                  onValueChange={(value) => handleAnswerChange(question.id, value)}
                >
                  <div className="space-y-2">
                    {question.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`q${question.id}-opt${index}`} />
                        <Label
                          htmlFor={`q${question.id}-opt${index}`}
                          className="font-normal cursor-pointer"
                        >
                          {option}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
                {showCustomInput && (
                  <div className="mt-3">
                    <Input
                      placeholder={t.teacher.newLesson.step2.customAnswerPlaceholder || "Enter your answer..."}
                      value={data.customAnswers[question.id.toString()] || ""}
                      onChange={(e) =>
                        handleCustomAnswerChange(question.id, e.target.value)
                      }
                      className="max-w-md"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {allQuestionsAnswered && (
        <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
          <p className="text-sm text-muted-foreground text-center">
            {t.teacher.newLesson.step2.allQuestionsAnswered ||
              "All questions answered! You can proceed to the next step."}
          </p>
        </div>
      )}
    </div>
  );
}

