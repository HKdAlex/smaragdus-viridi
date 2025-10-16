import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

import { Badge } from "@/shared/components/ui/badge";

interface DataComparisonCardProps {
  label: string;
  manualValue: string | number | null;
  aiValue: string | number | null;
  confidence?: number;
}

/**
 * Component to display side-by-side comparison of manual vs AI-extracted data
 * Shows which data source is being used and the confidence level
 */
export function DataComparisonCard({
  label,
  manualValue,
  aiValue,
  confidence,
}: DataComparisonCardProps) {
  const hasManual = manualValue !== null && manualValue !== undefined;
  const hasAI = aiValue !== null && aiValue !== undefined;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          {label}
          {confidence && (
            <Badge variant="outline" className="text-xs">
              {(confidence * 100).toFixed(0)}%
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {hasManual && (
          <div className="flex items-center gap-2">
            <Badge variant="default" className="text-xs">
              Manual
            </Badge>
            <span className="font-semibold">{manualValue}</span>
          </div>
        )}
        {hasAI && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              AI
            </Badge>
            <span
              className={hasManual ? "text-muted-foreground" : "font-semibold"}
            >
              {aiValue}
            </span>
          </div>
        )}
        {!hasManual && !hasAI && (
          <span className="text-sm text-muted-foreground italic">No data</span>
        )}
      </CardContent>
    </Card>
  );
}
