import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Banknote, CheckCircle2, Clock, AlertCircle, Building2 } from 'lucide-react';
import { ReimbursementStrategy, PayerMix } from '@/types/investorModules';

interface InvestorReimbursementStrategyProps {
  data: ReimbursementStrategy | null;
}

function getCoverageStatusColor(status: string | null) {
  switch (status) {
    case 'covered': return 'bg-emerald-500';
    case 'pending': return 'bg-amber-500';
    case 'not_covered': return 'bg-red-500';
    case 'variable': return 'bg-blue-500';
    default: return 'bg-muted';
  }
}

function getCoverageStatusLabel(status: string | null) {
  switch (status) {
    case 'covered': return 'Covered';
    case 'pending': return 'Pending';
    case 'not_covered': return 'Not Covered';
    case 'variable': return 'Variable by Payer';
    default: return 'Unknown';
  }
}

function getValueDossierLabel(status: string | null) {
  switch (status) {
    case 'not_started': return 'Not Started';
    case 'in_progress': return 'In Progress';
    case 'complete': return 'Complete';
    default: return 'Not Started';
  }
}

function getValueDossierProgress(status: string | null) {
  switch (status) {
    case 'not_started': return 0;
    case 'in_progress': return 50;
    case 'complete': return 100;
    default: return 0;
  }
}

