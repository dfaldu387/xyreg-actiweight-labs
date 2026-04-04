import React, { useState, useEffect } from 'react';
import { Upload, X, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { 
  TemplateUploadData, 
  TemplateScope, 
  TemplateCategory, 
  TEMPLATE_CATEGORIES 
} from '@/types/templateManagement';
import { fetchTemplateSettings } from '@/utils/templateSettingsQueries';
import { CategoryNumberingConfig } from '@/types/documentCategories';
import { useAuth } from '@/context/AuthContext';

interface EnhancedTemplateUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (data: TemplateUploadData) => Promise<void>;
  isUploading?: boolean;
  companyId: string;
}

export function EnhancedTemplateUploadDialog({
  open,
  onOpenChange,
  onUpload,
  isUploading = false,
  companyId
}: EnhancedTemplateUploadDialogProps) {
  const [formData, setFormData] = useState<TemplateUploadData>({
    name: '',
    description: '',
    document_type: '',
    template_scope: undefined,
    template_category: undefined,
    file: null as any,
  });
  
  const [customCategories, setCustomCategories] = useState<CategoryNumberingConfig[]>([]);

  // Load custom categories when dialog opens
  useEffect(() => {
    if (open && companyId) {
      loadCustomCategories();
    }
  }, [open, companyId]);

  const loadCustomCategories = async () => {
    try {
      const settings = await fetchTemplateSettings(companyId);
      const categories: CategoryNumberingConfig[] = [];
      
      settings.forEach(setting => {
        if (setting.setting_key.startsWith('custom_category_')) {
          const value = setting.setting_value as any;
          if (value && typeof value === 'object') {
            categories.push({
              categoryKey: setting.setting_key.replace(/^custom_category_/, ''),
              categoryName: value.categoryName || value.categoryKey || 'Unknown',
              description: value.description,
              isCustom: setting.setting_key.startsWith('custom_category_'),
              prefix: value.prefix || 'DOC',
              numberFormat: value.numberFormat || 'XXX',
              startingNumber: value.startingNumber || '001',
              versionFormat: value.versionFormat || 'V1.0'
            });
          }
        }
      });
      
      setCustomCategories(categories);
    } catch (error) {
      console.error('Error loading custom categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.file || !formData.template_scope || !formData.template_category) {
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
    onOpenChange(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, file }));
    }
  };

  const selectedCategory = formData.template_category ? TEMPLATE_CATEGORIES[formData.template_category] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload New Template</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
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
                <Label htmlFor="scope">Template Scope *</Label>
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
                <Label htmlFor="category">Category *</Label>
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
                    
                    {/* Custom categories from Document Category & Numbering System */}
                    {customCategories.length > 0 && (
                      <>
                        <div className="px-2 py-1 text-xs font-medium text-muted-foreground border-t mt-1 pt-2">
                          Custom Categories
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
              <Label htmlFor="document_type">Document Sub-type</Label>
              <Input
                id="document_type"
                value={formData.document_type}
                onChange={(e) => setFormData(prev => ({ ...prev, document_type: e.target.value }))}
                placeholder="e.g., SOP-001, TEMP-006-A, FORM-021-A"
              />
              <p className="text-xs text-muted-foreground">
                Optional: More specific document identifier within the category
              </p>
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground">Template File</h3>
            
            <div className="space-y-2">
              <Label htmlFor="file">Upload File *</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  accept=".docx,.pdf,.xlsx,.pptx,.txt"
                  required
                />
                {formData.file && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, file: null as any }))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Supported formats: DOCX, PDF, XLSX, PPTX, TXT (max 20MB)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!formData.name || !formData.file || !formData.template_scope || !formData.template_category || isUploading}
            >
              {isUploading ? (
                <>
                  <Upload className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Template
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}