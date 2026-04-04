import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle,
  TrendingDown,
  BarChart3,
  Info
} from 'lucide-react';
import { AffectedProductsSection } from '@/components/product/device/sections/AffectedProductsSection';
import { CannibalizationInsightsPanel } from './CannibalizationInsightsPanel';
import { AffectedProduct } from '@/types/affectedProducts';
import { MarketExtension } from '@/services/enhanced-rnpv/interfaces';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EnhancedMarketImpactAnalysisProps {
  productId: string;
  companyId: string;
  marketExtensions: MarketExtension[];
  affectedProducts: AffectedProduct[];
  onAffectedProductsChange: (products: AffectedProduct[]) => void;
}

export function EnhancedMarketImpactAnalysis({
  productId,
  companyId,
  marketExtensions,
  affectedProducts,
  onAffectedProductsChange
}: EnhancedMarketImpactAnalysisProps) {
  const [availableProducts, setAvailableProducts] = useState<Array<{ id: string; name: string }>>([]);
  const [activeTab, setActiveTab] = useState('configuration');

  // Fetch available products for cannibalization analysis
  useEffect(() => {
    const fetchAvailableProducts = async () => {
      try {
        const { data: products, error } = await supabase
          .from('products')
          .select('id, name')
          .eq('company_id', companyId)
          .neq('id', productId);
        
        if (error) throw error;
        setAvailableProducts(products || []);
      } catch (error) {
        console.error('Error loading available products:', error);
        toast.error('Failed to load available products');
      }
    };

    fetchAvailableProducts();
  }, [companyId, productId]);

  // Calculate total cannibalization impact across all markets
  const calculateTotalImpact = () => {
    if (!affectedProducts.length || !marketExtensions.length) return 0;
    
    // This is a simplified calculation - in a real implementation,
    // you'd integrate with the full rNPV calculation engine
    return affectedProducts.reduce((total, product) => {
      return total + (product.totalCannibalizationPercentage * 1000000); // Simplified impact
    }, 0);
  };

  const totalCannibalizationImpact = calculateTotalImpact();
  const hasActiveMarkets = marketExtensions.some(ext => ext.isActive);

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Market Impact Analysis
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Analyze how this product launch will impact existing products in your portfolio
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {affectedProducts.length}
              </div>
              <div className="text-sm text-muted-foreground">Affected Products</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {marketExtensions.filter(ext => ext.isActive).length}
              </div>
              <div className="text-sm text-muted-foreground">Active Markets</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${totalCannibalizationImpact > 0 ? 'text-red-600' : 'text-green-600'}`}>
                ${(Math.abs(totalCannibalizationImpact) / 1000000).toFixed(1)}M
              </div>
              <div className="text-sm text-muted-foreground">Est. Impact</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Setup Warning */}
      {!hasActiveMarkets && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Configure active market extensions first to enable comprehensive market impact analysis.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="configuration" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="analysis" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Impact Analysis
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-2">
            <TrendingDown className="h-4 w-4" />
            Portfolio Insights
          </TabsTrigger>
        </TabsList>

        {/* Configuration Tab */}
        <TabsContent value="configuration">
          <Card>
            <CardHeader>
              <CardTitle>Product Cannibalization Configuration</CardTitle>
              <p className="text-sm text-muted-foreground">
                Define which existing products will be impacted by this new product launch
              </p>
            </CardHeader>
            <CardContent>
              <AffectedProductsSection
                availableProducts={availableProducts}
                affectedProducts={affectedProducts}
                onAffectedProductsChange={onAffectedProductsChange}
                currency={{ symbol: '$', name: 'USD' }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Impact Analysis Tab */}
        <TabsContent value="analysis">
          <Card>
            <CardHeader>
              <CardTitle>Cannibalization Impact Analysis</CardTitle>
              <p className="text-sm text-muted-foreground">
                Detailed analysis of how cannibalization affects your portfolio across different markets
              </p>
            </CardHeader>
            <CardContent>
              {affectedProducts.length > 0 ? (
                <div className="space-y-6">
                  {/* Market-specific impact analysis */}
                  <div className="grid gap-4">
                    {marketExtensions
                      .filter(ext => ext.isActive)
                      .map(market => (
                        <div key={market.id} className="border rounded-lg p-4">
                          <h4 className="font-medium mb-3">{market.marketName} ({market.marketCode})</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="text-muted-foreground">Affected Products in Market</div>
                              <div className="font-medium">{affectedProducts.length}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Est. Revenue Impact</div>
                              <div className="font-medium text-red-600">
                                -${(totalCannibalizationImpact / marketExtensions.filter(ext => ext.isActive).length / 1000000).toFixed(1)}M
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Affected Products Details */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Affected Products Breakdown</h4>
                    {affectedProducts.map((product, index) => (
                      <div key={index} className="flex justify-between items-center p-3 border rounded">
                        <div>
                          <div className="font-medium">{product.productName}</div>
                          <div className="text-sm text-muted-foreground">
                            {product.monthsToReachRoof} months to reach {product.totalCannibalizationPercentage}% impact
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-red-600">
                            -{product.totalCannibalizationPercentage}%
                          </div>
                          <div className="text-sm text-muted-foreground">Max Impact</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingDown className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No Cannibalization Configured</p>
                  <p>Configure affected products in the Configuration tab to see impact analysis</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Portfolio Insights Tab */}
        <TabsContent value="insights">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Insights</CardTitle>
              <p className="text-sm text-muted-foreground">
                Strategic insights about portfolio cannibalization and market dynamics
              </p>
            </CardHeader>
            <CardContent>
              {affectedProducts.length > 0 && hasActiveMarkets ? (
                <div className="space-y-6">
                  {/* Portfolio Impact Summary */}
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-3">Portfolio Impact Summary</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Net Portfolio Impact</div>
                        <div className={`font-bold ${totalCannibalizationImpact > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {totalCannibalizationImpact > 0 ? '-' : '+'}${(Math.abs(totalCannibalizationImpact) / 1000000).toFixed(1)}M
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Portfolio Risk Level</div>
                        <div className="font-bold text-orange-600">
                          {affectedProducts.length > 3 ? 'High' : affectedProducts.length > 1 ? 'Medium' : 'Low'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Strategic Recommendations */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Strategic Recommendations</h4>
                    <div className="space-y-2 text-sm">
                      {affectedProducts.length > 3 && (
                        <div className="flex items-start gap-2 p-3 bg-orange-50 rounded">
                          <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                          <div>
                            <div className="font-medium text-orange-800">High Cannibalization Risk</div>
                            <div className="text-orange-700">
                              Consider staggered launch strategy to minimize portfolio disruption
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-start gap-2 p-3 bg-blue-50 rounded">
                        <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div>
                          <div className="font-medium text-blue-800">Market Positioning</div>
                          <div className="text-blue-700">
                            Focus on differentiation to reduce cannibalization in key markets
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No Portfolio Data</p>
                  <p>Complete the configuration and market setup to see portfolio insights</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}