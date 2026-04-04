import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, TrendingUp, AlertTriangle, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";

interface ImpactAnalysisProps {
  productId: string;
  companyId: string;
  disabled?: boolean;
}

export function ImpactAnalysis({ productId, companyId, disabled = false }: ImpactAnalysisProps) {
  const { lang } = useTranslation();
  const [selectedItemType, setSelectedItemType] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<string>("");

  const itemTypes = [
    { value: 'user_need', label: lang('traceability.impactAnalysis.itemTypes.userNeed') },
    { value: 'system_requirement', label: lang('traceability.impactAnalysis.itemTypes.systemRequirement') },
    { value: 'software_requirement', label: lang('traceability.impactAnalysis.itemTypes.softwareRequirement') },
    { value: 'hardware_requirement', label: lang('traceability.impactAnalysis.itemTypes.hardwareRequirement') },
    { value: 'test_case', label: lang('traceability.impactAnalysis.itemTypes.testCase') },
    { value: 'hazard', label: lang('traceability.impactAnalysis.itemTypes.hazard') },
    { value: 'risk_control', label: lang('traceability.impactAnalysis.itemTypes.riskControl') }
  ];

  const handleRunAnalysis = () => {
    if (disabled) return;
    if (!selectedItemType || !selectedItem) {
      toast.error(lang('traceability.impactAnalysis.toasts.selectBoth'));
      return;
    }
    toast.info(lang('traceability.impactAnalysis.toasts.comingSoon'));
  };

  const handleSelectItem = () => {
    if (disabled) return;
    toast.info(lang('traceability.impactAnalysis.toasts.selectionComingSoon'));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">{lang('traceability.impactAnalysis.title')}</h3>
        <p className="text-sm text-muted-foreground">
          {lang('traceability.impactAnalysis.description')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{lang('traceability.impactAnalysis.selectItem')}</CardTitle>
          <CardDescription>
            {lang('traceability.impactAnalysis.selectItemDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">{lang('traceability.impactAnalysis.itemType')}</label>
              <Select value={selectedItemType} onValueChange={setSelectedItemType} disabled={disabled}>
                <SelectTrigger disabled={disabled}>
                  <SelectValue placeholder={lang('traceability.impactAnalysis.selectItemTypePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {itemTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">{lang('traceability.impactAnalysis.specificItem')}</label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 justify-start"
                  onClick={handleSelectItem}
                  disabled={disabled || !selectedItemType}
                >
                  <Search className="h-4 w-4 mr-2" />
                  {selectedItem || lang('traceability.impactAnalysis.selectItemPlaceholder')}
                </Button>
              </div>
            </div>
          </div>
          <Button
            onClick={handleRunAnalysis}
            disabled={disabled || !selectedItemType || !selectedItem}
            className="w-full"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            {lang('traceability.impactAnalysis.runAnalysis')}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {lang('traceability.impactAnalysis.directImpacts')}
            </CardTitle>
            <CardDescription>{lang('traceability.impactAnalysis.directImpactsDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{lang('traceability.impactAnalysis.selectToSeeDirectImpacts')}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowRight className="h-4 w-4" />
              {lang('traceability.impactAnalysis.indirectImpacts')}
            </CardTitle>
            <CardDescription>{lang('traceability.impactAnalysis.indirectImpactsDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{lang('traceability.impactAnalysis.selectToSeeIndirectImpacts')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{lang('traceability.impactAnalysis.visualization')}</CardTitle>
          <CardDescription>{lang('traceability.impactAnalysis.visualizationDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <div className="max-w-md mx-auto">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm mb-2">{lang('traceability.impactAnalysis.visualizationPlaceholder')}</p>
              <p className="text-xs">{lang('traceability.impactAnalysis.visualizationHint')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">{lang('traceability.impactAnalysis.useCases.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium text-foreground mb-2">{lang('traceability.impactAnalysis.useCases.changeImpact.title')}</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>{lang('traceability.impactAnalysis.useCases.changeImpact.item1')}</li>
                <li>{lang('traceability.impactAnalysis.useCases.changeImpact.item2')}</li>
                <li>{lang('traceability.impactAnalysis.useCases.changeImpact.item3')}</li>
                <li>{lang('traceability.impactAnalysis.useCases.changeImpact.item4')}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">{lang('traceability.impactAnalysis.useCases.planning.title')}</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>{lang('traceability.impactAnalysis.useCases.planning.item1')}</li>
                <li>{lang('traceability.impactAnalysis.useCases.planning.item2')}</li>
                <li>{lang('traceability.impactAnalysis.useCases.planning.item3')}</li>
                <li>{lang('traceability.impactAnalysis.useCases.planning.item4')}</li>
              </ul>
            </div>
          </div>
          <div className="pt-2 border-t border-border">
            <p className="text-sm text-muted-foreground">
              <strong>{lang('traceability.impactAnalysis.tip.label')}</strong> {lang('traceability.impactAnalysis.tip.content')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
