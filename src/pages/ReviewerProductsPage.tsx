import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCompanyRole } from '@/context/CompanyRoleContext';
import { useReviewerGroupMembership } from '@/hooks/useReviewerGroupMembership';
import { useReviewerProducts } from '@/hooks/useReviewerProducts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, FileText, Building2, ArrowRight } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function ReviewerProductsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeCompanyId, companyRoles } = useCompanyRole();

  // Use the first available company if no active company
  const targetCompanyId = activeCompanyId || companyRoles[0]?.companyId;
  const targetCompanyName = companyRoles.find(r => r.companyId === targetCompanyId)?.companyName;

  const { userGroups, isLoading: isLoadingGroups } = useReviewerGroupMembership(targetCompanyId);
  const { data: products, isLoading: isLoadingProducts, error } = useReviewerProducts({
    reviewerGroupIds: userGroups,
  });
  // console.log("products", products);
  const firstName = user?.user_metadata?.first_name || "Expert";

  if (isLoadingGroups || isLoadingProducts) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
          <p className="ml-3 text-muted-foreground">Loading products...</p>
        </div>
      </div>
    );
  }

  if (!targetCompanyId) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">Assigned Products</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800">No companies available. Please contact an administrator.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">Assigned Products</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">Error loading products: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleProductClick = (productId: string) => {
    navigate(`/app/product/${productId}/device-information`);
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Assigned Products
        </h1>
        <p className="text-muted-foreground">
          Products with documents assigned to your reviewer groups
          {targetCompanyName && ` for ${targetCompanyName}`}
        </p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mt-2">
              <Package className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{products?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Products</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mt-2">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">
                  {products?.reduce((sum, p) => sum + (p.document_count || 0), 0) || 0}
                </p>
                <p className="text-sm text-muted-foreground">Documents</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mt-2">
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">
                  {new Set(products?.map(p => p.company_id)).size || 0}
                </p>
                <p className="text-sm text-muted-foreground">Companies</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products List */}
      {!products || products.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Products Assigned</h3>
            <p className="text-muted-foreground">
              You don't have any products with documents assigned to your reviewer groups yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {products.map((product) => (
            <Card
              key={product.id}
              className="hover:bg-accent/50 cursor-pointer transition-colors"
              onClick={() => handleProductClick(product.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      {product.name}
                    </CardTitle>
                    {product.company_name && (
                      <p className="text-sm text-muted-foreground">
                        {product.company_name}
                      </p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm">
                    View Details
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {product.device_category && (
                    <Badge variant="outline">{product.device_category}</Badge>
                  )}
                  {product.product_platform && (
                    <Badge variant="outline">{product.product_platform}</Badge>
                  )}
                  {product.model_reference && (
                    <Badge variant="outline">{product.model_reference}</Badge>
                  )}
                  {product.status && (
                    <Badge variant="secondary">{product.status}</Badge>
                  )}
                  {product.document_count && product.document_count > 0 && (
                    <Badge variant="default">
                      <FileText className="h-3 w-3 mr-1" />
                      {product.document_count} document{product.document_count !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
