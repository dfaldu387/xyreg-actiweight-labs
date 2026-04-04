import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, TrendingUp, Network, Calculator, Zap } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSmartRevenueCalculations, useCalculateSmartRevenue, useSmartRevenueInsights } from "@/hooks/useSmartRevenue";
import { useProductRelationshipsSmart } from "@/hooks/useSmartRevenue";
import { useForecasts } from "@/hooks/useCommercialData";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from '@/hooks/useTranslation';

interface SmartForecastingWidgetProps {
  companyId: string;
  disabled?: boolean;
}

export function SmartForecastingWidget({ companyId, disabled = false }: SmartForecastingWidgetProps) {
  const { toast } = useToast();
  const { lang } = useTranslation();
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [whatIfScenario, setWhatIfScenario] = useState({
    mainProductGrowth: 0,
    multiplierAdjustment: 0,
  });

  // Get current date range (last 3 months + next 12 months)
  const now = new Date();
  const startMonth = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const endMonth = new Date(now.getFullYear(), now.getMonth() + 12, 1);

  const { data: smartCalculations, isLoading: calculationsLoading } = useSmartRevenueCalculations(
    companyId,
    startMonth,
    endMonth
  );

  const { data: relationships, isLoading: relationshipsLoading } = useProductRelationshipsSmart(companyId);
  const { data: forecasts } = useForecasts(companyId);
  const { data: insights } = useSmartRevenueInsights(companyId, selectedProduct);
  const calculateSmartRevenue = useCalculateSmartRevenue();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleGenerateSmartForecast = async () => {
    if (disabled) return;
    if (!forecasts || forecasts.length === 0) {
      toast({
        title: lang('commercialPerformance.smartForecast.noForecastData'),
        description: lang('commercialPerformance.smartForecast.noForecastDataDesc'),
        variant: "destructive",
      });
      return;
    }

    // Convert forecasts to ProductForecastData format
    const productForecasts = forecasts.reduce((acc, forecast) => {
      // Group forecasts by product (this is simplified - would need product mapping)
      const key = 'portfolio'; // Simplified for now
      if (!acc[key]) {
        acc[key] = {
          productId: key,
          monthlyForecast: {},
          unitPrice: 1000, // Default unit price - should come from product data
        };
      }
      acc[key].monthlyForecast[forecast.forecast_month] = forecast.total_revenue / 1000; // Convert to units
      return acc;
    }, {} as Record<string, any>);

    const calculationMonths = [];
    for (let i = 0; i < 15; i++) {
      const month = new Date(now.getFullYear(), now.getMonth() - 3 + i, 1);
      calculationMonths.push(month);
    }

    try {
      await calculateSmartRevenue.mutateAsync({
        companyId,
        mainProductForecasts: Object.values(productForecasts),
        calculationMonths,
      });
    } catch (error) {
      console.error('Failed to generate smart forecast:', error);
    }
  };

  const relationshipStats = {
    totalRelationships: relationships?.length || 0,
    smartEnabled: relationships?.filter(r => r.initial_multiplier > 0 || r.recurring_multiplier > 0).length || 0,
    totalAttributedRevenue: insights?.totalAttributedRevenue || 0,
    topDriver: insights?.topMainProducts?.[0]?.[0] || 'N/A',
  };

  if (calculationsLoading || relationshipsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            {lang('commercialPerformance.smartForecast.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-pulse text-muted-foreground">{lang('commercialPerformance.smartForecast.loading')}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-card to-primary/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              {lang('commercialPerformance.smartForecast.title')}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {lang('commercialPerformance.smartForecast.subtitle')}
            </p>
          </div>
          <Button
            onClick={handleGenerateSmartForecast}
            disabled={calculateSmartRevenue.isPending || disabled}
            className="bg-primary text-primary-foreground"
          >
            <Calculator className="mr-2 h-4 w-4" />
            {calculateSmartRevenue.isPending ? lang('commercialPerformance.smartForecast.calculating') : lang('commercialPerformance.smartForecast.calculate')}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">{lang('commercialPerformance.smartForecast.tabs.overview')}</TabsTrigger>
            <TabsTrigger value="relationships">{lang('commercialPerformance.smartForecast.tabs.relationships')}</TabsTrigger>
            <TabsTrigger value="calculations">{lang('commercialPerformance.smartForecast.tabs.calculations')}</TabsTrigger>
            <TabsTrigger value="what-if">{lang('commercialPerformance.smartForecast.tabs.whatIf')}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Smart Revenue Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">{relationshipStats.totalRelationships}</div>
                <div className="text-sm text-muted-foreground">{lang('commercialPerformance.smartForecast.stats.totalRelationships')}</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{relationshipStats.smartEnabled}</div>
                <div className="text-sm text-muted-foreground">{lang('commercialPerformance.smartForecast.stats.smartEnabled')}</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(relationshipStats.totalAttributedRevenue)}
                </div>
                <div className="text-sm text-muted-foreground">{lang('commercialPerformance.smartForecast.stats.attributedRevenue')}</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-lg font-bold text-purple-600">{relationshipStats.topDriver}</div>
                <div className="text-sm text-muted-foreground">{lang('commercialPerformance.smartForecast.stats.topRevenueDriver')}</div>
              </div>
            </div>

            {/* Monthly Trends Chart Placeholder */}
            <div className="p-6 bg-muted/30 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {lang('commercialPerformance.smartForecast.trends.title')}
              </h3>
              <div className="h-32 flex items-center justify-center text-muted-foreground">
                <p>{lang('commercialPerformance.smartForecast.trends.placeholder')}</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="relationships" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{lang('commercialPerformance.smartForecast.relationships.title')}</h3>
                <Badge variant="outline">{relationshipStats.smartEnabled} {lang('commercialPerformance.smartForecast.stats.smartEnabled')}</Badge>
              </div>
              
              {relationships && relationships.length > 0 ? (
                <div className="space-y-2">
                  {relationships.map((relationship: any) => (
                    <div key={relationship.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Network className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {relationship.main_product?.name} → {relationship.accessory_product?.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {relationship.main_product?.model_reference} → {relationship.accessory_product?.model_reference}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {lang('commercialPerformance.smartForecast.relationships.initial')} {relationship.initial_multiplier}x
                        </Badge>
                        <Badge variant="outline">
                          {lang('commercialPerformance.smartForecast.relationships.recurring')} {relationship.recurring_multiplier}x/{relationship.recurring_period || 'monthly'}
                        </Badge>
                        <Badge variant="outline">
                          {relationship.lifecycle_duration_months || 12}mo {lang('commercialPerformance.smartForecast.relationships.cycle')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Network className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">{lang('commercialPerformance.smartForecast.relationships.noRelationships')}</p>
                  <p className="text-sm">{lang('commercialPerformance.smartForecast.relationships.noRelationshipsDesc')}</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="calculations" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{lang('commercialPerformance.smartForecast.calculations.title')}</h3>
              
              {smartCalculations && smartCalculations.length > 0 ? (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{lang('commercialPerformance.forecast.month')}</TableHead>
                        <TableHead>{lang('commercialPerformance.smartForecast.calculations.mainDevice')}</TableHead>
                        <TableHead>{lang('commercialPerformance.smartForecast.calculations.accessoryDevice')}</TableHead>
                        <TableHead className="text-right">{lang('commercialPerformance.smartForecast.calculations.forecastUnits')}</TableHead>
                        <TableHead className="text-right">{lang('commercialPerformance.smartForecast.calculations.initialRevenue')}</TableHead>
                        <TableHead className="text-right">{lang('commercialPerformance.smartForecast.calculations.recurringRevenue')}</TableHead>
                        <TableHead className="text-right">{lang('commercialPerformance.smartForecast.calculations.totalAttributed')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {smartCalculations.slice(0, 10).map((calc, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            {calc.calculationMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </TableCell>
                          <TableCell>{calc.mainProductId}</TableCell>
                          <TableCell>{calc.accessoryProductId}</TableCell>
                          <TableCell className="text-right">{calc.mainProductForecastUnits}</TableCell>
                          <TableCell className="text-right">{formatCurrency(calc.initialAccessoryRevenue)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(calc.recurringAccessoryRevenue)}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(calc.totalAttributedRevenue)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">{lang('commercialPerformance.smartForecast.calculations.noCalculations')}</p>
                  <p className="text-sm">{lang('commercialPerformance.smartForecast.calculations.noCalculationsDesc')}</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="what-if" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{lang('commercialPerformance.smartForecast.whatIf.title')}</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="main-product-growth">{lang('commercialPerformance.smartForecast.whatIf.mainProductGrowth')}</Label>
                  <Input
                    id="main-product-growth"
                    type="number"
                    value={whatIfScenario.mainProductGrowth}
                    onChange={(e) => setWhatIfScenario(prev => ({
                      ...prev,
                      mainProductGrowth: parseFloat(e.target.value) || 0
                    }))}
                    placeholder={lang('commercialPerformance.smartForecast.whatIf.enterGrowth')}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="multiplier-adjustment">{lang('commercialPerformance.smartForecast.whatIf.multiplierAdjustment')}</Label>
                  <Input
                    id="multiplier-adjustment"
                    type="number"
                    value={whatIfScenario.multiplierAdjustment}
                    onChange={(e) => setWhatIfScenario(prev => ({
                      ...prev,
                      multiplierAdjustment: parseFloat(e.target.value) || 0
                    }))}
                    placeholder={lang('commercialPerformance.smartForecast.whatIf.enterMultiplier')}
                  />
                </div>
              </div>

              <Button className="w-full" variant="outline">
                <Sparkles className="mr-2 h-4 w-4" />
                {lang('commercialPerformance.smartForecast.whatIf.runAnalysis')}
              </Button>

              <div className="p-4 bg-muted/30 rounded-lg">
                <h4 className="font-semibold mb-2">{lang('commercialPerformance.smartForecast.whatIf.resultsTitle')}</h4>
                <p className="text-sm text-muted-foreground">
                  {lang('commercialPerformance.smartForecast.whatIf.resultsDesc')}
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}