import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings, TrendingUp, Package, Link } from "lucide-react";
import { useProductAccessoryRelationships, useCreateProductAccessoryRelationship } from "@/hooks/useProductRelationships";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ProductRelationshipsManagerProps {
  companyId: string;
  productId: string;
}

export function ProductRelationshipsManager({ companyId, productId }: ProductRelationshipsManagerProps) {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newRelationship, setNewRelationship] = useState({
    accessory_product_id: '',
    relationship_type: 'accessory' as const,
    revenue_attribution_percentage: 0,
    is_required: false,
    typical_quantity: 1,
    initial_multiplier: 1.0,
    recurring_multiplier: 0.0,
    recurring_period: 'monthly',
    lifecycle_duration_months: 12,
    seasonality_factors: {},
  });

  const { data: relationships, isLoading } = useProductAccessoryRelationships(companyId, productId);
  const createRelationship = useCreateProductAccessoryRelationship();

  // Get available products for relationships
  const { data: availableProducts } = useQuery({
    queryKey: ['available-products', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, model_reference, device_category')
        .eq('company_id', companyId)
        .neq('id', productId) // Exclude current product
        .order('name');

      if (error) throw error;
      return data;
    },
    enabled: !!companyId && !!productId,
  });

  const handleCreateRelationship = async () => {
    try {
      await createRelationship.mutateAsync({
        company_id: companyId,
        main_product_id: productId,
        has_variant_distribution: false,
        distribution_method: 'fixed_percentages' as const,
        ...newRelationship,
      });

      toast({
        title: "Relationship Created",
        description: "Product relationship has been successfully created.",
      });

      setIsAddDialogOpen(false);
      setNewRelationship({
        accessory_product_id: '',
        relationship_type: 'accessory',
        revenue_attribution_percentage: 0,
        is_required: false,
        typical_quantity: 1,
        initial_multiplier: 1.0,
        recurring_multiplier: 0.0,
        recurring_period: 'monthly',
        lifecycle_duration_months: 12,
        seasonality_factors: {},
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create product relationship.",
        variant: "destructive",
      });
    }
  };

  const getRelationshipIcon = (type: string) => {
    switch (type) {
      case 'accessory': return <Package className="h-4 w-4" />;
      case 'bundle_item': return <Link className="h-4 w-4" />;
      case 'cross_sell': return <TrendingUp className="h-4 w-4" />;
      case 'upsell': return <TrendingUp className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Product Relationships
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-pulse text-muted-foreground">Loading relationships...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const mainProductRelationships = relationships?.filter(r => r.main_product_id === productId) || [];
  const accessoryRelationships = relationships?.filter(r => r.accessory_product_id === productId) || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Product Relationships
            </CardTitle>
            <CardDescription>
              Manage accessories, bundles, and cross-selling relationships for revenue attribution
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Relationship
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Product Relationship</DialogTitle>
                <DialogDescription>
                  Create a new relationship between this product and another product in your portfolio
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="accessory_product">Related Product</Label>
                  <Select 
                    value={newRelationship.accessory_product_id} 
                    onValueChange={(value) => setNewRelationship(prev => ({ ...prev, accessory_product_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProducts?.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} ({product.model_reference})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="relationship_type">Relationship Type</Label>
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
                      <SelectItem value="cross_sell">Cross-sell</SelectItem>
                      <SelectItem value="upsell">Upsell</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="attribution_percentage">Revenue Attribution (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={newRelationship.revenue_attribution_percentage}
                    onChange={(e) => setNewRelationship(prev => ({ 
                      ...prev, 
                      revenue_attribution_percentage: Number(e.target.value) 
                    }))}
                    placeholder="0-100%"
                  />
                </div>

                <div>
                  <Label htmlFor="typical_quantity">Typical Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newRelationship.typical_quantity}
                    onChange={(e) => setNewRelationship(prev => ({ 
                      ...prev, 
                      typical_quantity: Number(e.target.value) 
                    }))}
                    placeholder="1"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateRelationship}
                    disabled={!newRelationship.accessory_product_id || createRelationship.isPending}
                  >
                    {createRelationship.isPending ? 'Creating...' : 'Create Relationship'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Main Product Relationships */}
          {mainProductRelationships.length > 0 && (
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-3">This product has these relationships:</h4>
              <div className="space-y-2">
                {mainProductRelationships.map((relationship: any) => (
                  <div key={relationship.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getRelationshipIcon(relationship.relationship_type)}
                      <div>
                        <div className="font-medium">{relationship.accessory_product?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {relationship.accessory_product?.model_reference}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getRelationshipBadgeColor(relationship.relationship_type)}>
                        {relationship.relationship_type.replace('_', ' ')}
                      </Badge>
                      {relationship.revenue_attribution_percentage > 0 && (
                        <Badge variant="outline">
                          {relationship.revenue_attribution_percentage}% attribution
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Accessory Relationships */}
          {accessoryRelationships.length > 0 && (
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-3">This product is related to:</h4>
              <div className="space-y-2">
                {accessoryRelationships.map((relationship: any) => (
                  <div key={relationship.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getRelationshipIcon(relationship.relationship_type)}
                      <div>
                        <div className="font-medium">{relationship.main_product?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {relationship.main_product?.model_reference}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getRelationshipBadgeColor(relationship.relationship_type)}>
                        {relationship.relationship_type.replace('_', ' ')}
                      </Badge>
                      {relationship.revenue_attribution_percentage > 0 && (
                        <Badge variant="outline">
                          {relationship.revenue_attribution_percentage}% to main product
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {mainProductRelationships.length === 0 && accessoryRelationships.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No product relationships defined</p>
              <p className="text-sm">Create relationships to enable smart revenue attribution</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}