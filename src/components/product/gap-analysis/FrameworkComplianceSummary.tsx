
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { GapAnalysisItem } from "@/types/client";
import { calculateOverallCompliance } from "@/utils/statusSyncUtils";
import { useTranslation } from "@/hooks/useTranslation";

export interface FrameworkComplianceSummaryProps {
  title: string;
  items: GapAnalysisItem[];
  productId?: string;
  companyId?: string;
}

export function FrameworkComplianceSummary({
  title,
  items,
  productId,
  companyId
}: FrameworkComplianceSummaryProps) {
  const { lang } = useTranslation();
  const completionPercentage = calculateOverallCompliance(items);
  
  const getRouteUrl = () => {
    if (productId) {
      return `/app/product/${productId}/gap-analysis`;
    } else if (companyId) {
      if (title === "ISO 13485") {
        return `/app/company/${encodeURIComponent(companyId)}/iso-13485`;
      } else if (title.includes("MDR")) {
        return `/app/company/${encodeURIComponent(companyId)}/mdr-annex-i`;
      }
    }
    return "#";
  };
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium text-sm">{title}</h3>
          <span className="text-sm font-bold">{completionPercentage}%</span>
        </div>
        <Progress value={completionPercentage} className="h-2" />
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-end">
        <Button variant="link" size="sm" className="px-0" asChild>
          <Link to={getRouteUrl()}>
            {lang('gapAnalysis.frameworkSummary.viewDetails')} <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
