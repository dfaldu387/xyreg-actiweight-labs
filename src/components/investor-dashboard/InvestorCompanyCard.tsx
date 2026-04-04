import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Package, ArrowRight, Gauge, Flame, Globe, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { formatDistanceToNow } from 'date-fns';
import type { ApprovedMonitorAccess } from '@/hooks/useInvestorMonitorAccess';

interface InvestorCompanyCardProps {
  access: ApprovedMonitorAccess;
}

export function InvestorCompanyCard({ access }: InvestorCompanyCardProps) {
  const navigate = useNavigate();
  const company = access.companies;
  const product = access.products;
  const shareSettings = access.company_investor_share_settings;

  // Check what's visible (default to true if undefined)
  const showViability = shareSettings.show_viability_score ?? true;
  const showRunway = shareSettings.show_burn_rate ?? false;
  const showRegulatory = shareSettings.show_regulatory_status_map ?? true;

  // Mock KPI data (would come from real data)
  const viabilityScore = 78;
  const runwayMonths = 14;
  const markets = [
    { code: 'EU', status: 'authorized' },
    { code: 'US', status: 'pending' },
    { code: 'JP', status: 'planned' },
  ];

  // Check if recently updated
  const updated = new Date(shareSettings.updated_at);
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const hasRecentUpdates = updated > dayAgo;

  const handleViewMonitor = () => {
    navigate(`/investor/monitor/${shareSettings.public_slug}`);
  };

  const getRunwayColor = (months: number) => {
    if (months >= 12) return 'text-emerald-600 bg-emerald-500/10';
    if (months >= 6) return 'text-amber-600 bg-amber-500/10';
    return 'text-red-600 bg-red-500/10';
  };

  const getMarketIcon = (status: string) => {
    switch (status) {
      case 'authorized': return '✓';
      case 'pending': return '⏳';
      default: return '○';
    }
  };

  const getMarketColor = (status: string) => {
    switch (status) {
      case 'authorized': return 'text-emerald-600';
      case 'pending': return 'text-amber-600';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Card 
      className="hover:shadow-lg transition-all cursor-pointer group border-border/50 hover:border-primary/30" 
      onClick={handleViewMonitor}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-border group-hover:border-primary/50 transition-colors">
              {company.logo_url ? (
                <AvatarImage src={company.logo_url} alt={company.name} className="object-cover" />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-primary">
                <Building2 className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h3 className="font-semibold text-base group-hover:text-primary transition-colors truncate">
                {company.name}
              </h3>
              {product && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                  <Package className="h-3 w-3 shrink-0" />
                  {product.name}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {hasRecentUpdates && (
              <Badge className="bg-primary text-primary-foreground text-xs">
                New
              </Badge>
            )}
            <Badge variant="outline" className="border-emerald-500/50 text-emerald-600 text-xs">
              <Activity className="h-3 w-3 mr-1" />
              Active
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Device badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {product?.class && (
            <Badge variant="secondary" className="text-xs">
              Class {product.class}
            </Badge>
          )}
          {product?.current_lifecycle_phase && (
            <Badge variant="outline" className="text-xs">
              {product.current_lifecycle_phase}
            </Badge>
          )}
        </div>

        {/* KPI Section */}
        <div className="space-y-3 pt-2 border-t border-border/50">
          {/* Viability Score */}
          {showViability && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Gauge className="h-3.5 w-3.5" />
                <span>Viability</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={viabilityScore} className="w-16 h-1.5" />
                <span className="text-xs font-medium w-8 text-right">{viabilityScore}%</span>
              </div>
            </div>
          )}

          {/* Runway */}
          {showRunway && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Flame className="h-3.5 w-3.5" />
                <span>Runway</span>
              </div>
              <Badge variant="secondary" className={`text-xs ${getRunwayColor(runwayMonths)}`}>
                {runwayMonths} mo
              </Badge>
            </div>
          )}

          {/* Regulatory Status */}
          {showRegulatory && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Globe className="h-3.5 w-3.5" />
                <span>Markets</span>
              </div>
              <div className="flex items-center gap-1.5">
                {markets.slice(0, 3).map((m) => (
                  <span 
                    key={m.code} 
                    className={`text-xs font-medium ${getMarketColor(m.status)}`}
                    title={`${m.code}: ${m.status}`}
                  >
                    {m.code}{getMarketIcon(m.status)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <span className="text-xs text-muted-foreground">
            Updated {formatDistanceToNow(new Date(shareSettings.updated_at), { addSuffix: true })}
          </span>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </div>
      </CardContent>
    </Card>
  );
}
