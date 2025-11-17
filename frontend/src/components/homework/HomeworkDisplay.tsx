import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

interface HomeworkDisplayProps {
  homeworkHtml: string;
  title?: string;
}

export function HomeworkDisplay({ homeworkHtml, title }: HomeworkDisplayProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <CardTitle>{title || "Temă pentru acasă"}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div
          className="prose prose-sm max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: homeworkHtml }}
        />
      </CardContent>
    </Card>
  );
}
