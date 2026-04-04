import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, Users, Clock, Calendar } from 'lucide-react';

interface Channel {
  id?: string;
  name?: string;
  type?: string;
  enabled?: boolean;
  market?: string;
  percentage?: number;
}

interface InvestorGTMStrategyProps {
  data: {
    channels: Channel[];
    buyerPersona: string | null;
    salesCycleWeeks: number | null;
    budgetCycle: string | null;
  };
}

const channelTypeLabels: Record<string, string> = {
  direct: 'Direct Sales',
  distributor: 'Distributor Network',
  distribution: 'Distribution Partners',
  gpo: 'Group Purchasing Organization',
  ecommerce: 'E-Commerce',
  hybrid: 'Hybrid Model',
  strategic: 'Strategic Partnerships',
  licensing: 'Licensing Model',
  other: 'Other',
};

export function InvestorGTMStrategy({ data }: InvestorGTMStrategyProps) {
  if (!data) return null;

  // Filter to only enabled channels
  const enabledChannels = data.channels?.filter(c => c.enabled !== false) || [];
  const hasChannels = enabledChannels.length > 0;
  const hasMetrics = data.buyerPersona || data.salesCycleWeeks || data.budgetCycle;

  if (!hasChannels && !hasMetrics) return null;

  const getChannelLabel = (channel: Channel): string => {
    // Check for name first (new format)
    if (channel.name) return channel.name;
    // Check for id-based label
    if (channel.id && channelTypeLabels[channel.id]) return channelTypeLabels[channel.id];
    // Check for type-based label (legacy format)
    if (channel.type && channelTypeLabels[channel.type]) return channelTypeLabels[channel.type];
    // Fallback
    return channel.type || channel.id || 'Unknown Channel';
  };

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
        <Target className="h-5 w-5 text-primary" />
        Go-to-Market Strategy
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Distribution Channels */}
        {hasChannels && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Distribution Channels
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {enabledChannels.map((channel: Channel, idx: number) => (
                <div key={channel.id || idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Target className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <span className="font-medium text-sm">
                        {getChannelLabel(channel)}
                      </span>
                      {channel.market && (
                        <div className="text-xs text-muted-foreground">{channel.market}</div>
                      )}
                    </div>
                  </div>
                  {channel.percentage && (
                    <Badge variant="secondary">{channel.percentage}%</Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Sales Metrics */}
        {hasMetrics && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Sales Dynamics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.buyerPersona && (
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm font-medium">Economic Buyer</div>
                    <div className="text-sm text-muted-foreground">{data.buyerPersona}</div>
                  </div>
                </div>
              )}
              {data.salesCycleWeeks && (
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm font-medium">Sales Cycle</div>
                    <div className="text-sm text-muted-foreground">
                      {data.salesCycleWeeks} weeks
                    </div>
                  </div>
                </div>
              )}
              {data.budgetCycle && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm font-medium">Budget Cycle</div>
                    <div className="text-sm text-muted-foreground capitalize">
                      {data.budgetCycle.replace(/_/g, ' ')}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
