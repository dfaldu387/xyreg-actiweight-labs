import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Percent, TrendingUp } from 'lucide-react';
import { 
  useProductVariantDistributionSettings, 
  useCreateVariantDistributionSetting, 
  useUpdateVariantDistributionSetting, 
  useDeleteVariantDistributionSetting 
} from '@/hooks/useProductVariantDistributionSettings';
import { useProductVariants } from '@/hooks/useProductVariants';

interface Props {
  productId: string;
  companyId: string;
}

export function ProductVariantDistributionSettings({ productId, companyId }: Props) {
  const { data: settings = [], isLoading: settingsLoading } = useProductVariantDistributionSettings(productId);
  const { variants, loading: variantsLoading } = useProductVariants(productId);
  
  const createSetting = useCreateVariantDistributionSetting();
  const updateSetting = useUpdateVariantDistributionSetting();
  const deleteSetting = useDeleteVariantDistributionSetting();

  const totalPercentage = useMemo(() => {
    return settings.reduce((sum, setting) => sum + setting.distribution_percentage, 0);
  }, [settings]);

  const isValidDistribution = Math.abs(totalPercentage - 100) < 0.01;

  const handleCreateSetting = async (variantId: string, percentage: number) => {
    await createSetting.mutateAsync({
      company_id: companyId,
      product_id: productId,
      variant_id: variantId,
      distribution_percentage: percentage,
    });
  };

  const handleUpdateSetting = async (id: string, percentage: number) => {
    await updateSetting.mutateAsync({
      id,
      productId,
      data: { distribution_percentage: percentage }
    });
  };

  const handleDeleteSetting = async (id: string) => {
    await deleteSetting.mutateAsync({ id, productId });
  };

  const handleEqualDistribution = async () => {
    if (variants.length === 0) return;
    
    const equalPercentage = parseFloat((100 / variants.length).toFixed(2));
    const remainder = parseFloat((100 - (equalPercentage * variants.length)).toFixed(2));
    
    // Delete existing settings
    for (const setting of settings) {
      await deleteSetting.mutateAsync({ id: setting.id, productId });
    }
    
    // Create new equal distributions
    for (let i = 0; i < variants.length; i++) {
      const percentage = i === 0 ? equalPercentage + remainder : equalPercentage;
      await handleCreateSetting(variants[i].id, percentage);
    }
  };

  if (settingsLoading || variantsLoading) {
    return <div className="text-sm text-muted-foreground">Loading variant distribution settings...</div>;
  }

  if (variants.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <p>No variants found for this product.</p>
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
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Variant Sales Distribution
            </CardTitle>
            <CardDescription>
              Define expected sales distribution percentages across product variants for revenue analysis and forecasting
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Total:</span>
            <Badge variant={isValidDistribution ? "default" : "destructive"}>
              {totalPercentage.toFixed(2)}%
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Set distribution percentages to allocate product revenue across variants
          </p>
          <Button
            onClick={handleEqualDistribution}
            disabled={deleteSetting.isPending || createSetting.isPending}
            size="sm"
            variant="outline"
          >
            <Percent className="w-4 h-4 mr-2" />
            Apply Equal Split
          </Button>
        </div>

        <Separator />

        <div className="space-y-3">
          {variants.map((variant) => {
            const existingSetting = settings.find(s => s.variant_id === variant.id);
            
            return (
              <VariantPercentageRow
                key={variant.id}
                variant={variant}
                setting={existingSetting}
                onUpdate={handleUpdateSetting}
                onDelete={handleDeleteSetting}
                onCreate={handleCreateSetting}
              />
            );
          })}
        </div>

        {!isValidDistribution && (
          <div className="flex items-center space-x-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            <AlertCircle className="w-4 h-4" />
            <span>Total percentage must equal 100% for valid distribution. Current total: {totalPercentage.toFixed(2)}%</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface VariantPercentageRowProps {
  variant: any;
  setting?: any;
  onUpdate: (settingId: string, percentage: number) => Promise<void>;
  onDelete: (settingId: string) => Promise<void>;
  onCreate: (variantId: string, percentage: number) => Promise<void>;
}

function VariantPercentageRow({ variant, setting, onUpdate, onDelete, onCreate }: VariantPercentageRowProps) {
  const [percentage, setPercentage] = useState(setting?.distribution_percentage?.toString() || '0');
  const [isEditing, setIsEditing] = useState(!setting);

  const handleSave = async () => {
    const percentageValue = parseFloat(percentage) || 0;
    
    if (setting) {
      await onUpdate(setting.id, percentageValue);
    } else {
      await onCreate(variant.id, percentageValue);
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (setting) {
      await onDelete(setting.id);
    }
    setIsEditing(true);
    setPercentage('0');
  };

  return (
    <div className="flex items-center space-x-3 p-3 border rounded-lg bg-card">
      <div className="flex-1">
        <span className="text-sm font-medium">{variant.name || `Variant ${variant.id.slice(0, 8)}`}</span>
      </div>
      
      {isEditing ? (
        <div className="flex items-center space-x-2">
          <Input
            type="number"
            value={percentage}
            onChange={(e) => setPercentage(e.target.value)}
            placeholder="0.00"
            className="w-24 text-right"
            min="0"
            max="100"
            step="0.01"
          />
          <span className="text-sm text-muted-foreground">%</span>
          <Button 
            size="sm" 
            onClick={handleSave} 
            disabled={!percentage || parseFloat(percentage) < 0 || parseFloat(percentage) > 100}
          >
            Save
          </Button>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="text-sm">
            {setting?.distribution_percentage?.toFixed(2)}%
          </Badge>
          <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
          <Button size="sm" variant="ghost" onClick={handleDelete}>
            Remove
          </Button>
        </div>
      )}
    </div>
  );
}