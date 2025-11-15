import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

interface Step5ReviewProps {
  lessonId: string;
  onOpenEditor: () => void;
}

export function Step5Review({ lessonId, onOpenEditor }: Step5ReviewProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <Card className="border-2 shadow-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4">
              <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <CardTitle className="text-2xl font-semibold">Your lesson draft is ready</CardTitle>
          <CardDescription className="text-base mt-2">
            You can still edit content and run fact-check details on the next screen.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button onClick={onOpenEditor} size="lg" className="text-base px-8">
            Open in editor
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

