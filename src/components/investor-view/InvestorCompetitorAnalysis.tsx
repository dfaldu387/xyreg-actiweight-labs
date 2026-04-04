import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, ExternalLink, Percent, Shield, Globe, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface Competitor {
  id: string;
  competitor_company: string;
  product_name?: string;
  market?: string;
  device_classification?: string;
  regulatory_status?: string;
  market_share_estimate?: number | string;
  homepage_url?: string;
  notes?: string;
}

interface InvestorCompetitorAnalysisProps {
  competitors: Competitor[];
}

const STATUS_ICONS: Record<string, { icon: typeof CheckCircle; color: string }> = {
  'Approved': { icon: CheckCircle, color: 'text-emerald-500' },
  'Cleared': { icon: CheckCircle, color: 'text-emerald-500' },
  'CE Marked': { icon: CheckCircle, color: 'text-emerald-500' },
  'Pending': { icon: Clock, color: 'text-amber-500' },
  'Under Review': { icon: Clock, color: 'text-amber-500' },
  'Denied': { icon: AlertCircle, color: 'text-red-500' },
};

export function InvestorCompetitorAnalysis({ competitors }: InvestorCompetitorAnalysisProps) {
  if (!competitors || competitors.length === 0) {
    return null;
  }

  // Group by market for better organization
  const competitorsByMarket = competitors.reduce((acc, comp) => {
    const market = comp.market || 'Global';
    if (!acc[market]) acc[market] = [];
    acc[market].push(comp);
    return acc;
  }, {} as Record<string, Competitor[]>);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Target className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Competitive Landscape</h3>
        <Badge variant="outline" className="ml-auto">
          {competitors.length} {competitors.length === 1 ? 'Competitor' : 'Competitors'}
        </Badge>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="space-y-4">
            {Object.entries(competitorsByMarket).map(([market, comps]) => (
              <div key={market}>
                {Object.keys(competitorsByMarket).length > 1 && (
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">{market}</span>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {comps.map((competitor) => {
                    const statusConfig = STATUS_ICONS[competitor.regulatory_status || ''] || STATUS_ICONS['Pending'];
                    const StatusIcon = statusConfig.icon;
                    const marketShare = competitor.market_share_estimate 
                      ? typeof competitor.market_share_estimate === 'string' 
                        ? parseInt(competitor.market_share_estimate) 
                        : competitor.market_share_estimate
                      : null;
                    
                    return (
                      <div
                        key={competitor.id}
                        className="p-3 bg-muted/50 rounded-lg border hover:border-primary/30 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-sm truncate">
                                {competitor.competitor_company}
                              </h4>
                              {competitor.homepage_url && (
                                <a 
                                  href={competitor.homepage_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-muted-foreground hover:text-primary"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                            {competitor.product_name && (
                              <p className="text-xs text-muted-foreground truncate">{competitor.product_name}</p>
                            )}
                          </div>
                          
                          {marketShare !== null && marketShare > 0 && (
                            <div className="flex items-center gap-1 text-xs bg-primary/10 px-2 py-0.5 rounded-full">
                              <Percent className="h-3 w-3 text-primary" />
                              <span className="font-medium text-primary">{marketShare}%</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3 mt-2">
                          {competitor.device_classification && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Shield className="h-3 w-3" />
                              {competitor.device_classification}
                            </div>
                          )}
                          {competitor.regulatory_status && (
                            <div className={`flex items-center gap-1 text-xs ${statusConfig.color}`}>
                              <StatusIcon className="h-3 w-3" />
                              {competitor.regulatory_status}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
