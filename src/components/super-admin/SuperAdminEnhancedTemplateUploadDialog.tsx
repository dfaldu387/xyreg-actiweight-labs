import React, { useState, useEffect } from 'react';
import { Upload, X, Info, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { DocumentFileUpload } from '@/components/common/DocumentFileUpload';
import {
  TemplateUploadData,
  TemplateScope,
  TemplateCategory,
  TEMPLATE_CATEGORIES
} from '@/types/templateManagement';
import { fetchTemplateSettings } from '@/utils/templateSettingsQueries';
import { CategoryNumberingConfig } from '@/types/documentCategories';

interface SuperAdminEnhancedTemplateUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (data: TemplateUploadData) => Promise<void>;
  isUploading?: boolean;
  editingTemplate?: any;
}

export function SuperAdminEnhancedTemplateUploadDialog({
  open,
  onOpenChange,
  onUpload,
  isUploading = false,
  editingTemplate
}: SuperAdminEnhancedTemplateUploadDialogProps) {
  const [formData, setFormData] = useState<TemplateUploadData>({
    name: '',
    description: '',
    document_type: '',
    template_scope: undefined,
    template_category: undefined,
    file: null as any,
  });

  const [filePath, setFilePath] = useState<string | null>(null);
  const [customCategories, setCustomCategories] = useState<CategoryNumberingConfig[]>([]);

  // Load custom categories when dialog opens
  useEffect(() => {
    if (open) {
      loadCustomCategories();
    }
  }, [open]);

  // Set initial data when editing
  useEffect(() => {
    if (editingTemplate && open) {
      // Map scope field to template_scope
      const mappedScope = editingTemplate.scope === 'company' ? 'company-wide' :
        editingTemplate.scope === 'product' ? 'product-specific' :
          editingTemplate.scope === 'both' ? 'company-wide' : undefined;

      setFormData({
        name: editingTemplate.name || '',
        description: editingTemplate.description || '',
        document_type: editingTemplate.document_type || '',
        template_scope: mappedScope,
        template_category: editingTemplate.template_category || undefined,
        file: null as any, // Don't pre-populate file for editing
      });

      // Set file path if template has existing file
      setFilePath(editingTemplate.file_path || null);
    } else if (open) {
      // Reset form when opening for new template
      setFormData({
        name: '',
        description: '',
        document_type: '',
        template_scope: undefined,
        template_category: undefined,
        file: null as any,
      });
      setFilePath(null);
    }
  }, [editingTemplate, open]);

  const loadCustomCategories = async () => {
    try {
      // For SuperAdmin, we'll load from a default company or system-wide settings
      // This is a simplified version - in a real app, you might have system-wide template categories
      const categories: CategoryNumberingConfig[] = [
        {
          categoryKey: 'system-procedures',
          categoryName: 'System Procedures',
          description: 'System-wide procedures and policies',
          isCustom: false,
          prefix: 'SYS',
          numberFormat: 'XXX',
          startingNumber: '001',
          versionFormat: 'V1.0'
        },
        {
          categoryKey: 'compliance-templates',
          categoryName: 'Compliance Templates',
          description: 'Regulatory compliance templates',
          isCustom: false,
          prefix: 'COMP',
          numberFormat: 'XXX',
          startingNumber: '001',
          versionFormat: 'V1.0'
        }
      ];

      setCustomCategories(categories);
    } catch (error) {
      console.error('Error loading custom categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      return;
    }

    // For editing, file is optional
    if (!editingTemplate && !formData.file && !filePath) {
      return;
    }

    try {
      await onUpload(formData);
      handleClose();
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      document_type: '',
      template_scope: undefined,
      template_category: undefined,
      file: null as any,
    });
    setFilePath(null);
    onOpenChange(false);
  };

  const handleFileUpload = (file: File | null, uploadedPath?: string) => {
    setFormData(prev => ({ ...prev, file }));
    if (uploadedPath) {
      setFilePath(uploadedPath);
    } else if (file === null) {
      setFilePath(null);
    }
  };

  const selectedCategory = formData.template_category ? TEMPLATE_CATEGORIES[formData.template_category] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editingTemplate ? 'Edit Template' : 'Upload New Template'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className='max-h-[80vh] overflow-y-auto p-1'>
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground">Basic Information</h3>
              <div className="space-y-2">
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter template name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter template description"
                  rows={3}
                />
              </div>
            </div>

            {/* Classification */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground">Template Classification</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scope">Template Scope</Label>
                  <Select value={formData.template_scope} onValueChange={(value: TemplateScope) =>
                    setFormData(prev => ({ ...prev, template_scope: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select scope" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="company-wide">Company-wide</SelectItem>
                      <SelectItem value="product-specific">Product-specific</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.template_category} onValueChange={(value: TemplateCategory) =>
                    setFormData(prev => ({ ...prev, template_category: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Hardcoded system categories */}
                      {Object.entries(TEMPLATE_CATEGORIES).map(([key, category]) => (
                        <SelectItem key={key} value={key as TemplateCategory}>
                          {category.label}
                        </SelectItem>
                      ))}

                      {/* Custom categories for SuperAdmin */}
                      {customCategories.length > 0 && (
                        <>
                          <div className="px-2 py-1 text-xs font-medium text-muted-foreground border-t mt-1 pt-2">
                            System Categories
                          </div>
                          {customCategories.map((category) => (
                            <SelectItem key={category.categoryKey} value={category.categoryKey as TemplateCategory}>
                              {category.categoryName}
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Category Information */}
              {selectedCategory && (
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          {selectedCategory.description}
                        </p>
                        <div className="text-xs text-muted-foreground">
                          <strong>Examples:</strong> {selectedCategory.examples.join(', ')}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                <Label htmlFor="document_type">Document Type</Label>
                <Select value={formData.document_type} onValueChange={(value) =>
                  setFormData(prev => ({ ...prev, document_type: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SOP">SOP</SelectItem>
                    <SelectItem value="Form">Form</SelectItem>
                    <SelectItem value="List">List</SelectItem>
                    <SelectItem value="Certificate">Certificate</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Optional: Document type classification
                </p>
              </div>
            </div>

            {/* File Upload */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground">Template File</h3>

              <DocumentFileUpload
                onFileChange={handleFileUpload}
                disabled={isUploading}
                currentFile={editingTemplate?.file_path ? {
                  name: editingTemplate.file_name || 'Template File',
                  path: editingTemplate.file_path,
                  uploadedAt: editingTemplate.uploaded_at
                } : undefined}
              />

              {!editingTemplate && (
                <p className="text-xs text-muted-foreground">
                  * File upload is required for new templates
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!formData.name || isUploading || (!editingTemplate && !formData.file && !filePath)}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {editingTemplate ? 'Updating...' : 'Uploading...'}
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {editingTemplate ? 'Update Template' : 'Upload Template'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
