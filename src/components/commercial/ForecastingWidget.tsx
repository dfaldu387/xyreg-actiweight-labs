import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useForecasts, useUpdateForecast } from "@/hooks/useCommercialData";
import { CommercialForecastService } from "@/services/commercialForecastService";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from '@/hooks/useTranslation';

interface ForecastData {
  month: string;
  worstCase: number;
  likelyCase: number;
  bestCase: number;
  isGenerated: boolean;
}

interface ForecastingWidgetProps {
  companyId: string;
  disabled?: boolean;
}

export function ForecastingWidget({ companyId, disabled = false }: ForecastingWidgetProps) {
  const { toast } = useToast();
  const { data: forecasts = [], refetch } = useForecasts(companyId);
  const updateForecast = useUpdateForecast();
  const [isGenerating, setIsGenerating] = useState(false);
  const { lang } = useTranslation();

  // Convert database forecasts to display format
  const forecastData = React.useMemo(() => {
    const months = Array.from(new Set(forecasts.map(f => f.forecast_month))).sort();
    return months.map(month => {
      const monthForecasts = forecasts.filter(f => f.forecast_month === month);
      const worst = monthForecasts.find(f => f.scenario_type === 'worst_case');
      const likely = monthForecasts.find(f => f.scenario_type === 'likely_case');
      const best = monthForecasts.find(f => f.scenario_type === 'best_case');
      
      return {
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        monthKey: month,
        worstCase: worst?.total_revenue || 0,
        likelyCase: likely?.total_revenue || 0,
        bestCase: best?.total_revenue || 0,
        isGenerated: !!likely, // Has data = generated
      };
    });
  }, [forecasts]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const generateAIForecast = async () => {
    if (disabled) return;
    setIsGenerating(true);
    try {
      const result = await CommercialForecastService.generateAIForecast({
        companyId,
        historicalData: [], // TODO: Pass actual historical data
        marketFactors: [], // TODO: Pass market factors
        forecastMonths: 12,
      });

      if (result.success) {
        await refetch();
        toast({
          title: lang('commercialPerformance.forecast.generated'),
          description: lang('commercialPerformance.forecast.generatedDesc').replace('{{count}}', String(result.factors?.length || 0)),
        });
      } else {
        throw new Error(result.error || 'Failed to generate forecast');
      }
    } catch (error) {
      console.error('Failed to generate AI forecast:', error);
      toast({
        title: lang('commercialPerformance.forecast.generationFailed'),
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const updateForecastValue = async (index: number, field: 'worstCase' | 'likelyCase' | 'bestCase', value: string) => {
    if (disabled) return;
    const numValue = parseFloat(value) || 0;
    const item = forecastData[index];
    if (!item) return;

    const scenarioType = field === 'worstCase' ? 'worst_case' : 
                        field === 'likelyCase' ? 'likely_case' : 
                        'best_case';

    try {
      await updateForecast.mutateAsync({
        companyId,
        forecastMonth: item.monthKey,
        scenarioType,
        totalRevenue: numValue,
      });
    } catch (error) {
      console.error('Failed to update forecast:', error);
      toast({
        title: lang('commercialPerformance.forecast.updateFailed'),
        description: lang('commercialPerformance.forecast.updateFailedDesc'),
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="bg-gradient-to-br from-card to-muted/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-xl">{lang('commercialPerformance.forecast.title')}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {lang('commercialPerformance.forecast.subtitle')}
          </p>
        </div>
        <Button
          onClick={generateAIForecast}
          disabled={isGenerating || disabled}
          className="bg-primary text-primary-foreground"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          {isGenerating ? lang('commercialPerformance.forecast.generating') : lang('commercialPerformance.forecast.generate')}
        </Button>
      </CardHeader>
      
      <CardContent>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{lang('commercialPerformance.forecast.month')}</TableHead>
                <TableHead className="text-right">{lang('commercialPerformance.forecast.worstCase')}</TableHead>
                <TableHead className="text-right">{lang('commercialPerformance.forecast.likelyCase')}</TableHead>
                <TableHead className="text-right">{lang('commercialPerformance.forecast.bestCase')}</TableHead>
                <TableHead className="text-center">{lang('commercialPerformance.forecast.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
            {forecastData.map((item, index) => (
              <TableRow key={item.monthKey} className={index < 3 ? "bg-muted/30" : ""}>
                  <TableCell className="font-medium">
                    {item.month}
                    {index < 3 && <Badge variant="secondary" className="ml-2 text-xs">{lang('commercialPerformance.forecast.historical')}</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                  <Input
                    type="number"
                    value={item.worstCase}
                    onChange={(e) => updateForecastValue(index, 'worstCase', e.target.value)}
                    className="w-32 text-right border-red-200 focus:border-red-400"
                    onBlur={() => {}} // Save on blur
                  />
                  </TableCell>
                  <TableCell className="text-right">
                  <Input
                    type="number"
                    value={item.likelyCase}
                    onChange={(e) => updateForecastValue(index, 'likelyCase', e.target.value)}
                    className={`w-32 text-right ${item.isGenerated ? 'border-green-200 focus:border-green-400' : ''}`}
                    onBlur={() => {}} // Save on blur
                  />
                  </TableCell>
                  <TableCell className="text-right">
                  <Input
                    type="number"
                    value={item.bestCase}
                    onChange={(e) => updateForecastValue(index, 'bestCase', e.target.value)}
                    className="w-32 text-right border-blue-200 focus:border-blue-400"
                    onBlur={() => {}} // Save on blur
                  />
                  </TableCell>
                  <TableCell className="text-center">
                    {item.isGenerated ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <Sparkles className="w-3 h-3 mr-1" />
                        {lang('commercialPerformance.forecast.aiGenerated')}
                      </Badge>
                    ) : (
                      <Badge variant="outline">{lang('commercialPerformance.forecast.manual')}</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span>
              {lang('commercialPerformance.forecast.totalForecastRange')} {formatCurrency(forecastData.reduce((sum, item) => sum + item.worstCase, 0))} - {formatCurrency(forecastData.reduce((sum, item) => sum + item.bestCase, 0))}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}