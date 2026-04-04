import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';
import { useCreateSiblingGroupRelationship, useUpdateSiblingGroupRelationship } from '@/hooks/useSiblingGroupRelationships';
import { useCreateProductAccessoryRelationship, useUpdateProductAccessoryRelationship } from '@/hooks/useProductRelationships';
import { useCreateProductSiblingGroupRelationship, useUpdateProductSiblingGroupRelationship } from '@/hooks/useProductSiblingGroupRelationships';
import { useCreateSiblingGroupProductRelationship, useUpdateSiblingGroupProductRelationship } from '@/hooks/useSiblingGroupProductRelationships';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const relationshipTypes = [
  { 
    value: 'accessory', 
    label: 'Accessory',
    description: 'Products that are typically purchased together with the main product (e.g., cables, sensors)'
  },
  { 
    value: 'bundle_item', 
    label: 'Bundle Item',
    description: 'Products included as part of a bundled package deal'
  },
  { 
    value: 'cross_sell', 
    label: 'Cross-sell',
    description: 'Related products that customers might be interested in based on their current purchase'
  },
  { 
    value: 'upsell', 
    label: 'Upsell',
    description: 'Higher-value alternatives or premium versions of the current product'
  },
];

interface RelationshipDefinitionDialogProps {
  open: boolean;
  onClose: () => void;
  companyId: string;
  initialData?: {
    mainGroupId?: string;
    accessoryGroupId?: string;
    existingRelationship?: any;
    mainIsProduct?: boolean;
    accessoryIsProduct?: boolean;
  };
  siblingGroups: any[];
  products: any[];
  onRelationshipCreated?: (relationshipId: string, sourceId: string, targetId: string, percentage: number, sourceIsProduct: boolean, targetIsProduct: boolean) => void;
}

