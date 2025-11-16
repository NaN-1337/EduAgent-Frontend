import { useState } from "react";
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

interface GenerateQuizModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (title: string, numQuestions: number) => Promise<void>;
  defaultTitle?: string;
}

export function GenerateQuizModal({
  open,
  onOpenChange,
  onGenerate,
  defaultTitle = "",
}: GenerateQuizModalProps) {
  const { t } = useLanguage();
  const [title, setTitle] = useState(defaultTitle);
  const [numQuestions, setNumQuestions] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!title.trim()) {
      setError(t.teacher.lessonEditor.quiz?.generateModal?.errors?.titleRequired || "Quiz title is required");
      return;
    }

    if (numQuestions < 1 || numQuestions > 50) {
      setError(t.teacher.lessonEditor.quiz?.generateModal?.errors?.invalidQuestionCount || "Number of questions must be between 1 and 50");
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      await onGenerate(title.trim(), numQuestions);
      onOpenChange(false);
      // Reset form
      setTitle(defaultTitle);
      setNumQuestions(10);
    } catch (err: any) {
      setError(err.message || t.teacher.lessonEditor.quiz?.generateModal?.errors?.generationFailed || "Failed to generate quiz");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    if (!isGenerating) {
      onOpenChange(false);
      setError(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {t.teacher.lessonEditor.quiz?.generateModal?.title || "Generate Quiz"}
          </DialogTitle>
          <DialogDescription>
            {t.teacher.lessonEditor.quiz?.generateModal?.description || 
             "Create a quiz based on the lesson content. The quiz will contain multiple-choice questions."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="quiz-title">
              {t.teacher.lessonEditor.quiz?.generateModal?.titleLabel || "Quiz Title"}
            </Label>
            <Input
              id="quiz-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.teacher.lessonEditor.quiz?.generateModal?.titlePlaceholder || "e.g., Test: Celula - Structura și funcțiile"}
              disabled={isGenerating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="num-questions">
              {t.teacher.lessonEditor.quiz?.generateModal?.questionsLabel || "Number of Questions"}
            </Label>
            <Input
              id="num-questions"
              type="number"
              min={1}
              max={50}
              value={numQuestions}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                if (!isNaN(value) && value >= 1 && value <= 50) {
                  setNumQuestions(value);
                }
              }}
              disabled={isGenerating}
            />
            <p className="text-sm text-muted-foreground">
              {t.teacher.lessonEditor.quiz?.generateModal?.questionsHint || "Between 1 and 50 questions"}
            </p>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isGenerating}
          >
            {t.common.cancel}
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !title.trim()}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t.teacher.lessonEditor.quiz?.generateModal?.generating || "Generating..."}
              </>
            ) : (
              t.teacher.lessonEditor.quiz?.generateModal?.generateButton || "Generate Quiz"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

