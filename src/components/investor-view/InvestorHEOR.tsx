import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HeartPulse, DollarSign, TrendingUp, Calculator, Clock, PiggyBank } from 'lucide-react';

interface InvestorHEORProps {
  data: {
    healthEconomicsEvidence: string | null;
    heorAssumptions: string | null;
    heorByMarket: Record<string, any> | null;
  };
}

const modelTypeLabels: Record<string, string> = {
  cost_savings: 'Cost Savings Model',
  cost_utility: 'Cost-Utility (QALY)',
  budget_impact: 'Budget Impact Analysis',
  roi_payback: 'ROI / Payback Model',
};

function formatCurrency(value: number | null | undefined, currency = 'USD'): string {
  if (value == null) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function InvestorHEOR({ data }: InvestorHEORProps) {
  if (!data) return null;

  const hasMarketData = data.heorByMarket && Object.keys(data.heorByMarket).length > 0;
  
  if (!hasMarketData && !data.healthEconomicsEvidence) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
        <HeartPulse className="h-5 w-5 text-primary" />
        Health Economics & Outcomes Research
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* HEOR Evidence Summary */}
        {data.healthEconomicsEvidence && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Value Proposition Evidence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{data.healthEconomicsEvidence}</p>
            </CardContent>
          </Card>
        )}

        {/* Key Assumptions */}
        {data.heorAssumptions && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Economic Model Assumptions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{data.heorAssumptions}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Market-specific HEOR */}
      {hasMarketData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Object.entries(data.heorByMarket!).map(([market, heor]: [string, any]) => (
            <Card key={market}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-sm">{market}</Badge>
                  {heor.heor_model_type && (
                    <Badge variant="secondary" className="text-xs">
                      {modelTypeLabels[heor.heor_model_type] || heor.heor_model_type}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cost Savings Model */}
                {heor.heor_model_type === 'cost_savings' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-muted/50 rounded-lg p-3">
                        <div className="text-xs text-muted-foreground">Savings per Procedure</div>
                        <div className="text-lg font-bold text-emerald-600">
                          {formatCurrency(heor.cost_savings_per_procedure)}
                        </div>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3">
                        <div className="text-xs text-muted-foreground">Annual Savings</div>
                        <div className="text-lg font-bold text-emerald-600">
                          {formatCurrency(heor.cost_savings_annual)}
                        </div>
                      </div>
                    </div>
                    {heor.procedure_volume_annual && (
                      <div className="text-xs text-muted-foreground">
                        Based on {heor.procedure_volume_annual.toLocaleString()} procedures/year
                      </div>
                    )}
                  </div>
                )}

                {/* Cost-Utility (QALY) Model */}
                {heor.heor_model_type === 'cost_utility' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      {heor.qaly_gain_estimate && (
                        <div className="bg-muted/50 rounded-lg p-3">
                          <div className="text-xs text-muted-foreground">QALY Gain</div>
                          <div className="text-lg font-bold text-primary">
                            {heor.qaly_gain_estimate}
                          </div>
                        </div>
                      )}
                      {heor.icer_value && (
                        <div className="bg-muted/50 rounded-lg p-3">
                          <div className="text-xs text-muted-foreground">ICER</div>
                          <div className="text-lg font-bold">
                            {formatCurrency(heor.icer_value, heor.icer_currency || 'USD')}/QALY
                          </div>
                        </div>
                      )}
                    </div>
                    {heor.willingness_to_pay_threshold && (
                      <div className="text-xs text-muted-foreground">
                        WTP Threshold: {formatCurrency(heor.willingness_to_pay_threshold, heor.icer_currency || 'USD')}/QALY
                      </div>
                    )}
                  </div>
                )}

                {/* Budget Impact Model */}
                {heor.heor_model_type === 'budget_impact' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 2, 3].map((year) => {
                        const value = heor[`budget_impact_year${year}`];
                        if (!value) return null;
                        return (
                          <div key={year} className="bg-muted/50 rounded-lg p-3 text-center">
                            <div className="text-xs text-muted-foreground">Year {year}</div>
                            <div className="text-sm font-bold">{formatCurrency(value)}</div>
                          </div>
                        );
                      })}
                    </div>
                    {heor.budget_impact_notes && (
                      <p className="text-xs text-muted-foreground">{heor.budget_impact_notes}</p>
                    )}
                  </div>
                )}

                {/* ROI / Payback Model */}
                {heor.heor_model_type === 'roi_payback' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      {heor.roi_percent && (
                        <div className="bg-muted/50 rounded-lg p-3">
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            ROI
                          </div>
                          <div className="text-lg font-bold text-emerald-600">
                            {heor.roi_percent}%
                          </div>
                        </div>
                      )}
                      {heor.payback_period_months && (
                        <div className="bg-muted/50 rounded-lg p-3">
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Payback Period
                          </div>
                          <div className="text-lg font-bold">
                            {heor.payback_period_months} months
                          </div>
                        </div>
                      )}
                    </div>
                    {heor.device_capital_cost && (
                      <div className="text-xs text-muted-foreground">
                        Capital Cost: {formatCurrency(heor.device_capital_cost)}
                      </div>
                    )}
                  </div>
                )}

                {/* Fallback for legacy data */}
                {!heor.heor_model_type && (
                  <>
                    {heor.qaly && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">QALY:</span>
                        <span className="font-medium text-emerald-600">{heor.qaly}</span>
                      </div>
                    )}
                    {heor.icer && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">ICER:</span>
                        <span className="font-medium">{heor.icer}</span>
                      </div>
                    )}
                    {heor.costSavings && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Cost Savings:</span>
                        <span className="font-medium text-emerald-600">{heor.costSavings}</span>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
