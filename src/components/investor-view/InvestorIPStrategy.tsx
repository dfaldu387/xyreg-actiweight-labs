import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, FileText, Lightbulb, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface IPAsset {
  id: string;
  type: string;
  title: string;
  status: string;
  filingDate?: string;
  expiryDate?: string;
  jurisdiction?: string;
}

interface InvestorIPStrategyProps {
  data: {
    assets: IPAsset[];
    ftoStatus: string | null;
    ftoCertainty: string | null;
    ftoNotes: string | null;
  };
}

const typeIcons: Record<string, React.ReactNode> = {
  patent: <FileText className="h-4 w-4" />,
  trademark: <Shield className="h-4 w-4" />,
  trade_secret: <Lightbulb className="h-4 w-4" />,
  copyright: <FileText className="h-4 w-4" />,
};

const statusColors: Record<string, string> = {
  granted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  filed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  draft: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
};

const ftoStatusColors: Record<string, { bg: string; icon: React.ReactNode }> = {
  clear: { bg: 'bg-emerald-500', icon: <CheckCircle className="h-4 w-4" /> },
  likely_clear: { bg: 'bg-emerald-400', icon: <CheckCircle className="h-4 w-4" /> },
  needs_analysis: { bg: 'bg-amber-500', icon: <Clock className="h-4 w-4" /> },
  potential_issue: { bg: 'bg-red-400', icon: <AlertCircle className="h-4 w-4" /> },
  blocked: { bg: 'bg-red-600', icon: <AlertCircle className="h-4 w-4" /> },
};

export function InvestorIPStrategy({ data }: InvestorIPStrategyProps) {
  if (!data || (data.assets.length === 0 && !data.ftoStatus)) return null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch {
      return null;
    }
  };

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        IP Strategy & Freedom to Operate
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* IP Assets */}
        {data.assets.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Intellectual Property Portfolio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.assets.map((asset) => (
                <div key={asset.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    {typeIcons[asset.type] || <FileText className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{asset.title}</span>
                      <Badge className={statusColors[asset.status] || 'bg-muted'}>
                        {asset.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="capitalize">{asset.type.replace('_', ' ')}</span>
                      {asset.jurisdiction && <span>• {asset.jurisdiction}</span>}
                      {formatDate(asset.filingDate) && <span>• Filed {formatDate(asset.filingDate)}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* FTO Assessment */}
        {data.ftoStatus && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Freedom to Operate Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${ftoStatusColors[data.ftoStatus]?.bg || 'bg-muted'}`}>
                  {ftoStatusColors[data.ftoStatus]?.icon || <Shield className="h-5 w-5" />}
                </div>
                <div>
                  <div className="font-medium capitalize">
                    {data.ftoStatus.replace(/_/g, ' ')}
                  </div>
                  {data.ftoCertainty && (
                    <div className="text-sm text-muted-foreground">
                      Certainty: {data.ftoCertainty}
                    </div>
                  )}
                </div>
              </div>
              {data.ftoNotes && (
                <p className="text-sm text-muted-foreground border-t pt-3">
                  {data.ftoNotes}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
