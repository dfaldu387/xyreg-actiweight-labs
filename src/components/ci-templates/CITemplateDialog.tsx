import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CITemplateService } from "@/services/ciTemplateService";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

interface CITemplate {
  id: string;
  title: string;
  type: string;
  priority: string;
  description?: string;
  is_active: boolean;
  template_config: Record<string, any>;
}

interface CITemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  template?: CITemplate | null;
  onSuccess: () => void;
}

export function CITemplateDialog({ open, onOpenChange, companyId, template, onSuccess }: CITemplateDialogProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: "",
    type: "audit",
    priority: "medium",
    description: "",
    is_active: true,
    template_config: {}
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (template) {
      setFormData({
        title: template.title,
        type: template.type,
        priority: template.priority,
        description: template.description || "",
        is_active: template.is_active,
        template_config: template.template_config
      });
    } else {
      setFormData({
        title: "",
        type: "audit",
        priority: "medium",
        description: "",
        is_active: true,
        template_config: {}
      });
    }
  }, [template, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast.error("User not authenticated");
      return;
    }

    setIsLoading(true);

    try {
      const templateData = {
        company_id: companyId,
        title: formData.title,
        type: formData.type as "audit" | "gap" | "document" | "activity",
        priority: formData.priority as "low" | "medium" | "high" | "critical",
        description: formData.description,
        template_config: formData.template_config
      };

      if (template) {
        const success = await CITemplateService.updateTemplate(template.id, {
          title: formData.title,
          type: formData.type as "audit" | "gap" | "document" | "activity",
          priority: formData.priority as "low" | "medium" | "high" | "critical",
          description: formData.description,
          is_active: formData.is_active,
          template_config: formData.template_config
        });
        
        if (success) {
          toast.success("CI template updated successfully");
          onSuccess();
        }
      } else {
        const result = await CITemplateService.createTemplate(templateData, user.id);
        if (result) {
          toast.success("CI template created successfully");
          onSuccess();
        }
      }
    } catch (error) {
      console.error("Error saving CI template:", error);
      toast.error(template ? "Failed to update CI template" : "Failed to create CI template");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {template ? "Edit CI Template" : "Create CI Template"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter template title"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="audit">Audit CI</SelectItem>
                  <SelectItem value="gap">Gap Analysis CI</SelectItem>
                  <SelectItem value="document">Document CI</SelectItem>
                  <SelectItem value="activity">Activity CI</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter template description"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active">Active template</Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : template ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}