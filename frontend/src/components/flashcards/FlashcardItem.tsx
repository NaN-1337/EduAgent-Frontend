import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FlashcardItemProps {
  question: string;
  answer: string;
  index: number;
}

export function FlashcardItem({ question, answer, index }: FlashcardItemProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="perspective-1000 w-full h-64">
      <div
        className={cn(
          "relative w-full h-full transition-transform duration-600 transform-style-3d cursor-pointer",
          isFlipped && "rotate-y-180"
        )}
        onClick={() => setIsFlipped(!isFlipped)}
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Front of card - Question */}
        <Card
          className={cn(
            "absolute w-full h-full backface-hidden border-2 border-primary/40 hover:border-primary/60 transition-colors",
            "flex items-center justify-center"
          )}
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          <CardContent className="flex flex-col items-center justify-center h-full p-6">
            <div className="text-sm text-muted-foreground mb-4">
              Carte #{index + 1}
            </div>
            <div className="text-lg font-medium text-center mb-6">
              {question}
            </div>
            <div className="text-xs text-muted-foreground">
              Apasă pentru răspuns
            </div>
          </CardContent>
        </Card>

        {/* Back of card - Answer */}
        <Card
          className={cn(
            "absolute w-full h-full backface-hidden border-2 border-green-500/40 bg-green-50/50 dark:bg-green-950/20",
            "flex items-center justify-center"
          )}
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <CardContent className="flex flex-col items-center justify-center h-full p-6">
            <div className="text-sm text-green-600 dark:text-green-400 mb-4">
              Răspuns
            </div>
            <div className="text-lg text-center">
              {answer}
            </div>
            <div className="text-xs text-muted-foreground mt-6">
              Apasă pentru întrebare
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
