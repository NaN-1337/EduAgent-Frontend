import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";
import { QuizQuestion } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface QuizSubmissionAnswer {
  questionId: string;
  selectedAnswerId: string;
  correctAnswerId: string;
  isCorrect: boolean;
}

interface QuizResultsProps {
  questions: QuizQuestion[];
  title: string;
  answers: QuizSubmissionAnswer[];
  correctAnswers: number;
  incorrectAnswers: number;
  totalQuestions: number;
}

export function QuizResults({
  questions,
  title,
  answers,
  correctAnswers,
  incorrectAnswers,
  totalQuestions,
}: QuizResultsProps) {
  const { t } = useLanguage();

  const percentage = Math.round((correctAnswers / totalQuestions) * 100);
  const getAnswerForQuestion = (questionId: string) => {
    return answers.find((a) => a.questionId === questionId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t.student.lessonPlayer.quiz?.results?.completed || "Quiz completed"}
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {t.student.lessonPlayer.quiz?.results?.completed || "Completed"}
        </Badge>
      </div>

      {/* Score Summary */}
      <Card className="border-2 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {t.student.lessonPlayer.quiz?.results?.score || "Your Score"}
              </p>
              <p className="text-3xl font-bold mt-1">
                {correctAnswers} / {totalQuestions}
              </p>
              <p className="text-lg text-muted-foreground mt-1">
                {percentage}%
              </p>
            </div>
            <div className="text-right space-y-2">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-semibold">
                  {correctAnswers} {t.student.lessonPlayer.quiz?.results?.correct || "Correct"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-red-600">
                <XCircle className="h-5 w-5" />
                <span className="font-semibold">
                  {incorrectAnswers} {t.student.lessonPlayer.quiz?.results?.incorrect || "Incorrect"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions with Results */}
      <div className="space-y-6">
        {questions.map((question, index) => {
          const submission = getAnswerForQuestion(question.id);
          const isCorrect = submission?.isCorrect ?? false;
          const selectedOption = question.options.find(
            (opt) => opt.id === submission?.selectedAnswerId
          );
          const correctOption = question.options.find(
            (opt) => opt.id === question.correctAnswerId
          );

          return (
            <Card
              key={question.id}
              className={cn(
                "border-2",
                isCorrect ? "border-green-500/50" : "border-red-500/50"
              )}
            >
              <CardHeader>
                <CardTitle className="text-lg flex items-start gap-2">
                  <span className="text-muted-foreground">#{index + 1}</span>
                  <span>{question.text}</span>
                  {isCorrect ? (
                    <Badge className="ml-auto bg-green-600">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {t.student.lessonPlayer.quiz?.results?.correct || "Correct"}
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="ml-auto">
                      <XCircle className="h-3 w-3 mr-1" />
                      {t.student.lessonPlayer.quiz?.results?.incorrect || "Incorrect"}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {question.options.map((option) => {
                    const isSelected = option.id === submission?.selectedAnswerId;
                    const isCorrectAnswer = option.id === question.correctAnswerId;
                    const showAsIncorrect = isSelected && !isCorrect;

                    return (
                      <div
                        key={option.id}
                        className={cn(
                          "p-3 rounded-lg border-2 flex items-center gap-3",
                          isCorrectAnswer
                            ? "bg-green-50 dark:bg-green-950 border-green-500"
                            : showAsIncorrect
                            ? "bg-red-50 dark:bg-red-950 border-red-500"
                            : "bg-muted/50 border-muted"
                        )}
                      >
                        {isCorrectAnswer ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                        ) : showAsIncorrect ? (
                          <XCircle className="h-5 w-5 text-red-600 shrink-0" />
                        ) : (
                          <div className="h-5 w-5 shrink-0" />
                        )}
                        <span className="font-medium mr-2">{option.id.toUpperCase()}.</span>
                        <span
                          className={cn(
                            (isCorrectAnswer || showAsIncorrect) && "font-semibold"
                          )}
                        >
                          {option.text}
                        </span>
                        {isSelected && (
                          <Badge
                            variant="outline"
                            className={cn(
                              "ml-auto",
                              isCorrect
                                ? "bg-green-100 dark:bg-green-900"
                                : "bg-red-100 dark:bg-red-900"
                            )}
                          >
                            {t.student.lessonPlayer.quiz?.results?.yourAnswer || "Your Answer"}
                          </Badge>
                        )}
                        {isCorrectAnswer && !isSelected && (
                          <Badge variant="outline" className="ml-auto bg-green-100 dark:bg-green-900">
                            {t.student.lessonPlayer.quiz?.results?.correctAnswer || "Correct Answer"}
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

