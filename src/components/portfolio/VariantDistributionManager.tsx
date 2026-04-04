import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, AlertCircle } from 'lucide-react';
import { useVariantDistributions, useCreateVariantDistribution, useUpdateVariantDistribution, useDeleteVariantDistribution, useUpdateRelationshipVariantDistribution } from '@/hooks/useVariantDistributions';
import { useProductVariants } from '@/hooks/useProductVariants';
import { ProductAccessoryRelationship } from '@/hooks/useProductRelationships';
import { ProductVariantDistribution } from '@/types/productVariantDistribution';

interface Props {
  relationship: ProductAccessoryRelationship;
  companyId: string;
}

export function VariantDistributionManager({ relationship, companyId }: Props) {
  const { data: distributions = [], isLoading: distributionsLoading } = useVariantDistributions(relationship.id);
  const { variants: mainProductVariants, loading: mainVariantsLoading } = useProductVariants(relationship.main_product_id);
  const { variants: accessoryVariants, loading: accessoryVariantsLoading } = useProductVariants(relationship.accessory_product_id);
  
  const createDistribution = useCreateVariantDistribution();
  const updateDistribution = useUpdateVariantDistribution();
  const deleteDistribution = useDeleteVariantDistribution();
  const updateRelationship = useUpdateRelationshipVariantDistribution();

  const [isEnabled, setIsEnabled] = useState((relationship as any).has_variant_distribution || false);
  const [distributionMethod, setDistributionMethod] = useState<'fixed_percentages' | 'conditional_logic' | 'equal_distribution'>(
    (relationship as any).distribution_method || 'fixed_percentages'
  );

  // Calculate total percentage
  const totalPercentage = useMemo(() => {
    return distributions.reduce((sum, dist) => sum + dist.distribution_percentage, 0);
  }, [distributions]);

  const isValidDistribution = totalPercentage === 100;

  const handleEnableChange = async (enabled: boolean) => {
    setIsEnabled(enabled);
    await updateRelationship.mutateAsync({
      relationshipId: relationship.id,
      hasVariantDistribution: enabled,
      distributionMethod: distributionMethod
    });
  };

  const handleMethodChange = async (method: 'fixed_percentages' | 'conditional_logic' | 'equal_distribution') => {
    setDistributionMethod(method);
    await updateRelationship.mutateAsync({
      relationshipId: relationship.id,
      hasVariantDistribution: isEnabled,
      distributionMethod: method
    });
  };

  const handleAddDistribution = async (targetVariantId: string, percentage: number) => {
    await createDistribution.mutateAsync({
      relationship_id: relationship.id,
      target_variant_id: targetVariantId,
      distribution_percentage: percentage,
      distribution_method: distributionMethod
    });
  };

  const handleUpdateDistribution = async (distributionId: string, percentage: number) => {
    await updateDistribution.mutateAsync({
      id: distributionId,
      data: { distribution_percentage: percentage }
    });
  };

  const handleDeleteDistribution = async (distributionId: string) => {
    await deleteDistribution.mutateAsync(distributionId);
  };

  const handleEqualDistribution = async () => {
    if (accessoryVariants.length === 0) return;
    
    const equalPercentage = Math.floor(100 / accessoryVariants.length);
    const remainder = 100 - (equalPercentage * accessoryVariants.length);
    
    // Delete existing distributions
    for (const dist of distributions) {
      await deleteDistribution.mutateAsync(dist.id);
    }
    
    // Create new equal distributions
    for (let i = 0; i < accessoryVariants.length; i++) {
      const percentage = i === 0 ? equalPercentage + remainder : equalPercentage;
      await handleAddDistribution(accessoryVariants[i].id, percentage);
    }
  };

  if (distributionsLoading || mainVariantsLoading || accessoryVariantsLoading) {
    return <div className="text-sm text-muted-foreground">Loading variant distributions...</div>;
  }

  if (accessoryVariants.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <p>No variants found for the accessory product.</p>
            <p className="text-xs mt-1">Create product variants first to set up distribution percentages.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Variant Distribution</CardTitle>
          <div className="flex items-center space-x-2">
            <Label htmlFor="enable-distribution" className="text-sm">Enable</Label>
            <Switch
              id="enable-distribution"
              checked={isEnabled}
              onCheckedChange={handleEnableChange}
              disabled={updateRelationship.isPending}
            />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Define how different variants of the accessory product are distributed in relation to the main product.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {isEnabled && (
          <>
            <div className="space-y-2">
              <Label>Distribution Method</Label>
              <Select value={distributionMethod} onValueChange={handleMethodChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed_percentages">Fixed Percentages</SelectItem>
                  <SelectItem value="equal_distribution">Equal Distribution</SelectItem>
                  <SelectItem value="conditional_logic" disabled>
                    Conditional Logic (Coming Soon)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {distributionMethod === 'fixed_percentages' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Variant Percentages</h4>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">Total:</span>
                    <Badge variant={isValidDistribution ? "default" : "destructive"}>
                      {totalPercentage}%
                    </Badge>
                    {!isValidDistribution && (
                      <AlertCircle className="w-4 h-4 text-destructive" />
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {accessoryVariants.map((variant) => {
                    const existingDistribution = distributions.find(d => d.target_variant_id === variant.id);
                    
                    return (
                      <VariantPercentageRow
                        key={variant.id}
                        variant={variant}
                        distribution={existingDistribution}
                        onUpdate={handleUpdateDistribution}
                        onDelete={handleDeleteDistribution}
                        onAdd={handleAddDistribution}
                      />
                    );
                  })}
                </div>

                {!isValidDistribution && (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                    <AlertCircle className="w-4 h-4" />
                    <span>Total percentage must equal 100% for valid distribution.</span>
                  </div>
                )}
              </div>
            )}

            {distributionMethod === 'equal_distribution' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Equal Distribution</h4>
                    <p className="text-sm text-muted-foreground">
                      Each variant gets an equal share ({Math.floor(100 / accessoryVariants.length)}% each)
                    </p>
                  </div>
                  <Button
                    onClick={handleEqualDistribution}
                    disabled={deleteDistribution.isPending || createDistribution.isPending}
                    size="sm"
                  >
                    Apply Equal Split
                  </Button>
                </div>

                {distributions.length > 0 && (
                  <div className="space-y-2">
                    {distributions.map((dist) => {
                      const variant = accessoryVariants.find(v => v.id === dist.target_variant_id);
                      return (
                        <div key={dist.id} className="flex items-center justify-between p-2 bg-muted rounded">
                          <span className="text-sm">{variant?.name || 'Unknown Variant'}</span>
                          <Badge>{dist.distribution_percentage}%</Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {!isEnabled && (
          <div className="text-center text-muted-foreground py-8">
            <p>Enable variant distribution to configure percentage-based attribution for accessory variants.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface VariantPercentageRowProps {
  variant: any;
  distribution?: ProductVariantDistribution;
  onUpdate: (distributionId: string, percentage: number) => Promise<void>;
  onDelete: (distributionId: string) => Promise<void>;
  onAdd: (variantId: string, percentage: number) => Promise<void>;
}

function VariantPercentageRow({ variant, distribution, onUpdate, onDelete, onAdd }: VariantPercentageRowProps) {
  const [percentage, setPercentage] = useState(distribution?.distribution_percentage?.toString() || '0');
  const [isEditing, setIsEditing] = useState(!distribution);

  const handleSave = async () => {
    const percentageValue = parseFloat(percentage) || 0;
    
    if (distribution) {
      await onUpdate(distribution.id, percentageValue);
    } else {
      await onAdd(variant.id, percentageValue);
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (distribution) {
      await onDelete(distribution.id);
    }
    setIsEditing(true);
    setPercentage('0');
  };

  return (
    <div className="flex items-center space-x-3 p-3 border rounded-lg">
      <div className="flex-1">
        <span className="text-sm font-medium">{variant.name}</span>
      </div>
      
      {isEditing ? (
        <div className="flex items-center space-x-2">
          <Input
            type="number"
            value={percentage}
            onChange={(e) => setPercentage(e.target.value)}
            placeholder="0"
            className="w-20 text-center"
            min="0"
            max="100"
            step="0.01"
          />
          <span className="text-sm">%</span>
          <Button size="sm" onClick={handleSave} disabled={!percentage || parseFloat(percentage) < 0}>
            Save
          </Button>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">{distribution?.distribution_percentage}%</Badge>
          <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
          <Button size="sm" variant="ghost" onClick={handleDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}