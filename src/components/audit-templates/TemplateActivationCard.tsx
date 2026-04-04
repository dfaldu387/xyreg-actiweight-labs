
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TemplateActivationCardProps {
  template: any;
  companyId: string;
  scope: "company" | "product";
  productId?: string;
  onScheduleAudit: () => void;
}

export function TemplateActivationCard({ 
  template, 
  companyId, 
  scope, 
  productId, 
  onScheduleAudit 
}: TemplateActivationCardProps) {
  const [isActivating, setIsActivating] = useState(false);

  const handleToggleActivation = async (enabled: boolean) => {
    setIsActivating(true);
    try {
      const { error } = await supabase
        .from('company_audit_templates')
        .update({ is_enabled: enabled })
        .eq('id', template.id);

      if (error) throw error;

      toast.success(
        enabled 
          ? `Template "${template.audit_templates?.template_name}" activated`
          : `Template "${template.audit_templates?.template_name}" deactivated`
      );
      
      // Refresh the page to update the data
      window.location.reload();
    } catch (error) {
      console.error('Error updating template:', error);
      toast.error('Failed to update template');
    } finally {
      setIsActivating(false);
    }
  };

  const auditTemplate = template.audit_templates;
  if (!auditTemplate) return null;

  return (
    <Card className={`transition-all ${template.is_enabled ? 'border-green-200 bg-green-50/50' : ''}`}>
      <CardContent className="p-4">
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
            <div className="flex items-center gap-2">
              <Switch
                checked={template.is_enabled}
                onCheckedChange={handleToggleActivation}
                disabled={isActivating}
              />
              <span className="text-sm text-muted-foreground">
                {template.is_enabled ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            {template.is_enabled && (
              <Button 
                onClick={onScheduleAudit}
                size="sm"
                className="flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                Schedule Audit
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
