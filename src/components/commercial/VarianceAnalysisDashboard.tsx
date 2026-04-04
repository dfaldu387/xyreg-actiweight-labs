import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRestrictedFeature } from '@/contexts/RestrictedFeatureContext';
import { usePlanMenuAccess } from '@/hooks/usePlanMenuAccess';
import { PORTFOLIO_MENU_ACCESS } from '@/constants/menuAccessKeys';
import { useTranslation } from '@/hooks/useTranslation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Target,
  BarChart3,
  RefreshCw
} from "lucide-react";
import { 
  VarianceAnalysisService, 
  VarianceSummary, 
  VarianceAnalysisData,
  VarianceAlert
} from "@/services/varianceAnalysisService";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';


interface VarianceAnalysisDashboardProps {
  companyId: string;
}

export function VarianceAnalysisDashboard({ companyId }: VarianceAnalysisDashboardProps) {
  // Restriction check - double security pattern
  const { isRestricted: contextRestricted } = useRestrictedFeature();
  const { isMenuAccessKeyEnabled } = usePlanMenuAccess();
  const isFeatureEnabled = isMenuAccessKeyEnabled(PORTFOLIO_MENU_ACCESS.COMMERCIAL_VARIANCE_ANALYSIS);
  const isRestricted = contextRestricted || !isFeatureEnabled;

  const { lang } = useTranslation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    now.setMonth(now.getMonth() - 1); // Default to last month
    return now.toISOString().substring(0, 7);
  });
  const [varianceSummary, setVarianceSummary] = useState<VarianceSummary | null>(null);
  const [historicalData, setHistoricalData] = useState<VarianceSummary[]>([]);
  const [viewMode, setViewMode] = useState<'summary' | 'detailed' | 'trends'>('summary');

  const varianceService = new VarianceAnalysisService();

  // Load variance analysis on mount and when month changes
  useEffect(() => {
    loadVarianceAnalysis();
  }, [selectedMonth, companyId]);

  const loadVarianceAnalysis = async () => {
    setIsLoading(true);
    try {
      // Load current month analysis
      const summary = await varianceService.calculateVarianceAnalysis(companyId, selectedMonth);
      setVarianceSummary(summary);

      // Load historical data for trends
      const history = await varianceService.loadVarianceHistory(companyId, 12);
      setHistoricalData(history);

    } catch {
      toast({
        title: lang('commercial.varianceAnalysis.loadError'),
        description: lang('commercial.varianceAnalysis.loadErrorDesc'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAnalysis = async () => {
    if (isRestricted) return;
    await loadVarianceAnalysis();
    toast({
      title: lang('commercial.varianceAnalysis.analysisRefreshed'),
      description: lang('commercial.varianceAnalysis.analysisRefreshedDesc'),
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getVarianceColor = (variance: number) => {
    const absVariance = Math.abs(variance);
    if (absVariance < 10) return 'text-green-600';
    if (absVariance < 25) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-green-600 bg-green-50';
    }
  };

  // Prepare trend chart data
  const trendChartData = historicalData.map(item => ({
    month: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    npvAccuracy: item.metrics.averageAccuracyNPV,
    forecastAccuracy: item.metrics.averageAccuracyForecast,
    totalVarianceNPV: item.metrics.totalVarianceNPV,
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        <span className="ml-2 text-muted-foreground">{lang('commercial.varianceAnalysis.loading')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold">{lang('commercial.varianceAnalysis.title')}</h2>
            <p className="text-muted-foreground">
              {lang('commercial.varianceAnalysis.subtitle')}
            </p>
          </div>

        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedMonth} onValueChange={setSelectedMonth} disabled={isRestricted}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={lang('commercial.varianceAnalysis.selectMonth')} />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const monthStr = date.toISOString().substring(0, 7);
                const displayStr = date.toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric'
                });
                return (
                  <SelectItem key={monthStr} value={monthStr}>
                    {displayStr}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Button onClick={refreshAnalysis} variant="outline" size="sm" disabled={isRestricted}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {lang('commercial.varianceAnalysis.refresh')}
          </Button>
        </div>
      </div>

      {/* View Mode Selector */}
      <div className="flex gap-2">
        <Button
          variant={viewMode === 'summary' ? 'default' : 'outline'}
          onClick={() => !isRestricted && setViewMode('summary')}
          size="sm"
          disabled={isRestricted}
        >
          {lang('commercial.varianceAnalysis.summary')}
        </Button>
        <Button
          variant={viewMode === 'detailed' ? 'default' : 'outline'}
          onClick={() => !isRestricted && setViewMode('detailed')}
          size="sm"
          disabled={isRestricted}
        >
          {lang('commercial.varianceAnalysis.detailed')}
        </Button>
        <Button
          variant={viewMode === 'trends' ? 'default' : 'outline'}
          onClick={() => !isRestricted && setViewMode('trends')}
          size="sm"
          disabled={isRestricted}
        >
          {lang('commercial.varianceAnalysis.trends')}
        </Button>
      </div>

      {varianceSummary && (
        <>
          {viewMode === 'summary' && (
            <>
              {/* Summary KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{lang('commercial.varianceAnalysis.rnpvAccuracy')}</p>
                        <p className="text-2xl font-bold">
                          {varianceSummary.metrics.averageAccuracyNPV.toFixed(1)}%
                        </p>
                      </div>
                      <Target className="h-8 w-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{lang('commercial.varianceAnalysis.forecastAccuracy')}</p>
                        <p className="text-2xl font-bold">
                          {varianceSummary.metrics.averageAccuracyForecast.toFixed(1)}%
                        </p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{lang('commercial.varianceAnalysis.riskLevel')}</p>
                        <Badge className={getRiskLevelColor(varianceSummary.metrics.riskLevel)}>
                          {varianceSummary.metrics.riskLevel.toUpperCase()}
                        </Badge>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-yellow-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{lang('commercial.varianceAnalysis.trend')}</p>
                        <div className="flex items-center gap-2">
                          {varianceSummary.metrics.trendDirection === 'improving' ? (
                            <TrendingUp className="h-5 w-5 text-green-600" />
                          ) : varianceSummary.metrics.trendDirection === 'declining' ? (
                            <TrendingDown className="h-5 w-5 text-red-600" />
                          ) : (
                            <div className="h-5 w-5" />
                          )}
                          <span className="font-medium capitalize">
                            {lang(`commercial.varianceAnalysis.${varianceSummary.metrics.trendDirection}`)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Alerts */}
              {varianceSummary.alerts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      {lang('commercial.varianceAnalysis.varianceAlerts')} ({varianceSummary.alerts.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {varianceSummary.alerts.slice(0, 5).map((alert, index) => (
                      <Alert key={index} variant={getSeverityColor(alert.severity) as any}>
                        <AlertDescription>
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="font-medium">{lang('commercial.varianceAnalysis.product')}: {alert.productId}</span>
                              <p className="text-sm mt-1">{alert.message}</p>
                            </div>
                            <Badge variant="outline" className="ml-4">
                              {alert.severity}
                            </Badge>
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))}
                    {varianceSummary.alerts.length > 5 && (
                      <p className="text-sm text-muted-foreground">
                        {lang('commercial.varianceAnalysis.moreAlerts').replace('{{count}}', String(varianceSummary.alerts.length - 5))}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {viewMode === 'detailed' && (
            <Card>
              <CardHeader>
                <CardTitle>{lang('commercial.varianceAnalysis.productLevelVarianceAnalysis')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{lang('commercial.varianceAnalysis.product')}</TableHead>
                        <TableHead>{lang('commercial.varianceAnalysis.market')}</TableHead>
                        <TableHead className="text-right">{lang('commercial.varianceAnalysis.rnpvPrediction')}</TableHead>
                        <TableHead className="text-right">{lang('commercial.varianceAnalysis.aiForecast')}</TableHead>
                        <TableHead className="text-right">{lang('commercial.varianceAnalysis.actual')}</TableHead>
                        <TableHead className="text-right">{lang('commercial.varianceAnalysis.rnpvVariance')}</TableHead>
                        <TableHead className="text-right">{lang('commercial.varianceAnalysis.forecastVariance')}</TableHead>
                        <TableHead className="text-center">{lang('commercial.varianceAnalysis.confidence')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {varianceSummary.productVariances.map((variance, index) => (
                        <TableRow key={`${variance.productId}-${variance.marketCode}`}>
                          <TableCell className="font-medium">{variance.productId}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{variance.marketCode}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(variance.npvPrediction)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(variance.forecastValue)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(variance.actualValue)}
                          </TableCell>
                          <TableCell className={`text-right font-medium ${getVarianceColor(variance.variancePercentageNPVToActual)}`}>
                            {formatPercentage(variance.variancePercentageNPVToActual)}
                          </TableCell>
                          <TableCell className={`text-right font-medium ${getVarianceColor(variance.variancePercentageForecastToActual)}`}>
                            {formatPercentage(variance.variancePercentageForecastToActual)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge 
                              variant={variance.confidenceLevel > 80 ? 'default' : 'secondary'}
                              className={variance.confidenceLevel > 80 ? 'bg-green-100 text-green-800' : ''}
                            >
                              {variance.confidenceLevel.toFixed(0)}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {viewMode === 'trends' && trendChartData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{lang('commercial.varianceAnalysis.accuracyTrend')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trendChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip
                        formatter={(value: number) => [`${value.toFixed(1)}%`, '']}
                      />
                      <Line
                        type="monotone"
                        dataKey="npvAccuracy"
                        stroke="#8884d8"
                        strokeWidth={2}
                        name={lang('commercial.varianceAnalysis.rnpvAccuracy')}
                      />
                      <Line
                        type="monotone"
                        dataKey="forecastAccuracy"
                        stroke="#82ca9d"
                        strokeWidth={2}
                        name={lang('commercial.varianceAnalysis.forecastAccuracy')}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{lang('commercial.varianceAnalysis.totalVarianceTrend')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={trendChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip
                        formatter={(value: number) => [formatCurrency(value), lang('commercial.varianceAnalysis.totalVariance')]}
                      />
                      <Bar dataKey="totalVarianceNPV" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}

      {!varianceSummary && !isLoading && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              {lang('commercial.varianceAnalysis.noDataAvailable')}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {lang('commercial.varianceAnalysis.ensureDataAvailable')}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}