import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  CreditCard, 
  Calendar,
  RefreshCw,
  Download,
  Filter,
  BarChart3,
  PieChart,
  Activity
} from "lucide-react";
import { useStripeAnalytics, AnalyticsFilters } from "@/hooks/useStripeAnalytics";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { toast } from "sonner";

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

export function StripeDashboard() {
  const [filters, setFilters] = useState<AnalyticsFilters>({ period: '30d' });
  const { analytics, isLoading, error, refreshAnalytics, updateFilters } = useStripeAnalytics(filters);

  const handlePeriodChange = (period: string) => {
    const newFilters = { ...filters, period: period as AnalyticsFilters['period'] };
    if (period !== 'custom') {
      delete newFilters.startDate;
      delete newFilters.endDate;
    }
    setFilters(newFilters);
    updateFilters(newFilters);
  };

  const handleDateRangeChange = (field: 'startDate' | 'endDate', value: string) => {
    const newFilters = { ...filters, [field]: value, period: 'custom' as const };
    setFilters(newFilters);
    updateFilters(newFilters);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6 text-center">
          <div className="text-red-600 mb-4">
            <Activity className="h-12 w-12 mx-auto mb-2" />
            <h3 className="text-lg font-semibold">Error Loading Analytics</h3>
            <p className="text-sm">{error}</p>
          </div>
          <Button onClick={refreshAnalytics} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-slate-800">Stripe Analytics Dashboard</h2>
          <p className="text-slate-600">Comprehensive billing and subscription analytics</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="period" className="text-sm font-medium">Period:</Label>
            <Select value={filters.period} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {filters.period === 'custom' && (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                className="w-40"
              />
              <span className="text-sm text-slate-500">to</span>
              <Input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                className="w-40"
              />
            </div>
          )}
          
          <Button onClick={refreshAnalytics} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mt-4">
              <div>
                <p className="text-sm text-blue-600 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-blue-700">
                  {analytics ? formatCurrency(analytics.totalRevenue) : '...'}
                </p>
                <p className="text-xs text-blue-500 mt-1">All time</p>
              </div>
              <div className="p-3 bg-blue-200 rounded-full">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mt-4">
              <div>
                <p className="text-sm text-green-600 mb-1">Monthly Recurring Revenue</p>
                <p className="text-2xl font-bold text-green-700">
                  {analytics ? formatCurrency(analytics.monthlyRecurringRevenue) : '...'}
                </p>
                <p className="text-xs text-green-500 mt-1">MRR</p>
              </div>
              <div className="p-3 bg-green-200 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mt-4">
              <div>
                <p className="text-sm text-purple-600 mb-1">Active Subscriptions</p>
                <p className="text-2xl font-bold text-purple-700">
                  {analytics ? formatNumber(analytics.activeSubscriptions) : '...'}
                </p>
                <p className="text-xs text-purple-500 mt-1">
                  {analytics ? `${analytics.trialingSubscriptions} trialing` : ''}
                </p>
              </div>
              <div className="p-3 bg-purple-200 rounded-full">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mt-4">
              <div>
                <p className="text-sm text-orange-600 mb-1">Average Revenue Per User</p>
                <p className="text-2xl font-bold text-orange-700">
                  {analytics ? formatCurrency(analytics.averageRevenuePerUser) : '...'}
                </p>
                <p className="text-xs text-orange-500 mt-1">ARPU</p>
              </div>
              <div className="p-3 bg-orange-200 rounded-full">
                <CreditCard className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="growth" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Growth
          </TabsTrigger>
          <TabsTrigger value="plans" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Plans
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Transactions
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Status Distribution</CardTitle>
                <CardDescription>Current subscription status breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Active</span>
                      </div>
                      <span className="font-semibold">{analytics.activeSubscriptions}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm">Trialing</span>
                      </div>
                      <span className="font-semibold">{analytics.trialingSubscriptions}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-sm">Canceled</span>
                      </div>
                      <span className="font-semibold">{analytics.canceledSubscriptions}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Metrics</CardTitle>
                <CardDescription>Important business metrics</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Subscriptions</span>
                      <span className="font-semibold">{formatNumber(analytics.totalSubscriptions)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Churn Rate</span>
                      <span className="font-semibold">{analytics.churnRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Revenue</span>
                      <span className="font-semibold">{formatCurrency(analytics.totalRevenue)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Growth Tab */}
        <TabsContent value="growth" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Subscription & Revenue Growth</CardTitle>
              <CardDescription>Monthly subscription and revenue trends</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics && analytics.subscriptionGrowth.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={analytics.subscriptionGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'subscriptions' ? formatNumber(Number(value)) : formatCurrency(Number(value)),
                        name === 'subscriptions' ? 'Subscriptions' : 'Revenue'
                      ]}
                    />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="subscriptions" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      name="subscriptions"
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#82ca9d" 
                      strokeWidth={2}
                      name="revenue"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-96 flex items-center justify-center text-slate-500">
                  No growth data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Plans Tab */}
        <TabsContent value="plans" className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Plan</CardTitle>
                <CardDescription>Revenue distribution across subscription plans</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics && analytics.revenueByPlan.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={analytics.revenueByPlan}
                        cx="50%"
                        cy="50%"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="revenue"
                      >
                        {analytics.revenueByPlan.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-80 flex items-center justify-center text-slate-500">
                    No plan data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Plan Performance</CardTitle>
                <CardDescription>Revenue and subscription count by plan</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics && analytics.revenueByPlan.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.revenueByPlan}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="planName" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip 
                        formatter={(value, name) => [
                          name === 'revenue' ? formatCurrency(Number(value)) : formatNumber(Number(value)),
                          name === 'revenue' ? 'Revenue' : 'Subscriptions'
                        ]}
                      />
                      <Bar yAxisId="left" dataKey="revenue" fill="#8884d8" name="revenue" />
                      <Bar yAxisId="right" dataKey="subscriptions" fill="#82ca9d" name="subscriptions" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-80 flex items-center justify-center text-slate-500">
                    No plan data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest payment transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics && analytics.recentTransactions.length > 0 ? (
                <div className="space-y-4">
                  {analytics.recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-green-100 rounded-full">
                          <CreditCard className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-slate-500">{transaction.customerEmail}</p>
                          <p className="text-xs text-slate-400">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          {formatCurrency(transaction.amount)}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-slate-500">
                  No recent transactions
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
