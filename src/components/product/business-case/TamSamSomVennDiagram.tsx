import { useMemo } from "react";
import { useTranslation } from "@/hooks/useTranslation";

interface TamSamSomVennDiagramProps {
  tamValue: number | null;
  samValue: number | null;
  somValue: number | null;
  currencySymbol: string;
}

function formatMarketValue(value: number, symbol: string): string {
  if (value >= 1000) return `${symbol}${(value / 1000).toFixed(1)}B`;
  return `${symbol}${value.toFixed(0)}M`;
}

export function TamSamSomVennDiagram({
  tamValue,
  samValue,
  somValue,
  currencySymbol
}: TamSamSomVennDiagramProps) {
  const { lang } = useTranslation();
  const hasData = tamValue || samValue || somValue;

  // Calculate percentages for display
  const samPercent = tamValue && samValue ? Math.round((samValue / tamValue) * 100) : null;
  const somPercent = samValue && somValue ? Math.round((somValue / samValue) * 100) : null;

  // Calculate circle radii based on relative values - TRUE proportional sizing
  // Area of circle = π * r², so for proportional areas: r = maxR * sqrt(value/maxValue)
  const radii = useMemo(() => {
    const maxRadius = 150;
    const minVisibleRadius = 15; // Minimum for visibility only
    
    if (!tamValue) {
      return { tam: maxRadius, sam: maxRadius * 0.55, som: maxRadius * 0.22 };
    }

    // All circles scaled relative to TAM for TRUE proportions
    const tamR = maxRadius;
    const samR = samValue 
      ? Math.max(minVisibleRadius, maxRadius * Math.sqrt(samValue / tamValue))
      : maxRadius * 0.4;
    const somR = somValue && tamValue
      ? Math.max(minVisibleRadius, maxRadius * Math.sqrt(somValue / tamValue))
      : samR * 0.3;

    return { tam: tamR, sam: samR, som: somR };
  }, [tamValue, samValue, somValue]);

  // Determine if SOM is too small for internal labels
  const somTooSmall = radii.som < 40;

  const centerX = 200;
  const centerY = 180;

  return (
    <div className="w-full bg-gradient-to-br from-indigo-50/50 to-background dark:from-indigo-950/20 dark:to-background rounded-xl p-4 border border-border/50">
      <div className="flex flex-col lg:flex-row items-center gap-6">
        {/* SVG Diagram */}
        <div className="flex-shrink-0">
          <svg
            viewBox="0 0 400 360"
            className="w-full max-w-[380px] h-auto"
            role="img"
            aria-label={lang('marketAnalysis.vennDiagram.ariaLabel')}
          >
            {/* Drop shadow filter */}
            <defs>
              <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15"/>
              </filter>
            </defs>

            {/* TAM Circle - Outermost */}
            <circle
              cx={centerX}
              cy={centerY}
              r={radii.tam}
              className="fill-indigo-100 dark:fill-indigo-900/40 stroke-indigo-300 dark:stroke-indigo-700"
              strokeWidth="2.5"
              filter="url(#shadow)"
            />
            
            {/* SAM Circle - Middle */}
            <circle
              cx={centerX}
              cy={centerY}
              r={radii.sam}
              className="fill-indigo-200 dark:fill-indigo-800/50 stroke-indigo-400 dark:stroke-indigo-600"
              strokeWidth="2.5"
              filter="url(#shadow)"
            />
            
            {/* SOM Circle - Innermost */}
            <circle
              cx={centerX}
              cy={centerY}
              r={radii.som}
              className="fill-indigo-500 dark:fill-indigo-600 stroke-indigo-600 dark:stroke-indigo-500"
              strokeWidth="2.5"
              filter="url(#shadow)"
            />

            {/* Labels */}
            {/* TAM Label - top area */}
            <text
              x={centerX}
              y={centerY - radii.tam + 26}
              textAnchor="middle"
              className="fill-indigo-700 dark:fill-indigo-300 font-semibold"
              style={{ fontSize: '14px' }}
            >
              TAM
            </text>
            {tamValue && (
              <text
                x={centerX}
                y={centerY - radii.tam + 44}
                textAnchor="middle"
                className="fill-indigo-600 dark:fill-indigo-400 font-medium"
                style={{ fontSize: '13px' }}
              >
                {formatMarketValue(tamValue, currencySymbol)}
              </text>
            )}

            {/* SAM Label - positioned in SAM ring */}
            <text
              x={centerX}
              y={centerY - radii.sam + 24}
              textAnchor="middle"
              className="fill-indigo-800 dark:fill-indigo-200 font-semibold"
              style={{ fontSize: '14px' }}
            >
              SAM
            </text>
            {samValue && (
              <text
                x={centerX}
                y={centerY - radii.sam + 42}
                textAnchor="middle"
                className="fill-indigo-700 dark:fill-indigo-300 font-medium"
                style={{ fontSize: '13px' }}
              >
                {formatMarketValue(samValue, currencySymbol)}
              </text>
            )}

            {/* SOM Label - center or below if too small */}
            {!somTooSmall ? (
              <>
                <text
                  x={centerX}
                  y={centerY - 5}
                  textAnchor="middle"
                  className="fill-white dark:fill-white font-bold"
                  style={{ fontSize: '15px' }}
                >
                  SOM
                </text>
                {somValue && (
                  <text
                    x={centerX}
                    y={centerY + 14}
                    textAnchor="middle"
                    className="fill-white/90 dark:fill-white/90 font-semibold"
                    style={{ fontSize: '14px' }}
                  >
                    {formatMarketValue(somValue, currencySymbol)}
                  </text>
                )}
              </>
            ) : (
              <>
                {/* Small SOM - label below circle */}
                <text
                  x={centerX}
                  y={centerY + radii.som + 18}
                  textAnchor="middle"
                  className="fill-indigo-700 dark:fill-indigo-300 font-bold"
                  style={{ fontSize: '13px' }}
                >
                  SOM
                </text>
                {somValue && (
                  <text
                    x={centerX}
                    y={centerY + radii.som + 34}
                    textAnchor="middle"
                    className="fill-indigo-600 dark:fill-indigo-400 font-semibold"
                    style={{ fontSize: '12px' }}
                  >
                    {formatMarketValue(somValue, currencySymbol)}
                  </text>
                )}
              </>
            )}

            {/* Empty state overlay */}
            {!hasData && (
              <text
                x={centerX}
                y={centerY + 60}
                textAnchor="middle"
                className="fill-muted-foreground"
                style={{ fontSize: '13px' }}
              >
                {lang('marketAnalysis.vennDiagram.enterValuesToVisualize')}
              </text>
            )}
          </svg>
        </div>

        {/* Legend / Summary */}
        <div className="flex-1 space-y-3 text-sm">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 border-2 border-indigo-300 dark:border-indigo-700 flex-shrink-0" />
            <div>
              <span className="font-medium text-foreground">TAM</span>
              <span className="text-muted-foreground ml-1">- {lang('marketAnalysis.tam.full')}</span>
              {tamValue && (
                <span className="ml-2 font-semibold text-indigo-600 dark:text-indigo-400">
                  {formatMarketValue(tamValue, currencySymbol)}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-indigo-200 dark:bg-indigo-800/50 border-2 border-indigo-400 dark:border-indigo-600 flex-shrink-0" />
            <div>
              <span className="font-medium text-foreground">SAM</span>
              <span className="text-muted-foreground ml-1">- {lang('marketAnalysis.sam.full')}</span>
              {samValue && (
                <span className="ml-2 font-semibold text-indigo-600 dark:text-indigo-400">
                  {formatMarketValue(samValue, currencySymbol)}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-indigo-500 dark:bg-indigo-600 border-2 border-indigo-600 dark:border-indigo-500 flex-shrink-0" />
            <div>
              <span className="font-medium text-foreground">SOM</span>
              <span className="text-muted-foreground ml-1">- {lang('marketAnalysis.som.full')}</span>
              {somValue && (
                <span className="ml-2 font-semibold text-indigo-600 dark:text-indigo-400">
                  {formatMarketValue(somValue, currencySymbol)}
                </span>
              )}
            </div>
          </div>

          {hasData && samPercent && somPercent && (
            <div className="pt-2 border-t border-border/50 text-xs text-muted-foreground">
              <p>{lang('marketAnalysis.vennDiagram.samPercentOfTam').replace('{{percent}}', String(samPercent))}</p>
              <p>{lang('marketAnalysis.vennDiagram.somPercentOfSam').replace('{{percent}}', String(somPercent))}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
