import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ConsistentPageHeader } from '@/components/layout/ConsistentPageHeader';
import { ReimbursementInfoHub } from '@/components/product/reimbursement/ReimbursementInfoHub';
import { ReimbursementCodeTracker } from '@/components/product/reimbursement/ReimbursementCodeTracker';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';

export default function ProductReimbursementPage() {
  const { companyName, productId } = useParams();

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, company_id, markets')
        .eq('id', productId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });

  const { data: codeSummary } = useQuery({
    queryKey: ['reimbursement-summary', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_reimbursement_codes')
        .select('coverage_status')
        .eq('product_id', productId!);

      if (error) throw error;

      const summary = {
        total: data.length,
        exact_match: data.filter(c => c.coverage_status === 'exact_match').length,
        partial_match: data.filter(c => c.coverage_status === 'partial_match').length,
        pending: data.filter(c => c.coverage_status === 'pending').length,
        new_needed: data.filter(c => c.coverage_status === 'new_needed').length,
      };

      return summary;
    },
    enabled: !!productId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Product not found</div>
      </div>
    );
  }

  // Map country names and codes to standardized 2-letter codes
  const countryNameToCode: Record<string, string> = {
    'United States': 'US',
    'USA': 'US',  // Handle 3-letter code
    'European Union': 'EU',
    'Germany': 'DE',
    'France': 'FR',
    'United Kingdom': 'UK',
    'Canada': 'CA',
    'Japan': 'JP',
    'Australia': 'AU',
    'Brazil': 'BR',
    'China': 'CN',
    'India': 'IN',
    'South Korea': 'KR',
    'Switzerland': 'CH',
  };

  // Extract markets from product data
  let targetMarkets: string[] = [];
  if (product.markets) {
    if (Array.isArray(product.markets)) {
      targetMarkets = product.markets.map((m: any) => {
        let marketCode = '';
        if (typeof m === 'string') {
          marketCode = m;
        } else {
          marketCode = m.code || m.market || m.name;
        }
        // Normalize to code if it's a full country name
        return countryNameToCode[marketCode] || marketCode;
      });
    } else if (typeof product.markets === 'string') {
      targetMarkets = product.markets.split(',').map(m => {
        const trimmed = m.trim();
        return countryNameToCode[trimmed] || trimmed;
      });
    }
  }

  return (
    <div className="space-y-6">
      <ConsistentPageHeader
        breadcrumbs={[
          { label: companyName || 'Company', href: `/app/company/${companyName}` },
          { label: product?.name || 'Product', href: `/app/company/${companyName}/product/${productId}` },
          { label: 'Reimbursement', href: `/app/company/${companyName}/product/${productId}/reimbursement` }
        ]}
        title="Reimbursement Strategy"
      />

      <p className="text-muted-foreground mb-6">
        Track reimbursement codes and application status for each target market
      </p>

      {/* Summary Cards */}
      {codeSummary && codeSummary.total > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Codes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{codeSummary.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Exact Match
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{codeSummary.exact_match}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{codeSummary.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                New Code Needed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{codeSummary.new_needed}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Info Hub */}
      <ReimbursementInfoHub targetMarkets={targetMarkets} />

      {/* Code Tracker */}
      <ReimbursementCodeTracker
        productId={product.id}
        companyId={product.company_id}
        targetMarkets={targetMarkets}
      />

      {/* Disclaimer */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base">Important Disclaimer</CardTitle>
          <CardDescription>
            This module provides guidance and tracking for reimbursement planning. It does not provide authoritative
            code databases or guarantee reimbursement approval. All code applications must go through proper regulatory
            channels, and manufacturers should consult with reimbursement specialists for official guidance.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
