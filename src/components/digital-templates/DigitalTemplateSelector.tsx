import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FileText, Settings, Eye } from "lucide-react";
import { useTemplateSettings } from "@/hooks/useTemplateSettings";
import { DigitalTemplatePreview } from "./DigitalTemplatePreview";
import { DesignReviewTemplateService } from "@/services/designReviewTemplateService";

interface DigitalTemplateSelectorProps {
  companyId: string;
  activityType: string;
  currentPhase?: string;
  onTemplateSelect: (useDigitalTemplate: boolean, templateData?: any) => void;
}

export function DigitalTemplateSelector({ 
  companyId, 
  activityType, 
  currentPhase,
  onTemplateSelect 
}: DigitalTemplateSelectorProps) {
  const { settings } = useTemplateSettings(companyId);
  const [useDigitalTemplate, setUseDigitalTemplate] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  const isReviewsMeetingsType = activityType === 'reviews_meetings';
  const isDigitalTemplateEnabled = settings.enable_design_review_template === true;
  
  useEffect(() => {
    onTemplateSelect(useDigitalTemplate, useDigitalTemplate ? { 
      type: 'design_review',
      phase: currentPhase 
    } : null);
  }, [useDigitalTemplate, currentPhase, onTemplateSelect]);

  if (!isReviewsMeetingsType || !isDigitalTemplateEnabled) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Digital Template Available
            </CardTitle>
            <CardDescription>
              Use an adaptive digital template that customizes content based on your current development phase
            </CardDescription>
          </div>
          <Badge variant="secondary">Phase: {currentPhase || 'Not specified'}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="use-digital-template">Use Design Review Digital Template</Label>
            <p className="text-sm text-muted-foreground">
              Adaptive template with phase-specific checklists and requirements
            </p>
          </div>
          <Switch
            id="use-digital-template"
            checked={useDigitalTemplate}
            onCheckedChange={setUseDigitalTemplate}
          />
        </div>
        
        {useDigitalTemplate && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Preview Template
            </Button>
          </div>
        )}
        
        {showPreview && (
          <DigitalTemplatePreview
            templateData={{
              sections: DesignReviewTemplateService.getPhaseSpecificContent(currentPhase || 'concept')
            }}
            templateName="Design Review Template"
          />
        )}
      </CardContent>
    </Card>
  );
}