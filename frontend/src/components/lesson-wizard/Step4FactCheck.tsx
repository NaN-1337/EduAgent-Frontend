import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, AlertCircle, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface FlaggedIssue {
  id: string;
  claim: string;
  severity: "warning" | "critical";
}

interface Step4FactCheckProps {
  onContinue: () => void;
  onRegenerate?: () => void;
  onBack?: () => void;
}

// Mock data - replace with actual fact-check results
const mockFactCheckData = {
  status: "High confidence" as "High confidence" | "Needs review" | "Check critical issues",
  claimsVerified: 45,
  totalClaims: 48,
  outdatedFacts: 2,
  unsupportedStatements: 1,
  flaggedIssues: [
    {
      id: "1",
      claim: "Photosynthesis occurs only during daylight hours",
      severity: "warning" as const,
    },
    {
      id: "2",
      claim: "Plants produce oxygen as a byproduct",
      severity: "warning" as const,
    },
    {
      id: "3",
      claim: "Chlorophyll is the only pigment involved in photosynthesis",
      severity: "critical" as const,
    },
  ] as FlaggedIssue[],
};

export function Step4FactCheck({ onContinue, onRegenerate, onBack }: Step4FactCheckProps) {
  const { t } = useLanguage();
  const data = mockFactCheckData;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "High confidence":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800";
      case "Needs review":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800";
      case "Check critical issues":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800";
      default:
        return "";
    }
  };

  const getSeverityIcon = (severity: "warning" | "critical") => {
    return severity === "critical" ? (
      <AlertCircle className="h-4 w-4" />
    ) : (
      <AlertTriangle className="h-4 w-4" />
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="border-2 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">{t.teacher.newLesson.step4.title}</CardTitle>
          <CardDescription>
            {t.teacher.newLesson.step4.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Overview */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-lg font-semibold">Status</h3>
                  <Badge className={cn(getStatusColor(data.status), "border")}>
                    {data.status}
                  </Badge>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Claims verified</span>
                  </div>
                  <span className="text-lg font-semibold">
                    {data.claimsVerified}/{data.totalClaims}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <span className="font-medium">Potentially outdated facts</span>
                  </div>
                  <span className="text-lg font-semibold">{data.outdatedFacts}</span>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <span className="font-medium">Unsupported statements</span>
                  </div>
                  <span className="text-lg font-semibold">{data.unsupportedStatements}</span>
                </div>
              </div>
            </div>

            {/* Right: Flagged issues */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Top flagged issues</h3>
              {data.flaggedIssues.length === 0 ? (
                <p className="text-sm text-muted-foreground">No issues found!</p>
              ) : (
                <div className="space-y-3">
                  {data.flaggedIssues.slice(0, 3).map((issue) => (
                    <div
                      key={issue.id}
                      className="p-4 border rounded-lg bg-muted/50"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "shrink-0 mt-0.5",
                            issue.severity === "critical"
                              ? "text-red-600"
                              : "text-yellow-600"
                          )}
                        >
                          {getSeverityIcon(issue.severity)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium mb-2">{issue.claim}</p>
                          <Badge
                            variant={issue.severity === "critical" ? "destructive" : "secondary"}
                            className="text-xs"
                          >
                            {issue.severity === "critical" ? "Critical" : "Warning"}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        You will see this highlighted in the editor.
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <Button
                variant="outline"
                onClick={onBack || (() => window.history.back())}
                className="w-full sm:w-auto flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                {t.teacher.newLesson.step4.back}
              </Button>
              <div className="flex flex-col sm:flex-row gap-4">
                {onRegenerate && (
                  <Button
                    variant="outline"
                    onClick={onRegenerate}
                    className="w-full sm:w-auto"
                  >
                    {t.teacher.newLesson.step4.regenerate}
                  </Button>
                )}
                <Button
                  onClick={onContinue}
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  {t.teacher.newLesson.step4.continue}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

