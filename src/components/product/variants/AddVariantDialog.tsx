import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GripVertical, Trash2, Plus, Database, Loader2, Package } from 'lucide-react';
import { toast } from 'sonner';
import { useVariationDimensions, VariationDimension, VariationOption } from '@/hooks/useVariationDimensions';
import { useProductVariants, ProductVariant, VariantValueRow } from '@/hooks/useProductVariants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';

interface AddVariantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  companyId: string;
}

interface LocalDimension {
  id: string;
  name: string;
  isNew?: boolean;
  options: LocalOption[];
}

interface LocalOption {
  id: string;
  name: string;
  isNew?: boolean;
}

export function AddVariantDialog({
  open,
  onOpenChange,
    productId,
  companyId,
}: AddVariantDialogProps) {
  // Use variation dimensions hook for dynamic data
  const {
    dimensions: dbDimensions,
    optionsByDimension,
    loading: dimensionsLoading,
    createDimension,
    updateDimension,
    deleteDimension,
    createOption,
    deleteOption,
    refresh: refreshDimensions
  } = useVariationDimensions(companyId);

  // Use product variants hook to fetch existing variants
  const {
    variants: productVariants,
    values: variantValues,
    loading: variantsLoading,
    creating: variantCreating,
    refresh: refreshVariants,
    createVariant,
    deleteVariant,
    setVariantOption
  } = useProductVariants(productId);

  const [newDimensions, setNewDimensions] = useState<LocalDimension[]>([]);
  const [newOptionInputs, setNewOptionInputs] = useState<Record<string, string>>({});
  const [editingDimensions, setEditingDimensions] = useState<Record<string, string>>({});
  const [newVariantSelections, setNewVariantSelections] = useState<Record<string, string>>({}); // dimensionId -> optionId
  const [newVariantName, setNewVariantName] = useState<string>('');
  const [newVariantDescription, setNewVariantDescription] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'variants' | 'dimensions'>('variants');

  // Combine database dimensions with new (unsaved) dimensions
  const localDimensions = useMemo(() => {
    // Map database dimensions to LocalDimension format
    const dbDims: LocalDimension[] = dbDimensions.map(dim => ({
      id: dim.id,
      name: dim.name,
      isNew: false,
      options: (optionsByDimension[dim.id] || []).map(opt => ({
        id: opt.id,
        name: opt.name,
        isNew: false
      }))
    }));

    return [...dbDims, ...newDimensions];
  }, [dbDimensions, optionsByDimension, newDimensions]);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setNewOptionInputs({});
      setNewDimensions([]);
      setEditingDimensions({});
      setNewVariantSelections({});
      setNewVariantName('');
      setNewVariantDescription('');
      setActiveTab('variants');
    } else {
      // Refresh data when dialog opens
      refreshDimensions();
      refreshVariants();
    }
  }, [open]);

  // Get variant values grouped by variant ID
  const variantValuesByVariant = useMemo(() => {
    const grouped: Record<string, Record<string, string>> = {}; // variantId -> { dimensionId: optionId }
    variantValues.forEach(val => {
      if (!grouped[val.product_variant_id]) {
        grouped[val.product_variant_id] = {};
      }
      if (val.option_id) {
        grouped[val.product_variant_id][val.dimension_id] = val.option_id;
      }
    });
    return grouped;
  }, [variantValues]);

  // Generate variant display name from selected options
  const getVariantDisplayName = (variant: ProductVariant): string => {
    const selections = variantValuesByVariant[variant.id] || {};
    const optionNames: string[] = [];

    dbDimensions.forEach(dim => {
      const optionId = selections[dim.id];
      if (optionId) {
        const option = optionsByDimension[dim.id]?.find(opt => opt.id === optionId);
        if (option) {
          optionNames.push(`${dim.name}: ${option.name}`);
        }
      }
    });

    if (optionNames.length > 0) {
      return optionNames.join(', ');
    }
    return variant.name || `Variant ${variant.id.slice(0, 8)}`;
  };

  // Handle creating a new variant
  const handleCreateVariant = async () => {
    if (!productId) return;

    // Check if at least one dimension has an option selected
    const hasSelections = Object.values(newVariantSelections).some(optId => optId && optId !== '' && optId !== '__none__');
    if (!hasSelections) {
      toast.error('Please select at least one option for the variant');
      return;
    }

    // Generate variant name
    const variantName = newVariantName.trim() || (() => {
      const optionNames: string[] = [];
      dbDimensions.forEach(dim => {
        const optionId = newVariantSelections[dim.id];
        if (optionId && optionId !== '' && optionId !== '__none__') {
          const option = optionsByDimension[dim.id]?.find(opt => opt.id === optionId);
          if (option) {
            optionNames.push(option.name);
          }
        }
      });
      return optionNames.join(' - ') || `Variant ${(productVariants?.length || 0) + 1}`;
    })();

    try {
      // Get current product's basic_udi_di and company_id
      const { data: currentProduct, error: productError } = await supabase
        .from('products')
        .select('basic_udi_di, company_id, name, trade_name, model_reference, device_category, status, model_id')
        .eq('id', productId)
        .single();

      if (productError) {
        console.error('Error fetching current product:', productError);
        toast.error('Failed to fetch product information');
        return;
      }

      // Create the variant configuration
      const newVariant = await createVariant(variantName, newVariantDescription.trim() || undefined);
      if (!newVariant) return;

      // Set variant options for each dimension
      for (const [dimensionId, optionId] of Object.entries(newVariantSelections)) {
        if (optionId && optionId !== '' && optionId !== '__none__') {
          await setVariantOption(newVariant.id, dimensionId, optionId);
        }
      }

      // Create a sibling product (shown in dropdown) if basic_udi_di exists
      if (currentProduct?.basic_udi_di) {
        try {
          // Generate product name from variant name
          const productName = variantName ? `${currentProduct.name} - ${variantName}` : `${currentProduct.name} - Variant`;
          
          // Create new product with same basic_udi_di
          const { data: newProduct, error: newProductError } = await supabase
            .from('products')
            .insert({
              company_id: currentProduct.company_id,
              name: newVariantName,
              trade_name: currentProduct.trade_name || null,
              basic_udi_di: currentProduct.basic_udi_di,
              model_reference: currentProduct.model_reference || null,
              device_category: currentProduct.device_category || null,
              status: currentProduct.status || 'Planning',
              is_archived: false,
              model_id: currentProduct.model_id || null,
            })
            .select('id')
            .single();

          if (newProductError) {
            console.error('Error creating sibling device:', newProductError);
            // Don't fail the whole operation if product creation fails
            toast.warning('Variant created, but failed to create sibling device');
          } else if (newProduct) {
            // Link the variant to the new product
            const { error: linkError } = await supabase
              .from('product_variants')
              .update({ product_id: newProduct.id })
              .eq('id', newVariant.id);

            if (linkError) {
              console.error('Error linking variant to device:', linkError);
            } else {
              toast.success('Variant and sibling device created successfully');
            }
          }
        } catch (siblingError) {
          console.error('Error creating sibling device:', siblingError);
          // Don't fail the whole operation
          toast.warning('Variant created, but failed to create sibling device');
        }
      } else {
        toast.success('Variant created successfully');
      }

      // Reset form
      setNewVariantSelections({});
      setNewVariantName('');
      setNewVariantDescription('');
    } catch (error) {
      console.error('Error creating variant:', error);
      toast.error('Failed to create variant');
    }
  };

  // Handle updating variant option
  const handleUpdateVariantOption = async (variantId: string, dimensionId: string, optionId: string) => {
    await setVariantOption(variantId, dimensionId, optionId === '__none__' || optionId === '' ? null : optionId);
  };

  const handleAddDimension = () => {
    const newDim: LocalDimension = {
      id: `temp-${Date.now()}`,
      name: '',
      isNew: true,
      options: [],
    };
    setNewDimensions([...newDimensions, newDim]);
  };

  const handleDimensionNameChange = (dimId: string, name: string) => {
    // Check if it's a new dimension
    const isNewDim = newDimensions.some(d => d.id === dimId);
    if (isNewDim) {
      setNewDimensions(
        newDimensions.map((dim) =>
          dim.id === dimId ? { ...dim, name } : dim
        )
      );
    } else {
      // Track editing state for database dimensions
      setEditingDimensions({
        ...editingDimensions,
        [dimId]: name
      });
    }
  };

  const handleDeleteDimension = async (dimId: string) => {
    const dim = localDimensions.find((d) => d.id === dimId);
    if (!dim) return;

    // Check if it's a new (unsaved) dimension
    const isNewDim = newDimensions.some(d => d.id === dimId);
    if (isNewDim) {
      // Just remove from local state
      setNewDimensions(newDimensions.filter((d) => d.id !== dimId));
    } else {
      // Delete from database
      await deleteDimension(dimId);
    }
  };

  const handleAddOption = (dimId: string) => {
    setNewOptionInputs({
      ...newOptionInputs,
      [dimId]: '',
    });
  };

  const handleOptionInputChange = (dimId: string, value: string) => {
    setNewOptionInputs({
      ...newOptionInputs,
      [dimId]: value,
    });
  };

  const handleSaveOption = async (dimId: string, optionName: string) => {
    if (!optionName.trim()) {
      // Clear empty input
      const newInputs = { ...newOptionInputs };
      delete newInputs[dimId];
      setNewOptionInputs(newInputs);
      return;
    }

    const dim = localDimensions.find((d) => d.id === dimId);
    if (!dim) return;

    // If dimension is new, we need to save it first
    if (dim.isNew) {
      // Get the current name (may have been edited)
      const currentDimName = dim.name.trim();
      if (!currentDimName) {
        toast.error('Please enter a dimension name first');
        const newInputs = { ...newOptionInputs };
        delete newInputs[dimId];
        setNewOptionInputs(newInputs);
        return;
      }

      // Save dimension to database first
      const savedDim = await createDimension(currentDimName);
      if (!savedDim) {
        const newInputs = { ...newOptionInputs };
        delete newInputs[dimId];
        setNewOptionInputs(newInputs);
        return;
      }

      // Remove from newDimensions and it will appear in dbDimensions after refresh
      setNewDimensions(newDimensions.filter((d) => d.id !== dimId));

      // Now create the option for the saved dimension
      await createOption(savedDim.id, optionName);

      // Clear the input
      const newInputs = { ...newOptionInputs };
      delete newInputs[dimId];
      setNewOptionInputs(newInputs);
      return;
    }

    // Dimension is already saved, create option in database
    await createOption(dimId, optionName);

    // Clear the input
    const newInputs = { ...newOptionInputs };
    delete newInputs[dimId];
    setNewOptionInputs(newInputs);
  };

  const handleDeleteOption = async (dimId: string, optionId: string) => {
    const dim = localDimensions.find((d) => d.id === dimId);
    if (!dim) return;

    // Check if it's a new (unsaved) dimension
    const isNewDim = newDimensions.some(d => d.id === dimId);
    if (isNewDim) {
      // Remove from local state
      setNewDimensions(
        newDimensions.map((d) =>
          d.id === dimId
            ? {
              ...d,
              options: d.options.filter((o) => o.id !== optionId),
            }
            : d
        )
      );
    } else {
      // Delete from database
      await deleteOption(optionId);
    }
  };

  const handleSaveDimension = async (dimId: string) => {
    const dim = localDimensions.find((d) => d.id === dimId);
    if (!dim) return;

    // Get the current name (edited or original)
    const currentName = editingDimensions[dimId] !== undefined
      ? editingDimensions[dimId]
      : dim.name;

    if (!currentName.trim()) {
      toast.error('Please enter a dimension name');
      return;
    }

    // Check if it's a new dimension
    const isNewDim = newDimensions.some(d => d.id === dimId);
    if (isNewDim) {
      // Save new dimension to database
      const savedDim = await createDimension(currentName);
      if (savedDim) {
        // Remove from newDimensions - it will appear in dbDimensions after refresh
        setNewDimensions(newDimensions.filter((d) => d.id !== dimId));
      }
    } else {
      // Update existing dimension in database if name changed
      if (currentName !== dim.name) {
        await updateDimension(dimId, currentName);
        // Clear editing state
        const newEditing = { ...editingDimensions };
        delete newEditing[dimId];
        setEditingDimensions(newEditing);
      }
    }
  };

  const handleDone = async () => {
    // Save any pending dimensions
    const pendingDims = newDimensions.filter((d) => d.name.trim());
    if (pendingDims.length > 0) {
      // Try to save all pending dimensions
      for (const dim of pendingDims) {
        await createDimension(dim.name);
      }
      // Wait a bit for the refresh to complete
      setTimeout(() => {
        onOpenChange(false);
      }, 500);
      return;
    }

    // Save any pending dimension name edits
    const pendingEdits = Object.entries(editingDimensions);
    if (pendingEdits.length > 0) {
      for (const [dimId, name] of pendingEdits) {
        if (name.trim()) {
          await updateDimension(dimId, name);
        }
      }
      setTimeout(() => {
        onOpenChange(false);
      }, 500);
      return;
    }

    onOpenChange(false);
  };

  const loading = dimensionsLoading || variantsLoading;

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Variants</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Variants & Dimensions</DialogTitle>
          <DialogDescription>
            Manage product variants and variation dimensions
          </DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-2 border-b">
          <button
            type="button"
            onClick={() => setActiveTab('variants')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'variants'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <Package className="h-4 w-4 inline-block mr-2" />
            Variants ({productVariants?.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('dimensions')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'dimensions'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            Dimensions ({localDimensions.length})
          </button>
        </div>

        <div className="space-y-6 py-4">
          {/* Variants Tab */}
          {activeTab === 'variants' && (
            <>
              {/* Existing Variants */}
              {productVariants && productVariants.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Existing Variants</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {productVariants.map((variant) => {
                      const selections = variantValuesByVariant[variant.id] || {};
                      return (
                        <div key={variant.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{variant.name || 'Unnamed Variant'}</span>
                              <Badge variant="outline" className="text-xs">
                                {variant.status}
                              </Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => deleteVariant(variant.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Variant Options */}
                          {dbDimensions.length > 0 && (
                            <div className="space-y-2">
                              {dbDimensions.map((dim) => {
                                const selectedOptionId = selections[dim.id] || '__none__';
                                const options = optionsByDimension[dim.id] || [];

                                return (
                                  <div key={dim.id} className="flex items-center gap-2">
                                    <Label className="w-32 text-sm text-muted-foreground">
                                      {dim.name}:
                                    </Label>
                                    <Select
                                      value={selectedOptionId}
                                      onValueChange={(value) =>
                                        handleUpdateVariantOption(variant.id, dim.id, value)
                                      }
                                    >
                                      <SelectTrigger className="flex-1">
                                        <SelectValue placeholder={`Select ${dim.name}`} />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="__none__">None</SelectItem>
                                        {options.map((opt) => (
                                          <SelectItem key={opt.id} value={opt.id}>
                                            {opt.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Display selected options */}
                          {Object.keys(selections).length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-2 border-t">
                              {dbDimensions.map((dim) => {
                                const optionId = selections[dim.id];
                                if (!optionId) return null;
                                const option = optionsByDimension[dim.id]?.find(opt => opt.id === optionId);
                                if (!option) return null;
                                return (
                                  <Badge key={dim.id} variant="secondary" className="text-xs">
                                    {dim.name}: {option.name}
                                  </Badge>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {/* Create New Variant */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Create New Variant</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dbDimensions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No dimensions available. Please add dimensions first.</p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => setActiveTab('dimensions')}
                      >
                        Go to Dimensions
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="variant-name">Variant Name</Label>
                        <Input
                          id="variant-name"
                          value={newVariantName}
                          onChange={(e) => setNewVariantName(e.target.value)}
                          placeholder="Leave empty to auto-generate from selections"
                        />
                        <p className="text-xs text-muted-foreground">
                          If left empty, name will be generated from selected options
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="variant-description">Description</Label>
                        <Textarea
                          id="variant-description"
                          value={newVariantDescription}
                          onChange={(e) => setNewVariantDescription(e.target.value)}
                          placeholder="Enter a description for this variant"
                          rows={3}
                        />
                      </div>

                      <Separator />

                      <div className="space-y-3">
                        <Label>Select Options for Each Dimension</Label>
                        {dbDimensions.map((dim) => {
                          const options = optionsByDimension[dim.id] || [];
                          const selectedOptionId = newVariantSelections[dim.id] || '__none__';

                          return (
                            <div key={dim.id} className="flex items-center gap-2">
                              <Label className="w-32 text-sm">{dim.name}:</Label>
                              <Select
                                value={selectedOptionId}
                                onValueChange={(value) =>
                                  setNewVariantSelections({
                                    ...newVariantSelections,
                                    [dim.id]: value
                                  })
                                }
                              >
                                <SelectTrigger className="flex-1">
                                  <SelectValue placeholder={`Select ${dim.name}`} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="__none__">None</SelectItem>
                                  {options.map((opt) => (
                                    <SelectItem key={opt.id} value={opt.id}>
                                      {opt.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          );
                        })}
                      </div>

                      <Button
                        onClick={handleCreateVariant}
                        disabled={variantCreating || Object.values(newVariantSelections).every(v => !v || v === '' || v === '__none__')}
                        className="w-full"
                      >
                        {variantCreating ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Variant
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Dimensions Tab */}
          {activeTab === 'dimensions' && (
            <>
              {localDimensions.map((dimension) => (
                <div key={dimension.id} className="space-y-4 border rounded-lg p-4">
                  {/* Option name section */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Option name</label>
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-5 w-5 text-muted-foreground" />
                      <Input
                        value={editingDimensions[dimension.id] !== undefined
                          ? editingDimensions[dimension.id]
                          : dimension.name}
                        onChange={(e) =>
                          handleDimensionNameChange(dimension.id, e.target.value)
                        }
                        onBlur={async () => {
                          const currentName = editingDimensions[dimension.id] !== undefined
                            ? editingDimensions[dimension.id]
                            : dimension.name;
                          if (currentName.trim()) {
                            await handleSaveDimension(dimension.id);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.currentTarget.blur();
                          }
                        }}
                        placeholder="e.g., Color"
                        className="flex-1"
                      />
                      {!dimension.isNew && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9"
                          disabled
                          title="Saved"
                        >
                          <Database className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Option values section */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Option values</label>
                    <div className="space-y-2">
                      {dimension.options.map((option) => (
                        <div key={option.id} className="flex items-center gap-2">
                          <GripVertical className="h-5 w-5 text-muted-foreground" />
                          <Input
                            value={option.name}
                            readOnly
                            className="flex-1 bg-background border-input"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-destructive hover:text-destructive"
                            onClick={() =>
                              handleDeleteOption(dimension.id, option.id)
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}

                      {/* Add another value input */}
                      {newOptionInputs[dimension.id] !== undefined ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5" /> {/* Spacer for alignment */}
                          <Input
                            value={newOptionInputs[dimension.id] || ''}
                            onChange={(e) =>
                              handleOptionInputChange(
                                dimension.id,
                                e.target.value
                              )
                            }
                            onKeyDown={async (e) => {
                              if (e.key === 'Enter') {
                                await handleSaveOption(
                                  dimension.id,
                                  newOptionInputs[dimension.id] || ''
                                );
                              } else if (e.key === 'Escape') {
                                const newInputs = { ...newOptionInputs };
                                delete newInputs[dimension.id];
                                setNewOptionInputs(newInputs);
                              }
                            }}
                            placeholder="Add another value"
                            className="flex-1"
                            autoFocus
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9"
                            onClick={() => {
                              const newInputs = { ...newOptionInputs };
                              delete newInputs[dimension.id];
                              setNewOptionInputs(newInputs);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddOption(dimension.id)}
                          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 px-2 py-1"
                        >
                          <Plus className="h-4 w-4" />
                          Add another value
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Delete dimension button */}
                  <div className="flex justify-start pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteDimension(dimension.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}

              {/* Add another option button */}
              <Button
                type="button"
                variant="outline"
                onClick={handleAddDimension}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add another option
              </Button>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleDone}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

