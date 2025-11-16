import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { Question } from "@/lib/api";

interface Step2QuestionsData {
  questions: Question[];
  answers: Record<string, string>; // question ID -> selected answer
  customAnswers: Record<string, string>; // question ID -> custom text for "Altele"
}

interface Step2QuestionsProps {
  data: Step2QuestionsData;
  onChange: (data: Partial<Step2QuestionsData>) => void;
}

export function Step2Questions({
  data,
  onChange,
}: Step2QuestionsProps) {
  const { t } = useLanguage();

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

