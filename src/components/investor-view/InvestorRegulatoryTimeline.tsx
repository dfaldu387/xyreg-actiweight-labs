import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle2, Clock, AlertTriangle, Scale } from 'lucide-react';
import { RegulatoryTimeline } from '@/types/investorModules';

interface InvestorRegulatoryTimelineProps {
  data: RegulatoryTimeline | null;
}

function getStatusColor(status: string) {
  switch (status) {
    case 'completed': return 'bg-emerald-500';
    case 'in_progress': return 'bg-amber-500';
    case 'pending': return 'bg-muted';
    default: return 'bg-muted';
  }
}

function getImpactColor(impact: string) {
  switch (impact) {
    case 'high': return 'text-red-500';
    case 'medium': return 'text-amber-500';
    case 'low': return 'text-blue-500';
    default: return 'text-muted-foreground';
  }
}

export function InvestorRegulatoryTimeline({ data }: InvestorRegulatoryTimelineProps) {
  if (!data) {
    return (
      <Card className="border-dashed border-muted-foreground/30">
        <CardContent className="py-8 text-center text-muted-foreground">
          Regulatory timeline not yet defined
        </CardContent>
      </Card>
    );
  }

  const hasMarketTimelines = data.market_timelines && data.market_timelines.length > 0;
  const hasMilestones = data.milestones && data.milestones.length > 0;
  const hasDependencies = data.dependencies && data.dependencies.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Scale className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Regulatory Timeline</h3>
      </div>

      {/* Market Timelines with Scenario Analysis */}
      {hasMarketTimelines && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approval Timeline by Market</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {data.market_timelines.map((timeline, idx) => (
                <div key={idx} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-sm">{timeline.market}</Badge>
                    {timeline.submission_date && (
                      <span className="text-sm text-muted-foreground">
                        Submission: {timeline.submission_date}
                      </span>
                    )}
                  </div>
                  
                  {(timeline.approval_date_best || timeline.approval_date_expected || timeline.approval_date_worst) && (
                    <div className="relative">
                      {/* Timeline bar */}
                      <div className="flex items-center gap-2 text-xs">
                        {timeline.approval_date_best && (
                          <div className="flex-1 text-center">
                            <div className="h-2 bg-emerald-500/30 rounded-l-full" />
                            <p className="mt-1 text-emerald-600 font-medium">{timeline.approval_date_best}</p>
                            <p className="text-muted-foreground">Best Case</p>
                          </div>
                        )}
                        {timeline.approval_date_expected && (
                          <div className="flex-1 text-center">
                            <div className="h-2 bg-primary/50" />
                            <p className="mt-1 text-primary font-medium">{timeline.approval_date_expected}</p>
                            <p className="text-muted-foreground">Expected</p>
                          </div>
                        )}
                        {timeline.approval_date_worst && (
                          <div className="flex-1 text-center">
                            <div className="h-2 bg-amber-500/30 rounded-r-full" />
                            <p className="mt-1 text-amber-600 font-medium">{timeline.approval_date_worst}</p>
                            <p className="text-muted-foreground">Worst Case</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Milestones */}
      {hasMilestones && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Key Regulatory Milestones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.milestones.map((milestone, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${getStatusColor(milestone.status)}`} />
                  <Badge variant="outline" className="w-12 justify-center">{milestone.market}</Badge>
                  <span className="text-sm text-muted-foreground w-24">{milestone.date}</span>
                  <span className="text-sm flex-1">{milestone.milestone}</span>
                  {milestone.status === 'completed' && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  )}
                  {milestone.status === 'in_progress' && (
                    <Clock className="h-4 w-4 text-amber-500" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dependencies & Risks */}
      {hasDependencies && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <CardTitle className="text-sm font-medium text-muted-foreground">Dependencies & Risks</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.dependencies.map((dep, idx) => (
                <div key={idx} className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <p className="font-medium text-sm">{dep.dependency}</p>
                    <Badge variant="outline" className={getImpactColor(dep.impact)}>
                      {dep.impact} impact
                    </Badge>
                  </div>
                  {dep.mitigation && (
                    <p className="text-xs text-muted-foreground mt-2">
                      <span className="font-medium">Mitigation:</span> {dep.mitigation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Benchmark */}
      {(data.similar_device_timeline_months || data.benchmark_notes) && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-medium text-muted-foreground">Industry Benchmark</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {data.similar_device_timeline_months && (
              <p className="text-lg font-semibold mb-2">
                Similar devices: ~{data.similar_device_timeline_months} months to approval
              </p>
            )}
            {data.benchmark_notes && (
              <p className="text-sm text-muted-foreground">{data.benchmark_notes}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
