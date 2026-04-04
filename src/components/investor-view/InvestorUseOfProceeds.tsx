import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { DollarSign, Beaker, FileCheck, Users, Megaphone, Factory } from 'lucide-react';

interface UseOfProceedsData {
  rd_percent: number | null;
  rd_activities: string | null;
  regulatory_percent: number | null;
  regulatory_activities: string | null;
  team_percent: number | null;
  team_activities: string | null;
  commercial_percent: number | null;
  commercial_activities: string | null;
  operations_percent: number | null;
  operations_activities: string | null;
  total_raise_amount: number | null;
  raise_currency: string;
}

interface InvestorUseOfProceedsProps {
  data: UseOfProceedsData;
}

const CATEGORY_CONFIG = [
  { key: 'rd', label: 'R&D', color: 'hsl(221 83% 53%)', icon: Beaker },          // Blue
  { key: 'regulatory', label: 'Regulatory', color: 'hsl(142 76% 36%)', icon: FileCheck },  // Green
  { key: 'team', label: 'Team', color: 'hsl(262 83% 58%)', icon: Users },          // Purple
  { key: 'commercial', label: 'Commercial', color: 'hsl(183 62% 42%)', icon: Megaphone },  // Teal
  { key: 'operations', label: 'Operations', color: 'hsl(28 82% 55%)', icon: Factory },     // Amber
];

export function InvestorUseOfProceeds({ data }: InvestorUseOfProceedsProps) {
  const chartData = CATEGORY_CONFIG.map(cat => ({
    name: cat.label,
    value: (data as any)[`${cat.key}_percent`] || 0,
    color: cat.color,
    activities: (data as any)[`${cat.key}_activities`] || null,
  })).filter(item => item.value > 0);

  const totalPercent = chartData.reduce((sum, item) => sum + item.value, 0);
  
  // Format currency
  const formatCurrency = (amount: number | null, currency: string) => {
    if (!amount) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formattedRaise = formatCurrency(data.total_raise_amount, data.raise_currency);

  if (chartData.length === 0 && !formattedRaise) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
          <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Use of Proceeds</h2>
          <p className="text-sm text-muted-foreground">How funding will be allocated</p>
        </div>
      </div>

      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-2">
          {formattedRaise && (
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">Target Raise</CardTitle>
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {formattedRaise}
              </span>
            </div>
          )}
          <CardDescription>Funding allocation across key areas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            {chartData.length > 0 && (
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                      labelLine={false}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`${value}%`, 'Allocation']}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Allocation Details */}
            <div className="space-y-3">
              {CATEGORY_CONFIG.map(cat => {
                const percent = (data as any)[`${cat.key}_percent`];
                const activities = (data as any)[`${cat.key}_activities`];
                const Icon = cat.icon;
                
                if (!percent && !activities) return null;

                return (
                  <div
                    key={cat.key}
                    className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="h-4 w-4" style={{ color: cat.color }} />
                      <span className="font-medium">{cat.label}</span>
                      {percent > 0 && (
                        <span className="ml-auto text-sm font-semibold" style={{ color: cat.color }}>
                          {percent}%
                        </span>
                      )}
                    </div>
                    {activities && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{activities}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {totalPercent > 0 && totalPercent !== 100 && (
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Total allocation: {totalPercent}%
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
