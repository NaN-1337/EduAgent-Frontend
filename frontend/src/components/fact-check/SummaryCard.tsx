import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FactCheckStats {
  claimsVerified: number;
  totalClaims: number;
  outdatedFacts: number;
  unsupportedStatements: number;
}

interface SummaryCardProps {
  status: "High confidence" | "Needs review" | "Critical issues found";
  stats: FactCheckStats;
}

export function SummaryCard({ status, stats }: SummaryCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "High confidence":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800";
      case "Needs review":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800";
      case "Critical issues found":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800";
      default:
        return "";
    }
  };

  return (
    <Card className="border-2 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Summary</CardTitle>
          <Badge className={cn(getStatusColor(status), "border")}>
            {status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600" aria-hidden="true" />
            <span className="font-medium">Claims verified</span>
          </div>
          <span className="text-lg font-semibold">
            {stats.claimsVerified}/{stats.totalClaims}
          </span>
        </div>

        <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600" aria-hidden="true" />
            <span className="font-medium">Potentially outdated facts</span>
          </div>
          <span className="text-lg font-semibold">{stats.outdatedFacts}</span>
        </div>

        <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" aria-hidden="true" />
            <span className="font-medium">Unsupported statements</span>
          </div>
          <span className="text-lg font-semibold">{stats.unsupportedStatements}</span>
        </div>
      </CardContent>
    </Card>
  );
}

