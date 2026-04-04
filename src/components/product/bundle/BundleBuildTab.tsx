import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BundleAllProductsCard } from './BundleAllProductsCard';
import { BundleSiblingGroupsCard } from './BundleSiblingGroupsCard';
import { RelationshipConfigTable } from './RelationshipConfigTable';
import { CurrentBundlePanel } from './CurrentBundlePanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Package2, Plus, Sparkles, Package, AlertCircle, CheckCircle2 } from 'lucide-react';
import { SaveStatusIndicator } from '@/components/ui/save-status-indicator';
import { ProductVariationsSection } from '../device/sections/ProductVariationsSection';
import { Separator } from '@/components/ui/separator';
import { CreateBundleDialog } from './CreateBundleDialog';
import { BundleDistributionDiagram } from './BundleDistributionDiagram';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/hooks/useTranslation';
import { Switch } from '@/components/ui/switch';

export interface BundleProduct {
  product: {
    id: string;
    name: string;
    description?: string;
    tradeName?: string;
    image?: string;
    images?: string[];
  };
  relationshipType: 'component' | 'accessory' | 'consumable' | 'required' | 'optional' | 'replacement_part';
  multiplier: number;
  consumptionRate?: number;
  consumptionPeriod?: 'per_use' | 'per_procedure' | 'per_day' | 'per_week' | 'per_month' | 'per_year';
  relationshipId?: string;
  attachmentRate?: number; // 0-100%
  distributionGroupId?: string;
  isVariantGroup?: boolean;
  variantGroupId?: string;
  variantGroupName?: string;
  variantCount?: number;
  distributionPattern?: 'even' | 'gaussian_curve' | 'empirical_data';
  variantProducts?: Array<{
    id: string;
    name: string;
    trade_name?: string;
    description?: string;
    percentage?: number;
    position?: number;
    assignmentId?: string;
  }>;
}

interface BundleBuildTabProps {
  productId?: string;
  companyId: string;
  selectedBundleId: string | null;
  onNavigateToBuild?: () => void;
  disabled?: boolean;
}

