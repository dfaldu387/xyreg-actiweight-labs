import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, Clock, ShieldAlert } from 'lucide-react';

export interface RiskCategoryCount {
  category: string;
  mitigated: number;
  inProgress: number;
  open: number;
  total: number;
}

export interface TopRisk {
  id: string;
  description: string;
  severity: string;
  severityLevel: number;
  category: string;
  mitigation: string;
  mitigationStatus: 'mitigated' | 'in_progress' | 'open';
}

export interface RiskSummaryData {
  categoryCounts: RiskCategoryCount[];
  topRisks: TopRisk[];
  totalRisks: number;
  mitigatedCount: number;
  openCount: number;
}

interface InvestorRiskSummaryProps {
  data: RiskSummaryData;
}

const severityColors: Record<string, string> = {
  'Catastrophic': 'bg-red-500 text-white',
  'Major': 'bg-orange-500 text-white',
  'Serious': 'bg-amber-500 text-white',
  'Minor': 'bg-yellow-400 text-yellow-900',
  'Negligible': 'bg-green-400 text-green-900',
};

const categoryIcons: Record<string, React.ReactNode> = {
  'Clinical': <ShieldAlert className="h-4 w-4" />,
  'Technical': <AlertTriangle className="h-4 w-4" />,
  'Regulatory': <AlertTriangle className="h-4 w-4" />,
  'Commercial': <AlertTriangle className="h-4 w-4" />,
};

export function InvestorRiskSummary({ data }: InvestorRiskSummaryProps) {
  if (!data || data.totalRisks === 0) {
    return (
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-amber-500" />
          Key Risk Assessment
        </h2>
        <Card className="bg-white dark:bg-slate-900">
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center py-8">
              No risks have been identified yet. Complete the risk assessment in the design controls module to see a summary here.
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }

  // Calculate overall mitigation rate
  const mitigationRate = data.totalRisks > 0
    ? Math.round((data.mitigatedCount / data.totalRisks) * 100)
    : 0;

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
        <AlertTriangle className="h-6 w-6 text-amber-500" />
        Key Risk Assessment
      </h2>

      <Card className="bg-white dark:bg-slate-900">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Risk Overview</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                {data.totalRisks} {data.totalRisks === 1 ? 'Risk' : 'Risks'} Identified
              </Badge>
              <Badge
                variant="secondary"
                className={mitigationRate >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                  mitigationRate >= 50 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}
              >
                {mitigationRate}% Mitigated
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Category Summary Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.categoryCounts.map((cat) => (
              <div
                key={cat.category}
                className="p-4 rounded-lg border bg-muted/30"
              >
                <div className="flex items-center gap-2 mb-2">
                  {categoryIcons[cat.category] || <AlertTriangle className="h-4 w-4" />}
                  <span className="font-medium text-sm">{cat.category}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {cat.mitigated > 0 && (
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                      {cat.mitigated} Mitigated
                    </Badge>
                  )}
                  {cat.inProgress > 0 && (
                    <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">
                      {cat.inProgress} In Progress
                    </Badge>
                  )}
                  {cat.open > 0 && (
                    <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
                      {cat.open} Open
                    </Badge>
                  )}
                  {cat.total === 0 && (
                    <span className="text-xs text-muted-foreground">No risks</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Top Risks List */}
          {data.topRisks.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Top Risks & Mitigations
              </h4>
              <div className="space-y-3">
                {data.topRisks.map((risk, index) => (
                  <div
                    key={risk.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-muted/20"
                  >
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge className={`text-xs ${severityColors[risk.severity] || 'bg-gray-400'}`}>
                          {risk.severity}
                        </Badge>
                        <span className="font-medium text-sm text-foreground">
                          {risk.description}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {risk.mitigationStatus === 'mitigated' ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                            <span>{risk.mitigation || 'Mitigation in place'}</span>
                          </>
                        ) : risk.mitigationStatus === 'in_progress' ? (
                          <>
                            <Clock className="h-3.5 w-3.5 text-amber-500" />
                            <span>{risk.mitigation || 'Mitigation in progress'}</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                            <span>{risk.mitigation || 'Requires mitigation'}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
