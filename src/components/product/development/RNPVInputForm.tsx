import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RNPVInputData } from '@/services/rnpvInputService';
import { CannibalizationSettings } from './CannibalizationSettings';
import { PhaseBudgetIntegration } from './PhaseBudgetIntegration';
import { PhaseBasedRiskAssessment } from './PhaseBasedRiskAssessment';
import { CommercialSuccessFactorsManager } from './CommercialSuccessFactorsManager';
import { Calculator, TrendingUp, Target, DollarSign, Shield, Network } from 'lucide-react';

interface RNPVInputFormProps {
  productId: string;
  companyId: string;
  initialInputs: RNPVInputData;
  onInputsChange: (inputs: RNPVInputData) => void;
  onRecalculate: () => void;
  isLoading?: boolean;
}

export function RNPVInputForm({
  productId,
  companyId,
  initialInputs,
  onInputsChange,
  onRecalculate,
  isLoading = false
}: RNPVInputFormProps) {
  const [inputs, setInputs] = useState<RNPVInputData>(initialInputs);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (JSON.stringify(inputs) !== JSON.stringify(initialInputs)) {
      setHasChanges(true);
      onInputsChange(inputs);
    } else {
      setHasChanges(false);
    }
  }, [inputs, initialInputs, onInputsChange]);

  const updateInput = (field: keyof RNPVInputData, value: any) => {
    setInputs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRecalculate = () => {
    onRecalculate();
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">rNPV Analysis Parameters</h3>
          <p className="text-sm text-muted-foreground">
            Configure your financial assumptions and market parameters
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="secondary">Unsaved changes</Badge>
          )}
          <Button 
            onClick={handleRecalculate}
            disabled={isLoading}
            className="gap-2"
          >
            <Calculator className="h-4 w-4" />
            {isLoading ? 'Calculating...' : 'Recalculate'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="market" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="market" className="gap-2">
            <Target className="h-4 w-4" />
            Market
          </TabsTrigger>
          <TabsTrigger value="revenue" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Revenue
          </TabsTrigger>
          <TabsTrigger value="costs" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Costs
          </TabsTrigger>
          <TabsTrigger value="financial" className="gap-2">
            <Calculator className="h-4 w-4" />
            Financial
          </TabsTrigger>
          <TabsTrigger value="risk" className="gap-2">
            <Shield className="h-4 w-4" />
            Risk
          </TabsTrigger>
          <TabsTrigger value="commercial" className="gap-2">
            <Network className="h-4 w-4" />
            Commercial
          </TabsTrigger>
          <TabsTrigger value="cannibalization" className="gap-2">
            <Network className="h-4 w-4" />
            Portfolio
          </TabsTrigger>
        </TabsList>

        {/* Market Parameters */}
        <TabsContent value="market">
          <Card>
            <CardHeader>
              <CardTitle>Market Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tam">Total Addressable Market ($)</Label>
                  <Input
                    id="tam"
                    type="number"
                    value={inputs.totalAddressableMarket}
                    onChange={(e) => updateInput('totalAddressableMarket', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="market-share">Expected Market Share (%)</Label>
                  <Input
                    id="market-share"
                    type="number"
                    step="0.1"
                    value={inputs.expectedMarketShare}
                    onChange={(e) => updateInput('expectedMarketShare', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="launch-year">Launch Year</Label>
                  <Input
                    id="launch-year"
                    type="number"
                    value={inputs.launchYear}
                    onChange={(e) => updateInput('launchYear', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lifespan">Product Lifespan (years)</Label>
                  <Input
                    id="lifespan"
                    type="number"
                    value={inputs.productLifespan}
                    onChange={(e) => updateInput('productLifespan', Number(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Model */}
        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Model</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="selling-price">Average Selling Price ($)</Label>
                  <Input
                    id="selling-price"
                    type="number"
                    value={inputs.averageSellingPrice}
                    onChange={(e) => updateInput('averageSellingPrice', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price-change">Annual Price Change (%)</Label>
                  <Input
                    id="price-change"
                    type="number"
                    step="1"
                    value={inputs.annualPriceChange}
                    onChange={(e) => updateInput('annualPriceChange', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="volume-growth">Annual Volume Growth (%)</Label>
                  <Input
                    id="volume-growth"
                    type="number"
                    step="1"
                    value={inputs.annualVolumeGrowth}
                    onChange={(e) => updateInput('annualVolumeGrowth', Number(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cost Structure */}
        <TabsContent value="costs">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Cost Structure</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="unit-cost">Unit Cost ($)</Label>
                    <Input
                      id="unit-cost"
                      type="number"
                      value={inputs.unitCost}
                      onChange={(e) => updateInput('unitCost', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cost-change">Annual Cost Change (%)</Label>
                    <Input
                      id="cost-change"
                      type="number"
                      step="1"
                      value={inputs.annualCostChange}
                      onChange={(e) => updateInput('annualCostChange', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fixed-costs">Fixed Costs ($)</Label>
                    <Input
                      id="fixed-costs"
                      type="number"
                      value={inputs.fixedCosts}
                      onChange={(e) => updateInput('fixedCosts', Number(e.target.value))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <PhaseBudgetIntegration 
              productId={productId}
              onDevelopmentCostsUpdate={(costs) => {
                // Update the form with development costs from phase budgets
                console.log('Development costs from phase budgets:', costs);
                updateInput('totalDevelopmentCosts', costs.totalDevelopmentCosts);
              }}
            />
          </div>
        </TabsContent>

        {/* Financial Parameters */}
        <TabsContent value="financial">
          <Card>
            <CardHeader>
              <CardTitle>Financial Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discount-rate">Discount Rate (%)</Label>
                  <Input
                    id="discount-rate"
                    type="number"
                    step="0.1"
                    value={inputs.discountRate}
                    onChange={(e) => updateInput('discountRate', Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Cost of capital / required rate of return
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax-rate">Tax Rate (%)</Label>
                  <Input
                    id="tax-rate"
                    type="number"
                    step="0.1"
                    value={inputs.taxRate}
                    onChange={(e) => updateInput('taxRate', Number(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Factors - Now Phase-based */}
        <TabsContent value="risk">
          <PhaseBasedRiskAssessment
            productId={productId}
            onRiskDataChange={(combinedLoA, milestones) => {
              // Store the milestone-based risk data for calculations
              console.log('Phase-based risk data updated:', { combinedLoA, milestones });
            }}
          />
        </TabsContent>

        {/* Commercial Success Factors */}
        <TabsContent value="commercial">
          <CommercialSuccessFactorsManager
            productId={productId}
            companyId={companyId}
            onFactorsChange={(factors, combinedLoA) => {
              // Store commercial factor data for calculations
              console.log('Commercial factors updated:', { factors, combinedLoA });
            }}
          />
        </TabsContent>

        {/* Cannibalization */}
        <TabsContent value="cannibalization">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Impact Analysis</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure how this new product affects existing portfolio products
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="cannibalization-enabled"
                  checked={inputs.cannibalizationEnabled}
                  onCheckedChange={(checked) => updateInput('cannibalizationEnabled', checked)}
                />
                <Label htmlFor="cannibalization-enabled">
                  Enable cannibalization analysis
                </Label>
              </div>

              {inputs.cannibalizationEnabled && (
                <CannibalizationSettings
                  companyId={companyId}
                  currentProductId={productId}
                  affectedProducts={inputs.affectedProducts}
                  portfolioSynergies={inputs.portfolioSynergies}
                  onAffectedProductsChange={(products) => updateInput('affectedProducts', products)}
                  onPortfolioSynergiesChange={(synergies) => updateInput('portfolioSynergies', synergies)}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Analysis Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Analysis Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="analysis-name">Analysis Name</Label>
              <Input
                id="analysis-name"
                value={inputs.analysisName}
                onChange={(e) => updateInput('analysisName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={inputs.description || ''}
                onChange={(e) => updateInput('description', e.target.value)}
                placeholder="Optional description of this analysis scenario"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}