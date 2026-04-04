import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Settings, TrendingUp, DollarSign, Calendar, Target, Import, AlertTriangle } from 'lucide-react';
import { MarketExtension } from '@/services/enhanced-rnpv/interfaces';
import { MarketExtensionService } from '@/services/enhanced-rnpv/marketExtensionService';
import { HierarchicalMarketService } from '@/services/hierarchicalMarketService';
import { CannibalizationImpactService, BidirectionalCannibalizationData } from '@/services/cannibalizationImpactService';
import { useToast } from '@/hooks/use-toast';
import { EnhancedProductMarket } from '@/utils/enhancedMarketRiskClassMapping';
import { MarketExtensionCardWithTemplates } from './MarketExtensionCardWithTemplates';
import { CannibalizationInsightsPanel } from './CannibalizationInsightsPanel';

interface MarketExtensionManagerProps {
  productId: string;
  companyId: string;
  marketExtensions: MarketExtension[];
  onMarketExtensionsChange: (extensions: MarketExtension[]) => void;
}

export function MarketExtensionManager({
  productId,
  companyId,
  marketExtensions,
  onMarketExtensionsChange
}: MarketExtensionManagerProps) {
  const [isAddingMarket, setIsAddingMarket] = useState(false);
  const [editingMarket, setEditingMarket] = useState<string | null>(null);
  const [targetMarkets, setTargetMarkets] = useState<EnhancedProductMarket[]>([]);
  const [cannibalizationData, setCannibalizationData] = useState<BidirectionalCannibalizationData>({
    thisProductCannibalizes: [],
    thisProductIsCannibalized: [],
    netPortfolioImpact: 0
  });
  const [isLoadingTargetMarkets, setIsLoadingTargetMarkets] = useState(false);
  const [newMarket, setNewMarket] = useState({
    marketCode: '',
    marketName: '',
    launchDate: '',
    peakRevenue: '',
    marketPenetration: ''
  });
  const { toast } = useToast();

  // Load target markets and cannibalization data on mount
  useEffect(() => {
    loadTargetMarkets();
    loadCannibalizationData();
  }, [productId]);

  const loadTargetMarkets = async () => {
    setIsLoadingTargetMarkets(true);
    try {
      const inheritanceChain = await HierarchicalMarketService.resolveEffectiveMarkets(productId);
      setTargetMarkets(inheritanceChain.effectiveMarkets);
      console.log('[MarketExtensionManager] Loaded target markets:', inheritanceChain.effectiveMarkets);
    } catch (error) {
      console.error('[MarketExtensionManager] Error loading target markets:', error);
    } finally {
      setIsLoadingTargetMarkets(false);
    }
  };

  const loadCannibalizationData = async () => {
    try {
      const cannibalizationService = new CannibalizationImpactService();
      const data = await cannibalizationService.getBidirectionalCannibalizationData(productId);
      setCannibalizationData(data);
      console.log('[MarketExtensionManager] Loaded cannibalization data:', data);
    } catch (error) {
      console.error('[MarketExtensionManager] Error loading cannibalization data:', error);
    }
  };

  const availableMarkets = MarketExtensionService.getAvailableMarkets();
  const unselectedMarkets = availableMarkets.filter(
    market => !marketExtensions.some(ext => ext.marketCode === market.code)
  );

  // Get selected target market codes
  const selectedTargetMarketCodes = targetMarkets
    .filter(market => market.selected)
    .map(market => market.code);

  // Check if target markets are already configured as extensions
  const missingMarketExtensions = selectedTargetMarketCodes.filter(
    code => !marketExtensions.some(ext => ext.marketCode === code)
  );

  const handleAddMarket = async () => {
    if (!newMarket.marketCode || !newMarket.marketName) {
      toast({
        title: "Validation Error",
        description: "Please select a market and provide basic information.",
        variant: "destructive"
      });
      return;
    }

    try {
      const marketData: Omit<MarketExtension, 'id' | 'createdAt' | 'updatedAt'> = {
        productId,
        companyId,
        marketCode: newMarket.marketCode,
        marketName: newMarket.marketName,
        isActive: true,
        revenueForecast: {
          currency: 'USD',
          discountRate: 0.10,
          launchDate: newMarket.launchDate ? new Date(newMarket.launchDate) : new Date(),
          monthlyRevenue: [],
          peakRevenue: parseFloat(newMarket.peakRevenue) || undefined,
          marketPenetration: parseFloat(newMarket.marketPenetration) || undefined
        },
        marketSpecificCosts: {
          currency: 'USD',
          regulatorySubmissionFees: 0,
          clinicalTrialCosts: 0,
          marketingInvestment: 0,
          distributionCosts: 0,
          maintenanceCosts: 0,
          additionalCosts: []
        },
        regulatoryPhases: MarketExtensionService.getRegulatoryTemplatesForMarket(newMarket.marketCode),
        commercialFactors: MarketExtensionService.getCommercialFactorTemplatesForMarket(newMarket.marketCode)
      };

      const createdExtension = await MarketExtensionService.createMarketExtension(
        productId,
        companyId,
        marketData
      );

      onMarketExtensionsChange([...marketExtensions, createdExtension]);
      setIsAddingMarket(false);
      setNewMarket({ marketCode: '', marketName: '', launchDate: '', peakRevenue: '', marketPenetration: '' });
      
      toast({
        title: "Market Added",
        description: `${newMarket.marketName} has been added to your analysis.`
      });
    } catch (error) {
      console.error('Failed to add market:', error);
      toast({
        title: "Error",
        description: "Failed to add market extension. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleToggleMarket = async (extensionId: string, isActive: boolean) => {
    try {
      const updatedExtension = await MarketExtensionService.updateMarketExtension(
        extensionId,
        { isActive }
      );

      const updatedExtensions = marketExtensions.map(ext =>
        ext.id === extensionId ? updatedExtension : ext
      );
      onMarketExtensionsChange(updatedExtensions);

      toast({
        title: isActive ? "Market Activated" : "Market Deactivated",
        description: `Market has been ${isActive ? 'included in' : 'excluded from'} the analysis.`
      });
    } catch (error) {
      console.error('Failed to toggle market:', error);
      toast({
        title: "Error",
        description: "Failed to update market status.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteMarket = async (extensionId: string, marketName: string) => {
    try {
      await MarketExtensionService.deleteMarketExtension(extensionId);
      const updatedExtensions = marketExtensions.filter(ext => ext.id !== extensionId);
      onMarketExtensionsChange(updatedExtensions);

      toast({
        title: "Market Removed",
        description: `${marketName} has been removed from the analysis.`
      });
    } catch (error) {
      console.error('Failed to delete market:', error);
      toast({
        title: "Error",
        description: "Failed to remove market extension.",
        variant: "destructive"
      });
    }
  };

  const getMarketStatusColor = (extension: MarketExtension) => {
    if (!extension.isActive) return 'bg-muted';
    const hasRevenue = extension.revenueForecast.monthlyRevenue.length > 0;
    const hasRegulatory = extension.regulatoryPhases.length > 0;
    if (hasRevenue && hasRegulatory) return 'bg-green-100 border-green-300';
    if (hasRevenue || hasRegulatory) return 'bg-yellow-100 border-yellow-300';
    return 'bg-red-100 border-red-300';
  };

  const handleImportFromTargetMarkets = async () => {
    try {
      setIsLoadingTargetMarkets(true);
      const extensionsToCreate = missingMarketExtensions.map(code => {
        const targetMarket = targetMarkets.find(tm => tm.code === code);
        return {
          marketCode: code,
          marketName: targetMarket?.name || code,
          launchDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year from now
          peakRevenue: '',
          marketPenetration: ''
        };
      });

      for (const market of extensionsToCreate) {
        const marketData: Omit<MarketExtension, 'id' | 'createdAt' | 'updatedAt'> = {
          productId,
          companyId,
          marketCode: market.marketCode,
          marketName: market.marketName,
          isActive: true,
          revenueForecast: {
            currency: 'USD',
            discountRate: 0.10,
            launchDate: new Date(market.launchDate),
            monthlyRevenue: [],
            peakRevenue: undefined,
            marketPenetration: undefined
          },
          marketSpecificCosts: {
            currency: 'USD',
            regulatorySubmissionFees: 0,
            clinicalTrialCosts: 0,
            marketingInvestment: 0,
            distributionCosts: 0,
            maintenanceCosts: 0,
            additionalCosts: []
          },
          regulatoryPhases: MarketExtensionService.getRegulatoryTemplatesForMarket(market.marketCode),
          commercialFactors: MarketExtensionService.getCommercialFactorTemplatesForMarket(market.marketCode)
        };

        const createdExtension = await MarketExtensionService.createMarketExtension(
          productId,
          companyId,
          marketData
        );

        onMarketExtensionsChange([...marketExtensions, createdExtension]);
      }

      toast({
        title: "Markets Imported",
        description: `${extensionsToCreate.length} target markets imported successfully.`
      });
    } catch (error) {
      console.error('Failed to import target markets:', error);
      toast({
        title: "Import Failed",
        description: "Failed to import target markets. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingTargetMarkets(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Market Extensions
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Configure target markets for platform deployment and revenue analysis
            </p>
          </div>
          <div className="flex items-center gap-2">
            {missingMarketExtensions.length > 0 && (
              <Button 
                onClick={handleImportFromTargetMarkets}
                variant="outline"
                className="flex items-center gap-2"
                disabled={isLoadingTargetMarkets}
              >
                <Import className="h-4 w-4" />
                {isLoadingTargetMarkets ? 'Importing...' : `Import Target Markets (${missingMarketExtensions.length})`}
              </Button>
            )}
            {unselectedMarkets.length > 0 && (
              <Button 
                onClick={() => setIsAddingMarket(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Market
              </Button>
            )}
          </div>
        </div>
        
        {/* Target Markets Sync Status */}
        {selectedTargetMarketCodes.length > 0 ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Target className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900">Product Target Markets: {selectedTargetMarketCodes.join(', ')}</p>
                {missingMarketExtensions.length > 0 ? (
                  <p className="text-blue-700 mt-1">
                    <AlertTriangle className="h-3 w-3 inline mr-1" />
                    {missingMarketExtensions.length} target market(s) not yet configured for rNPV analysis
                  </p>
                ) : (
                  <p className="text-green-700 mt-1">✓ All target markets are configured for rNPV analysis</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-900">No Target Markets Selected</p>
                <p className="text-yellow-700 mt-1">
                  Please configure target markets in your product settings first, then return here to import them for rNPV analysis.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Cannibalization Insights */}
        {marketExtensions.length > 0 && cannibalizationData && (
          <CannibalizationInsightsPanel
            cannibalizationData={cannibalizationData}
            activeMarkets={marketExtensions.filter(ext => ext.isActive).map(ext => ext.marketCode)}
          />
        )}

        {/* Market Extensions List */}
        <div className="grid gap-4">
          {marketExtensions.map((extension) => (
            <MarketExtensionCardWithTemplates
              key={extension.id}
              extension={extension}
              cannibalizationData={{
                impacts: cannibalizationData.thisProductCannibalizes || [],
                netPortfolioImpact: cannibalizationData.netPortfolioImpact || 0
              }}
              companyId={companyId}
              deviceClass="Class II" // TODO: Get from product
              onToggle={handleToggleMarket}
              onEdit={setEditingMarket}
              onDelete={handleDeleteMarket}
              onUpdate={(updatedExtension) => {
                const updatedExtensions = marketExtensions.map(ext =>
                  ext.id === updatedExtension.id ? updatedExtension : ext
                );
                onMarketExtensionsChange(updatedExtensions);
              }}
            />
          ))}
        </div>

        {/* Add New Market Form */}
        {isAddingMarket && (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-lg">Add New Market Extension</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Target Market</Label>
                  <Select 
                    value={newMarket.marketCode} 
                    onValueChange={(value) => {
                      const market = availableMarkets.find(m => m.code === value);
                      setNewMarket(prev => ({
                        ...prev,
                        marketCode: value,
                        marketName: market?.name || ''
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select market" />
                    </SelectTrigger>
                    <SelectContent>
                      {unselectedMarkets.map((market) => (
                        <SelectItem key={market.code} value={market.code}>
                          <div className="flex items-center gap-2">
                            <span>{market.name}</span>
                            <Badge variant="outline">{market.region}</Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Expected Launch Date</Label>
                  <Input
                    type="date"
                    value={newMarket.launchDate}
                    onChange={(e) => setNewMarket(prev => ({ ...prev, launchDate: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Peak Revenue Estimate ($)</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 5000000"
                    value={newMarket.peakRevenue}
                    onChange={(e) => setNewMarket(prev => ({ ...prev, peakRevenue: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Market Penetration (%)</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 5"
                    max="100"
                    value={newMarket.marketPenetration}
                    onChange={(e) => setNewMarket(prev => ({ ...prev, marketPenetration: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddingMarket(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddMarket}>
                  Add Market
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit Market Dialog */}
        {editingMarket && (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-lg">Edit Market Extension</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
                const extension = marketExtensions.find(ext => ext.id === editingMarket);
                if (!extension) return null;
                
                return (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Market: {extension.marketName}</Label>
                      <Badge variant="outline">{extension.marketCode}</Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Launch Date</Label>
                      <Input
                        type="date"
                        value={new Date(extension.revenueForecast.launchDate).toISOString().split('T')[0]}
                        onChange={async (e) => {
                          if (!e.target.value) return;
                          try {
                            const updatedExtension = await MarketExtensionService.updateMarketExtension(
                              extension.id,
                              {
                                revenueForecast: {
                                  ...extension.revenueForecast,
                                  launchDate: new Date(e.target.value)
                                }
                              }
                            );
                            const updatedExtensions = marketExtensions.map(ext =>
                              ext.id === extension.id ? updatedExtension : ext
                            );
                            onMarketExtensionsChange(updatedExtensions);
                          } catch (error) {
                            console.error('Failed to update launch date:', error);
                            toast({
                              title: "Error",
                              description: "Failed to update launch date.",
                              variant: "destructive"
                            });
                          }
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Peak Revenue ($)</Label>
                      <Input
                        type="number"
                        placeholder="Enter peak revenue"
                        value={extension.revenueForecast.peakRevenue || ''}
                        onChange={async (e) => {
                          try {
                            const peakRevenue = parseFloat(e.target.value) || undefined;
                            const updatedExtension = await MarketExtensionService.updateMarketExtension(
                              extension.id,
                              {
                                revenueForecast: {
                                  ...extension.revenueForecast,
                                  peakRevenue
                                }
                              }
                            );
                            const updatedExtensions = marketExtensions.map(ext =>
                              ext.id === extension.id ? updatedExtension : ext
                            );
                            onMarketExtensionsChange(updatedExtensions);
                          } catch (error) {
                            console.error('Failed to update peak revenue:', error);
                          }
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Market Penetration (%)</Label>
                      <Input
                        type="number"
                        placeholder="Enter market penetration"
                        max="100"
                        value={extension.revenueForecast.marketPenetration || ''}
                        onChange={async (e) => {
                          try {
                            const marketPenetration = parseFloat(e.target.value) || undefined;
                            const updatedExtension = await MarketExtensionService.updateMarketExtension(
                              extension.id,
                              {
                                revenueForecast: {
                                  ...extension.revenueForecast,
                                  marketPenetration
                                }
                              }
                            );
                            const updatedExtensions = marketExtensions.map(ext =>
                              ext.id === extension.id ? updatedExtension : ext
                            );
                            onMarketExtensionsChange(updatedExtensions);
                          } catch (error) {
                            console.error('Failed to update market penetration:', error);
                          }
                        }}
                      />
                    </div>
                  </div>
                );
              })()}

              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setEditingMarket(null)}
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {marketExtensions.length === 0 && !isAddingMarket && (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No Market Extensions</p>
            <p className="mb-4">Add target markets to begin your rNPV analysis</p>
            <div className="flex justify-center gap-2">
              {missingMarketExtensions.length > 0 && (
                <Button onClick={handleImportFromTargetMarkets} variant="outline">
                  <Import className="h-4 w-4 mr-2" />
                  Import Target Markets
                </Button>
              )}
              {unselectedMarkets.length > 0 && (
                <Button onClick={() => setIsAddingMarket(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Market
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}