export function BundleBuildTab({ productId, companyId, selectedBundleId, onNavigateToBuild, disabled = false }: BundleBuildTabProps) {
  const { lang } = useTranslation();
  const [bundleProducts, setBundleProducts] = useState<BundleProduct[]>([]);
  const [isNewBundle, setIsNewBundle] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('products');
  const queryClient = useQueryClient();

  // Fetch product name for auto-naming bundles (only when productId is provided)
  const { data: product } = useQuery({
    queryKey: ['product-name', productId],
    queryFn: async () => {
      if (!productId) return null;
      const { data, error } = await supabase
        .from('products')
        .select('name')
        .eq('id', productId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!productId
  });

  // Fetch existing bundle names for sequential numbering
  const { data: existingBundles } = useQuery({
    queryKey: ['existing-bundle-names', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_bundles')
        .select('bundle_name')
        .eq('company_id', companyId);
      
      if (error) throw error;
      return data?.map(b => b.bundle_name) || [];
    },
    enabled: !!companyId
  });

  // Fetch bundle members from the new bundle system
  const { data: bundleMembers, isLoading: isLoadingRelationships } = useQuery({
    queryKey: ['bundle-members', selectedBundleId],
    queryFn: async (): Promise<{ members: any[]; products: any[]; siblingGroups: any[] } | null> => {
      if (!selectedBundleId) return null;

      const { data: members, error } = await supabase
        .from('product_bundle_members')
        .select(`
          id,
          product_id,
          sibling_group_id,
          relationship_type,
          multiplier,
          quantity,
          consumption_rate,
          consumption_period,
          attachment_rate,
          distribution_group_id
        `)
        .eq('bundle_id', selectedBundleId);

      if (error) throw error;
      
      // Fetch product details for product members
      const productIds = members?.filter((m: any) => m.product_id).map((m: any) => m.product_id) || [];
      const siblingGroupIds = members?.filter((m: any) => m.sibling_group_id).map((m: any) => m.sibling_group_id) || [];
      
      let products: any[] = [];
      let siblingGroups: any[] = [];
      
      if (productIds.length > 0) {
        const { data: productsData, error: prodError } = await supabase
          .from('products')
          .select('id, name, description, trade_name')
          .in('id', productIds);
        
        if (prodError) throw prodError;
        products = productsData || [];
      }
      
      if (siblingGroupIds.length > 0) {
        const { data: groupsData, error: groupError } = await supabase
          .from('product_sibling_groups')
          .select(`
            id,
            name,
            basic_udi_di,
            distribution_pattern,
            product_sibling_assignments(
              id,
              product_id,
              percentage,
              position,
              products(
                id,
                name,
                trade_name,
                description
              )
            )
          `)
          .in('id', siblingGroupIds);
        
        if (groupError) throw groupError;
        siblingGroups = (groupsData || []).map((g: any) => ({
          ...g,
          productCount: g.product_sibling_assignments?.length || 0,
          products: g.product_sibling_assignments
            ?.map((a: any) => ({
              ...a.products,
              percentage: a.percentage,
              position: a.position,
              assignmentId: a.id // Include assignment ID for editing
            }))
            .filter((p: any) => p.id)
            .sort((a: any, b: any) => (a.position || 0) - (b.position || 0)) || []
        }));
      }
      
      return { members: members || [], products, siblingGroups };
    },
    enabled: !!selectedBundleId
  });

  // Check if this is a newly created empty bundle
  useEffect(() => {
    if (selectedBundleId && bundleMembers) {
      const isEmpty = bundleMembers.members.length === 0;
      setIsNewBundle(isEmpty);
    }
  }, [selectedBundleId, bundleMembers]);

  // Initialize bundle products from bundle members
  // Reset when selectedBundleId changes to ensure clean slate
  useEffect(() => {
    if (!bundleMembers) {
      setBundleProducts([]);
      return;
    }

    const products: BundleProduct[] = [];
    const { members, products: productsData, siblingGroups } = bundleMembers;

    // Create product map
    const productMap = new Map(productsData?.map((p: any) => [p.id, p]) || []);
    const groupMap = new Map(siblingGroups?.map((g: any) => [g.id, g]) || []);

    // Add regular products
    members?.forEach((member: any) => {
      if (member.product_id) {
        const product = productMap.get(member.product_id);
        if (product) {
          products.push({
            product: {
              id: product.id,
              name: product.name,
              description: product.description,
              tradeName: product.trade_name
            },
            relationshipType: member.relationship_type as BundleProduct['relationshipType'],
            multiplier: member.multiplier || 1,
            consumptionRate: member.consumption_rate,
            consumptionPeriod: member.consumption_period,
            relationshipId: member.id,
            attachmentRate: member.attachment_rate ?? 100,
            distributionGroupId: member.distribution_group_id
          });
        }
      } else if (member.sibling_group_id) {
        const group = groupMap.get(member.sibling_group_id);
        if (group) {
          products.push({
            product: {
              id: group.id,
              name: group.name,
              description: `Sibling Group: ${group.basic_udi_di}`
            },
            relationshipType: member.relationship_type as BundleProduct['relationshipType'],
            multiplier: member.multiplier || 1,
            consumptionRate: member.consumption_rate,
            consumptionPeriod: member.consumption_period,
            relationshipId: member.id,
            attachmentRate: member.attachment_rate ?? 100,
            distributionGroupId: member.distribution_group_id,
            isVariantGroup: true,
            variantGroupId: group.id,
            variantGroupName: group.name,
            variantCount: group.productCount || 0,
            distributionPattern: group.distribution_pattern,
            variantProducts: group.products || []
          });
        }
      }
    });

    setBundleProducts(products);
  }, [bundleMembers, selectedBundleId]);

  // Autosave whenever bundle products change (except initial load)
  const [hasInitialized, setHasInitialized] = useState(false);
  
  useEffect(() => {
    if (bundleMembers && bundleProducts.length > 0) {
      setHasInitialized(true);
    }
  }, [bundleMembers, bundleProducts]);

  useEffect(() => {
    // Only autosave if initialized and we have changes
    if (!selectedBundleId || !hasInitialized) return;

    // Debounce autosave by 1000ms
    const timeoutId = setTimeout(() => {
      
      saveBundleMutation.mutate({ isManualSave: false });
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [bundleProducts, selectedBundleId, hasInitialized]);



  // Save bundle mutation - update bundle members
  const saveBundleMutation = useMutation({
    mutationFn: async ({ isManualSave = false }: { isManualSave?: boolean } = {}) => {
      if (!selectedBundleId) {
        throw new Error('No bundle selected');
      }

      // Verify the bundle exists before trying to save
      const { data: bundleExists } = await supabase
        .from('product_bundles')
        .select('id')
        .eq('id', selectedBundleId)
        .single();
      
      if (!bundleExists) {
        throw new Error('Bundle not found. Please create a new bundle or select an existing one.');
      }
      // Delete all existing members for this bundle
      const { error: deleteError } = await supabase
        .from('product_bundle_members')
        .delete()
        .eq('bundle_id', selectedBundleId);

      if (deleteError) {
        console.error('❌ Error deleting bundle members:', deleteError);
        throw deleteError;
      }

      // Insert new members
      if (bundleProducts.length > 0) {
        const members = bundleProducts.map((bp, index) => ({
          bundle_id: selectedBundleId,
          product_id: bp.isVariantGroup ? null : bp.product.id,
          sibling_group_id: bp.isVariantGroup ? bp.variantGroupId : null,
          relationship_type: bp.relationshipType,
          multiplier: bp.multiplier,
          consumption_rate: bp.consumptionRate,
          consumption_period: bp.consumptionPeriod,
          attachment_rate: bp.attachmentRate,
          distribution_group_id: bp.distributionGroupId,
          is_primary: false,
          position: index
        }));

        
        const { error: insertError } = await supabase
          .from('product_bundle_members')
          .insert(members);

        if (insertError) {
          console.error('❌ Error inserting bundle members:', insertError);
          throw insertError;
        }
      }

      
      return { isManualSave };
    },
    onSuccess: (data) => {
      // Only show toast on manual save
      if (data?.isManualSave) {
        toast.success(lang('bundles.build.toast.bundleSaved'));
      }
      queryClient.invalidateQueries({ queryKey: ['bundle-members', selectedBundleId] });
      queryClient.invalidateQueries({ queryKey: ['bundle-details', selectedBundleId] });
      queryClient.invalidateQueries({ queryKey: ['bundle-specific-stats', selectedBundleId] });
      queryClient.invalidateQueries({ queryKey: ['product-bundles', companyId] });
    },
    onError: (error) => {
      console.error('❌ Error saving bundle:', error);
      toast.error(lang('bundles.build.toast.saveFailed'));
    }
  });

  const handleAddProducts = (products: any[]) => {
    const existingIds = new Set(bundleProducts.map(bp => bp.product.id));
    const newProducts = products
      .filter(product => !existingIds.has(product.id))
      .map(product => ({
        product,
        relationshipType: 'component' as const,
        multiplier: 1,
        attachmentRate: 100
      }));
    
    if (newProducts.length > 0) {
      setBundleProducts(prev => [...prev, ...newProducts]);
    }
  };

  const handleAddSiblingGroup = (groups: any[]) => {
    
    const newSiblingGroupItems = groups.map(group => ({
      product: {
        id: group.id,
        name: group.name,
        description: `Sibling Group: ${group.basicUdiDi} (${group.productCount} products)`
      },
      relationshipType: 'component' as const,
      multiplier: 1,
      attachmentRate: 100,
      isVariantGroup: true,
      variantGroupId: group.id,
      variantCount: group.productCount
    }));
    
    setBundleProducts(prev => [
      ...prev,
      ...newSiblingGroupItems
    ]);
  };

  const handleRemoveProduct = (productId: string) => {
    setBundleProducts(prev => prev.filter(bp => {
      // For variant groups, check both product ID and variant group ID
      if (bp.isVariantGroup) {
        return bp.variantGroupId !== productId && bp.product.id !== productId;
      }
      return bp.product.id !== productId;
    }));
  };

  const handleUpdateRelationship = (
    productId: string,
    relationshipType: BundleProduct['relationshipType'],
    multiplier: number,
    consumptionRate?: number,
    consumptionPeriod?: BundleProduct['consumptionPeriod']
  ) => {
    setBundleProducts(prev =>
      prev.map(bp =>
        bp.product.id === productId
          ? { ...bp, relationshipType, multiplier, consumptionRate, consumptionPeriod }
          : bp
      )
    );
  };

  const handleUpdateAttachmentRate = (productId: string, rate: number) => {
    setBundleProducts(prev =>
      prev.map(bp =>
        bp.product.id === productId
          ? { ...bp, attachmentRate: rate }
          : bp
      )
    );
  };

  const handleUpdateDistributionGroup = (productId: string, groupId: string | null, rate: number) => {
    setBundleProducts(prev =>
      prev.map(bp =>
        bp.product.id === productId
          ? { ...bp, distributionGroupId: groupId || undefined, attachmentRate: rate }
          : bp
      )
    );
  };

  const handleSave = () => {
    saveBundleMutation.mutate({ isManualSave: true });
  };

  const handleBundleCreated = async (bundleId: string) => {
    
    
    // Invalidate and wait for bundles query to refetch
    await queryClient.invalidateQueries({ queryKey: ['product-bundles', productId] });
    await queryClient.refetchQueries({ queryKey: ['product-bundles', productId] });
    
    // Now update URL to show the new bundle
    const newParams = new URLSearchParams(searchParams);
    newParams.set('bundleId', bundleId);
    setSearchParams(newParams);
    
    
  };

  // Standalone device (no accessories) toggle
  const [hasNoAccessories, setHasNoAccessories] = useState(false);
  const [isLoadingStandalone, setIsLoadingStandalone] = useState(false);

  // Fetch the has_no_accessories flag for this product
  useEffect(() => {
    if (!productId) return;
    supabase
      .from('products')
      .select('has_no_accessories')
      .eq('id', productId)
      .single()
      .then(({ data }) => {
        if (data) setHasNoAccessories(!!data.has_no_accessories);
      });
  }, [productId]);

  const handleToggleNoAccessories = async (checked: boolean) => {
    if (!productId) return;
    setIsLoadingStandalone(true);
    const { error } = await supabase
      .from('products')
      .update({ has_no_accessories: checked } as any)
      .eq('id', productId);
    setIsLoadingStandalone(false);
    if (error) {
      toast.error('Failed to update standalone status');
      return;
    }
    setHasNoAccessories(checked);
    toast.success(checked ? 'Device marked as standalone — no accessories required' : 'Standalone declaration removed');
    queryClient.invalidateQueries({ queryKey: ['productDetails', productId] });
  };

  const hasChanges = true; // For simplicity, always enable save

  return (
    <div className={`space-y-6 ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>
      {/* Standalone Device Declaration */}
      {productId && (
        <Card className={`border-2 ${hasNoAccessories ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20' : 'border-muted'}`}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {hasNoAccessories && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                  <h4 className="font-semibold text-sm">Standalone Device Declaration</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  No accessories or other devices intended to be used in combination — this device is used as a standalone product without any required accessories, consumables, or combination devices.
                </p>
                {hasNoAccessories && (
                  <Badge variant="outline" className="mt-2 border-emerald-500 text-emerald-700 dark:text-emerald-400">
                    Standalone device — no accessories required
                  </Badge>
                )}
              </div>
              <Switch
                checked={hasNoAccessories}
                onCheckedChange={handleToggleNoAccessories}
                disabled={isLoadingStandalone}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* New Bundle Alert */}
      {isNewBundle && (
        <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950/20">
          <Sparkles className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-900 dark:text-blue-100">{lang('bundles.build.newBundleCreated')}</AlertTitle>
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            {lang('bundles.build.newBundleDescription')}
          </AlertDescription>
        </Alert>
      )}

      {/* Header with Create New Bundle Button (only show when productId is provided) */}
      {productId && (
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{lang('bundles.build.deviceSelection')}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {lang('bundles.build.deviceSelectionDescription')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <SaveStatusIndicator
              status={saveBundleMutation.isPending ? 'saving' : saveBundleMutation.isSuccess ? 'saved' : 'idle'}
              hasUnsavedChanges={false}
            />
            <Button onClick={() => setCreateDialogOpen(true)} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              {lang('bundles.build.createNewBundle')}
            </Button>
          </div>
        </div>
      )}

      {!productId && (
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{lang('bundles.build.deviceSelection')}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {lang('bundles.build.deviceSelectionDescription')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <SaveStatusIndicator
              status={saveBundleMutation.isPending ? 'saving' : saveBundleMutation.isSuccess ? 'saved' : 'idle'}
              hasUnsavedChanges={false}
            />
          </div>
        </div>
      )}

      <div className={hasNoAccessories ? 'opacity-50 pointer-events-none' : ''}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="products">
            {lang('bundles.build.devicesAndGroups')}
            {bundleProducts.length > 0 && (
              <Badge variant="secondary" className="ml-2">{bundleProducts.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="relationships">{lang('bundles.build.relationshipTable')}</TabsTrigger>
          <TabsTrigger value="diagram">{lang('bundles.build.visualDiagram')}</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {bundleProducts.length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{lang('bundles.build.devicesAdded')}</AlertTitle>
                  <AlertDescription>
                    {lang('bundles.build.devicesAddedDescription')
                      .replace('{count}', String(bundleProducts.length))
                      .replace('{items}', bundleProducts.length === 1 ? lang('bundles.build.item') : lang('bundles.build.items'))}
                  </AlertDescription>
                </Alert>
              )}

              <BundleAllProductsCard
                companyId={companyId}
                currentProductId={productId || ''}
                selectedProductIds={bundleProducts.filter(bp => !bp.isVariantGroup).map(bp => bp.product.id)}
                onAddProducts={handleAddProducts}
                onRemoveProduct={handleRemoveProduct}
                isNewBundle={isNewBundle}
              />
              
              <BundleSiblingGroupsCard
                companyId={companyId}
                currentProductId={productId || ''}
                selectedGroupIds={(() => {
                  const ids = bundleProducts
                    .filter(bp => bp.isVariantGroup)
                    .map(bp => bp.variantGroupId!)
                    .filter(Boolean);
                  return ids;
                })()}
                onAddGroup={handleAddSiblingGroup}
                onRemoveGroup={handleRemoveProduct}
                isNewBundle={isNewBundle}
              />
            </div>

            <div className="lg:col-span-1">
              <CurrentBundlePanel
                bundleProducts={bundleProducts}
                onRemoveProduct={handleRemoveProduct}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="relationships" className="space-y-6">
          {/* Section 3: Bundle Relationship Configuration */}
          {!selectedBundleId ? (
            <Card>
              <CardHeader>
                <CardTitle>{lang('bundles.build.bundleDevicesRelationships')}</CardTitle>
                <CardDescription>
                  {lang('bundles.build.createBundleToStart')}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <p className="text-muted-foreground mb-4">{lang('bundles.build.noBundleSelected')}</p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {lang('bundles.build.createBundle')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{lang('bundles.build.bundleDevicesRelationships')}</CardTitle>
                    <CardDescription>
                      {lang('bundles.build.configureRelationship')}
                    </CardDescription>
                  </div>
                  {saveBundleMutation.isPending && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      {lang('bundles.build.saving')}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {bundleProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">{lang('bundles.build.emptyBundle')}</h3>
                    <p className="text-muted-foreground">
                      {lang('bundles.build.selectDevicesToAdd')}
                    </p>
                  </div>
                ) : (
                <RelationshipConfigTable
                  bundleProducts={bundleProducts}
                  onRemoveProduct={handleRemoveProduct}
                  onUpdateRelationship={handleUpdateRelationship}
                  onUpdateAttachmentRate={handleUpdateAttachmentRate}
                  onUpdateDistributionGroup={handleUpdateDistributionGroup}
                />
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="diagram" className="space-y-6">
          {!selectedBundleId ? (
            <Card>
              <CardHeader>
                <CardTitle>{lang('bundles.build.visualDistribution')}</CardTitle>
                <CardDescription>
                  {lang('bundles.build.createBundleToVisualize')}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <p className="text-muted-foreground mb-4">{lang('bundles.build.noBundleSelected')}</p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {lang('bundles.build.createBundle')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{lang('bundles.build.visualDistribution')}</CardTitle>
                    <CardDescription>
                      {lang('bundles.build.interactiveVisualization')}
                    </CardDescription>
                  </div>
                  <SaveStatusIndicator
                    status={saveBundleMutation.isPending ? 'saving' : saveBundleMutation.isSuccess ? 'saved' : 'idle'}
                    hasUnsavedChanges={false}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <BundleDistributionDiagram
                  products={bundleProducts.map((bp, index) => ({
                    id: bp.product.id,
                    product_id: bp.isVariantGroup ? undefined : bp.product.id,
                    sibling_group_id: bp.isVariantGroup ? bp.variantGroupId : undefined,
                    product_name: bp.isVariantGroup ? undefined : bp.product.name,
                    group_name: bp.isVariantGroup ? bp.variantGroupName : undefined,
                    relationship_type: bp.relationshipType,
                    quantity: bp.multiplier,
                    is_primary: index === 0, // First product is primary
                    product_image: bp.product.image || bp.product.images?.[0],
                    initial_multiplier: bp.multiplier,
                    recurring_multiplier: bp.consumptionRate,
                    recurring_period: bp.consumptionPeriod,
                    attachment_rate: bp.attachmentRate,
                    distribution_group_id: bp.distributionGroupId,
                    distributionPattern: bp.distributionPattern,
                    variantProducts: bp.variantProducts,
                  }))}
                  onEditAttachmentRate={handleUpdateAttachmentRate}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      </div>

      {productId && (
        <CreateBundleDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          productId={productId}
          companyId={companyId}
          productName={product?.name || ''}
          existingBundleNames={existingBundles || []}
          onBundleCreated={handleBundleCreated}
          onNavigateToBuild={onNavigateToBuild}
        />
      )}
    </div>
  );
}
