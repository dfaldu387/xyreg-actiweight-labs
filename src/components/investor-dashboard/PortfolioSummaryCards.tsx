import React from 'react';
import { Building2, TrendingUp, AlertTriangle, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { ApprovedMonitorAccess } from '@/hooks/useInvestorMonitorAccess';

interface PortfolioSummaryCardsProps {
  approvedAccess: ApprovedMonitorAccess[];
}

export function PortfolioSummaryCards({ approvedAccess }: PortfolioSummaryCardsProps) {
  const totalCompanies = approvedAccess.length;
  
  // Count by phase (simplified)
  const inDevelopment = approvedAccess.filter(a => {
    const phase = a.products?.current_lifecycle_phase?.toLowerCase() || '';
    return phase.includes('design') || phase.includes('development') || phase.includes('verification');
  }).length;
  
  const launched = approvedAccess.filter(a => {
    const phase = a.products?.current_lifecycle_phase?.toLowerCase() || '';
    return phase.includes('market') || phase.includes('production') || phase.includes('surveillance');
  }).length;
  
  // Mock alerts count (would come from real data)
  const alertsCount = approvedAccess.filter(a => {
    // Companies updated in last 24 hours could be "alerts"
    const updated = new Date(a.company_investor_share_settings.updated_at);
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return updated > dayAgo;
  }).length;
  
  // Calculate average viability (mock - would need real scorecard data)
  const avgViability = totalCompanies > 0 ? 72 : 0;

  const summaryItems = [
    {
      label: 'Companies',
      value: totalCompanies.toString(),
      sublabel: 'monitored',
      icon: Building2,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Pipeline',
      value: `${inDevelopment}/${launched}`,
      sublabel: 'dev / market',
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-500/10',
    },
    {
      label: 'Updates',
      value: alertsCount.toString(),
      sublabel: 'in 24h',
      icon: AlertTriangle,
      color: alertsCount > 0 ? 'text-amber-600' : 'text-muted-foreground',
      bgColor: alertsCount > 0 ? 'bg-amber-500/10' : 'bg-muted',
    },
    {
      label: 'Avg Viability',
      value: `${avgViability}%`,
      sublabel: 'portfolio',
      icon: Star,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {summaryItems.map((item) => (
        <Card key={item.label} className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {item.label}
                </p>
                <p className="text-2xl font-bold">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.sublabel}</p>
              </div>
              <div className={`p-2 rounded-lg ${item.bgColor}`}>
                <item.icon className={`h-5 w-5 ${item.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
