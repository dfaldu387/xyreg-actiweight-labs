import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, CheckCircle2, Clock, Rocket, Shield } from 'lucide-react';

interface MarketData {
  code: string;
  name: string;
  selected: boolean;
  riskClass?: string;
  regulatoryStatus?: string;
  marketLaunchStatus?: string;
  launchDate?: string;
}

interface TerritoryPriority {
  code: string;
  name: string;
  priority: number;
  rationale?: string;
}

interface InvestorTargetMarketsProps {
  markets: MarketData[];
  territoryPriority?: TerritoryPriority[];
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline'; icon: typeof CheckCircle2 }> = {
  launched: { label: 'Launched', variant: 'default', icon: Rocket },
  planned: { label: 'Planned', variant: 'secondary', icon: Clock },
  registered: { label: 'Registered', variant: 'outline', icon: CheckCircle2 },
};

export function InvestorTargetMarkets({ markets, territoryPriority }: InvestorTargetMarketsProps) {
  const selectedMarkets = markets.filter(m => m.selected);
  
  if (selectedMarkets.length === 0) {
    return null;
  }

  // Sort by territory priority if available
  const sortedMarkets = [...selectedMarkets].sort((a, b) => {
    const aPriority = territoryPriority?.find(t => t.code === a.code)?.priority || 999;
    const bPriority = territoryPriority?.find(t => t.code === b.code)?.priority || 999;
    return aPriority - bPriority;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Globe className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Target Markets</h3>
        <Badge variant="outline" className="ml-auto">
          {selectedMarkets.length} {selectedMarkets.length === 1 ? 'Market' : 'Markets'}
        </Badge>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sortedMarkets.map((market, index) => {
              const priority = territoryPriority?.find(t => t.code === market.code);
              const statusConfig = STATUS_CONFIG[market.marketLaunchStatus || 'planned'] || STATUS_CONFIG.planned;
              const StatusIcon = statusConfig.icon;
              
              return (
                <div
                  key={market.code}
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border"
                >
                  {/* Priority Badge */}
                  {priority && (
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                      {priority.priority}
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{market.name}</p>
                      <Badge variant={statusConfig.variant} className="text-xs flex-shrink-0">
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {market.riskClass && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Shield className="h-3 w-3" />
                          Class {market.riskClass}
                        </div>
                      )}
                      {market.launchDate && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(market.launchDate).getFullYear()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
