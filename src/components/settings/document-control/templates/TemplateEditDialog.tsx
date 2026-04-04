import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Save,
  X
} from 'lucide-react';
import { TEMPLATE_CATEGORIES } from '@/types/templateManagement';
import type { TemplateScope, TemplateCategory } from '@/types/templateManagement';

interface TemplateEditDialogProps {
  template: any | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedTemplate: any) => Promise<void>;
  isLoading?: boolean;
}

export function TemplateEditDialog({
  template,
  isOpen,
  onClose,
  onSave,
  isLoading = false
}: TemplateEditDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    document_type: '',
    template_category: '' as TemplateCategory | '' | 'none',
    scope: 'company' as 'company' | 'product' | 'both'
  });

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || '',
        description: template.description || '',
        document_type: template.document_type || '',
        template_category: template.template_category || '',
        scope: template.scope || 'company'
      });
    }
  }, [template]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!template) return;

    try {
      await onSave({
        ...template,
        ...formData,
        // Clean up empty strings and "none" values to null for optional fields
        description: formData.description || null,
        document_type: formData.document_type || null,
        template_category: formData.template_category === 'none' ? null : formData.template_category || null,
        scope: formData.scope
      });
      onClose();
    } catch (error) {
      console.error('Error updating template:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!template) return null;

  const isSaasTemplate = template.source === 'saas';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Edit Template
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Template Source Info */}
          {isSaasTemplate && (
            <div className="bg-muted/50 rounded-lg p-3">
              <Badge variant="secondary" className="text-sm">
                SaaS Template - Limited editing available
              </Badge>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
                disabled={isSaasTemplate}
                placeholder="Enter template name"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe what this template is used for..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="document_type">Document Type</Label>
              <Input
                id="document_type"
                value={formData.document_type}
                onChange={(e) => handleInputChange('document_type', e.target.value)}
                placeholder="e.g., SOP, Protocol, Form"
              />
            </div>
          </div>

          {/* Classification */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Classification</h4>
            
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <Label htmlFor="scope">Template Scope</Label>
                 <Select
                   value={formData.scope}
                   onValueChange={(value: 'company' | 'product' | 'both') => handleInputChange('scope', value)}
                 >
                   <SelectTrigger>
                     <SelectValue placeholder="Select scope" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="company">Company-wide</SelectItem>
                     <SelectItem value="product">Product-specific</SelectItem>
                     <SelectItem value="both">Both</SelectItem>
                   </SelectContent>
                 </Select>
               </div>

              <div>
                <Label htmlFor="template_category">Template Category</Label>
                <Select
                  value={formData.template_category}
                  onValueChange={(value) => handleInputChange('template_category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No category specified</SelectItem>
                    {Object.entries(TEMPLATE_CATEGORIES).map(([key, category]) => (
                      <SelectItem key={key} value={key}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>


          {/* File Information (Read-only) */}
          {template.file_path && (
            <div>
              <h4 className="font-medium text-sm mb-2">File Information</h4>
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">
                    {template.file_name || 'Template file'}
                  </span>
                </div>
                {template.file_size && (
                  <div className="text-sm text-muted-foreground">
                    Size: {(template.file_size / 1024).toFixed(1)} KB
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  File cannot be changed through editing - upload a new template to replace the file
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-4 border-t">
            <Button type="submit" disabled={isLoading || !formData.name.trim()}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}