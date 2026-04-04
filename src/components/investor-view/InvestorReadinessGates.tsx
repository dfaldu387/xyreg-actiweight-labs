import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Clock, XCircle, ChevronRight, Flag } from 'lucide-react';
import { ReadinessGates, ReadinessGate } from '@/types/investorModules';

interface InvestorReadinessGatesProps {
  data: ReadinessGates | null;
}

function getGateStatusIcon(status: string) {
  switch (status) {
    case 'passed': return <CheckCircle2 className="h-6 w-6 text-emerald-500" />;
    case 'in_progress': return <Clock className="h-6 w-6 text-amber-500" />;
    case 'failed': return <XCircle className="h-6 w-6 text-red-500" />;
    default: return <Circle className="h-6 w-6 text-muted-foreground" />;
  }
}

function getDecisionBadge(decision: string | null) {
  switch (decision) {
    case 'go': return <Badge className="bg-emerald-500">GO</Badge>;
    case 'no_go': return <Badge variant="destructive">NO-GO</Badge>;
    case 'conditional': return <Badge className="bg-amber-500">CONDITIONAL</Badge>;
    default: return null;
  }
}

export function InvestorReadinessGates({ data }: InvestorReadinessGatesProps) {
  if (!data) {
    return (
      <Card className="border-dashed border-muted-foreground/30">
        <CardContent className="py-8 text-center text-muted-foreground">
          Product readiness gates not yet defined
        </CardContent>
      </Card>
    );
  }

  const gates = (data.gates as ReadinessGate[]) || [];
  const hasGates = gates.length > 0;
  const currentGate = gates.find(g => g.id === data.current_gate_id);
  const currentGateIndex = gates.findIndex(g => g.id === data.current_gate_id);
  const hasDecisionLog = data.decision_log && data.decision_log.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Flag className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Product Readiness Gates</h3>
      </div>

      {/* Gate Progress Visualization */}
      {hasGates && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Stage Gate Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {/* Progress line */}
              <div className="absolute top-6 left-6 right-6 h-1 bg-muted rounded-full" />
              <div 
                className="absolute top-6 left-6 h-1 bg-primary rounded-full transition-all" 
                style={{ width: `${(currentGateIndex / (gates.length - 1)) * 100}%` }}
              />

              {/* Gates */}
              <div className="relative flex justify-between">
                {gates.map((gate, idx) => {
                  const isActive = gate.id === data.current_gate_id;
                  const isPassed = idx < currentGateIndex || gate.status === 'passed';
                  
                  return (
                    <div key={gate.id} className="flex flex-col items-center" style={{ width: `${100 / gates.length}%` }}>
                      <div className={`
                        h-12 w-12 rounded-full flex items-center justify-center z-10
                        ${isActive ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' : ''}
                        ${isPassed && !isActive ? 'bg-emerald-500 text-white' : ''}
                        ${!isPassed && !isActive ? 'bg-muted' : ''}
                      `}>
                        {isPassed ? (
                          <CheckCircle2 className="h-6 w-6" />
                        ) : isActive ? (
                          <Clock className="h-6 w-6" />
                        ) : (
                          <span className="text-sm font-bold">{idx + 1}</span>
                        )}
                      </div>
                      <p className={`text-xs mt-2 text-center ${isActive ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                        {gate.name}
                      </p>
                      {gate.decision && (
                        <div className="mt-1">
                          {getDecisionBadge(gate.decision)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Gate Details */}
      {currentGate && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Current Stage: {currentGate.name}</CardTitle>
              <Badge variant="outline" className="border-primary text-primary">Active</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentGate.entry_criteria && currentGate.entry_criteria.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Entry Criteria</p>
                  <ul className="space-y-1">
                    {currentGate.entry_criteria.map((criteria, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        {criteria}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {currentGate.exit_criteria && currentGate.exit_criteria.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Exit Criteria</p>
                  <ul className="space-y-1">
                    {currentGate.exit_criteria.map((criteria, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ChevronRight className="h-3 w-3" />
                        {criteria}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            {currentGate.decision_makers && currentGate.decision_makers.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium mb-2">Decision Makers</p>
                <div className="flex flex-wrap gap-2">
                  {currentGate.decision_makers.map((maker, idx) => (
                    <Badge key={idx} variant="secondary">{maker}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Completed Gates Summary */}
      {hasGates && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gate Status Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {gates.map((gate) => (
                <div key={gate.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getGateStatusIcon(gate.status)}
                    <span className="text-sm">{gate.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {gate.decision_date && (
                      <span className="text-xs text-muted-foreground">{gate.decision_date}</span>
                    )}
                    {getDecisionBadge(gate.decision)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Decision Log */}
      {hasDecisionLog && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Decision History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.decision_log.map((decision, idx) => {
                const gate = gates.find(g => g.id === decision.gate_id);
                return (
                  <div key={idx} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{gate?.name || decision.gate_id}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{decision.date}</span>
                        {getDecisionBadge(decision.decision)}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{decision.rationale}</p>
                    {decision.attendees && decision.attendees.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {decision.attendees.map((attendee, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{attendee}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
