
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, FileText, Settings, Tag } from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "@/hooks/useTranslation";

interface TemplateDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: any | null;
}

export function TemplateDetailsDialog({ open, onOpenChange, template }: TemplateDetailsDialogProps) {
  const { lang } = useTranslation();

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {lang('companySettings.auditTemplates.templateDetails')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{template.template_name}</h3>
              {template.description && (
                <p className="text-muted-foreground mt-2">{template.description}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant={template.source === 'standard' ? 'default' : 'secondary'}>
                {template.source}
              </Badge>
              <Badge variant="outline">
                {template.applicability}
              </Badge>
              {template.audit_type_category && (
                <Badge variant="outline">
                  {template.audit_type_category}
                </Badge>
              )}
            </div>
          </div>

          <Separator />

          {/* Configuration Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {template.lifecycle_phase && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{lang('companySettings.auditTemplates.lifecyclePhase')}</span>
                </div>
                <p className="text-sm text-muted-foreground">{template.lifecycle_phase}</p>
              </div>
            )}

            {template.suggested_duration && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{lang('companySettings.auditTemplates.suggestedDuration')}</span>
                </div>
                <p className="text-sm text-muted-foreground">{template.suggested_duration}</p>
              </div>
            )}

            {template.suggested_auditor_type && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{lang('companySettings.auditTemplates.auditorType')}</span>
                </div>
                <p className="text-sm text-muted-foreground">{template.suggested_auditor_type}</p>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{lang('companySettings.auditTemplates.status')}</span>
              </div>
              <Badge variant={template.is_active ? "default" : "secondary"}>
                {template.is_active ? lang('common.active') : lang('common.inactive')}
              </Badge>
            </div>
          </div>

          {template.suggested_documents && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-semibold">{lang('companySettings.auditTemplates.suggestedDocuments')}</h4>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{template.suggested_documents}</p>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Timestamps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <span className="font-medium">{lang('companySettings.auditTemplates.created')}:</span>
              <p>{format(new Date(template.created_at), 'PPP')}</p>
            </div>
            <div>
              <span className="font-medium">{lang('companySettings.auditTemplates.lastUpdated')}:</span>
              <p>{format(new Date(template.updated_at), 'PPP')}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
