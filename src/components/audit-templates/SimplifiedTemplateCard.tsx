
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, User, Plus } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface SimplifiedTemplateCardProps {
  template: any;
  onScheduleAudit: () => void;
  disabled?: boolean;
}

export function SimplifiedTemplateCard({
  template,
  onScheduleAudit,
  disabled = false
}: SimplifiedTemplateCardProps) {
  const { lang } = useTranslation();
  const auditTemplate = template.audit_templates;
  if (!auditTemplate) return null;

  return (
    <Card className="border-green-200 bg-green-50/50">
      <CardContent className="!p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h4 className="font-medium">{auditTemplate.template_name}</h4>
              <Badge variant="outline" className="text-xs">
                {auditTemplate.applicability}
              </Badge>
              {auditTemplate.lifecycle_phase && (
                <Badge variant="secondary" className="text-xs">
                  {auditTemplate.lifecycle_phase}
                </Badge>
              )}
            </div>
            
            {auditTemplate.description && (
              <p className="text-sm text-muted-foreground mb-3">
                {auditTemplate.description}
              </p>
            )}
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {auditTemplate.suggested_duration && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {auditTemplate.suggested_duration}
                </div>
              )}
              {auditTemplate.suggested_auditor_type && (
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {auditTemplate.suggested_auditor_type}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={onScheduleAudit}
              size="sm"
              className="flex items-center gap-1"
              disabled={disabled}
            >
              <Plus className="h-3 w-3" />
              {lang('deviceAudits.component.scheduleAudit')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
