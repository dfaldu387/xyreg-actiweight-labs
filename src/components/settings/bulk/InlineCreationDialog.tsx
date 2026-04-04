import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { CompanyDeviceCategoriesService } from '@/services/companyDeviceCategoriesService';
import { CompanyPlatformService } from '@/services/companyPlatformService';
import { CompanyProductModelsService } from '@/services/companyProductModelsService';
import { useVariationDimensions } from '@/hooks/useVariationDimensions';
import { Tag, Layers, Box, Package } from 'lucide-react';

type CreationType = 'category' | 'platform' | 'model' | 'variation';

interface InlineCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  onSuccess: () => void;
  defaultType?: CreationType;
}

export function InlineCreationDialog({
  open,
  onOpenChange,
  companyId,
  onSuccess,
  defaultType = 'category'
}: InlineCreationDialogProps) {
  const [type, setType] = useState<CreationType>(defaultType);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  const { createDimension } = useVariationDimensions(companyId);

  const resetForm = () => {
    setName('');
    setDescription('');
    setType(defaultType);
  };

  const handleCreate = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error('Name is required');
      return;
    }

    setIsCreating(true);
    try {
      switch (type) {
        case 'category':
          await CompanyDeviceCategoriesService.createDeviceCategory({
            company_id: companyId,
            name: trimmedName,
            description: description.trim() || undefined
          });
          toast.success('Device category created successfully');
          break;

        case 'platform':
          await CompanyPlatformService.createPlatform(companyId, {
            name: trimmedName,
            description: description.trim() || undefined
          });
          toast.success('Product platform created successfully');
          break;

        case 'model':
          await CompanyProductModelsService.createModel(companyId, {
            name: trimmedName,
            description: description.trim() || undefined
          });
          toast.success('Product model created successfully');
          break;

        case 'variation':
          await createDimension(trimmedName);
          // Success toast is handled by the hook
          break;

        default:
          throw new Error('Invalid creation type');
      }

      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Creation failed:', error);
      toast.error(`Failed to create ${type}: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    onOpenChange(false);
  };

  const getTypeConfig = (type: CreationType) => {
    switch (type) {
      case 'category':
        return {
          title: 'Create Device Category',
          icon: Tag,
          placeholder: 'e.g., Cardiovascular Devices, Orthopedic Implants',
          showDescription: true
        };
      case 'platform':
        return {
          title: 'Create Product Platform',
          icon: Layers,
          placeholder: 'e.g., X-Series Platform, Advanced Platform',
          showDescription: true
        };
      case 'model':
        return {
          title: 'Create Product Model',
          icon: Box,
          placeholder: 'e.g., Model-X100, Pro Series',
          showDescription: true
        };
      case 'variation':
        return {
          title: 'Create Variation Dimension',
          icon: Package,
          placeholder: 'e.g., Size, Color, Configuration',
          showDescription: false
        };
    }
  };

  const config = getTypeConfig(type);
  const Icon = config.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            Add to Portfolio
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="creation-type">Type</Label>
            <Select value={type} onValueChange={(value: CreationType) => setType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="category">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Device Category
                  </div>
                </SelectItem>
                <SelectItem value="platform">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    Product Platform
                  </div>
                </SelectItem>
                <SelectItem value="model">
                  <div className="flex items-center gap-2">
                    <Box className="h-4 w-4" />
                    Product Model
                  </div>
                </SelectItem>
                <SelectItem value="variation">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Variation Dimension
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="item-name">Name *</Label>
            <Input
              id="item-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={config.placeholder}
              disabled={isCreating}
            />
          </div>

          {config.showDescription && (
            <div>
              <Label htmlFor="item-description">Description</Label>
              <Textarea
                id="item-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                disabled={isCreating}
                rows={2}
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={handleCancel} disabled={isCreating}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating ? 'Creating...' : `Create ${type.charAt(0).toUpperCase() + type.slice(1)}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}