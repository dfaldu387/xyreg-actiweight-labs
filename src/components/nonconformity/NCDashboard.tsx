import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useTranslation } from '@/hooks/useTranslation';

interface NCDashboardProps {
  analytics: { total: number; open: number; overdue: number; byStatus: Record<string, number> } | null;
  isLoading: boolean;
}

export function NCDashboard({ analytics, isLoading }: NCDashboardProps) {
  const { lang } = useTranslation();

  if (isLoading) {
    return <div className="flex justify-center py-8"><LoadingSpinner size="lg" /></div>;
  }

  if (!analytics) return null;

  const stats = [
    { label: lang('nonconformity.totalNCs'), value: analytics.total, color: 'text-foreground' },
    { label: lang('nonconformity.open'), value: analytics.open, color: 'text-destructive' },
    { label: lang('nonconformity.overdue'), value: analytics.overdue, color: 'text-amber-600' },
    { label: lang('nonconformity.closed'), value: analytics.byStatus?.closed || 0, color: 'text-primary' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((s) => (
        <Card key={s.label}>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
