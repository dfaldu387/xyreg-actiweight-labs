import React, { useState } from 'react';
import { Plus, Link as LinkIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ProductSupplierTable } from './ProductSupplierTable';
import { LinkSupplierDialog } from './LinkSupplierDialog';
import { useQuery } from '@tanstack/react-query';
import { SupplierService } from '@/services/supplierService';

interface ProductSuppliersTabProps {
  productId: string;
  companyId: string;
}

export function ProductSuppliersTab({ productId, companyId }: ProductSuppliersTabProps) {
  const [showLinkDialog, setShowLinkDialog] = useState(false);

  const { data: productSuppliers = [], isLoading, error } = useQuery({
    queryKey: ['product-suppliers', productId],
    queryFn: () => SupplierService.getProductSuppliers(productId),
    enabled: !!productId,
  });

  const criticalSuppliers = productSuppliers.filter(ps => ps.supplier?.criticality === 'Critical');
  const approvedSuppliers = productSuppliers.filter(ps => ps.supplier?.status === 'Approved');

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center space-y-2">
            <p className="text-destructive">Error loading suppliers</p>
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Product Suppliers</h2>
          <p className="text-muted-foreground">
            Suppliers providing components or services for this product
          </p>
        </div>
        <Button onClick={() => setShowLinkDialog(true)}>
          <LinkIcon className="h-4 w-4 mr-2" />
          Link Supplier
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productSuppliers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{criticalSuppliers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{approvedSuppliers.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Suppliers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Linked Suppliers</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <ProductSupplierTable 
              productSuppliers={productSuppliers}
              productId={productId}
            />
          )}
        </CardContent>
      </Card>

      {/* Link Supplier Dialog */}
      <LinkSupplierDialog
        open={showLinkDialog}
        onOpenChange={setShowLinkDialog}
        productId={productId}
        companyId={companyId}
      />
    </div>
  );
}