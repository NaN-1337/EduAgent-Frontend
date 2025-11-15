import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, AlertCircle, ChevronDown, ChevronUp, Loader2, Check, Edit } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FlaggedClaim {
  id: string;
  claim: string;
  fullText: string;
  severity: "warning" | "critical";
  location: {
    section: "studentSummary" | "slides" | "teacherGuidelines";
    slideNumber?: number;
    position: number;
  };
  reason: string;
  sources: Array<{
    title: string;
    url?: string;
  }>;
}

interface ClaimItemProps {
  claim: FlaggedClaim;
  isSelected: boolean;
  onSelect: () => void;
  onFix: () => void;
  onAccept: () => void;
  onEdit: () => void;
  isFixing?: boolean;
}

export function ClaimItem({
  claim,
  isSelected,
  onSelect,
  onFix,
  onAccept,
  onEdit,
  isFixing = false,
}: ClaimItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getSeverityIcon = () => {
    return claim.severity === "critical" ? (
      <AlertCircle className="h-4 w-4 text-red-600" aria-hidden="true" />
    ) : (
      <AlertTriangle className="h-4 w-4 text-yellow-600" aria-hidden="true" />
    );
  };

  const getLocationLabel = () => {
    if (claim.location.section === "slides" && claim.location.slideNumber) {
      return `Slide ${claim.location.slideNumber}`;
    }
    const labels = {
      studentSummary: "Summary",
      slides: "Slides",
      teacherGuidelines: "Teacher guide",
    };
    return labels[claim.location.section];
  };

  return (
    <div
      className={cn(
        "border-2 rounded-lg transition-all cursor-pointer",
        isSelected
          ? "border-primary bg-primary/5 shadow-md"
          : "border-border hover:border-primary/50"
      )}
    >
      <div
        className="p-4"
        onClick={() => {
          onSelect();
          setIsExpanded(!isExpanded);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect();
            setIsExpanded(!isExpanded);
          }
        }}
        aria-expanded={isExpanded}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0">{getSeverityIcon()}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge
                variant={claim.severity === "critical" ? "destructive" : "secondary"}
                className="text-xs"
              >
                {claim.severity === "critical" ? "Critical" : "Warning"}
              </Badge>
              <span className="text-xs text-muted-foreground">{getLocationLabel()}</span>
            </div>
            <p className="text-sm font-medium line-clamp-2">{claim.claim}</p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="shrink-0 text-muted-foreground hover:text-foreground"
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 border-t pt-4 space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Full claim:</p>
            <p className="text-sm text-muted-foreground">{claim.fullText}</p>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Reason:</p>
            <p className="text-sm text-muted-foreground">{claim.reason}</p>
          </div>

          {claim.sources.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Sources consulted:</p>
              <ul className="space-y-1">
                {claim.sources.map((source, index) => (
                  <li key={index} className="text-sm text-muted-foreground">
                    {source.url ? (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {source.title}
                      </a>
                    ) : (
                      source.title
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onFix();
              }}
              disabled={isFixing}
              size="sm"
              className="flex-1 sm:flex-none"
            >
              {isFixing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fixing…
                </>
              ) : (
                "Ask EduAgent to fix"
              )}
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onAccept();
              }}
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none"
            >
              <Check className="mr-2 h-4 w-4" />
              Mark as accepted
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit manually
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