export function InvestorReimbursementStrategy({ data }: InvestorReimbursementStrategyProps) {
  if (!data) {
    return (
      <Card className="border-dashed border-muted-foreground/30">
        <CardContent className="py-8 text-center text-muted-foreground">
          Reimbursement strategy not yet defined
        </CardContent>
      </Card>
    );
  }

  const hasTargetCodes = data.target_codes && data.target_codes.length > 0;
  const hasPayerMix = data.payer_mix && Object.keys(data.payer_mix).length > 0;
  const hasMilestones = data.key_milestones && data.key_milestones.length > 0;
  const hasPayerMeetings = data.payer_meetings && data.payer_meetings.length > 0;

  const payerMix = data.payer_mix as PayerMix || {};
  const payerTotal = (payerMix.medicare || 0) + (payerMix.medicaid || 0) + (payerMix.private || 0) + (payerMix.self_pay || 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Banknote className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Reimbursement Strategy</h3>
      </div>

      {/* Coverage Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className={`h-12 w-12 rounded-full ${getCoverageStatusColor(data.coverage_status)} flex items-center justify-center`}>
                {data.coverage_status === 'covered' ? (
                  <CheckCircle2 className="h-6 w-6 text-white" />
                ) : data.coverage_status === 'pending' ? (
                  <Clock className="h-6 w-6 text-white" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-white" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Coverage Status</p>
                <p className="text-lg font-semibold">{getCoverageStatusLabel(data.coverage_status)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Timeline to Coverage</p>
                <p className="text-lg font-semibold">
                  {data.reimbursement_timeline_months ? `${data.reimbursement_timeline_months} months` : '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground mb-2">Value Dossier</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{getValueDossierLabel(data.value_dossier_status)}</span>
                <span>{getValueDossierProgress(data.value_dossier_status)}%</span>
              </div>
              <Progress value={getValueDossierProgress(data.value_dossier_status)} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Target Codes */}
      {hasTargetCodes && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Target Reimbursement Codes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.target_codes.map((code, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{code.market}</Badge>
                    <span className="font-mono text-sm">{code.code}</span>
                    <span className="text-sm text-muted-foreground">{code.description}</span>
                  </div>
                  <Badge 
                    variant={code.status === 'existing' ? 'default' : code.status === 'bundled' ? 'secondary' : 'outline'}
                    className={code.status === 'new_needed' ? 'border-amber-500 text-amber-500' : ''}
                  >
                    {code.status === 'new_needed' ? 'New Code Needed' : code.status === 'bundled' ? 'Bundled' : 'Existing'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payer Mix */}
      {hasPayerMix && payerTotal > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Payer Mix Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-4 rounded-full overflow-hidden mb-4">
              {payerMix.medicare && payerMix.medicare > 0 && (
                <div 
                  className="bg-blue-500" 
                  style={{ width: `${(payerMix.medicare / payerTotal) * 100}%` }}
                  title={`Medicare: ${payerMix.medicare}%`}
                />
              )}
              {payerMix.medicaid && payerMix.medicaid > 0 && (
                <div 
                  className="bg-emerald-500" 
                  style={{ width: `${(payerMix.medicaid / payerTotal) * 100}%` }}
                  title={`Medicaid: ${payerMix.medicaid}%`}
                />
              )}
              {payerMix.private && payerMix.private > 0 && (
                <div 
                  className="bg-purple-500" 
                  style={{ width: `${(payerMix.private / payerTotal) * 100}%` }}
                  title={`Private: ${payerMix.private}%`}
                />
              )}
              {payerMix.self_pay && payerMix.self_pay > 0 && (
                <div 
                  className="bg-amber-500" 
                  style={{ width: `${(payerMix.self_pay / payerTotal) * 100}%` }}
                  title={`Self-Pay: ${payerMix.self_pay}%`}
                />
              )}
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              {payerMix.medicare !== undefined && payerMix.medicare > 0 && (
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                  <span>Medicare: {payerMix.medicare}%</span>
                </div>
              )}
              {payerMix.medicaid !== undefined && payerMix.medicaid > 0 && (
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-emerald-500" />
                  <span>Medicaid: {payerMix.medicaid}%</span>
                </div>
              )}
              {payerMix.private !== undefined && payerMix.private > 0 && (
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-purple-500" />
                  <span>Private: {payerMix.private}%</span>
                </div>
              )}
              {payerMix.self_pay !== undefined && payerMix.self_pay > 0 && (
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-amber-500" />
                  <span>Self-Pay: {payerMix.self_pay}%</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Milestones */}
      {hasMilestones && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reimbursement Milestones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.key_milestones.map((milestone, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${
                    milestone.status === 'completed' ? 'bg-emerald-500' : 
                    milestone.status === 'pending' ? 'bg-amber-500' : 'bg-muted'
                  }`} />
                  <span className="text-sm text-muted-foreground w-24">{milestone.date}</span>
                  <span className="text-sm">{milestone.milestone}</span>
                  <Badge variant={milestone.status === 'completed' ? 'default' : 'outline'} className="ml-auto">
                    {milestone.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payer Meetings */}
      {hasPayerMeetings && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Payer Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.payer_meetings.map((meeting, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{meeting.payer}</p>
                    <p className="text-xs text-muted-foreground">{meeting.date}</p>
                  </div>
                  <Badge 
                    variant={meeting.outcome === 'positive' ? 'default' : meeting.outcome === 'negative' ? 'destructive' : 'outline'}
                    className={meeting.outcome === 'positive' ? 'bg-emerald-500' : ''}
                  >
                    {meeting.outcome}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* HEOR Metrics */}
      {(data.cost_savings_per_procedure || data.qaly_gain_estimate || data.icer_value || data.roi_percent || data.budget_impact_year1) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Health Economics (HEOR)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {data.cost_savings_per_procedure != null && data.cost_savings_per_procedure > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Cost Savings/Procedure</p>
                  <p className="text-sm font-semibold">${data.cost_savings_per_procedure.toLocaleString()}</p>
                </div>
              )}
              {data.qaly_gain_estimate != null && data.qaly_gain_estimate > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">QALY Gain</p>
                  <p className="text-sm font-semibold">{data.qaly_gain_estimate}</p>
                </div>
              )}
              {data.icer_value != null && data.icer_value > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">ICER</p>
                  <p className="text-sm font-semibold">${data.icer_value.toLocaleString()}{data.icer_currency ? ` ${data.icer_currency}` : ''}</p>
                </div>
              )}
              {data.roi_percent != null && data.roi_percent > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">ROI</p>
                  <p className="text-sm font-semibold">{data.roi_percent}%</p>
                </div>
              )}
            </div>
            {(data.budget_impact_year1 || data.budget_impact_year2 || data.budget_impact_year3) && (
              <div className="mt-4 pt-3 border-t">
                <p className="text-xs text-muted-foreground mb-2">Budget Impact</p>
                <div className="flex gap-6 text-sm">
                  {data.budget_impact_year1 != null && (
                    <div><span className="text-muted-foreground">Year 1: </span><span className="font-medium">${data.budget_impact_year1.toLocaleString()}</span></div>
                  )}
                  {data.budget_impact_year2 != null && (
                    <div><span className="text-muted-foreground">Year 2: </span><span className="font-medium">${data.budget_impact_year2.toLocaleString()}</span></div>
                  )}
                  {data.budget_impact_year3 != null && (
                    <div><span className="text-muted-foreground">Year 3: </span><span className="font-medium">${data.budget_impact_year3.toLocaleString()}</span></div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Health Economics Evidence */}
      {data.health_economics_evidence && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Health Economics Evidence</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{data.health_economics_evidence}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
