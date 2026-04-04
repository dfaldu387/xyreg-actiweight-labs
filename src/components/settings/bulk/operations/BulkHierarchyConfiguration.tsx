import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HierarchicalNode } from "@/services/hierarchicalBulkService";
import { supabase } from "@/integrations/supabase/client";
import { useVariationDimensions } from "@/hooks/useVariationDimensions";
import { ArrowRight, Package, Layers3, Box, Tag, Settings2, X } from 'lucide-react';
import { toast } from 'sonner';

interface BulkHierarchyConfigurationProps {
  selectedNodes: HierarchicalNode[];
  onExecute: (hierarchyData: any) => void;
  isExecuting: boolean;
  companyId: string;
}

interface HierarchyOption {
  id: string;
  name: string;
  description?: string;
}

export function BulkHierarchyConfiguration({ 
  selectedNodes, 
  onExecute, 
  isExecuting,
  companyId
}: BulkHierarchyConfigurationProps) {
  const [targetCategory, setTargetCategory] = useState('');
  const [targetPlatform, setTargetPlatform] = useState('');
  const [targetModel, setTargetModel] = useState('');
  const [operation, setOperation] = useState('');
  const [selectedDimensions, setSelectedDimensions] = useState<Record<string, string>>({});
  
  const [categories, setCategories] = useState<HierarchyOption[]>([]);
  const [platforms, setPlatforms] = useState<HierarchyOption[]>([]);
  const [models, setModels] = useState<HierarchyOption[]>([]);
  
  const { dimensions, optionsByDimension, loading: variationsLoading } = useVariationDimensions(companyId);
  
  useEffect(() => {
    loadHierarchyOptions();
  }, [companyId]);
  
  const loadHierarchyOptions = async () => {
    try {
      // Load categories
      const { data: categoriesData } = await supabase
        .from('company_device_categories')
        .select('id, name, description')
        .eq('company_id', companyId);
      
      // Load platforms  
      const { data: platformsData } = await supabase
        .from('company_platforms')
        .select('id, name, description')
        .eq('company_id', companyId);
        
      // Load models
      const { data: modelsData } = await supabase
        .from('company_product_models')
        .select('id, name, description')
        .eq('company_id', companyId);
      
      setCategories(categoriesData || []);
      setPlatforms(platformsData || []);
      setModels(modelsData || []);
    } catch (error) {
      console.error('Failed to load hierarchy options:', error);
      toast.error('Failed to load hierarchy options');
    }
  };
  
  const getOperationTypes = () => [
    { value: 'reassign_category', label: 'Move to Different Category', icon: Tag },
    { value: 'reassign_platform', label: 'Assign to Platform', icon: Layers3 },
    { value: 'reassign_model', label: 'Update Model Reference', icon: Box },
    { value: 'create_variants', label: 'Create Product Variants', icon: Package },
    { value: 'assign_variations', label: 'Assign Variation Dimensions', icon: Settings2 }
  ];
  
  const getAffectedCount = () => {
    // Collect all unique product IDs that would be affected
    const affectedProductIds = new Set<string>();
    
    const addProductIdsFromNode = (node: HierarchicalNode) => {
      if (node.type === 'product') {
        affectedProductIds.add(node.id);
      } else if (node.children) {
        // For higher-level nodes, add all descendant products
        node.children.forEach(child => addProductIdsFromNode(child));
      }
    };
    
    selectedNodes.forEach(node => addProductIdsFromNode(node));
    return affectedProductIds.size;
  };
  
  const getImpactPreview = () => {
    const productCount = getAffectedCount();
    const selectedCategoryName = categories.find(c => c.id === targetCategory)?.name;
    const selectedPlatformName = platforms.find(p => p.id === targetPlatform)?.name;
    const selectedModelName = models.find(m => m.id === targetModel)?.name;
    
    switch (operation) {
      case 'reassign_category':
        return `${productCount} products will be moved to "${selectedCategoryName}" category`;
      case 'reassign_platform':
        return `${productCount} products will be assigned to "${selectedPlatformName}" platform`;
      case 'reassign_model':
        return `${productCount} products will reference "${selectedModelName}" model`;
      case 'create_variants':
        return `Create variants for ${productCount} products`;
      case 'assign_variations':
        const dimensionCount = Object.keys(selectedDimensions).length;
        return `Assign ${dimensionCount} variation dimension${dimensionCount !== 1 ? 's' : ''} to ${productCount} products`;
      default:
        return '';
    }
  };
  
  const handleExecute = () => {
    if (!operation) {
      toast.error('Please select an operation type');
      return;
    }
    
    // Get the actual names instead of IDs for database updates
    const selectedCategoryName = categories.find(c => c.id === targetCategory)?.name;
    const selectedPlatformName = platforms.find(p => p.id === targetPlatform)?.name;
    const selectedModelName = models.find(m => m.id === targetModel)?.name;
    
    const hierarchyData = {
      operation,
      targetCategory: selectedCategoryName,
      targetPlatform: selectedPlatformName, 
      targetModel: selectedModelName,
      variations: selectedDimensions,
      affectedProductCount: getAffectedCount()
    };
    
    onExecute(hierarchyData);
  };
  
  const isValid = () => {
    if (!operation) return false;
    
    switch (operation) {
      case 'reassign_category':
        return !!targetCategory;
      case 'reassign_platform':
        return !!targetPlatform;
      case 'reassign_model':
        return !!targetModel;
      case 'create_variants':
        return true;
      case 'assign_variations':
        return Object.keys(selectedDimensions).length > 0;
      default:
        return false;
    }
  };

  const handleDimensionChange = (dimensionId: string, optionId: string) => {
    setSelectedDimensions(prev => ({
      ...prev,
      [dimensionId]: optionId
    }));
  };

  const removeDimension = (dimensionId: string) => {
    setSelectedDimensions(prev => {
      const updated = { ...prev };
      delete updated[dimensionId];
      return updated;
    });
  };
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="font-semibold">Configure Hierarchy Changes</h3>
        <p className="text-sm text-muted-foreground">
          Modify category, platform, or model assignments for {selectedNodes.length} selected items.
        </p>
      </div>
      
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="operation-type">Operation Type</Label>
          <Select value={operation} onValueChange={setOperation}>
            <SelectTrigger>
              <SelectValue placeholder="Select hierarchy operation" />
            </SelectTrigger>
            <SelectContent>
              {getOperationTypes().map((op) => {
                const Icon = op.icon;
                return (
                  <SelectItem key={op.value} value={op.value}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {op.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        
        {operation === 'reassign_category' && (
          <div className="space-y-2">
            <Label htmlFor="target-category">Target Category</Label>
            <Select value={targetCategory} onValueChange={setTargetCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex flex-col">
                      <span>{category.name}</span>
                      {category.description && (
                        <span className="text-xs text-muted-foreground">{category.description}</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {operation === 'reassign_platform' && (
          <div className="space-y-2">
            <Label htmlFor="target-platform">Target Platform</Label>
            <Select value={targetPlatform} onValueChange={setTargetPlatform}>
              <SelectTrigger>
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent>
                {platforms.map((platform) => (
                  <SelectItem key={platform.id} value={platform.id}>
                    <div className="flex flex-col">
                      <span>{platform.name}</span>
                      {platform.description && (
                        <span className="text-xs text-muted-foreground">{platform.description}</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {operation === 'reassign_model' && (
          <div className="space-y-2">
            <Label htmlFor="target-model">Target Model</Label>
            <Select value={targetModel} onValueChange={setTargetModel}>
              <SelectTrigger>
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex flex-col">
                      <span>{model.name}</span>
                      {model.description && (
                        <span className="text-xs text-muted-foreground">{model.description}</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {operation === 'assign_variations' && (
          <div className="space-y-4">
            {Object.keys(selectedDimensions).length > 0 && (
              <div className="space-y-3">
                <Label>Selected Variations</Label>
                <div className="space-y-2">
                  {Object.entries(selectedDimensions).map(([dimensionId, optionId]) => {
                    const dimension = dimensions.find(d => d.id === dimensionId);
                    const option = optionsByDimension[dimensionId]?.find(o => o.id === optionId);
                    
                    return (
                      <div key={dimensionId} className="flex items-center justify-between p-3 border rounded-md">
                        <div className="space-y-1">
                          <div className="font-medium">{dimension?.name}</div>
                          <Badge variant="secondary">{option?.name}</Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDimension(dimensionId)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {dimensions && dimensions.length > 0 && (
              <div className="space-y-3">
                <Label>Add Variation Dimension</Label>
                <div className="space-y-2">
                  {dimensions
                    .filter(dimension => !selectedDimensions[dimension.id])
                    .map(dimension => {
                      const options = optionsByDimension[dimension.id] || [];
                      
                      return (
                        <div key={dimension.id} className="space-y-2">
                          <div className="font-medium">{dimension.name}</div>
                          <Select
                            onValueChange={(optionId) => handleDimensionChange(dimension.id, optionId)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={`Select ${dimension.name.toLowerCase()} option`} />
                            </SelectTrigger>
                            <SelectContent>
                              {options.map(option => (
                                <SelectItem key={option.id} value={option.id}>
                                  {option.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
            
            {(!dimensions || dimensions.length === 0) && !variationsLoading && (
              <div className="text-center py-6 text-muted-foreground">
                <Settings2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No variation dimensions found.</p>
                <p className="text-sm">Create them in Product Portfolio Structure settings first.</p>
              </div>
            )}
          </div>
        )}
        
        {/* Impact Preview */}
        {operation && isValid() && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Impact Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline">{getAffectedCount()} products</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{getImpactPreview()}</span>
              </div>
              {operation === 'assign_variations' && Object.keys(selectedDimensions).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {Object.entries(selectedDimensions).map(([dimensionId, optionId]) => {
                    const dimension = dimensions.find(d => d.id === dimensionId);
                    const option = optionsByDimension[dimensionId]?.find(o => o.id === optionId);
                    
                    return (
                      <Badge key={dimensionId} variant="outline" className="text-xs">
                        {dimension?.name}: {option?.name}
                      </Badge>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      
      <Button
        onClick={handleExecute}
        disabled={isExecuting || !isValid()}
        className="w-full"
      >
        {isExecuting ? 'Applying Changes...' : `Apply to ${getAffectedCount()} Products`}
      </Button>
    </div>
  );
}