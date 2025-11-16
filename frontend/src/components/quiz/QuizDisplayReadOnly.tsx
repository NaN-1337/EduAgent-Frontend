import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";
import { QuizQuestion } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface QuizDisplayReadOnlyProps {
  questions: QuizQuestion[];
  title: string;
  totalQuestions: number;
}

export function QuizDisplayReadOnly({
  questions,
  title,
  totalQuestions,
}: QuizDisplayReadOnlyProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t.teacher.lessonEditor.quiz?.readOnly?.totalQuestions || "Total questions"}: {totalQuestions}
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {t.teacher.lessonEditor.quiz?.readOnly?.readOnly || "Read Only"}
        </Badge>
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
              <div className="space-y-2">
                {question.options.map((option) => {
                  const isCorrect = option.id === question.correctAnswerId;
                  return (
                    <div
                      key={option.id}
                      className={cn(
                        "p-3 rounded-lg border-2 flex items-center gap-3",
                        isCorrect
                          ? "bg-green-50 dark:bg-green-950 border-green-500"
                          : "bg-muted/50 border-muted"
                      )}
                    >
                      {isCorrect ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                      ) : (
                        <div className="h-5 w-5 shrink-0" />
                      )}
                      <span className="font-medium mr-2">{option.id.toUpperCase()}.</span>
                      <span className={cn(isCorrect && "font-semibold")}>
                        {option.text}
                      </span>
                      {isCorrect && (
                        <Badge variant="outline" className="ml-auto bg-green-100 dark:bg-green-900">
                          {t.teacher.lessonEditor.quiz?.readOnly?.correct || "Correct"}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

