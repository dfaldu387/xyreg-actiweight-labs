import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, AlertTriangle, UserPlus, Award, PieChart } from 'lucide-react';
import { TeamGaps, Competencies } from '@/types/investorModules';

interface InvestorTeamGapsProps {
  data: TeamGaps | null;
}

const COMPETENCY_AREAS = [
  { key: 'regulatory', label: 'Regulatory' },
  { key: 'clinical', label: 'Clinical' },
  { key: 'commercial', label: 'Commercial' },
  { key: 'manufacturing', label: 'Manufacturing' },
  { key: 'quality', label: 'Quality' },
  { key: 'engineering', label: 'Engineering' },
] as const;

function getCompetencyColor(level: string | undefined) {
  switch (level) {
    case 'strong': return 'bg-emerald-500';
    case 'developing': return 'bg-amber-500';
    case 'gap': return 'bg-red-500';
    case 'outsourced': return 'bg-blue-500';
    default: return 'bg-muted';
  }
}

function getCompetencyLabel(level: string | undefined) {
  switch (level) {
    case 'strong': return 'Strong';
    case 'developing': return 'Developing';
    case 'gap': return 'Gap';
    case 'outsourced': return 'Outsourced';
    default: return '—';
  }
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'high': return 'bg-red-500 text-white';
    case 'medium': return 'bg-amber-500 text-white';
    case 'low': return 'bg-blue-500 text-white';
    default: return '';
  }
}

export function InvestorTeamGaps({ data }: InvestorTeamGapsProps) {
  if (!data) {
    return (
      <Card className="border-dashed border-muted-foreground/30">
        <CardContent className="py-8 text-center text-muted-foreground">
          Team gap analysis not yet completed
        </CardContent>
      </Card>
    );
  }

  const competencies = data.competencies as Competencies || {};
  const hasCompetencies = Object.keys(competencies).length > 0;
  const hasCriticalGaps = data.critical_gaps && data.critical_gaps.length > 0;
  const hasHiringRoadmap = data.hiring_roadmap && data.hiring_roadmap.length > 0;
  const hasAdvisors = data.advisors && data.advisors.length > 0;
  const hasFounderAllocation = data.founder_allocation && Object.keys(data.founder_allocation).length > 0;

  const founderAllocation = data.founder_allocation || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Team Gap Analysis</h3>
      </div>

      {/* Competency Matrix */}
      {hasCompetencies && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Team Competency Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {COMPETENCY_AREAS.map(({ key, label }) => {
                const level = competencies[key as keyof Competencies];
                return (
                  <div key={key} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className={`h-4 w-4 rounded-full ${getCompetencyColor(level)}`} />
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{getCompetencyLabel(level)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t text-xs">
              <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-emerald-500" /> Strong</div>
              <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-amber-500" /> Developing</div>
              <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-red-500" /> Gap</div>
              <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-blue-500" /> Outsourced</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Critical Gaps */}
      {hasCriticalGaps && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <CardTitle className="text-sm font-medium text-muted-foreground">Critical Hiring Needs</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.critical_gaps.map((gap, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <UserPlus className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{gap.role}</p>
                      <p className="text-xs text-muted-foreground">Target: {gap.target_hire_date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {gap.budget && (
                      <span className="text-sm text-muted-foreground">
                        ${(gap.budget / 1000).toFixed(0)}K
                      </span>
                    )}
                    <Badge className={getPriorityColor(gap.priority)}>
                      {gap.priority}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hiring Roadmap */}
      {hasHiringRoadmap && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Hiring Roadmap</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.hiring_roadmap.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <Badge variant="outline">{item.phase}</Badge>
                  <div>
                    <p className="font-medium text-sm">{item.role}</p>
                    <p className="text-xs text-muted-foreground">{item.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Advisory Board */}
      {hasAdvisors && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-medium text-muted-foreground">Advisory Board</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.advisors.map((advisor, idx) => (
                <div key={idx} className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-medium text-sm">{advisor.name}</p>
                  <p className="text-xs text-muted-foreground">{advisor.affiliation}</p>
                  <Badge variant="outline" className="mt-2">{advisor.expertise}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Founder Time Allocation */}
      {hasFounderAllocation && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <PieChart className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-medium text-muted-foreground">Founder Time Allocation</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-1 h-6 rounded-full overflow-hidden">
              {founderAllocation.product && founderAllocation.product > 0 && (
                <div className="bg-blue-500" style={{ width: `${founderAllocation.product}%` }} title={`Product: ${founderAllocation.product}%`} />
              )}
              {founderAllocation.fundraising && founderAllocation.fundraising > 0 && (
                <div className="bg-emerald-500" style={{ width: `${founderAllocation.fundraising}%` }} title={`Fundraising: ${founderAllocation.fundraising}%`} />
              )}
              {founderAllocation.operations && founderAllocation.operations > 0 && (
                <div className="bg-purple-500" style={{ width: `${founderAllocation.operations}%` }} title={`Operations: ${founderAllocation.operations}%`} />
              )}
              {founderAllocation.sales && founderAllocation.sales > 0 && (
                <div className="bg-amber-500" style={{ width: `${founderAllocation.sales}%` }} title={`Sales: ${founderAllocation.sales}%`} />
              )}
              {founderAllocation.other && founderAllocation.other > 0 && (
                <div className="bg-gray-500" style={{ width: `${founderAllocation.other}%` }} title={`Other: ${founderAllocation.other}%`} />
              )}
            </div>
            <div className="flex flex-wrap gap-4 mt-3 text-xs">
              {founderAllocation.product !== undefined && founderAllocation.product > 0 && (
                <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-blue-500" /> Product: {founderAllocation.product}%</div>
              )}
              {founderAllocation.fundraising !== undefined && founderAllocation.fundraising > 0 && (
                <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-emerald-500" /> Fundraising: {founderAllocation.fundraising}%</div>
              )}
              {founderAllocation.operations !== undefined && founderAllocation.operations > 0 && (
                <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-purple-500" /> Operations: {founderAllocation.operations}%</div>
              )}
              {founderAllocation.sales !== undefined && founderAllocation.sales > 0 && (
                <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-amber-500" /> Sales: {founderAllocation.sales}%</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
