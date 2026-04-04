import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, Clock, FileText, User } from 'lucide-react';
import { DesignReviewTemplateService, DesignReviewSection } from '@/services/designReviewTemplateService';
import { useTemplateResponse } from '@/hooks/useTemplateResponse';
import { TemplateResponseService } from '@/services/templateResponseService';
import { TemplateSection } from './TemplateSection';
import { PhaseCompletionChecklist } from './PhaseCompletionChecklist';

interface DigitalTemplateExecutorProps {
  activityId: string;
  companyId: string;
  productId: string;
  templateType: string;
  phase: string;
  currentUserId: string;
  onComplete?: () => void;
}

export function DigitalTemplateExecutor({
  activityId,
  companyId,
  productId,
  templateType,
  phase,
  currentUserId,
  onComplete
}: DigitalTemplateExecutorProps) {
  const { response, loading, saving, createResponse, saveProgress, markCompleted } = useTemplateResponse(activityId, companyId);
  const [sections, setSections] = useState<DesignReviewSection[]>([]);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  useEffect(() => {
    // Get phase-specific sections
    const phaseSections = DesignReviewTemplateService.getPhaseSpecificContent(phase);
    setSections(phaseSections);
  }, [phase]);

  useEffect(() => {
    if (response && sections.length > 0) {
      const percentage = TemplateResponseService.calculateCompletionPercentage(
        response.template_data,
        sections
      );
      setCompletionPercentage(percentage);
    }
  }, [response, sections]);

  const initializeTemplate = async () => {
    const template = DesignReviewTemplateService.generateTemplate(phase);
    const initialData = {
      template,
      sections: {},
      generalInfo: {
        projectName: '',
        reviewDate: new Date().toISOString().split('T')[0],
        developmentPhase: phase,
        reviewType: 'Phase Gate Design Review'
      },
      decision: null,
      attendees: template.attendees.map(attendee => ({ ...attendee, present: false }))
    };

    await createResponse(templateType, initialData);
  };

  const handleSectionSave = async (sectionId: string, sectionData: any) => {
    await saveProgress(sectionId, sectionData);
  };

  const handleCompleteTemplate = async () => {
    if (completionPercentage === 100) {
      const success = await markCompleted(currentUserId);
      if (success && onComplete) {
        onComplete();
      }
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Clock className="h-4 w-4 mr-2 animate-spin" />
            Loading template...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!response) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Initialize Design Review Template
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Start your phase-specific design review for {phase} phase. This template will guide you through
            all required sections and checkpoints.
          </p>
          <Button onClick={initializeTemplate} disabled={saving}>
            Start Design Review
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isCompleted = response.completion_status === 'completed';

  return (
    <div className="space-y-6">
      {/* Header with progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Design Review Template - {phase}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Phase-specific design review checklist and documentation
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isCompleted ? "default" : "secondary"}>
                {isCompleted ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Completed
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4 mr-1" />
                    In Progress
                  </>
                )}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Completion Progress</span>
                <span>{completionPercentage}%</span>
              </div>
              <Progress value={completionPercentage} className="w-full" />
            </div>
            
            {isCompleted && response.completed_at && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                Completed on {new Date(response.completed_at).toLocaleDateString()}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* General Information */}
      <Card>
        <CardHeader>
          <CardTitle>General Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Project Name</label>
              <p className="text-sm text-muted-foreground">
                {response.template_data.generalInfo?.projectName || 'Not specified'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Review Date</label>
              <p className="text-sm text-muted-foreground">
                {response.template_data.generalInfo?.reviewDate || 'Not set'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Development Phase</label>
              <p className="text-sm text-muted-foreground">{phase}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Review Type</label>
              <p className="text-sm text-muted-foreground">Phase Gate Design Review</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase Completion Checklist */}
      <PhaseCompletionChecklist
        companyId={companyId}
        productId={productId}
        phaseName={phase}
      />

      {/* Template Sections */}
      <div className="space-y-4">
        {sections.map((section, index) => (
          <TemplateSection
            key={section.id}
            section={section}
            sectionData={response.template_data.sections?.[section.id]}
            onSave={async (data) => {
              await handleSectionSave(section.id, data);
              return true;
            }}
            isReadOnly={isCompleted}
            saving={saving}
          />
        ))}
      </div>

      {/* Actions */}
      {!isCompleted && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Complete Design Review</h3>
                <p className="text-sm text-muted-foreground">
                  All sections must be completed before the template can be finalized.
                </p>
              </div>
              <Button
                onClick={handleCompleteTemplate}
                disabled={completionPercentage < 100 || saving}
              >
                Complete Review
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}