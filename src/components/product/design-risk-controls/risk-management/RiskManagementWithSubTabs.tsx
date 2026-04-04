import React from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, AlertTriangle } from "lucide-react";
import { RiskManagementModule } from "./RiskManagementModule";
import { HighLevelRiskAssessment } from "./HighLevelRiskAssessment";
import { supabase } from "@/integrations/supabase/client";

interface RiskManagementWithSubTabsProps {
  productId: string;
  companyId: string;
  disabled?: boolean;
  isInGenesisFlow?: boolean;
}

export function RiskManagementWithSubTabs({
  productId,
  companyId,
  disabled = false,
  isInGenesisFlow = false,
}: RiskManagementWithSubTabsProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  // If highlightHazard param is present, force the detailed tab
  const activeSubTab = searchParams.get('highlightHazard') ? 'detailed' : (searchParams.get('riskSubTab') || 'detailed');

  // Fetch hazards count for combined completion check
  const { data: hazardsData } = useQuery({
    queryKey: ['hazards', productId, 'count'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hazards')
        .select('id')
        .eq('product_id', productId)
        .limit(1);
      if (error) throw error;
      return data;
    },
    enabled: !!productId && isInGenesisFlow,
    staleTime: 0,
    refetchOnMount: true,
  });

  // Fetch high-level risks count for combined completion check
  const { data: highLevelRisksData } = useQuery({
    queryKey: ['high-level-risks', productId, 'count'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_high_level_risks')
        .select('id')
        .eq('product_id', productId)
        .limit(1);
      if (error) throw error;
      return data;
    },
    enabled: !!productId && isInGenesisFlow,
    staleTime: 0,
    refetchOnMount: true,
  });

  // Combined completion: step is complete if EITHER tab has data
  const hasHazards = (hazardsData?.length ?? 0) > 0;
  const hasHighLevelRisks = (highLevelRisksData?.length ?? 0) > 0;
  const isStepComplete = hasHazards || hasHighLevelRisks;

  const handleSubTabChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('riskSubTab', value);
    setSearchParams(newParams, { replace: true });
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeSubTab} onValueChange={handleSubTabChange}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="high-level" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            High Level Assessment
          </TabsTrigger>
          <TabsTrigger value="detailed" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Hazard Traceability Matrix
          </TabsTrigger>
        </TabsList>

        <TabsContent value="high-level" className="mt-6">
          <HighLevelRiskAssessment productId={productId} companyId={companyId} isInGenesisFlow={isInGenesisFlow} isStepComplete={isStepComplete} />
        </TabsContent>

        <TabsContent value="detailed" className="mt-6">
          <RiskManagementModule
            productId={productId}
            companyId={companyId}
            disabled={disabled}
            isInGenesisFlow={isInGenesisFlow}
            isStepComplete={isStepComplete}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
