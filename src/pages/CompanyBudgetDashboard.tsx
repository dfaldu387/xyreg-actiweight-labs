import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCompany } from "@/hooks/useCompany";
import { useCompanyId } from "@/hooks/useCompanyId";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Package, Layers } from "lucide-react";
import { CompanyBudgetService, ProductBudgetSummary, PhaseCategorySummary } from "@/services/companyBudgetService";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { usePlanMenuAccess } from '@/hooks/usePlanMenuAccess';
import { PORTFOLIO_MENU_ACCESS } from '@/constants/menuAccessKeys';
import { RestrictedFeatureProvider } from '@/contexts/RestrictedFeatureContext';
import { RestrictedPreviewBanner } from '@/components/subscription/RestrictedPreviewBanner';
import { useTranslation } from '@/hooks/useTranslation';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function BudgetDashboardContent() {
  const { companyName } = useParams<{ companyName: string }>();
  const navigate = useNavigate();
  const { lang } = useTranslation();
  const { companyId: companyIdFromHook } = useCompany();
  const companyIdFromUrl = useCompanyId();

  const { isMenuAccessKeyEnabled, planName } = usePlanMenuAccess();
  const isFeatureEnabled = isMenuAccessKeyEnabled(PORTFOLIO_MENU_ACCESS.OPERATIONS_BUDGET);
  const isRestricted = !isFeatureEnabled;

  const companyId = companyIdFromUrl || companyIdFromHook;
  
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalBudget: 0, totalActual: 0, totalVariance: 0, productCount: 0, phaseCount: 0
  });
  const [productSummaries, setProductSummaries] = useState<ProductBudgetSummary[]>([]);
  const [phaseSummaries, setPhaseSummaries] = useState<PhaseCategorySummary[]>([]);

  const loadBudgetData = useCallback(async () => {
    if (!companyId) { setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const [summaryData, productData, phaseData] = await Promise.all([
        CompanyBudgetService.getCompanyBudgetSummary(companyId),
        CompanyBudgetService.getProductBudgetSummaries(companyId),
        CompanyBudgetService.getPhaseCategorySummaries(companyId)
      ]);
      setSummary(summaryData as any);
      setProductSummaries(productData);
      setPhaseSummaries(phaseData);
    } catch {
      setSummary({ totalBudget: 0, totalActual: 0, totalVariance: 0, productCount: 0, phaseCount: 0 });
      setProductSummaries([]);
      setPhaseSummaries([]);
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (companyId) { loadBudgetData(); } else { setIsLoading(false); }
  }, [companyId, loadBudgetData]);

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  };

  const formatVariance = (variance: number, currency: string = 'USD') => {
    const isPositive = variance >= 0;
    return (
      <span className={isPositive ? "text-destructive" : "text-success"}>
        {isPositive ? '+' : ''}{formatCurrency(variance, currency)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!companyId) {
    return <div>{lang('budgetDashboard.companyNotFound')}</div>;
  }

  const variancePercentage = summary.totalBudget > 0 
    ? ((summary.totalVariance / summary.totalBudget) * 100).toFixed(1)
    : '0';

  return (
    <RestrictedFeatureProvider isRestricted={isRestricted} planName={planName} featureName={lang('budgetDashboard.featureName')}>
      <div className="space-y-6">
        {isRestricted && <RestrictedPreviewBanner className="mt-6 !mb-0" />}

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{lang('budgetDashboard.cards.totalBudget.title')}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalBudget)}</div>
              <p className="text-xs text-muted-foreground">{lang('budgetDashboard.cards.totalBudget.description')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{lang('budgetDashboard.cards.actualSpent.title')}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalActual)}</div>
              <p className="text-xs text-muted-foreground">{lang('budgetDashboard.cards.actualSpent.description')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{lang('budgetDashboard.cards.variance.title')}</CardTitle>
              {summary.totalVariance >= 0 ? <TrendingUp className="h-4 w-4 text-destructive" /> : <TrendingDown className="h-4 w-4 text-success" />}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatVariance(summary.totalVariance)}</div>
              <p className="text-xs text-muted-foreground">
                {variancePercentage}% {summary.totalVariance >= 0 ? lang('budgetDashboard.cards.variance.overBudget') : lang('budgetDashboard.cards.variance.underBudget')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{lang('budgetDashboard.cards.products.title')}</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.productCount}</div>
              <p className="text-xs text-muted-foreground">{lang('budgetDashboard.cards.products.description')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{lang('budgetDashboard.cards.phases.title')}</CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.phaseCount}</div>
              <p className="text-xs text-muted-foreground">{lang('budgetDashboard.cards.phases.description')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Product Budget Table */}
        <Card>
          <CardHeader>
            <CardTitle>{lang('budgetDashboard.productTable.title')}</CardTitle>
            <CardDescription>{lang('budgetDashboard.productTable.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{lang('budgetDashboard.productTable.columns.product')}</TableHead>
                  <TableHead className="text-right">{lang('budgetDashboard.productTable.columns.phases')}</TableHead>
                  <TableHead className="text-right">{lang('budgetDashboard.productTable.columns.budget')}</TableHead>
                  <TableHead className="text-right">{lang('budgetDashboard.productTable.columns.actual')}</TableHead>
                  <TableHead className="text-right">{lang('budgetDashboard.productTable.columns.variance')}</TableHead>
                  <TableHead className="text-right">{lang('budgetDashboard.productTable.columns.status')}</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productSummaries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      {lang('budgetDashboard.productTable.emptyState')}
                    </TableCell>
                  </TableRow>
                ) : (
                  productSummaries.map((product) => {
                    const isOverBudget = product.variance > 0;
                    const variancePct = product.total_budget > 0
                      ? Math.abs((product.variance / product.total_budget) * 100).toFixed(1) : '0';
                    return (
                      <TableRow key={product.product_id}>
                        <TableCell className="font-medium">{product.product_name}</TableCell>
                        <TableCell className="text-right">{product.phase_count}</TableCell>
                        <TableCell className="text-right">{formatCurrency(product.total_budget, product.currency)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(product.total_actual, product.currency)}</TableCell>
                        <TableCell className="text-right">{formatVariance(product.variance, product.currency)}</TableCell>
                        <TableCell className="text-right">
                          {isOverBudget ? (
                            <span className="text-destructive text-sm">⚠️ {lang('budgetDashboard.productTable.statusOver').replace('{{percent}}', variancePct)}</span>
                          ) : (
                            <span className="text-success text-sm">✓ {lang('budgetDashboard.productTable.statusUnder').replace('{{percent}}', variancePct)}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/app/product/${product.product_id}/milestones`)}>
                            {lang('budgetDashboard.productTable.view')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Charts Section */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{lang('budgetDashboard.charts.phaseType.title')}</CardTitle>
              <CardDescription>{lang('budgetDashboard.charts.phaseType.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              {phaseSummaries.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={phaseSummaries.slice(0, 7)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="phase_name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={100} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '6px' }} />
                    <Legend />
                    <Bar dataKey="total_budget" name={lang('budgetDashboard.charts.phaseType.legendBudget')} fill="hsl(var(--primary))" />
                    <Bar dataKey="total_actual" name={lang('budgetDashboard.charts.phaseType.legendActual')} fill="hsl(var(--chart-2))" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">{lang('budgetDashboard.charts.phaseType.emptyState')}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{lang('budgetDashboard.charts.distribution.title')}</CardTitle>
              <CardDescription>{lang('budgetDashboard.charts.distribution.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              {phaseSummaries.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={phaseSummaries.slice(0, 5)} dataKey="total_budget" nameKey="phase_name" cx="50%" cy="50%" outerRadius={100} label={(entry) => `${entry.phase_name.substring(0, 15)}...`}>
                      {phaseSummaries.slice(0, 5).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '6px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">{lang('budgetDashboard.charts.phaseType.emptyState')}</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </RestrictedFeatureProvider>
  );
}

export default function CompanyBudgetDashboard() {
  const { companyName } = useParams<{ companyName: string }>();
  const navigate = useNavigate();
  const { lang } = useTranslation();
  const { companyId: companyIdFromHook } = useCompany();
  const companyIdFromUrl = useCompanyId();

  // Restriction check - double security pattern (hooks must be called before any conditional returns)
  const { isMenuAccessKeyEnabled, planName } = usePlanMenuAccess();
  const isFeatureEnabled = isMenuAccessKeyEnabled(PORTFOLIO_MENU_ACCESS.OPERATIONS_BUDGET);
  const isRestricted = !isFeatureEnabled;

  // Use companyId from URL resolution (more reliable) or fallback to hook
  const companyId = companyIdFromUrl || companyIdFromHook;
  
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalBudget: 0,
    totalActual: 0,
    totalVariance: 0,
    productCount: 0,
    phaseCount: 0
  });
  const [productSummaries, setProductSummaries] = useState<ProductBudgetSummary[]>([]);
  const [phaseSummaries, setPhaseSummaries] = useState<PhaseCategorySummary[]>([]);

  const loadBudgetData = useCallback(async () => {
    if (!companyId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [summaryData, productData, phaseData] = await Promise.all([
        CompanyBudgetService.getCompanyBudgetSummary(companyId),
        CompanyBudgetService.getProductBudgetSummaries(companyId),
        CompanyBudgetService.getPhaseCategorySummaries(companyId)
      ]);

      setSummary(summaryData as any);
      setProductSummaries(productData);
      setPhaseSummaries(phaseData);
    } catch {
      // Set empty state on error
      setSummary({
        totalBudget: 0,
        totalActual: 0,
        totalVariance: 0,
        productCount: 0,
        phaseCount: 0
      });
      setProductSummaries([]);
      setPhaseSummaries([]);
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (companyId) {
      loadBudgetData();
    } else {
      setIsLoading(false);
    }
  }, [companyId, loadBudgetData]);

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatVariance = (variance: number, currency: string = 'USD') => {
    const isPositive = variance >= 0;
    return (
      <span className={isPositive ? "text-destructive" : "text-success"}>
        {isPositive ? '+' : ''}{formatCurrency(variance, currency)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!companyId) {
    return <div>{lang('budgetDashboard.companyNotFound')}</div>;
  }

  const variancePercentage = summary.totalBudget > 0 
    ? ((summary.totalVariance / summary.totalBudget) * 100).toFixed(1)
    : '0';

  return (
    <RestrictedFeatureProvider
      isRestricted={isRestricted}
      planName={planName}
      featureName={lang('budgetDashboard.featureName')}
    >
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/app/company/${encodeURIComponent(companyName || '')}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {lang('budgetDashboard.back')}
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{lang('budgetDashboard.title')}</h1>
              <p className="text-muted-foreground">{lang('budgetDashboard.subtitle')}</p>
            </div>
          </div>
        </div>

        {isRestricted && <RestrictedPreviewBanner className="mt-6 !mb-0" />}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{lang('budgetDashboard.cards.totalBudget.title')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalBudget)}</div>
            <p className="text-xs text-muted-foreground">{lang('budgetDashboard.cards.totalBudget.description')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{lang('budgetDashboard.cards.actualSpent.title')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalActual)}</div>
            <p className="text-xs text-muted-foreground">{lang('budgetDashboard.cards.actualSpent.description')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{lang('budgetDashboard.cards.variance.title')}</CardTitle>
            {summary.totalVariance >= 0 ? (
              <TrendingUp className="h-4 w-4 text-destructive" />
            ) : (
              <TrendingDown className="h-4 w-4 text-success" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatVariance(summary.totalVariance)}</div>
            <p className="text-xs text-muted-foreground">
              {variancePercentage}% {summary.totalVariance >= 0 ? lang('budgetDashboard.cards.variance.overBudget') : lang('budgetDashboard.cards.variance.underBudget')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{lang('budgetDashboard.cards.products.title')}</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.productCount}</div>
            <p className="text-xs text-muted-foreground">{lang('budgetDashboard.cards.products.description')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{lang('budgetDashboard.cards.phases.title')}</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.phaseCount}</div>
            <p className="text-xs text-muted-foreground">{lang('budgetDashboard.cards.phases.description')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Product Budget Table */}
      <Card>
        <CardHeader>
          <CardTitle>{lang('budgetDashboard.productTable.title')}</CardTitle>
          <CardDescription>{lang('budgetDashboard.productTable.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{lang('budgetDashboard.productTable.columns.product')}</TableHead>
                <TableHead className="text-right">{lang('budgetDashboard.productTable.columns.phases')}</TableHead>
                <TableHead className="text-right">{lang('budgetDashboard.productTable.columns.budget')}</TableHead>
                <TableHead className="text-right">{lang('budgetDashboard.productTable.columns.actual')}</TableHead>
                <TableHead className="text-right">{lang('budgetDashboard.productTable.columns.variance')}</TableHead>
                <TableHead className="text-right">{lang('budgetDashboard.productTable.columns.status')}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productSummaries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    {lang('budgetDashboard.productTable.emptyState')}
                  </TableCell>
                </TableRow>
              ) : (
                productSummaries.map((product) => {
                  const isOverBudget = product.variance > 0;
                  const variancePct = product.total_budget > 0
                    ? Math.abs((product.variance / product.total_budget) * 100).toFixed(1)
                    : '0';

                  return (
                    <TableRow key={product.product_id}>
                      <TableCell className="font-medium">{product.product_name}</TableCell>
                      <TableCell className="text-right">{product.phase_count}</TableCell>
                      <TableCell className="text-right">{formatCurrency(product.total_budget, product.currency)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(product.total_actual, product.currency)}</TableCell>
                      <TableCell className="text-right">{formatVariance(product.variance, product.currency)}</TableCell>
                      <TableCell className="text-right">
                        {isOverBudget ? (
                          <span className="text-destructive text-sm">⚠️ {lang('budgetDashboard.productTable.statusOver').replace('{{percent}}', variancePct)}</span>
                        ) : (
                          <span className="text-success text-sm">✓ {lang('budgetDashboard.productTable.statusUnder').replace('{{percent}}', variancePct)}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/app/product/${product.product_id}/milestones`)}
                        >
                          {lang('budgetDashboard.productTable.view')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Phase Category Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{lang('budgetDashboard.charts.phaseType.title')}</CardTitle>
            <CardDescription>{lang('budgetDashboard.charts.phaseType.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            {phaseSummaries.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={phaseSummaries.slice(0, 7)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="phase_name"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="total_budget" name={lang('budgetDashboard.charts.phaseType.legendBudget')} fill="hsl(var(--primary))" />
                  <Bar dataKey="total_actual" name={lang('budgetDashboard.charts.phaseType.legendActual')} fill="hsl(var(--chart-2))" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                {lang('budgetDashboard.charts.phaseType.emptyState')}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Phase Category Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{lang('budgetDashboard.charts.distribution.title')}</CardTitle>
            <CardDescription>{lang('budgetDashboard.charts.distribution.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            {phaseSummaries.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={phaseSummaries.slice(0, 5)}
                    dataKey="total_budget"
                    nameKey="phase_name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${entry.phase_name.substring(0, 15)}...`}
                  >
                    {phaseSummaries.slice(0, 5).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                {lang('budgetDashboard.charts.phaseType.emptyState')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    </RestrictedFeatureProvider>
  );
}
