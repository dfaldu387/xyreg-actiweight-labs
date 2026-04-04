
import { Product, GapAnalysisItem } from "@/types/client";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChartBar, Check, X, Ban, ChevronRight } from "lucide-react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

interface RegulatoryGapAnalysisProps {
  product: Product | null | undefined;
}

interface FrameworkStats {
  name: string;
  totalItems: number;
  compliantItems: number;
  nonCompliantItems: number;
  naItems: number;
  complianceRate: number;
}

export function RegulatoryGapAnalysisSection({ product }: RegulatoryGapAnalysisProps) {
  const navigate = useNavigate();

  if (!product) return null;

  // Get gap analysis items
  const gapItems = product.gapAnalysis || [];

  // Calculate overall stats using the new grouping
  const totalItems = gapItems.length;
  const compliantItems = gapItems.filter(item => item.status === "compliant").length;
  const nonCompliantItems = gapItems.filter(item => 
    item.status === "non_compliant" || item.status === "partially_compliant"
  ).length;
  const naItems = gapItems.filter(item => item.status === "not_applicable").length;

  // Calculate compliance rate (excluding N/A items)
  const totalExcludingNA = totalItems - naItems;
  const overallComplianceRate = totalExcludingNA > 0 
    ? Math.round((compliantItems / totalExcludingNA) * 100) 
    : 0;

  // Group items by framework and calculate stats
  const frameworkStats: FrameworkStats[] = useMemo(() => {
    const frameworks = [
      "MDR", 
      "MDR Annex II", 
      "MDR Annex III", 
      "ISO 14971", 
      "ISO 13485"
    ];
    
    return frameworks.map(framework => {
      const frameworkItems = gapItems.filter(item => {
        if (framework === "MDR") {
          return item.framework === "MDR" && item.clauseId.startsWith("MDR_Annex_I");
        }
        return item.framework === framework;
      });
      
      const totalItems = frameworkItems.length;
      const compliantItems = frameworkItems.filter(item => item.status === "compliant").length;
      const nonCompliantItems = frameworkItems.filter(item => 
        item.status === "non_compliant" || item.status === "partially_compliant"
      ).length;
      const naItems = frameworkItems.filter(item => item.status === "not_applicable").length;
      
      const totalExcludingNA = totalItems - naItems;
      const complianceRate = totalExcludingNA > 0 
        ? Math.round((compliantItems / totalExcludingNA) * 100) 
        : 0;
      
      return {
        name: framework === "MDR" ? "MDR Annex I" : framework,
        totalItems,
        compliantItems,
        nonCompliantItems,
        naItems,
        complianceRate
      };
    });
  }, [gapItems]);

  const handleFrameworkClick = (framework: string) => {
    navigate(`/app/product/${product.id}/gap-analysis?framework=${framework}`);
  };

  return (
    <Card>
      <CardContent className="p-2 sm:p-3 lg:p-4">
        <div className="space-y-3 sm:space-y-4">
          {/* Updated header to match Device Information Completion format */}
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
              <ChartBar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Regulatory Gap Analysis
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-medium">{overallComplianceRate}%</span>
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>
          
          {/* Overall Progress Bar */}
          <div>
            <Progress value={overallComplianceRate} className="h-2 sm:h-2.5" />
          </div>
          
          {/* Legend for Overall Compliance - Updated with consistent terminology and icons */}
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-1.5">
              <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
              <span>Closed: {compliantItems}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <X className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
              <span>Open: {nonCompliantItems}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Ban className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
              <span>N/A: {naItems}</span>
            </div>
          </div>
          
          {/* Framework Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-3">
            {frameworkStats.map((framework) => (
              <Card 
                key={framework.name} 
                className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleFrameworkClick(framework.name)}
              >
                <CardContent className="p-2 sm:p-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-xs sm:text-sm truncate">{framework.name}</h4>
                    <span className="font-bold text-xs sm:text-sm">{framework.complianceRate}%</span>
                  </div>
                  
                  <Progress value={framework.complianceRate} className="h-1.5 sm:h-2 my-1 sm:my-2" />
                  
                  {/* Updated terminology and dot indicators */}
                  <div className="flex justify-between text-xs mt-1 sm:mt-2">
                    <div className="flex items-center gap-1">
                      <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-green-500" />
                      <span>Closed: {framework.compliantItems}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-red-500" />
                      <span>Open: {framework.nonCompliantItems}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-gray-300" />
                      <span>N/A: {framework.naItems}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
