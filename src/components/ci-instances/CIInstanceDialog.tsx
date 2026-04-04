import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CITemplateService } from "@/services/ciTemplateService";
import { CIInstanceService } from "@/services/ciInstanceService";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

interface CITemplate {
  id: string;
  title: string;
  type: string;
  priority: string;
  description?: string;
  template_config: Record<string, any>;
}

interface CIInstance {
  id: string;
  title: string;
  type: string;
  priority: string;
  status: string;
  description?: string;
  assigned_to?: string;
  due_date?: string;
  template_id: string;
  instance_config: Record<string, any>;
}

interface CIInstanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  productId?: string;
  instance?: CIInstance | null;
  onSuccess: () => void;
}

export function CIInstanceDialog({ open, onOpenChange, companyId, productId, instance, onSuccess }: CIInstanceDialogProps) {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<CITemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [formData, setFormData] = useState({
    title: "",
    status: "pending",
    description: "",
    assigned_to: "",
    due_date: "",
    instance_config: {}
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);

  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open, companyId]);

  useEffect(() => {
    if (instance) {
      setFormData({
        title: instance.title,
        status: instance.status,
        description: instance.description || "",
        assigned_to: instance.assigned_to || "",
        due_date: instance.due_date ? instance.due_date.split('T')[0] : "",
        instance_config: instance.instance_config
      });
      setSelectedTemplate(instance.template_id);
    } else {
      setFormData({
        title: "",
        status: "pending",
        description: "",
        assigned_to: "",
        due_date: "",
        instance_config: {}
      });
      setSelectedTemplate("");
    }
  }, [instance, open]);

  const loadTemplates = async () => {
    try {
      setIsLoadingTemplates(true);
      const data = await CITemplateService.getCompanyTemplates(companyId);
      // Only show active templates
      setTemplates(data.filter(t => t.is_active));
    } catch (error) {
      console.error("Error loading CI templates:", error);
      toast.error("Failed to load CI templates");
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template && !instance) {
      // Pre-fill form with template data when creating new instance
      setFormData(prev => ({
        ...prev,
        title: template.title,
        description: template.description || ""
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTemplate) {
      toast.error("Please select a template");
      return;
    }

    if (!user?.id) {
      toast.error("User not authenticated");
      return;
    }

    setIsLoading(true);

    try {
      if (instance) {
        // Update existing instance
        const updateData = {
          title: formData.title,
          status: formData.status as "pending" | "in_progress" | "completed" | "blocked" | "cancelled",
          description: formData.description,
          assigned_to: formData.assigned_to || undefined,
          due_date: formData.due_date || undefined,
          instance_config: formData.instance_config
        };

        const success = await CIInstanceService.updateInstance(instance.id, updateData);
        if (success) {
          toast.success("CI instance updated successfully");
          onSuccess();
        }
      } else {
        // Create new instance by inheriting from template
        const instances = await CIInstanceService.inheritTemplatesForProduct(companyId, productId || "", user.id);
        
        // If we created instances, update the first one with our custom data
        if (instances.length > 0) {
          const newInstance = instances.find(inst => inst.template_id === selectedTemplate);
          if (newInstance) {
            const updateData = {
              title: formData.title,
              status: formData.status as "pending" | "in_progress" | "completed" | "blocked" | "cancelled",
              description: formData.description,
              assigned_to: formData.assigned_to || undefined,
              due_date: formData.due_date || undefined,
              instance_config: formData.instance_config
            };
            
            await CIInstanceService.updateInstance(newInstance.id, updateData);
          }
          
          toast.success("CI instance created from template");
          onSuccess();
        }
      }
    } catch (error) {
      console.error("Error saving CI instance:", error);
      toast.error(instance ? "Failed to update CI instance" : "Failed to create CI instance");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {instance ? "Edit CI Instance" : "Create CI Instance from Template"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!instance && (
            <div className="space-y-2">
              <Label htmlFor="template">Select Template</Label>
              {isLoadingTemplates ? (
                <div className="text-sm text-muted-foreground">Loading templates...</div>
              ) : (
                <Select
                  value={selectedTemplate}
                  onValueChange={handleTemplateChange}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a CI template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            template.type === 'audit' ? 'bg-blue-100 text-blue-800' :
                            template.type === 'gap' ? 'bg-green-100 text-green-800' :
                            template.type === 'document' ? 'bg-purple-100 text-purple-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                            {template.type}
                          </span>
                          {template.title}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter instance title"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assigned_to">Assigned To (User ID)</Label>
            <Input
              id="assigned_to"
              value={formData.assigned_to}
              onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
              placeholder="Enter user ID (optional)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter instance description"
              rows={3}
            />
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
            <Button type="submit" disabled={isLoading || (!selectedTemplate && !instance)}>
              {isLoading ? "Saving..." : instance ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}