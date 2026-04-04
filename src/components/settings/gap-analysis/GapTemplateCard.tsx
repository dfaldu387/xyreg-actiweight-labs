
import React from "react";
import { ExternalLink, FileBarChart } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { GapAnalysisTemplate, ImportanceLevel } from "@/types/gapAnalysisTemplate";
import { useTranslation } from "@/hooks/useTranslation";

interface GapTemplateCardProps {
  template: GapAnalysisTemplate;
  onToggleActive: (templateId: string) => void;
  onViewDetails: (template: GapAnalysisTemplate) => void;
}

export function GapTemplateCard({ template, onToggleActive, onViewDetails }: GapTemplateCardProps) {
  const { lang } = useTranslation();

  // Function to get badge variant based on importance
  const getImportanceBadgeVariant = (importance: ImportanceLevel) => {
    switch (importance) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "outline";
    }
  };
  
  // Function to get human-readable importance text
  const getImportanceText = (importance: ImportanceLevel) => {
    switch (importance) {
      case "high":
        return lang('companySettings.gapAnalysis.recommendedStrongly');
      case "medium":
        return lang('companySettings.gapAnalysis.recommendedMedium');
      case "low":
        return lang('companySettings.gapAnalysis.recommendedLow');
      default:
        return lang('companySettings.gapAnalysis.recommended');
    }
  };

  return (
    <Card className={`border ${template.isActive ? 'border-primary/20' : 'border-muted'}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center">
              <FileBarChart className="h-4 w-4 mr-2 text-primary" />
              {template.name}
              {template.isCustom && (
                <Badge variant="outline" className="ml-2 text-xs">{lang('companySettings.gapAnalysis.custom')}</Badge>
              )}
            </CardTitle>
            <CardDescription>{template.description}</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex flex-col items-end">
              <Label htmlFor={`template-toggle-${template.id}`} className="text-xs text-muted-foreground mb-1">
                {template.isActive ? lang('common.active') : lang('common.inactive')}
              </Label>
              <Switch
                id={`template-toggle-${template.id}`}
                checked={template.isActive}
                onCheckedChange={() => onToggleActive(template.id)}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="outline" className="text-xs">
            {template.framework}
          </Badge>
          <Badge variant="outline" className="text-xs capitalize">
            {template.scope === "company" ? lang('companySettings.gapAnalysis.companyWide') : lang('companySettings.gapAnalysis.productSpecific')}
          </Badge>
          <Badge variant={getImportanceBadgeVariant(template.importance)} className="text-xs">
            {getImportanceText(template.importance)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
          {lang('companySettings.gapAnalysis.templateCardDescription')}
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex justify-between">
        <div className="text-xs text-muted-foreground">
          {template.isCustom ? lang('companySettings.gapAnalysis.customTemplate') : lang('companySettings.gapAnalysis.standardTemplate')}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-xs"
          onClick={() => onViewDetails(template)}
        >
          {lang('companySettings.gapAnalysis.viewDetails')}
          <ExternalLink className="h-3 w-3 ml-1" />
        </Button>
      </CardFooter>
    </Card>
  );
}