export function RelationshipDefinitionDialog({
  open,
  onClose,
  companyId,
  initialData,
  siblingGroups,
  products,
  onRelationshipCreated,
}: RelationshipDefinitionDialogProps) {
  const createRelationship = useCreateSiblingGroupRelationship();
  const updateRelationship = useUpdateSiblingGroupRelationship();
  const createProductRelationship = useCreateProductAccessoryRelationship();
  const updateProductRelationship = useUpdateProductAccessoryRelationship();
  const createProductSiblingGroupRelationship = useCreateProductSiblingGroupRelationship();
  const updateProductSiblingGroupRelationship = useUpdateProductSiblingGroupRelationship();
  const createSiblingGroupProductRelationship = useCreateSiblingGroupProductRelationship();
  const updateSiblingGroupProductRelationship = useUpdateSiblingGroupProductRelationship();
  
  
  const isEditing = !!initialData?.existingRelationship;
  
  const [mainGroupId, setMainGroupId] = React.useState<string>(initialData?.mainGroupId || '');
  const [accessoryGroupId, setAccessoryGroupId] = React.useState<string>(initialData?.accessoryGroupId || '');
  const [relationshipType, setRelationshipType] = React.useState<string>(
    initialData?.existingRelationship?.relationship_type || 'accessory'
  );
  const [initialMultiplier, setInitialMultiplier] = React.useState<number>(
    initialData?.existingRelationship?.initial_multiplier || 1
  );
  const [recurringMultiplier, setRecurringMultiplier] = React.useState<number>(
    initialData?.existingRelationship?.recurring_multiplier || 0
  );
  const [recurringPeriod, setRecurringPeriod] = React.useState<string>(
    initialData?.existingRelationship?.recurring_period || 'monthly'
  );
  const [lifecycleDuration, setLifecycleDuration] = React.useState<number>(
    initialData?.existingRelationship?.lifecycle_duration_months || 12
  );
  const [revenueAttribution, setRevenueAttribution] = React.useState<number>(
    initialData?.existingRelationship?.revenue_attribution_percentage || 100
  );
  const [saving, setSaving] = React.useState(false);

  // Update local state when initialData changes
  React.useEffect(() => {
    if (initialData?.mainGroupId) setMainGroupId(initialData.mainGroupId);
    if (initialData?.accessoryGroupId) setAccessoryGroupId(initialData.accessoryGroupId);
    if (initialData?.existingRelationship) {
      const rel = initialData.existingRelationship;
      setRelationshipType(rel.relationship_type || 'accessory');
      setInitialMultiplier(rel.initial_multiplier || 1);
      setRecurringMultiplier(rel.recurring_multiplier || 0);
      setRecurringPeriod(rel.recurring_period || 'monthly');
      setLifecycleDuration(rel.lifecycle_duration_months || 12);
      setRevenueAttribution(rel.revenue_attribution_percentage || 100);
      
      // Extract main and accessory IDs from the relationship
      if (rel.main_sibling_group_id && rel.accessory_sibling_group_id) {
        // Sibling group to sibling group
        setMainGroupId(rel.main_sibling_group_id);
        setAccessoryGroupId(rel.accessory_sibling_group_id);
      } else if (rel.main_product_id && rel.accessory_product_id) {
        // Product to product
        setMainGroupId(rel.main_product_id);
        setAccessoryGroupId(rel.accessory_product_id);
      } else if (rel.main_product_id && rel.accessory_sibling_group_id) {
        // Product to sibling group
        setMainGroupId(rel.main_product_id);
        setAccessoryGroupId(rel.accessory_sibling_group_id);
      }
    }
  }, [initialData]);

  const handleSave = async () => {
    if (!mainGroupId || !accessoryGroupId) {
      toast.error('Please select both main and accessory groups');
      return;
    }

    setSaving(true);
    try {
      // Check if IDs correspond to products or sibling groups
      const mainIsProduct = products.some(p => p.id === mainGroupId);
      const accessoryIsProduct = products.some(p => p.id === accessoryGroupId);
      const mainIsSiblingGroup = siblingGroups.some(sg => sg.id === mainGroupId);
      const accessoryIsSiblingGroup = siblingGroups.some(sg => sg.id === accessoryGroupId);
      
      // Determine relationship type
      if (mainIsProduct && accessoryIsProduct) {
        // Product to Product relationship
        // Check for existing relationship if creating new
        if (!isEditing) {
          const { data: existing } = await supabase
            .from('product_accessory_relationships')
            .select('id')
            .eq('company_id', companyId)
            .eq('main_product_id', mainGroupId)
            .eq('accessory_product_id', accessoryGroupId)
            .maybeSingle();
          
          if (existing) {
            toast.info('This relationship already exists and is shown on the canvas', {
              description: 'You can edit it by double-clicking the connection line',
            });
            setSaving(false);
            onClose();
            return;
          }
        }
        
        // Save as product accessory relationship
        const productData = {
          company_id: companyId,
          main_product_id: mainGroupId,
          accessory_product_id: accessoryGroupId,
          relationship_type: relationshipType as any,
          revenue_attribution_percentage: revenueAttribution,
          is_required: true,
          typical_quantity: initialMultiplier,
          initial_multiplier: initialMultiplier,
          recurring_multiplier: recurringMultiplier,
          recurring_period: recurringPeriod as any,
          lifecycle_duration_months: lifecycleDuration,
          seasonality_factors: {},
          has_variant_distribution: false,
          distribution_method: 'fixed_percentages' as any,
        };

        if (isEditing) {
          await updateProductRelationship.mutateAsync({
            id: initialData.existingRelationship.id,
            ...productData,
          });
          toast.success('Product relationship updated successfully');
        } else {
          const result = await createProductRelationship.mutateAsync(productData);
          toast.success('Product relationship created successfully');
          // Notify parent to add edge to canvas
          if (onRelationshipCreated && result && typeof result === 'object' && 'id' in result) {
            onRelationshipCreated(result.id as string, mainGroupId, accessoryGroupId, revenueAttribution, true, true);
          }
        }
      } else if (mainIsProduct && accessoryIsSiblingGroup) {
        // Product to Sibling Group relationship
        if (!isEditing) {
          const { data: existing } = await supabase
            .from('product_sibling_group_relationships')
            .select('id')
            .eq('company_id', companyId)
            .eq('main_product_id', mainGroupId)
            .eq('accessory_sibling_group_id', accessoryGroupId)
            .maybeSingle();
          
          if (existing) {
            toast.info('This relationship already exists and is shown on the canvas', {
              description: 'You can edit it by double-clicking the connection line',
            });
            setSaving(false);
            onClose();
            return;
          }
        }
        
        const productSiblingGroupData = {
          company_id: companyId,
          main_product_id: mainGroupId,
          accessory_sibling_group_id: accessoryGroupId,
          relationship_type: relationshipType as any,
          revenue_attribution_percentage: revenueAttribution,
          is_required: true,
          typical_quantity: initialMultiplier,
          initial_multiplier: initialMultiplier,
          recurring_multiplier: recurringMultiplier,
          recurring_period: recurringPeriod as any,
          lifecycle_duration_months: lifecycleDuration,
          seasonality_factors: {},
        };

        if (isEditing) {
          await updateProductSiblingGroupRelationship.mutateAsync({
            id: initialData.existingRelationship.id,
            ...productSiblingGroupData,
          });
          toast.success('Product to sibling group relationship updated successfully');
        } else {
          const result = await createProductSiblingGroupRelationship.mutateAsync(productSiblingGroupData);
          toast.success('Product to sibling group relationship created successfully');
          // Notify parent to add edge to canvas
          if (onRelationshipCreated && result && typeof result === 'object' && 'id' in result) {
            onRelationshipCreated(result.id as string, mainGroupId, accessoryGroupId, revenueAttribution, true, false);
          }
        }
      } else if (mainIsSiblingGroup && accessoryIsSiblingGroup) {
        // Sibling Group to Sibling Group relationship
        // Check for existing relationship if creating new
        if (!isEditing) {
          const { data: existing } = await supabase
            .from('sibling_group_relationships')
            .select('id')
            .eq('company_id', companyId)
            .eq('main_sibling_group_id', mainGroupId)
            .eq('accessory_sibling_group_id', accessoryGroupId)
            .maybeSingle();
          
          if (existing) {
            toast.info('This relationship already exists and is shown on the canvas', {
              description: 'You can edit it by double-clicking the connection line',
            });
            setSaving(false);
            onClose();
            return;
          }
        }
        
        // Save as sibling group relationship (both are sibling groups)
        const data = {
          company_id: companyId,
          main_sibling_group_id: mainGroupId,
          accessory_sibling_group_id: accessoryGroupId,
          relationship_type: relationshipType as any,
          revenue_attribution_percentage: revenueAttribution,
          initial_multiplier: initialMultiplier,
          recurring_multiplier: recurringMultiplier,
          recurring_period: recurringPeriod as any,
          lifecycle_duration_months: lifecycleDuration,
          seasonality_factors: {},
        };

        if (isEditing) {
          await updateRelationship.mutateAsync({
            id: initialData.existingRelationship.id,
            ...data,
          });
          toast.success('Relationship updated successfully');
        } else {
          const result = await createRelationship.mutateAsync(data);
          toast.success('Relationship created successfully');
          // Notify parent to add edge to canvas
          if (onRelationshipCreated && result) {
            const relationshipId = (result as any).id;
            if (relationshipId) {
              onRelationshipCreated(relationshipId, mainGroupId, accessoryGroupId, revenueAttribution, false, false);
            }
          }
        }
      } else if (mainIsSiblingGroup && accessoryIsProduct) {
        // Sibling Group to Product relationship
        if (!isEditing) {
          const { data: existing } = await supabase
            .from('sibling_group_product_relationships')
            .select('id')
            .eq('company_id', companyId)
            .eq('main_sibling_group_id', mainGroupId)
            .eq('accessory_product_id', accessoryGroupId)
            .maybeSingle();
          
          if (existing) {
            toast.info('This relationship already exists and is shown on the canvas', {
              description: 'You can edit it by double-clicking the connection line',
            });
            setSaving(false);
            onClose();
            return;
          }
        }
        
        const siblingGroupProductData = {
          company_id: companyId,
          main_sibling_group_id: mainGroupId,
          accessory_product_id: accessoryGroupId,
          relationship_type: relationshipType as any,
          revenue_attribution_percentage: revenueAttribution,
          is_required: true,
          typical_quantity: initialMultiplier,
          initial_multiplier: initialMultiplier,
          recurring_multiplier: recurringMultiplier,
          recurring_period: recurringPeriod as any,
          lifecycle_duration_months: lifecycleDuration,
          seasonality_factors: {},
        };

        if (isEditing) {
          await updateSiblingGroupProductRelationship.mutateAsync({
            id: initialData.existingRelationship.id,
            ...siblingGroupProductData,
          });
          toast.success('Sibling group to product relationship updated successfully');
        } else {
          const result = await createSiblingGroupProductRelationship.mutateAsync(siblingGroupProductData);
          toast.success('Sibling group to product relationship created successfully');
          // Notify parent to add edge to canvas
          if (onRelationshipCreated && result && typeof result === 'object' && 'id' in result && result.id) {
            onRelationshipCreated(result.id as string, mainGroupId, accessoryGroupId, revenueAttribution, false, true);
          }
        }
      } else {
        // Invalid combination
        toast.error('Invalid relationship type.');
        setSaving(false);
        return;
      }

      onClose();
    } catch (error) {
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} relationship`);
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit' : 'Define'} Relationship</DialogTitle>
          <DialogDescription>
            Configure how accessory groups relate to main product groups, including variant distribution
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isEditing ? (
            <>
              <div className="space-y-2">
                <Label>Main Entity</Label>
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm font-medium">
                    {(() => {
                      const mainProduct = products.find(p => p.id === mainGroupId);
                      const mainGroup = siblingGroups.find(g => g.id === mainGroupId);
                      if (mainProduct) {
                        return `${mainProduct.name} ${mainProduct.model_reference ? `(${mainProduct.model_reference})` : ''}`;
                      }
                      if (mainGroup) {
                        return `${mainGroup.name} (${mainGroup.basic_udi_di})`;
                      }
                      return 'Unknown';
                    })()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {products.find(p => p.id === mainGroupId) ? 'Individual Product' : 'Sibling Group'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Accessory/Related Entity</Label>
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm font-medium">
                    {(() => {
                      const accessoryProduct = products.find(p => p.id === accessoryGroupId);
                      const accessoryGroup = siblingGroups.find(g => g.id === accessoryGroupId);
                      if (accessoryProduct) {
                        return `${accessoryProduct.name} ${accessoryProduct.model_reference ? `(${accessoryProduct.model_reference})` : ''}`;
                      }
                      if (accessoryGroup) {
                        return `${accessoryGroup.name} (${accessoryGroup.basic_udi_di})`;
                      }
                      return 'Unknown';
                    })()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {products.find(p => p.id === accessoryGroupId) ? 'Individual Product' : 'Sibling Group'}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Main Product Group</Label>
                <Select value={mainGroupId} onValueChange={setMainGroupId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select main group" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Sibling Groups</div>
                    {siblingGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name} ({group.basic_udi_di})
                      </SelectItem>
                    ))}
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">Individual Products</div>
                    {products.filter(p => !p.parent_product_id).map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} {product.model_reference ? `(${product.model_reference})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Accessory/Related Group</Label>
                <Select value={accessoryGroupId} onValueChange={setAccessoryGroupId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select accessory group" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Sibling Groups</div>
                    {siblingGroups
                      .filter((g) => g.id !== mainGroupId)
                      .map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name} ({group.basic_udi_di})
                        </SelectItem>
                      ))}
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">Individual Products</div>
                    {products.filter(p => !p.parent_product_id && p.id !== mainGroupId).map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} {product.model_reference ? `(${product.model_reference})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>Relationship Type</Label>
            <TooltipProvider>
              <Select value={relationshipType} onValueChange={setRelationshipType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {relationshipTypes.map((type) => (
                    <div key={type.value} className="flex items-center justify-between hover:bg-accent rounded-sm">
                      <SelectItem value={type.value} className="flex-1">
                        {type.label}
                      </SelectItem>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="px-2 py-1">
                            <HelpCircle className="h-3 w-3 text-muted-foreground" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <p className="text-xs">{type.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </TooltipProvider>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Initial Purchase Multiplier</Label>
              <Input
                type="number"
                min="0"
                step="0.1"
                value={initialMultiplier}
                onChange={(e) => setInitialMultiplier(parseFloat(e.target.value) || 0)}
                placeholder="e.g., 1"
              />
              <p className="text-xs text-muted-foreground">
                Units per main product at initial purchase
              </p>
            </div>

            <div className="space-y-2">
              <Label>Recurring Multiplier</Label>
              <Input
                type="number"
                min="0"
                step="0.1"
                value={recurringMultiplier}
                onChange={(e) => setRecurringMultiplier(parseFloat(e.target.value) || 0)}
                placeholder="e.g., 2"
              />
              <p className="text-xs text-muted-foreground">
                Units per main product for recurring purchases
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Recurring Period</Label>
              <Select value={recurringPeriod} onValueChange={setRecurringPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Lifecycle Duration (months)</Label>
              <Input
                type="number"
                min="1"
                value={lifecycleDuration}
                onChange={(e) => setLifecycleDuration(parseInt(e.target.value) || 12)}
                placeholder="e.g., 12"
              />
              <p className="text-xs text-muted-foreground">
                Expected relationship duration
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Revenue Attribution (%)</Label>
            <Input
              type="number"
              min="0"
              max="100"
              value={revenueAttribution}
              onChange={(e) => {
                const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                setRevenueAttribution(isNaN(val) ? 0 : val);
              }}
              placeholder="e.g., 100"
            />
            <p className="text-xs text-muted-foreground">
              Percentage of accessory revenue attributed to main product
            </p>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Update' : 'Create'} Relationship
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
