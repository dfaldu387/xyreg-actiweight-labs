import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Plus, Users, AlertTriangle, ClipboardCheck, BarChart3, Monitor, BookOpen } from "lucide-react";
import { useUsabilityEngineeringFile } from "@/hooks/useUsabilityEngineeringFile";
import { UseSpecificationTab } from "./UseSpecificationTab";
import { UICharacteristicsTab } from "./UICharacteristicsTab";
import { UsabilityHazardsTab } from "./UsabilityHazardsTab";
import { EvaluationPlanTab } from "./EvaluationPlanTab";
import { EvaluationReportTab } from "./EvaluationReportTab";
import { ValidationResultsTab } from "./ValidationResultsTab";
import { UEFSummaryTab } from "./UEFSummaryTab";
import { useTranslation } from "@/hooks/useTranslation";

const SUB_TABS = [
  { value: 'use-specification', label: 'Use Specification', icon: Users, clause: '5.1' },
  { value: 'ui-characteristics', label: 'UI Characteristics', icon: Monitor, clause: '5.2' },
  { value: 'usability-hazards', label: 'Usability Hazards', icon: AlertTriangle, clause: '5.3-5.4' },
  { value: 'evaluation-plan', label: 'Evaluation Plan', icon: ClipboardCheck, clause: '5.5' },
  { value: 'evaluation-reports', label: 'Evaluation Reports', icon: BookOpen, clause: '5.7/5.9' },
  { value: 'validation-results', label: 'Validation Results', icon: BarChart3, clause: '' },
  { value: 'uef-summary', label: 'UEF Summary', icon: FileText, clause: '' },
];

interface UsabilityEngineeringModuleProps {
  productId: string;
  companyId: string;
  disabled?: boolean;
}

export function UsabilityEngineeringModule({ productId, companyId, disabled }: UsabilityEngineeringModuleProps) {
  const { lang } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSubTab, setActiveSubTab] = useState(searchParams.get('subTab') || 'use-specification');
  
  const { uef, isLoading, createUEF, isCreating } = useUsabilityEngineeringFile(productId, companyId);

  // Sync with URL
  useEffect(() => {
    const subTab = searchParams.get('subTab');
    if (subTab && SUB_TABS.some(t => t.value === subTab)) {
      setActiveSubTab(subTab);
    }
  }, [searchParams]);

  const handleSubTabChange = (newTab: string) => {
    setActiveSubTab(newTab);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('subTab', newTab);
    setSearchParams(newParams, { replace: true });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading Usability Engineering File...</p>
        </div>
      </div>
    );
  }

  // Show create prompt if no UEF exists
  if (!uef) {
    return (
      <Card className="border-dashed">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>{lang('designRiskControls.usabilityEngineering.createTitle')}</CardTitle>
          <CardDescription className="max-w-md mx-auto">
            {lang('designRiskControls.usabilityEngineering.createDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button onClick={() => createUEF()} disabled={isCreating || disabled}>
            <Plus className="h-4 w-4 mr-2" />
            {isCreating ? 'Creating...' : lang('designRiskControls.usabilityEngineering.createButton')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeSubTab} onValueChange={handleSubTabChange}>
        <TabsList className="grid w-full grid-cols-7">
          {SUB_TABS.map((tab) => (
            <TabsTrigger 
              key={tab.value} 
              value={tab.value}
              className="flex items-center gap-2"
              disabled={disabled}
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.clause && (
                <span className="hidden lg:inline text-xs text-muted-foreground">({tab.clause})</span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="use-specification" className="mt-4">
          <UseSpecificationTab productId={productId} companyId={companyId} disabled={disabled} />
        </TabsContent>

        <TabsContent value="ui-characteristics" className="mt-4">
          <UICharacteristicsTab productId={productId} companyId={companyId} disabled={disabled} />
        </TabsContent>

        <TabsContent value="usability-hazards" className="mt-4">
          <UsabilityHazardsTab productId={productId} companyId={companyId} disabled={disabled} />
        </TabsContent>

        <TabsContent value="evaluation-plan" className="mt-4">
          <EvaluationPlanTab uef={uef} productId={productId} companyId={companyId} disabled={disabled} />
        </TabsContent>

        <TabsContent value="evaluation-reports" className="mt-4">
          <EvaluationReportTab productId={productId} companyId={companyId} disabled={disabled} />
        </TabsContent>

        <TabsContent value="validation-results" className="mt-4">
          <ValidationResultsTab productId={productId} companyId={companyId} disabled={disabled} />
        </TabsContent>

        <TabsContent value="uef-summary" className="mt-4">
          <UEFSummaryTab uef={uef} productId={productId} companyId={companyId} disabled={disabled} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
