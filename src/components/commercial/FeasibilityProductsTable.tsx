import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { useFeasibilityProducts, useRevenueProjections, useFeasibilityPortfolio } from '@/hooks/useFeasibilityPortfolio';
import { RevenueProjectionsDialog } from './RevenueProjectionsDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface FeasibilityProductsTableProps {
  portfolioId: string;
  companyId: string;
  bundleId?: string;
}

export function FeasibilityProductsTable({ portfolioId, companyId, bundleId }: FeasibilityProductsTableProps) {
  const navigate = useNavigate();
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [revenueDialogOpen, setRevenueDialogOpen] = useState(false);

  const { data: products, isLoading } = useFeasibilityProducts(portfolioId);
  const { data: allRevenue } = useRevenueProjections(portfolioId);
  const { data: portfolio } = useFeasibilityPortfolio(bundleId);

  const getRevenueSummary = (portfolioProductId: string) => {
    const projections = allRevenue?.filter(r => r.portfolio_product_id === portfolioProductId) || [];
    if (projections.length === 0) return null;
    
    const total = projections.reduce((sum, r) => sum + (r.likely_case_revenue || 0), 0);
    return { count: projections.length, total };
  };

  const handleNavigateToMilestones = (productId: string) => {
    navigate(`/app/product/${productId}/milestones`, {
      state: { fromFeasibilityStudy: true, bundleId, portfolioId }
    });
  };

  const handleOpenRevenue = (portfolioProductId: string) => {
    const bundleTargetMarkets = (portfolio as any)?.target_markets || [];
    if (bundleTargetMarkets.length === 0) {
      // Could add a toast here to inform user
      return;
    }
    setSelectedProductId(portfolioProductId);
    setRevenueDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No products found in this feasibility study.</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate portfolio totals
  const portfolioRevenueTotal = allRevenue?.reduce((sum, r) => sum + (r.likely_case_revenue || 0), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Devices</CardDescription>
            <CardTitle className="text-3xl">{products.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Projected Revenue (Likely)</CardDescription>
            <CardTitle className="text-3xl">
              ${(portfolioRevenueTotal / 1000).toFixed(0)}k
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products & Financial Planning</CardTitle>
          <CardDescription>
            View product milestones and define revenue projections for each product in the feasibility study
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Relationship</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
            {products.map((product) => {
                const revenueSummary = getRevenueSummary(product.id);
                const productImage = product.product.image || product.product.images?.[0];

                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {productImage ? (
                          <img 
                            src={productImage} 
                            alt={product.product.name}
                            className="h-10 w-10 rounded object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                            <span className="text-xs font-medium">
                              {product.product.name.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{product.product.name}</div>
                          {product.product.trade_name && (
                            <div className="text-sm text-muted-foreground">
                              {product.product.trade_name}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{product.role || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm capitalize">-</span>
                    </TableCell>
                    <TableCell>{product.quantity_in_bundle || 1}</TableCell>
                    <TableCell>
                      <Badge variant={product.development_status === 'existing' ? 'default' : 'secondary'}>
                        {product.development_status || 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {revenueSummary ? (
                        <div className="text-sm">
                          <div className="font-medium">
                            ${(revenueSummary.total / 1000).toFixed(0)}k
                          </div>
                          <div className="text-muted-foreground">
                            {revenueSummary.count} projections
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Not set</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleNavigateToMilestones(product.product.id)}
                        >
                          <Calendar className="h-3 w-3 mr-1" />
                          Milestones
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenRevenue(product.id)}
                          disabled={!((portfolio as any)?.target_markets?.length > 0)}
                          title={!((portfolio as any)?.target_markets?.length > 0) ? "Define target markets in bundle settings first" : ""}
                        >
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Revenue
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedProductId && (
        <RevenueProjectionsDialog
          open={revenueDialogOpen}
          onOpenChange={setRevenueDialogOpen}
          portfolioId={portfolioId}
          portfolioProductId={selectedProductId}
          productName={products.find(p => p.id === selectedProductId)?.product.name || ''}
          targetMarkets={(portfolio as any)?.target_markets || []}
        />
      )}
    </div>
  );
}
