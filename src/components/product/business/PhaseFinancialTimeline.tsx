import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DevelopmentPhase } from "@/services/enhanced-rnpv/interfaces";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { TrendingDown, TrendingUp, Calendar, AlertTriangle, DollarSign } from "lucide-react";
import { useMemo } from "react";

interface PhaseFinancialTimelineProps {
  phases: DevelopmentPhase[];
  currency: string;
  cumulativeTechnicalLoA: number;
}

interface MonthlyDataPoint {
  month: number;
  cumulativeInvestment: number;
  riskAdjustedInvestment: number;
  phaseName?: string;
  loa?: number;
}

export function PhaseFinancialTimeline({ phases, currency, cumulativeTechnicalLoA }: PhaseFinancialTimelineProps) {
  const timelineData = useMemo(() => {
    if (!phases || phases.length === 0) return null;

    // Find total project duration based on phases
    const maxEndMonth = Math.max(...phases.map(p => p.startMonth + p.duration));
    const totalMonths = maxEndMonth;

    // Initialize monthly data
    const monthlyData: MonthlyDataPoint[] = [];
    let cumulativeInvestment = 0;
    let cumulativeLOA = 1.0; // Start at 100%

    // Build phase timeline with LOA gates
    const phaseTimeline = phases.map(phase => ({
      startMonth: phase.startMonth,
      endMonth: phase.startMonth + phase.duration,
      phase
    })).sort((a, b) => a.startMonth - b.startMonth);

    // Generate monthly cash flow
    for (let month = 0; month <= totalMonths; month++) {
      // Find active phases for this month
      let monthlySpend = 0;
      let currentPhaseName: string | undefined;
      let phaseTransitionLOA: number | undefined;

      phaseTimeline.forEach(({ startMonth, endMonth, phase }) => {
        if (month >= startMonth && month < endMonth) {
          const phaseDuration = endMonth - startMonth || 1;
          const monthlyPhaseCost = phase.costs / phaseDuration;
          monthlySpend += monthlyPhaseCost;
          currentPhaseName = phase.name;
        }

        // Check if this month is a phase transition (end of phase)
        if (month === endMonth) {
          const losDecimal = phase.likelihoodOfSuccess / 100;
          cumulativeLOA *= losDecimal;
          phaseTransitionLOA = phase.likelihoodOfSuccess;
        }
      });

      cumulativeInvestment += monthlySpend;
      const riskAdjustedInvestment = cumulativeInvestment * cumulativeLOA;

      monthlyData.push({
        month,
        cumulativeInvestment,
        riskAdjustedInvestment,
        phaseName: currentPhaseName,
        loa: phaseTransitionLOA
      });
    }

    // Calculate metrics
    const totalInvestment = phases.reduce((sum, p) => sum + p.costs, 0);
    const riskAdjustedTotal = totalInvestment * (cumulativeTechnicalLoA / 100);
    const avgMonthlyBurn = totalInvestment / totalMonths;
    const highestRiskPhase = phases.reduce((min, p) => 
      (p.likelihoodOfSuccess < (min?.likelihoodOfSuccess || 100)) ? p : min
    , phases[0]);

    return {
      monthlyData,
      totalInvestment,
      riskAdjustedTotal,
      avgMonthlyBurn,
      highestRiskPhase,
      totalMonths,
      phaseTimeline
    };
  }, [phases, cumulativeTechnicalLoA]);

  if (!timelineData) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            No phase timeline data available. Ensure phases are defined with costs and durations.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { monthlyData, totalInvestment, riskAdjustedTotal, avgMonthlyBurn, highestRiskPhase, totalMonths, phaseTimeline } = timelineData;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Total Investment</p>
            </div>
            <p className="text-2xl font-bold mt-2">{formatCurrency(totalInvestment)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-amber-500" />
              <p className="text-sm text-muted-foreground">Risk-Adjusted</p>
            </div>
            <p className="text-2xl font-bold mt-2">{formatCurrency(riskAdjustedTotal)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {cumulativeTechnicalLoA.toFixed(1)}% LOA
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <p className="text-sm text-muted-foreground">Avg Monthly Burn</p>
            </div>
            <p className="text-2xl font-bold mt-2">{formatCurrency(avgMonthlyBurn)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <p className="text-sm text-muted-foreground">Highest Risk Phase</p>
            </div>
            <p className="text-sm font-semibold mt-2 truncate" title={highestRiskPhase.name}>
              {highestRiskPhase.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {highestRiskPhase.likelihoodOfSuccess.toFixed(1)}% LoS
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Risk-Adjusted Cumulative Investment Timeline</CardTitle>
          <p className="text-sm text-muted-foreground">
            Shows how investment accumulates over time with probability gates applied at each phase transition
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={monthlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="month" 
                label={{ value: 'Months from Project Start', position: 'insideBottom', offset: -5 }}
                className="text-xs"
              />
              <YAxis 
                tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                label={{ value: `Investment (${currency})`, angle: -90, position: 'insideLeft' }}
                className="text-xs"
              />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(month) => `Month ${month}`}
                contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
              />
              <Legend />
              
              {/* Phase transition markers */}
              {phaseTimeline.map(({ endMonth, phase }, idx) => (
                <ReferenceLine 
                  key={idx}
                  x={endMonth} 
                  stroke="hsl(var(--primary))" 
                  strokeDasharray="3 3"
                  label={{ 
                    value: `${phase.name} (${phase.likelihoodOfSuccess.toFixed(0)}% LoS)`, 
                    position: 'top',
                    fontSize: 10
                  }}
                />
              ))}
              
              <Line 
                type="monotone" 
                dataKey="cumulativeInvestment" 
                stroke="hsl(var(--destructive))" 
                strokeWidth={2}
                name="Raw Investment"
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="riskAdjustedInvestment" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Risk-Adjusted Investment"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>

          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium mb-2">Understanding This Chart:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <span className="text-destructive font-medium">Red Line</span>: Actual cumulative investment over time</li>
              <li>• <span className="text-primary font-medium">Blue Line</span>: Risk-adjusted investment (actual × cumulative LOA)</li>
              <li>• <span className="text-primary font-medium">Vertical Dashed Lines</span>: Phase transitions where LOA gates are applied</li>
              <li>• The gap between lines shows the risk discount applied to your investment</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Phase Details Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Phase Investment Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Phase</th>
                  <th className="text-right p-2">Budget</th>
                  <th className="text-right p-2">Duration</th>
                  <th className="text-right p-2">Monthly Burn</th>
                  <th className="text-right p-2">LOA</th>
                  <th className="text-right p-2">Risk-Adjusted Value</th>
                </tr>
              </thead>
              <tbody>
                {phases.map((phase, idx) => {
                  const monthlyBurn = phase.costs / phase.duration;
                  const riskAdjusted = phase.costs * (phase.likelihoodOfSuccess / 100);

                  return (
                    <tr key={idx} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium">{phase.name}</td>
                      <td className="p-2 text-right">{formatCurrency(phase.costs)}</td>
                      <td className="p-2 text-right">{phase.duration} months</td>
                      <td className="p-2 text-right">{formatCurrency(monthlyBurn)}/mo</td>
                      <td className="p-2 text-right">
                        <span className={phase.likelihoodOfSuccess < 80 ? 'text-red-500 font-semibold' : ''}>
                          {phase.likelihoodOfSuccess.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-2 text-right font-medium">{formatCurrency(riskAdjusted)}</td>
                    </tr>
                  );
                })}
                <tr className="font-bold bg-muted/30">
                  <td className="p-2">TOTAL</td>
                  <td className="p-2 text-right">{formatCurrency(totalInvestment)}</td>
                  <td className="p-2 text-right">{totalMonths} months</td>
                  <td className="p-2 text-right">{formatCurrency(avgMonthlyBurn)}/mo</td>
                  <td className="p-2 text-right">{cumulativeTechnicalLoA.toFixed(1)}%</td>
                  <td className="p-2 text-right">{formatCurrency(riskAdjustedTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
