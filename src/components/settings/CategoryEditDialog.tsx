import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CategoryNumberingConfig, DEFAULT_NUMBERING_CONFIG, NUMBER_FORMATS, VERSION_FORMATS } from '@/types/documentCategories';

interface CategoryEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: CategoryNumberingConfig;
  onSave: (category: CategoryNumberingConfig) => void;
  isEdit?: boolean;
}

export function CategoryEditDialog({ 
  open, 
  onOpenChange, 
  category, 
  onSave, 
  isEdit = false 
}: CategoryEditDialogProps) {
  const [formData, setFormData] = useState<CategoryNumberingConfig>(
    category || {
      categoryKey: '',
      categoryName: '',
      description: '',
      isCustom: true,
      ...DEFAULT_NUMBERING_CONFIG
    }
  );

  React.useEffect(() => {
    if (category) {
      setFormData(category);
    } else {
      setFormData({
        categoryKey: '',
        categoryName: '',
        description: '',
        isCustom: true,
        ...DEFAULT_NUMBERING_CONFIG
      });
    }
  }, [category]);

  const handleSave = () => {
    if (!formData.categoryName.trim()) return;
    
    // Generate category key from name if it's a new category
    const categoryKey = isEdit 
      ? formData.categoryKey 
      : formData.categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    
    onSave({
      ...formData,
      categoryKey,
      isCustom: !isEdit ? true : formData.isCustom
    });
    onOpenChange(false);
  };

  const generatePreview = (): string => {
    const numberExample = formData.numberFormat === 'XXX' ? '001' : 
                         formData.numberFormat === 'XXXX' ? '0001' : 
                         formData.numberFormat === 'XX-XX' ? '01-01' : '001';
    
    return `${formData.prefix}-${numberExample} ${formData.versionFormat}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit Category' : 'Add New Category'}
          </DialogTitle>
          <DialogDescription>
            {isEdit 
              ? 'Update the category settings and numbering configuration.'
              : 'Create a new document category with custom numbering configuration.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="categoryName">Category Name *</Label>
            <Input
              id="categoryName"
              value={formData.categoryName}
              onChange={(e) => setFormData(prev => ({ ...prev, categoryName: e.target.value }))}
              placeholder="Custom Document Category"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of this document category..."
              className="min-h-[60px]"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prefix">Prefix *</Label>
              <Input
                id="prefix"
                value={formData.prefix}
                onChange={(e) => setFormData(prev => ({ ...prev, prefix: e.target.value }))}
                placeholder="DOC"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="numberFormat">Number Format</Label>
              <Select 
                value={formData.numberFormat}
                onValueChange={(value) => setFormData(prev => ({ ...prev, numberFormat: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NUMBER_FORMATS.map(format => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startingNumber">Starting Number</Label>
              <Input
                id="startingNumber"
                value={formData.startingNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, startingNumber: e.target.value }))}
                placeholder="001"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="versionFormat">Version Format</Label>
              <Select 
                value={formData.versionFormat}
                onValueChange={(value) => setFormData(prev => ({ ...prev, versionFormat: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VERSION_FORMATS.map(format => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Preview:</span> 
              <span className="font-mono font-medium ml-2">
                {generatePreview()}
              </span>
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!formData.categoryName.trim() || !formData.prefix.trim()}
          >
            {isEdit ? 'Update Category' : 'Add Category'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}