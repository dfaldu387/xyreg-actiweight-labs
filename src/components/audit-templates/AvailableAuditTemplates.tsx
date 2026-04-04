
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Settings } from "lucide-react";
import { SimplifiedTemplateCard } from "./SimplifiedTemplateCard";
import { EnhancedAuditInstanceDialog } from "../audit/EnhancedAuditInstanceDialog";
import { useAuditTemplates } from "@/hooks/useAuditTemplates";
import { AuditFormData } from "../audit/AuditForm";
import { useTranslation } from "@/hooks/useTranslation";

interface AvailableAuditTemplatesProps {
  companyId: string;
  scope: "company" | "product";
  productId?: string;
  title: string;
  onCreateAuditInstance?: (formData: AuditFormData) => void;
  disabled?: boolean;
}

export function AvailableAuditTemplates({
  companyId,
  scope,
  productId,
  title,
  onCreateAuditInstance,
  disabled = false
}: AvailableAuditTemplatesProps) {
  const { lang } = useTranslation();
  const [createInstanceDialogOpen, setCreateInstanceDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const { configuredTemplates, isLoading } = useAuditTemplates(companyId);

  // Filter templates to only show enabled ones that match scope and are active
  const availableTemplates = configuredTemplates.filter(template => {
    // Must be enabled in company settings
    if (!template.is_enabled) return false;
    
    // Must be an active template
    if (!template.audit_templates?.is_active) return false;
    
    // Must match scope applicability
    const applicability = template.audit_templates?.applicability || "";
    if (scope === "company") {
      return applicability.includes("company-wide") || applicability.includes("organization");
    } else {
      return applicability.includes("product-applicable") || applicability.includes("all");
    }
  });

  const handleScheduleAudit = (template: any) => {
    if (disabled) return;
    setSelectedTemplate(template);
    setCreateInstanceDialogOpen(true);
  };

  const handleCreateInstance = (formData: AuditFormData) => {
    if (onCreateAuditInstance) {
      onCreateAuditInstance(formData);
    }
    setCreateInstanceDialogOpen(false);
    setSelectedTemplate(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">{lang('audits.templates.loading')}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {title}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {lang('audits.templates.subtitle').replace('{{scope}}', scope)}
              </p>
            </div>
            <Badge variant="secondary">
              {lang('audits.templates.availableCount').replace('{{count}}', String(availableTemplates.length))}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {availableTemplates.length === 0 ? (
            <div className="text-center p-4 text-muted-foreground">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>{lang('audits.templates.emptyTitle')}</p>
              <p className="text-xs">{lang('audits.templates.emptyHint')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {availableTemplates.map((template) => (
                <SimplifiedTemplateCard
                  key={template.id}
                  template={template}
                  onScheduleAudit={() => handleScheduleAudit(template)}
                  disabled={disabled}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedTemplate && (
        <EnhancedAuditInstanceDialog
          open={createInstanceDialogOpen}
          onOpenChange={setCreateInstanceDialogOpen}
          onSubmit={handleCreateInstance}
          selectedTemplate={selectedTemplate}
          type={scope}
          companyId={companyId}
          productId={productId}
        />
      )}
    </>
  );
}
