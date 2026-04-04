import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FileText, Eye, Settings } from "lucide-react";
import { DesignReviewTemplatePreview } from "./DesignReviewTemplatePreview";
import { useTemplateSettings } from "@/hooks/useTemplateSettings";
import { useTranslation } from "@/hooks/useTranslation";

interface DesignReviewTemplateSelectorProps {
  companyId: string;
  currentPhase?: string;
  onTemplateSelect: (useTemplate: boolean, templateData?: any) => void;
}

export function DesignReviewTemplateSelector({
  companyId,
  currentPhase = 'concept',
  onTemplateSelect
}: DesignReviewTemplateSelectorProps) {
  const { lang } = useTranslation();
  const { settings, updateSetting, saveSettings } = useTemplateSettings(companyId);
  const [showPreview, setShowPreview] = useState(false);
  
  // Get the current setting value from persisted settings
  const useTemplate = settings.enable_design_review_template === true;
  
  const handleToggleTemplate = async (enabled: boolean) => {
    try {
      updateSetting('enable_design_review_template', enabled);
      await saveSettings({ enable_design_review_template: enabled });
    } catch (error) {
      console.error('Failed to save template setting:', error);
    }
  };
  
  useEffect(() => {
    onTemplateSelect(useTemplate, useTemplate ? { 
      type: 'design_review',
      phase: currentPhase 
    } : null);
  }, [useTemplate, currentPhase, onTemplateSelect]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {lang('companySettings.designReviewTemplate.title')}
            </CardTitle>
            <CardDescription>
              {lang('companySettings.designReviewTemplate.description')}
            </CardDescription>
          </div>
          <Badge variant="secondary">{lang('companySettings.designReviewTemplate.phase')}: {currentPhase}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="use-template">{lang('companySettings.designReviewTemplate.useTemplate')}</Label>
            <p className="text-sm text-muted-foreground">
              {lang('companySettings.designReviewTemplate.structuredTemplate')}
            </p>
          </div>
          <Switch
            id="use-template"
            checked={useTemplate}
            onCheckedChange={handleToggleTemplate}
          />
        </div>

        {useTemplate && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              {lang('companySettings.designReviewTemplate.previewTemplate')}
            </Button>
          </div>
        )}

        {showPreview && (
          <DesignReviewTemplatePreview
            phase={currentPhase}
            open={showPreview}
            onOpenChange={setShowPreview}
          />
        )}
      </CardContent>
    </Card>
  );
}