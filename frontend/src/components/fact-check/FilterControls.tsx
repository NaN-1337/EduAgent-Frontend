import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type FilterType = "all" | "warnings" | "critical";

interface FilterControlsProps {
  selectedFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  warningCount: number;
  criticalCount: number;
}

export function FilterControls({
  selectedFilter,
  onFilterChange,
  warningCount,
  criticalCount,
}: FilterControlsProps) {
  const filters = [
    { id: "all" as FilterType, label: "All", count: warningCount + criticalCount },
    { id: "warnings" as FilterType, label: "Warnings only", count: warningCount },
    { id: "critical" as FilterType, label: "Critical only", count: criticalCount },
  ];

  return (
    <Card className="border-2 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Filters</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => onFilterChange(filter.id)}
              className={cn(
                "px-4 py-2 rounded-lg border-2 transition-colors text-sm font-medium",
                selectedFilter === filter.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-accent border-border"
              )}
              aria-pressed={selectedFilter === filter.id}
            >
              {filter.label}
              {filter.count > 0 && (
                <Badge
                  variant="secondary"
                  className={cn(
                    "ml-2",
                    selectedFilter === filter.id && "bg-primary-foreground/20"
                  )}
                >
                  {filter.count}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

