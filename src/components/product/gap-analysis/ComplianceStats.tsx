
import { GapAnalysisItem } from "@/types/client";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertTriangle, XCircle, Ban } from "lucide-react";
import { calculateOverallCompliance } from "@/utils/statusSyncUtils";
import { useTranslation } from "@/hooks/useTranslation";

interface ComplianceStatsProps {
  items: GapAnalysisItem[];
}

export function ComplianceStats({ items }: ComplianceStatsProps) {
  const { lang } = useTranslation();

  // Calculate status counts
  const compliant = items.filter(item => item.status === "compliant").length;
  const partial = items.filter(item => item.status === "partially_compliant").length;
  const nonCompliant = items.filter(item => item.status === "non_compliant").length;
  const notApplicable = items.filter(item => item.status === "not_applicable").length;

  // Calculate total excluding not applicable items
  const totalExcludingNA = items.length - notApplicable;

  // Calculate completion percentage using our utility function
  const completionPercentage = calculateOverallCompliance(items);

  return (
    <div className="mb-4 max-w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium">{lang('gapAnalysis.stats.complianceProgress')}</span>
        <span className="text-sm font-bold">{completionPercentage}%</span>
      </div>

      <Progress value={completionPercentage} className="h-2 mb-2 max-w-full" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs max-w-full">
        <div className="flex items-center gap-1 min-w-0">
          <CheckCircle className="h-3 w-3 text-success flex-shrink-0" />
          <span className="truncate">{lang('gapAnalysis.stats.closed')} {compliant}</span>
        </div>
        <div className="flex items-center gap-1 min-w-0">
          <AlertTriangle className="h-3 w-3 text-warning flex-shrink-0" />
          <span className="truncate">{lang('gapAnalysis.stats.partial')} {partial}</span>
        </div>
        <div className="flex items-center gap-1 min-w-0">
          <XCircle className="h-3 w-3 text-destructive flex-shrink-0" />
          <span className="truncate">{lang('gapAnalysis.stats.open')} {nonCompliant}</span>
        </div>
        <div className="flex items-center gap-1 min-w-0">
          <Ban className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          <span className="truncate">{lang('gapAnalysis.stats.notApplicable')} {notApplicable}</span>
        </div>
      </div>
    </div>
  );
}
