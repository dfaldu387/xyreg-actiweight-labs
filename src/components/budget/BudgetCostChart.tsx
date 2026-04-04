import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BulkBudgetService, PhaseBudgetSummary } from '@/services/bulkBudgetService';
import { useTemplateSettings } from '@/hooks/useTemplateSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { TrendingUp, DollarSign, Target, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/useTranslation';

interface BudgetCostChartProps {
  productId: string;
  companyId: string;
}

interface ChartData {
  phase: string;
  budgetFixed: number;
  actualFixed: number;
  budgetVariable: number;
  actualVariable: number;
  budgetOther: number;
  actualOther: number;
  budgetTotal: number;
  actualTotal: number;
  variance: number;
  variancePercent: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export function BudgetCostChart({ productId, companyId }: BudgetCostChartProps) {
  const { lang } = useTranslation();
  const [phaseSummaries, setPhaseSummaries] = useState<PhaseBudgetSummary[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChartTab, setActiveChartTab] = useState('overview');
  const { settings } = useTemplateSettings(companyId);

  const defaultCurrency = settings.default_currency || 'USD';

  useEffect(() => {
    loadData();
  }, [productId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const summariesResponse = await BulkBudgetService.getAllBudgetItemsForProduct(productId);
      const summariesData = Array.isArray(summariesResponse) ? summariesResponse : [];
      setPhaseSummaries(summariesData);
      
      // Transform data for charts
      const transformed: ChartData[] = summariesData.map(summary => {
        const budgetTotal = summary.fixed_total + summary.variable_total + summary.other_total;
        const actualTotal = summary.actual_fixed_total + summary.actual_variable_total + summary.actual_other_total;
        const variance = actualTotal - budgetTotal;
        const variancePercent = budgetTotal > 0 ? (variance / budgetTotal) * 100 : 0;

        return {
          phase: summary.phase_name,
          budgetFixed: summary.fixed_total,
          actualFixed: summary.actual_fixed_total,
          budgetVariable: summary.variable_total,
          actualVariable: summary.actual_variable_total,
          budgetOther: summary.other_total,
          actualOther: summary.actual_other_total,
          budgetTotal,
          actualTotal,
          variance,
          variancePercent
        };
      });
      
      setChartData(transformed);
    } catch {
      // Error loading budget data
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: defaultCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculateTotals = () => {
    const totalBudget = chartData.reduce((sum, item) => sum + item.budgetTotal, 0);
    const totalActual = chartData.reduce((sum, item) => sum + item.actualTotal, 0);
    const totalVariance = totalActual - totalBudget;
    const totalVariancePercent = totalBudget > 0 ? (totalVariance / totalBudget) * 100 : 0;

    return { totalBudget, totalActual, totalVariance, totalVariancePercent };
  };

  const getCategoryBreakdown = () => {
    const breakdown = {
      fixed: { budget: 0, actual: 0 },
      variable: { budget: 0, actual: 0 },
      other: { budget: 0, actual: 0 }
    };

    chartData.forEach(item => {
      breakdown.fixed.budget += item.budgetFixed;
      breakdown.fixed.actual += item.actualFixed;
      breakdown.variable.budget += item.budgetVariable;
      breakdown.variable.actual += item.actualVariable;
      breakdown.other.budget += item.budgetOther;
      breakdown.other.actual += item.actualOther;
    });

    return breakdown;
  };

  const totals = calculateTotals();
  const categoryBreakdown = getCategoryBreakdown();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">{lang('productMilestones.costChart.loading')}</div>
      </div>
    );
  }

  const pieData = [
    { name: lang('productMilestones.costChart.categories.fixedCosts'), value: categoryBreakdown.fixed.budget, fill: COLORS[0] },
    { name: lang('productMilestones.costChart.categories.variableCosts'), value: categoryBreakdown.variable.budget, fill: COLORS[1] },
    { name: lang('productMilestones.costChart.categories.otherCosts'), value: categoryBreakdown.other.budget, fill: COLORS[2] }
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="!p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{lang('productMilestones.costChart.totalBudget')}</p>
                <p className="text-2xl font-bold">{formatCurrency(totals.totalBudget)}</p>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="!p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{lang('productMilestones.costChart.totalActual')}</p>
                <p className="text-2xl font-bold">{formatCurrency(totals.totalActual)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="!p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{lang('productMilestones.costChart.variance')}</p>
                <p className={`text-2xl font-bold ${totals.totalVariance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(Math.abs(totals.totalVariance))}
                </p>
              </div>
              <TrendingUp className={`h-8 w-8 ${totals.totalVariance >= 0 ? 'text-red-600' : 'text-green-600'}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="!p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{lang('productMilestones.costChart.variancePercent')}</p>
                <div className="flex items-center gap-2">
                  <p className={`text-2xl font-bold ${totals.totalVariancePercent >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {Math.abs(totals.totalVariancePercent).toFixed(1)}%
                  </p>
                  <Badge variant={totals.totalVariancePercent >= 0 ? 'destructive' : 'default'}>
                    {totals.totalVariance >= 0 ? lang('productMilestones.costChart.over') : lang('productMilestones.costChart.under')}
                  </Badge>
                </div>
              </div>
              <AlertCircle className={`h-8 w-8 ${Math.abs(totals.totalVariancePercent) > 10 ? 'text-red-600' : 'text-muted-foreground'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs value={activeChartTab} onValueChange={setActiveChartTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">{lang('productMilestones.costChart.tabs.budgetVsActual')}</TabsTrigger>
          <TabsTrigger value="variance">{lang('productMilestones.costChart.tabs.varianceAnalysis')}</TabsTrigger>
          <TabsTrigger value="category">{lang('productMilestones.costChart.tabs.byCategory')}</TabsTrigger>
          <TabsTrigger value="breakdown">{lang('productMilestones.costChart.tabs.costBreakdown')}</TabsTrigger>
        </TabsList>

                <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{lang('productMilestones.costChart.charts.budgetVsActualByPhase')}</CardTitle>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-primary" style={{ borderTop: '2px dashed hsl(var(--primary))' }}></div>
                    <span className="text-sm text-muted-foreground">{lang('productMilestones.costChart.charts.budget')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#a3a3a3]"></div>
                    <span className="text-sm text-muted-foreground">{lang('productMilestones.costChart.charts.actual')}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="phase" 
                    className="text-xs" 
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval={0}
                  />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} className="text-xs" />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="budgetTotal"
                    stroke="hsl(var(--primary))"
                    strokeDasharray="5 5"
                    name={lang('productMilestones.costChart.charts.budget')}
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="actualTotal"
                    stroke="#a3a3a3"
                    name={lang('productMilestones.costChart.charts.actual')}
                    strokeWidth={3}
                    dot={{ fill: '#a3a3a3', strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="variance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{lang('productMilestones.costChart.charts.costVarianceByPhase')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="phase" className="text-xs" />
                  <YAxis tickFormatter={(value) => `${value}%`} className="text-xs" />
                  <Tooltip 
                    formatter={(value: number) => `${value.toFixed(1)}%`}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="variancePercent"
                    stroke="hsl(var(--foreground))"
                    name={lang('productMilestones.costChart.variancePercent')}
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--foreground))', strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="category" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{lang('productMilestones.costChart.charts.budgetDistribution')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{lang('productMilestones.costChart.charts.categoryComparison')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(categoryBreakdown).map(([category, data]) => {
                    const categoryLabel = category === 'fixed'
                      ? lang('productMilestones.costChart.categories.fixedCosts')
                      : category === 'variable'
                        ? lang('productMilestones.costChart.categories.variableCosts')
                        : lang('productMilestones.costChart.categories.otherCosts');
                    return (
                    <div key={category} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{categoryLabel}</span>
                        <Badge variant={data.actual > data.budget ? 'destructive' : 'default'}>
                          {data.budget > 0 ? ((data.actual - data.budget) / data.budget * 100).toFixed(1) : '0'}% {lang('productMilestones.costChart.varianceLabel')}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">{lang('productMilestones.costChart.charts.budget')}: </span>
                          <span className="font-medium">{formatCurrency(data.budget)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{lang('productMilestones.costChart.charts.actual')}: </span>
                          <span className="font-medium">{formatCurrency(data.actual)}</span>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{lang('productMilestones.costChart.charts.detailedBreakdown')}</CardTitle>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-2 bg-primary"></div>
                    <span className="text-sm text-muted-foreground">{lang('productMilestones.costChart.charts.budgetFixed')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-2 bg-primary opacity-70"></div>
                    <span className="text-sm text-muted-foreground">{lang('productMilestones.costChart.charts.actualFixed')}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="phase" 
                    className="text-xs" 
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval={0}
                  />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} className="text-xs" />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Bar dataKey="budgetFixed" stackId="budget" fill={COLORS[0]} name={lang('productMilestones.costChart.legend.budgetFixed')} />
                  <Bar dataKey="budgetVariable" stackId="budget" fill={COLORS[1]} name={lang('productMilestones.costChart.legend.budgetVariable')} />
                  <Bar dataKey="budgetOther" stackId="budget" fill={COLORS[2]} name={lang('productMilestones.costChart.legend.budgetOther')} />
                  <Bar dataKey="actualFixed" stackId="actual" fill={COLORS[0]} name={lang('productMilestones.costChart.legend.actualFixed')} opacity={0.7} />
                  <Bar dataKey="actualVariable" stackId="actual" fill={COLORS[1]} name={lang('productMilestones.costChart.legend.actualVariable')} opacity={0.7} />
                  <Bar dataKey="actualOther" stackId="actual" fill={COLORS[2]} name={lang('productMilestones.costChart.legend.actualOther')} opacity={0.7} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}