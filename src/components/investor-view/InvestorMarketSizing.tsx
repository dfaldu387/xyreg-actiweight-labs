import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, DollarSign, Target } from 'lucide-react';
import { MarketSizing } from '@/types/investorModules';

interface InvestorMarketSizingProps {
  data: MarketSizing | null;
}

function formatCurrency(value: number | null, currency: string = 'USD'): string {
  if (!value) return '—';
  if (value >= 1_000_000_000) {
    return `${currency === 'USD' ? '$' : '€'}${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `${currency === 'USD' ? '$' : '€'}${(value / 1_000_000).toFixed(1)}M`;
  }
  return `${currency === 'USD' ? '$' : '€'}${(value / 1_000).toFixed(0)}K`;
}

function formatNumber(value: number | null): string {
  if (!value) return '—';
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(0)}K`;
  }
  return value.toLocaleString();
}

function formatMarketValue(value: number, symbol: string): string {
  if (value >= 1000) return `${symbol}${(value / 1000).toFixed(1)}B`;
  return `${symbol}${value.toFixed(0)}M`;
}

interface DartboardDiagramProps {
  tamValue: number | null;
  samValue: number | null;
  somValue: number | null;
  currencySymbol: string;
}

function DartboardDiagram({ tamValue, samValue, somValue, currencySymbol }: DartboardDiagramProps) {
  const hasData = tamValue || samValue || somValue;

  // Calculate percentages for display
  const samPercent = tamValue && samValue ? Math.round((samValue / tamValue) * 100) : null;
  const somPercent = samValue && somValue ? Math.round((somValue / samValue) * 100) : null;

  // Calculate circle radii based on relative values - TRUE proportional sizing
  const radii = useMemo(() => {
    const maxRadius = 120;
    const minVisibleRadius = 15;
    
    if (!tamValue) {
      return { tam: maxRadius, sam: maxRadius * 0.55, som: maxRadius * 0.22 };
    }

    const tamR = maxRadius;
    const samR = samValue 
      ? Math.max(minVisibleRadius, maxRadius * Math.sqrt(samValue / tamValue))
      : maxRadius * 0.4;
    const somR = somValue && tamValue
      ? Math.max(minVisibleRadius, maxRadius * Math.sqrt(somValue / tamValue))
      : samR * 0.3;

    return { tam: tamR, sam: samR, som: somR };
  }, [tamValue, samValue, somValue]);

  const somTooSmall = radii.som < 35;
  const centerX = 160;
  const centerY = 140;

  return (
    <div className="w-full bg-gradient-to-br from-indigo-50/50 to-background dark:from-indigo-950/20 dark:to-background rounded-xl p-4">
      <div className="flex flex-col lg:flex-row items-center gap-6">
        {/* SVG Diagram */}
        <div className="flex-shrink-0">
          <svg
            viewBox="0 0 320 280"
            className="w-full max-w-[300px] h-auto"
            role="img"
            aria-label="TAM SAM SOM concentric circles diagram"
          >
            {/* Drop shadow filter */}
            <defs>
              <filter id="shadow-investor" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15"/>
              </filter>
            </defs>

            {/* TAM Circle - Outermost */}
            <circle
              cx={centerX}
              cy={centerY}
              r={radii.tam}
              className="fill-indigo-100 dark:fill-indigo-900/40 stroke-indigo-300 dark:stroke-indigo-700"
              strokeWidth="2"
              filter="url(#shadow-investor)"
            />
            
            {/* SAM Circle - Middle */}
            <circle
              cx={centerX}
              cy={centerY}
              r={radii.sam}
              className="fill-indigo-200 dark:fill-indigo-800/50 stroke-indigo-400 dark:stroke-indigo-600"
              strokeWidth="2"
              filter="url(#shadow-investor)"
            />
            
            {/* SOM Circle - Innermost */}
            <circle
              cx={centerX}
              cy={centerY}
              r={radii.som}
              className="fill-indigo-500 dark:fill-indigo-600 stroke-indigo-600 dark:stroke-indigo-500"
              strokeWidth="2"
              filter="url(#shadow-investor)"
            />

            {/* Labels */}
            {/* TAM Label - top area */}
            <text
              x={centerX}
              y={centerY - radii.tam + 22}
              textAnchor="middle"
              className="fill-indigo-700 dark:fill-indigo-300 font-semibold"
              style={{ fontSize: '12px' }}
            >
              TAM
            </text>
            {tamValue && (
              <text
                x={centerX}
                y={centerY - radii.tam + 38}
                textAnchor="middle"
                className="fill-indigo-600 dark:fill-indigo-400 font-medium"
                style={{ fontSize: '11px' }}
              >
                {formatMarketValue(tamValue, currencySymbol)}
              </text>
            )}

            {/* SAM Label */}
            <text
              x={centerX}
              y={centerY - radii.sam + 20}
              textAnchor="middle"
              className="fill-indigo-800 dark:fill-indigo-200 font-semibold"
              style={{ fontSize: '12px' }}
            >
              SAM
            </text>
            {samValue && (
              <text
                x={centerX}
                y={centerY - radii.sam + 36}
                textAnchor="middle"
                className="fill-indigo-700 dark:fill-indigo-300 font-medium"
                style={{ fontSize: '11px' }}
              >
                {formatMarketValue(samValue, currencySymbol)}
              </text>
            )}

            {/* SOM Label */}
            {!somTooSmall ? (
              <>
                <text
                  x={centerX}
                  y={centerY - 4}
                  textAnchor="middle"
                  className="fill-white dark:fill-white font-bold"
                  style={{ fontSize: '13px' }}
                >
                  SOM
                </text>
                {somValue && (
                  <text
                    x={centerX}
                    y={centerY + 12}
                    textAnchor="middle"
                    className="fill-white/90 dark:fill-white/90 font-semibold"
                    style={{ fontSize: '12px' }}
                  >
                    {formatMarketValue(somValue, currencySymbol)}
                  </text>
                )}
              </>
            ) : (
              <>
                <text
                  x={centerX}
                  y={centerY + radii.som + 16}
                  textAnchor="middle"
                  className="fill-indigo-700 dark:fill-indigo-300 font-bold"
                  style={{ fontSize: '11px' }}
                >
                  SOM
                </text>
                {somValue && (
                  <text
                    x={centerX}
                    y={centerY + radii.som + 30}
                    textAnchor="middle"
                    className="fill-indigo-600 dark:fill-indigo-400 font-semibold"
                    style={{ fontSize: '10px' }}
                  >
                    {formatMarketValue(somValue, currencySymbol)}
                  </text>
                )}
              </>
            )}

            {/* Empty state */}
            {!hasData && (
              <text
                x={centerX}
                y={centerY + 50}
                textAnchor="middle"
                className="fill-muted-foreground"
                style={{ fontSize: '11px' }}
              >
                Enter values to visualize
              </text>
            )}
          </svg>
        </div>

        {/* Legend / Summary */}
        <div className="flex-1 space-y-3 text-sm">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-900/40 border-2 border-indigo-300 dark:border-indigo-700 flex-shrink-0" />
            <div>
              <span className="font-medium text-foreground">TAM</span>
              <span className="text-muted-foreground ml-1">- Total Addressable</span>
              {tamValue && (
                <span className="ml-2 font-semibold text-indigo-600 dark:text-indigo-400">
                  {formatMarketValue(tamValue, currencySymbol)}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-indigo-200 dark:bg-indigo-800/50 border-2 border-indigo-400 dark:border-indigo-600 flex-shrink-0" />
            <div>
              <span className="font-medium text-foreground">SAM</span>
              <span className="text-muted-foreground ml-1">- Serviceable Addressable</span>
              {samValue && (
                <span className="ml-2 font-semibold text-indigo-600 dark:text-indigo-400">
                  {formatMarketValue(samValue, currencySymbol)}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-indigo-500 dark:bg-indigo-600 border-2 border-indigo-600 dark:border-indigo-500 flex-shrink-0" />
            <div>
              <span className="font-medium text-foreground">SOM</span>
              <span className="text-muted-foreground ml-1">- Serviceable Obtainable</span>
              {somValue && (
                <span className="ml-2 font-semibold text-indigo-600 dark:text-indigo-400">
                  {formatMarketValue(somValue, currencySymbol)}
                </span>
              )}
            </div>
          </div>

          {hasData && samPercent && somPercent && (
            <div className="pt-2 border-t border-border/50 text-xs text-muted-foreground">
              <p>Your SAM is {samPercent}% of TAM</p>
              <p>Your SOM is {somPercent}% of SAM</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function InvestorMarketSizing({ data }: InvestorMarketSizingProps) {
  if (!data) {
    return (
      <Card className="border-dashed border-muted-foreground/30">
        <CardContent className="py-8 text-center text-muted-foreground">
          Market sizing data not yet provided
        </CardContent>
      </Card>
    );
  }

  const hasTAM = data.tam_value && data.tam_value > 0;
  const hasSAM = data.sam_value && data.sam_value > 0;
  const hasSOM = data.som_value && data.som_value > 0;
  const hasClinicalImpact = data.lives_impacted_annually || data.procedures_enabled_annually || data.cost_savings_per_procedure;

  const currencySymbol = data.tam_currency === 'USD' ? '$' : '€';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Market Size & Clinical Impact</h3>
      </div>

      {/* TAM/SAM/SOM Dartboard */}
      {(hasTAM || hasSAM || hasSOM) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Market Opportunity</CardTitle>
          </CardHeader>
          <CardContent>
            <DartboardDiagram
              tamValue={data.tam_value}
              samValue={data.sam_value}
              somValue={data.som_value}
              currencySymbol={currencySymbol}
            />

            {data.tam_sources && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Sources:</span> {data.tam_sources}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Clinical Impact */}
      {hasClinicalImpact && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Clinical Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.lives_impacted_annually && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Users className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{formatNumber(data.lives_impacted_annually)}</p>
                    <p className="text-xs text-muted-foreground">Lives impacted annually</p>
                  </div>
                </div>
              )}
              
              {data.procedures_enabled_annually && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Target className="h-8 w-8 text-emerald-600" />
                  <div>
                    <p className="text-2xl font-bold">{formatNumber(data.procedures_enabled_annually)}</p>
                    <p className="text-xs text-muted-foreground">Procedures enabled/year</p>
                  </div>
                </div>
              )}
              
              {data.cost_savings_per_procedure && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <DollarSign className="h-8 w-8 text-amber-600" />
                  <div>
                    <p className="text-2xl font-bold">{formatCurrency(data.cost_savings_per_procedure, data.tam_currency)}</p>
                    <p className="text-xs text-muted-foreground">Cost savings/procedure</p>
                  </div>
                </div>
              )}
            </div>

            {data.clinical_impact_sources && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Evidence sources:</span> {data.clinical_impact_sources}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
