import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProductDetails } from '@/hooks/useProductDetails';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Package } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export function ReviewerProductDetails() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('info');

  const { data: product, isLoading, error } = useProductDetails(productId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
        <span className="ml-3">Loading product details...</span>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">
              {error ? 'Error loading product details' : 'Product not found'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/app/review-panel/products')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Package className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="text-muted-foreground">Product Details</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="info">Product Info</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="regulation">Regulation</TabsTrigger>
          <TabsTrigger value="purpose">Purpose</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Product Name</p>
                  <p className="text-base">{product.name}</p>
                </div>
                
                {product.model_reference && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Model Reference</p>
                    <p className="text-base">{product.model_reference}</p>
                  </div>
                )}

                {product.device_category && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Device Category</p>
                    <p className="text-base">{product.device_category}</p>
                  </div>
                )}

                {product.product_platform && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Product Platform</p>
                    <p className="text-base">{product.product_platform}</p>
                  </div>
                )}

                {product.status && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <p className="text-base">{product.status}</p>
                  </div>
                )}

                {product.device_type && typeof product.device_type === 'string' && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Device Type</p>
                    <p className="text-base">{product.device_type}</p>
                  </div>
                )}
              </div>

              {product.description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
                  <p className="text-base">{product.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Product Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {product.trade_name && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Trade Name</p>
                    <p className="text-base">{product.trade_name}</p>
                  </div>
                )}

                {product.device_category && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Device Category</p>
                    <p className="text-base">{product.device_category}</p>
                  </div>
                )}

                {product.model_reference && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Model Reference</p>
                    <p className="text-base">{product.model_reference}</p>
                  </div>
                )}

                {product.current_lifecycle_phase && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Lifecycle Phase</p>
                    <Badge variant="outline">{product.current_lifecycle_phase}</Badge>
                  </div>
                )}

                {product.basic_udi_di && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Basic UDI-DI</p>
                    <p className="text-base font-mono text-sm">{product.basic_udi_di}</p>
                  </div>
                )}

                {product.udi_di && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">UDI-DI</p>
                    <p className="text-base font-mono text-sm">{product.udi_di}</p>
                  </div>
                )}
              </div>

              {product.intended_use && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Intended Use</p>
                  <p className="text-base">{product.intended_use}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {product.trade_name && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Trade Name</p>
                    <p className="text-base">{product.trade_name}</p>
                  </div>
                )}

                {product.model_version && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Model Version</p>
                    <p className="text-base">{product.model_version}</p>
                  </div>
                )}

                {product.manufacturer && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Manufacturer</p>
                    <p className="text-base">{product.manufacturer}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regulation">
          <Card>
            <CardHeader>
              <CardTitle>Regulatory Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {product.basic_udi_di && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Basic UDI-DI</p>
                    <p className="text-base font-mono">{product.basic_udi_di}</p>
                  </div>
                )}

                {product.udi_di && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">UDI-DI</p>
                    <p className="text-base font-mono">{product.udi_di}</p>
                  </div>
                )}

                {product.udi_pi && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">UDI-PI</p>
                    <p className="text-base font-mono">{product.udi_pi}</p>
                  </div>
                )}

                {product.gtin && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">GTIN</p>
                    <p className="text-base font-mono">{product.gtin}</p>
                  </div>
                )}

                {product.ce_mark_status && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">CE Mark Status</p>
                    <Badge variant="outline">{product.ce_mark_status}</Badge>
                  </div>
                )}

                {product.notified_body && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Notified Body</p>
                    <p className="text-base">{product.notified_body}</p>
                  </div>
                )}

                {product.conformity_assessment_route && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Conformity Assessment Route</p>
                    <p className="text-base">{product.conformity_assessment_route}</p>
                  </div>
                )}

                {product.registration_status && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Registration Status</p>
                    <Badge variant="secondary">{product.registration_status}</Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purpose">
          <Card>
            <CardHeader>
              <CardTitle>Intended Purpose</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {product.intended_use && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Intended Use</p>
                  <p className="text-base whitespace-pre-wrap">{product.intended_use}</p>
                </div>
              )}

              {product.intended_users && product.intended_users.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Intended Users</p>
                  <div className="flex flex-wrap gap-2">
                    {product.intended_users.map((user, index) => (
                      <Badge key={index} variant="outline">{user}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {product.clinical_benefits && product.clinical_benefits.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Clinical Benefits</p>
                  <ul className="list-disc list-inside space-y-1">
                    {product.clinical_benefits.map((benefit, index) => (
                      <li key={index} className="text-base">{benefit}</li>
                    ))}
                  </ul>
                </div>
              )}

              {product.contraindications && product.contraindications.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Contraindications</p>
                  <ul className="list-disc list-inside space-y-1">
                    {product.contraindications.map((contraindication, index) => (
                      <li key={index} className="text-base">{contraindication}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
