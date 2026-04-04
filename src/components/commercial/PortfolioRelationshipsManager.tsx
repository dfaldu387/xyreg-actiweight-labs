import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Network, Search } from "lucide-react";
import { useProductAccessoryRelationships, useCreateProductAccessoryRelationship } from "@/hooks/useProductRelationships";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ProductHierarchySelector } from "./ProductHierarchySelector";
import { VariantDistributionManager } from "../portfolio/VariantDistributionManager";
import { useProductVariants } from "@/hooks/useProductVariants";
import { RevenueAttributionVisualizer } from "./RevenueAttributionVisualizer";

interface PortfolioRelationshipsManagerProps {
  companyId: string;
}

export function PortfolioRelationshipsManager({ companyId }: PortfolioRelationshipsManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [mainProductSearch, setMainProductSearch] = useState('');
  const [newRelationship, setNewRelationship] = useState({
    main_product_id: '',
    accessory_product_ids: [] as string[],
    relationship_type: 'accessory' as const,
    revenue_attribution_percentage: 0,
    typical_quantity: 1,
    is_required: false,
    initial_multiplier: 1.0,
    recurring_multiplier: 0.0,
    recurring_period: 'monthly',
    lifecycle_duration_months: 12,
    seasonality_factors: {},
  });

  const { toast } = useToast();
  const { data: relationships, isLoading: relationshipsLoading } = useProductAccessoryRelationships(companyId);
  const createRelationshipMutation = useCreateProductAccessoryRelationship();


  // Get product portfolio overview
  const { data: portfolioOverview } = useQuery({
    queryKey: ['portfolio-overview', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, model_reference, device_category, product_platform, trade_name')
        .eq('company_id', companyId)
        .eq('is_archived', false)
        .order('name');

      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const handleCreateRelationship = async () => {
    if (!newRelationship.main_product_id || newRelationship.accessory_product_ids.length === 0) {
      toast({
        title: "Error",
        description: "Please select main product and at least one accessory product",
        variant: "destructive",
      });
      return;
    }

    if (newRelationship.accessory_product_ids.includes(newRelationship.main_product_id)) {
      toast({
        title: "Error",
        description: "Main product cannot be selected as an accessory",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create relationships for all selected accessories
      const relationshipPromises = newRelationship.accessory_product_ids.map(accessoryId => 
        createRelationshipMutation.mutateAsync({
          company_id: companyId,
          main_product_id: newRelationship.main_product_id,
          accessory_product_id: accessoryId,
          relationship_type: newRelationship.relationship_type,
          revenue_attribution_percentage: newRelationship.revenue_attribution_percentage,
          typical_quantity: newRelationship.typical_quantity,
          is_required: newRelationship.is_required,
          initial_multiplier: newRelationship.initial_multiplier,
          recurring_multiplier: newRelationship.recurring_multiplier,
          recurring_period: newRelationship.recurring_period,
          lifecycle_duration_months: newRelationship.lifecycle_duration_months,
          seasonality_factors: newRelationship.seasonality_factors,
          has_variant_distribution: false,
          distribution_method: 'fixed_percentages' as const,
        })
      );

      await Promise.all(relationshipPromises);

      toast({
        title: "Success",
        description: `Created ${newRelationship.accessory_product_ids.length} product relationship(s) successfully`,
      });

      setIsAddDialogOpen(false);
      setMainProductSearch('');
      setNewRelationship({
        main_product_id: '',
        accessory_product_ids: [],
        relationship_type: 'accessory',
        revenue_attribution_percentage: 0,
        typical_quantity: 1,
        is_required: false,
        initial_multiplier: 1.0,
        recurring_multiplier: 0.0,
        recurring_period: 'monthly',
        lifecycle_duration_months: 12,
        seasonality_factors: {},
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create product relationships",
        variant: "destructive",
      });
    }
  };

  const toggleAccessorySelection = (productId: string) => {
    setNewRelationship(prev => ({
      ...prev,
      accessory_product_ids: prev.accessory_product_ids.includes(productId)
        ? prev.accessory_product_ids.filter(id => id !== productId)
        : [...prev.accessory_product_ids, productId]
    }));
  };


  const getRelationshipBadgeColor = (type: string) => {
    switch (type) {
      case 'accessory': return 'bg-blue-100 text-blue-800';
      case 'bundle_item': return 'bg-green-100 text-green-800';
      case 'cross_sell': return 'bg-orange-100 text-orange-800';
      case 'upsell': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const relationshipStats = {
    totalProducts: portfolioOverview?.length || 0,
    totalRelationships: relationships?.length || 0,
    revenueAttributionActive: relationships?.filter(r => r.revenue_attribution_percentage > 0).length || 0,
  };

  if (relationshipsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Portfolio Relationships Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-pulse text-muted-foreground">Loading portfolio relationships...</div>
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
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Revenue Attribution
            </CardTitle>
            <CardDescription>
              Visual representation of how revenue flows between products
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => {
            setIsAddDialogOpen(true);
            setMainProductSearch('');
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Create Relationship
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-primary">{relationshipStats.totalProducts}</div>
            <div className="text-sm text-muted-foreground">Total Devices</div>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-primary">{relationshipStats.totalRelationships}</div>
            <div className="text-sm text-muted-foreground">Active Relationships</div>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-primary">{relationshipStats.revenueAttributionActive}</div>
            <div className="text-sm text-muted-foreground">With Attribution</div>
          </div>
        </div>

        {/* Revenue Attribution Visualizer */}
        <RevenueAttributionVisualizer companyId={companyId} />
      </CardContent>

      {/* Create Relationship Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Create Device Relationship</DialogTitle>
            <DialogDescription>
              Create a relationship between devices for bundling, accessories, or cross-selling.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            <div>
              <Label htmlFor="main-product">Main Device</Label>
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search main device..."
                    value={mainProductSearch}
                    onChange={(e) => setMainProductSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select
                  value={newRelationship.main_product_id}
                  onValueChange={(value) => setNewRelationship(prev => ({ ...prev, main_product_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select main device" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] overflow-y-auto">
                    {portfolioOverview
                      ?.filter((product) => {
                        if (!mainProductSearch) return true;
                        const searchLower = mainProductSearch.toLowerCase();
                        return (
                          product.name.toLowerCase().includes(searchLower) ||
                          product.trade_name?.toLowerCase().includes(searchLower) ||
                          product.model_reference?.toLowerCase().includes(searchLower)
                        );
                      })
                      .map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} ({product.trade_name || product.model_reference})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="accessory-products">Accessory Devices</Label>
              <ProductHierarchySelector
                companyId={companyId}
                selectedProductIds={newRelationship.accessory_product_ids}
                onSelectionChange={(productIds) => setNewRelationship(prev => ({ 
                  ...prev, 
                  accessory_product_ids: productIds 
                }))}
                excludeProductId={newRelationship.main_product_id}
              />
            </div>

            <div>
              <Label htmlFor="relationship-type">Relationship Type</Label>
              <Select
                value={newRelationship.relationship_type}
                onValueChange={(value: any) => setNewRelationship(prev => ({ ...prev, relationship_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="accessory">Accessory</SelectItem>
                  <SelectItem value="bundle_item">Bundle Item</SelectItem>
                  <SelectItem value="cross_sell">Cross Sell</SelectItem>
                  <SelectItem value="upsell">Upsell</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="revenue-attribution">Revenue Attribution (%)</Label>
              <Input
                id="revenue-attribution"
                type="number"
                min="0"
                max="100"
                value={newRelationship.revenue_attribution_percentage}
                onChange={(e) => setNewRelationship(prev => ({ 
                  ...prev, 
                  revenue_attribution_percentage: parseInt(e.target.value) || 0 
                }))}
              />
            </div>

            <div>
              <Label htmlFor="typical-quantity">Typical Quantity</Label>
              <Input
                id="typical-quantity"
                type="number"
                min="1"
                value={newRelationship.typical_quantity}
                onChange={(e) => setNewRelationship(prev => ({ 
                  ...prev, 
                  typical_quantity: parseInt(e.target.value) || 1 
                }))}
              />
            </div>

            {/* Smart Revenue Modeling Fields */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="col-span-2">
                <Label className="text-sm font-semibold text-primary">Smart Revenue Multipliers</Label>
                <p className="text-xs text-muted-foreground">Configure automatic revenue calculations</p>
              </div>
              
              <div>
                <Label htmlFor="initial-multiplier">Initial Multiplier</Label>
                <Input
                  id="initial-multiplier"
                  type="number"
                  step="0.1"
                  min="0"
                  value={newRelationship.initial_multiplier}
                  onChange={(e) => setNewRelationship(prev => ({ 
                    ...prev, 
                    initial_multiplier: parseFloat(e.target.value) || 0 
                  }))}
                  placeholder="Units sold with main device"
                />
              </div>

              <div>
                <Label htmlFor="recurring-multiplier">Recurring Multiplier</Label>
                <Input
                  id="recurring-multiplier"
                  type="number"
                  step="0.1"
                  min="0"
                  value={newRelationship.recurring_multiplier}
                  onChange={(e) => setNewRelationship(prev => ({ 
                    ...prev, 
                    recurring_multiplier: parseFloat(e.target.value) || 0 
                  }))}
                  placeholder="Ongoing units per period"
                />
              </div>

              <div>
                <Label htmlFor="recurring-period">Recurring Period</Label>
                <Select
                  value={newRelationship.recurring_period}
                  onValueChange={(value) => setNewRelationship(prev => ({ 
                    ...prev, 
                    recurring_period: value 
                  }))}
                >
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

              <div>
                <Label htmlFor="lifecycle-duration">Lifecycle Duration (months)</Label>
                <Input
                  id="lifecycle-duration"
                  type="number"
                  min="1"
                  max="120"
                  value={newRelationship.lifecycle_duration_months}
                  onChange={(e) => setNewRelationship(prev => ({ 
                    ...prev, 
                    lifecycle_duration_months: parseInt(e.target.value) || 12 
                  }))}
                  placeholder="Device lifecycle duration"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is-required"
                checked={newRelationship.is_required}
                onCheckedChange={(checked) => setNewRelationship(prev => ({ 
                  ...prev, 
                  is_required: checked as boolean 
                }))}
              />
              <Label htmlFor="is-required">Required relationship</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t flex-shrink-0">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateRelationship}
              disabled={createRelationshipMutation.isPending}
            >
              {createRelationshipMutation.isPending ? "Creating..." : "Create Relationship"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}