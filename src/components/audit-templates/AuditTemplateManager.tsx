
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Settings, Info } from "lucide-react";
import { useAuditTemplates } from "@/hooks/useAuditTemplates";
import { TemplateActivationDialog } from "./TemplateActivationDialog";

interface AuditTemplateManagerProps {
  companyId: string;
  scope: "company" | "product";
  productId?: string;
  title: string;
  description: string;
}

export function AuditTemplateManager({ 
  companyId, 
  scope, 
  productId, 
  title, 
  description 
}: AuditTemplateManagerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { configuredTemplates, isLoading } = useAuditTemplates(companyId);

  // Filter templates by scope
  const relevantTemplates = configuredTemplates.filter(template => {
    if (scope === "company") {
      return template.audit_templates?.applicability?.includes("company") || 
             template.audit_templates?.applicability?.includes("organization");
    } else {
      return template.audit_templates?.applicability?.includes("product") || 
             template.audit_templates?.applicability?.includes("all");
    }
  });

  const activeTemplates = relevantTemplates.filter(template => template.is_enabled);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading templates...</div>
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
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            </div>
            <Button onClick={() => setDialogOpen(true)} variant="outline">
              Manage Templates
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Active Templates:</span>
              <Badge variant="secondary">{activeTemplates.length} enabled</Badge>
            </div>
            
            {activeTemplates.length === 0 ? (
              <div className="text-center p-4 text-muted-foreground">
                <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No audit templates are currently enabled.</p>
                <p className="text-xs">Click "Manage Templates" to enable templates for this {scope}.</p>
              </div>
            ) : (
              <div className="grid gap-2">
                {activeTemplates.map((template) => (
                  <div key={template.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <span className="font-medium text-sm">
                        {template.audit_templates?.template_name}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {template.audit_templates?.lifecycle_phase || "All phases"}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-green-50">Active</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <TemplateActivationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        companyId={companyId}
        scope={scope}
        productId={productId}
        templates={relevantTemplates}
      />
    </>
  );
}
