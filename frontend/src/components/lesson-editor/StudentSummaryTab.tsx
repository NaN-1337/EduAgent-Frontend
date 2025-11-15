import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, FileText, Heading } from "lucide-react";
import { cn } from "@/lib/utils";

interface IssueMarker {
  id: string;
  position: number;
  severity: "warning" | "critical";
  message: string;
}

interface StudentSummaryTabProps {
  content: string;
  onChange: (content: string) => void;
  issues?: IssueMarker[];
}

export function StudentSummaryTab({ content, onChange, issues = [] }: StudentSummaryTabProps) {
  const [selectedIssue, setSelectedIssue] = useState<IssueMarker | null>(null);

  // Calculate reading metrics
  const wordCount = content.trim().split(/\s+/).filter((w) => w.length > 0).length;
  const paragraphCount = content.split(/\n\n/).filter((p) => p.trim().length > 0).length;
  const headingCount = (content.match(/^#+\s/gm) || []).length;
  const readingTime = Math.ceil(wordCount / 200); // Average reading speed: 200 words/min

  // Determine reading level (simplified)
  const readingLevel = wordCount < 100 ? "A2 / Grade 3-4" : wordCount < 200 ? "B1 / Grade 5-6" : "B2 / Grade 7-8";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Editor */}
      <div className="lg:col-span-2">
        <Card className="border-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Student Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Textarea
                value={content}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Enter the student-facing summary here..."
                className="min-h-[500px] text-base leading-relaxed font-sans resize-none"
                rows={20}
              />
              {/* Issue markers overlay (simplified - in real app, would be positioned precisely) */}
              {issues.length > 0 && (
                <div className="absolute top-2 right-2 flex gap-1">
                  {issues.map((issue) => (
                    <button
                      key={issue.id}
                      onClick={() => setSelectedIssue(issue)}
                      className={cn(
                        "p-1 rounded hover:bg-accent transition-colors",
                        issue.severity === "critical" ? "text-red-600" : "text-yellow-600"
                      )}
                      aria-label={`Issue: ${issue.message}`}
                    >
                      <AlertTriangle className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedIssue && (
              <div className="mt-4 p-3 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle
                    className={cn(
                      "h-4 w-4",
                      selectedIssue.severity === "critical" ? "text-red-600" : "text-yellow-600"
                    )}
                  />
                  <Badge
                    variant={selectedIssue.severity === "critical" ? "destructive" : "secondary"}
                    className="text-xs"
                  >
                    {selectedIssue.severity === "critical" ? "Critical" : "Warning"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{selectedIssue.message}</p>
                <button
                  onClick={() => setSelectedIssue(null)}
                  className="mt-2 text-xs text-primary hover:underline"
                >
                  Dismiss
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right: Analysis Panel */}
      <div className="lg:col-span-1">
        <Card className="border-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span className="text-sm font-medium">Reading level</span>
              </div>
              <p className="text-base font-semibold">{readingLevel}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">Estimated reading time</span>
              </div>
              <p className="text-base font-semibold">{readingTime} min</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span className="text-sm font-medium">Paragraph count</span>
              </div>
              <p className="text-base font-semibold">{paragraphCount}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Heading className="h-4 w-4" />
                <span className="text-sm font-medium">Headings used</span>
              </div>
              <p className="text-base font-semibold">{headingCount}</p>
            </div>

            {issues.length > 0 && (
              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">Fact-check issues</span>
                </div>
                <p className="text-base font-semibold text-yellow-600">{issues.length} flagged</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

