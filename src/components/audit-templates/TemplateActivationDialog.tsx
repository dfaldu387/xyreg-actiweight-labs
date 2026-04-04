
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, User, FileText, Target } from "lucide-react";
import { toast } from "sonner";

interface TemplateActivationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  scope: "company" | "product";
  productId?: string;
  templates: any[];
}

export function TemplateActivationDialog({
  open,
  onOpenChange,
  companyId,
  scope,
  productId,
  templates
}: TemplateActivationDialogProps) {
  const [localStates, setLocalStates] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Initialize local states from templates
  const getInitialStates = () => {
    const states: Record<string, boolean> = {};
    templates.forEach(template => {
      states[template.id] = template.is_enabled || false;
    });
    return states;
  };

  const handleToggle = (templateId: string, enabled: boolean) => {
    setLocalStates(prev => ({
      ...prev,
      [templateId]: enabled
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // In a real implementation, this would call an API to update template activations
      // For now, we'll just show a success message
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      toast.success("Template settings saved successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to save template settings");
    } finally {
      setIsSaving(false);
    }
  };

  const currentStates = Object.keys(localStates).length > 0 ? localStates : getInitialStates();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>
            Manage {scope === "company" ? "Company" : "Product"} Audit Templates
          </DialogTitle>
          <DialogDescription>
            Enable or disable audit templates for this {scope}. Only enabled templates will be available when creating new audits.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {templates.map((template) => (
              <Card key={template.id} className="border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-base">
                          {template.audit_templates?.template_name || "Unnamed Template"}
                        </h4>
                        <Switch
                          checked={currentStates[template.id] || false}
                          onCheckedChange={(checked) => handleToggle(template.id, checked)}
                        />
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {template.audit_templates?.description || "No description available"}
                      </p>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-blue-500" />
                          <span className="text-muted-foreground">Lifecycle Phase:</span>
                          <Badge variant="outline">
                            {template.audit_templates?.lifecycle_phase || "All phases"}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-green-500" />
                          <span className="text-muted-foreground">Duration:</span>
                          <span>{template.audit_templates?.suggested_duration || "Not specified"}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-purple-500" />
                          <span className="text-muted-foreground">Auditor:</span>
                          <span>{template.audit_templates?.suggested_auditor_type || "Any"}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-orange-500" />
                          <span className="text-muted-foreground">Applicability:</span>
                          <Badge variant="secondary">
                            {template.audit_templates?.applicability || "General"}
                          </Badge>
                        </div>
                      </div>

                      {template.audit_templates?.suggested_documents && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Suggested Documents:</span>
                          <p className="mt-1 text-xs bg-muted p-2 rounded">
                            {template.audit_templates.suggested_documents}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {templates.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No audit templates available for this {scope}.</p>
                <p className="text-sm">Templates need to be created in Company Settings first.</p>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
