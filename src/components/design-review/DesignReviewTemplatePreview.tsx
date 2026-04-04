import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Users, FileText, ClipboardCheck, Target, AlertTriangle } from "lucide-react";
import { DesignReviewTemplateService } from "@/services/designReviewTemplateService";
import { useTranslation } from "@/hooks/useTranslation";

interface DesignReviewTemplatePreviewProps {
  phase: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DesignReviewTemplatePreview({ phase, open, onOpenChange }: DesignReviewTemplatePreviewProps) {
  const { lang } = useTranslation();
  const template = DesignReviewTemplateService.generateTemplate(phase);
  const phaseContent = DesignReviewTemplateService.getPhaseSpecificContent(phase);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {lang('designReview.templatePreviewTitle')} - {phase.charAt(0).toUpperCase() + phase.slice(1)} {lang('designReview.phaseLabel')}
          </DialogTitle>
          <DialogDescription>
            {lang('designReview.templatePreviewDescription')} <Badge variant="outline">{phase}</Badge> {lang('designReview.phaseLabel').toLowerCase()}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* General Information */}
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {lang('designReview.generalInformationPreview')}
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm bg-muted/30 p-4 rounded-lg">
              <div>
                <label className="font-medium">{lang('designReview.projectDeviceName')}</label>
                <p className="text-muted-foreground">{lang('designReview.enterProjectName')}</p>
              </div>
              <div>
                <label className="font-medium">{lang('designReview.reviewDateLabel')}</label>
                <p className="text-muted-foreground">{lang('designReview.reviewDatePlaceholder')}</p>
              </div>
              <div>
                <label className="font-medium">{lang('designReview.developmentPhasePreview')}</label>
                <p className="text-muted-foreground capitalize">{phase}</p>
              </div>
              <div>
                <label className="font-medium">{lang('designReview.reviewTypePreview')}</label>
                <p className="text-muted-foreground">{lang('designReview.phaseGateReview')}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Attendees */}
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              {lang('designReview.attendeesAndRolesPreview')}
            </h3>
            <div className="space-y-2">
              {template.attendees.map((attendee, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-muted/30 rounded">
                  <span className="text-sm font-medium">{lang('designReview.name')}</span>
                  <span className="text-sm">{attendee.title}</span>
                  <span className="text-sm text-muted-foreground">{lang('designReview.signatureDatePreview')}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Phase-Specific Review Criteria */}
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Target className="h-4 w-4" />
              3. {phase.charAt(0).toUpperCase() + phase.slice(1)} — {lang('designReview.gateCriteriaPreview')}
            </h3>
            <div className="space-y-4">
              {phaseContent.map((section, index) => (
                <div key={section.id} className="border rounded-lg p-4 bg-background">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <ClipboardCheck className="h-4 w-4" />
                    {section.title}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">{section.content}</p>
                  
                  {section.section_type === 'checklist' && section.phase_specific_data?.items && (
                    <div className="space-y-2">
                      {section.phase_specific_data.items.map((item: string, itemIndex: number) => (
                        <div key={itemIndex} className="flex items-start gap-2 p-2 bg-muted/20 rounded">
                          <CheckCircle2 className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {section.section_type === 'form' && section.phase_specific_data?.fields && (
                    <div className="space-y-3">
                      {section.phase_specific_data.fields.map((field: any, fieldIndex: number) => (
                        <div key={fieldIndex} className="space-y-1">
                          <label className="text-sm font-medium">{field.label}:</label>
                          <div className="p-2 border rounded bg-muted/10 text-sm text-muted-foreground">
                            {lang('designReview.toBeCompleted')}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Decision & Actions */}
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {lang('designReview.reviewDecisionAndActionsPreview')}
            </h3>
            <div className="space-y-4">
              <div className="bg-muted/30 p-4 rounded-lg">
                <label className="font-medium">{lang('designReview.reviewDecisionPreview')}</label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <input type="radio" className="w-4 h-4" />
                    <span className="text-sm">✅ <strong>{lang('designReview.approvedPreview')}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="radio" className="w-4 h-4" />
                    <span className="text-sm">⚠️ <strong>{lang('designReview.conditionsPreview')}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="radio" className="w-4 h-4" />
                    <span className="text-sm">❌ <strong>{lang('designReview.notApprovedPreview')}</strong></span>
                  </div>
                </div>
              </div>
              
              <div className="border rounded-lg p-4">
                <label className="font-medium">{lang('designReview.actionItems')}</label>
                <div className="mt-2">
                  <div className="grid grid-cols-4 gap-2 p-2 bg-muted/20 rounded font-medium text-sm">
                    <div>{lang('designReview.actionItem')}</div>
                    <div>{lang('designReview.assignedTo')}</div>
                    <div>{lang('designReview.dueDateColumn')}</div>
                    <div>{lang('designReview.priority')}</div>
                  </div>
                  <div className="p-3 text-sm text-muted-foreground text-center border-t mt-2">
                    {lang('designReview.actionItemsPlaceholder')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Signatures */}
          <div>
            <h3 className="font-semibold text-lg mb-3">{lang('designReview.approvalsPreview')}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="font-medium">{lang('designReview.reviewChairPreview')}</label>
                <div className="p-3 border rounded bg-muted/20">
                  <div className="text-sm">{lang('designReview.signature')}</div>
                  <div className="text-sm">{lang('designReview.dateSignature')}</div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="font-medium">{lang('designReview.qualityAssurancePreview')}</label>
                <div className="p-3 border rounded bg-muted/20">
                  <div className="text-sm">{lang('designReview.signature')}</div>
                  <div className="text-sm">{lang('designReview.dateSignature')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}