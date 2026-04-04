import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Target, Building2, TrendingUp, Calendar, ArrowRight } from 'lucide-react';

interface Acquirer {
  id: string;
  name: string;
  type: 'strategic' | 'private_equity' | 'other';
  rationale: string;
  acquisition_history?: string;
}

interface ComparableTransaction {
  id: string;
  target_company: string;
  acquirer: string;
  date: string;
  deal_value?: string;
  multiple_type?: 'revenue' | 'ebitda';
  multiple_value?: number;
}

interface ExitStrategyData {
  potential_acquirers: Acquirer[];
  comparable_transactions: ComparableTransaction[];
  strategic_rationale: string | null;
  exit_timeline_years: number | null;
  preferred_exit_type: string | null;
  selected_endgame: string | null;
  endgame_metrics_focus: string | null;
}

interface InvestorExitStrategyProps {
  data: ExitStrategyData;
}

const ENDGAME_LABELS: Record<string, { label: string; description: string; color: string }> = {
  trade_sale: { 
    label: 'Trade Sale', 
    description: 'Acquisition by a strategic buyer',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
  },
  independent: { 
    label: 'Independent', 
    description: 'Build a standalone company',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
  },
  ipo: { 
    label: 'IPO', 
    description: 'Public market listing',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
  },
  licensing: { 
    label: 'Licensing', 
    description: 'License technology to partners',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
  },
  private_equity: { 
    label: 'Private Equity', 
    description: 'Financial sponsor acquisition',
    color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
  },
};

const ACQUIRER_TYPE_LABELS: Record<string, string> = {
  strategic: 'Strategic',
  private_equity: 'PE/VC',
  other: 'Other',
};

export function InvestorExitStrategy({ data }: InvestorExitStrategyProps) {
  const hasContent = data.selected_endgame || 
    data.strategic_rationale ||
    (data.potential_acquirers && data.potential_acquirers.length > 0) ||
    (data.comparable_transactions && data.comparable_transactions.length > 0);

  if (!hasContent) {
    return null;
  }

  const endgameConfig = data.selected_endgame ? ENDGAME_LABELS[data.selected_endgame] : null;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
          <Target className="h-5 w-5 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Exit Strategy & Valuations</h2>
          <p className="text-sm text-muted-foreground">Path to liquidity for investors</p>
        </div>
      </div>

      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <CardContent className="pt-6">
          {/* Endgame & Timeline Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {endgameConfig && (
              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                <p className="text-xs text-muted-foreground mb-2">Strategic Endgame</p>
                <Badge className={`${endgameConfig.color} text-sm px-3 py-1`}>
                  {endgameConfig.label}
                </Badge>
                <p className="text-xs text-muted-foreground mt-2">{endgameConfig.description}</p>
              </div>
            )}
            
            {data.exit_timeline_years && (
              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                <p className="text-xs text-muted-foreground mb-2">Target Timeline</p>
                <div className="flex items-center justify-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-lg font-semibold">{data.exit_timeline_years} years</span>
                </div>
              </div>
            )}

            {data.endgame_metrics_focus && (
              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                <p className="text-xs text-muted-foreground mb-2">Key Metrics Focus</p>
                <p className="text-sm font-medium">{data.endgame_metrics_focus}</p>
              </div>
            )}
          </div>

          {/* Strategic Rationale */}
          {data.strategic_rationale && (
            <div className="mb-6 p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-sm font-semibold mb-2">Strategic Rationale</h3>
              <p className="text-sm text-muted-foreground">{data.strategic_rationale}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Potential Acquirers */}
            {data.potential_acquirers && data.potential_acquirers.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  Potential Acquirers
                </h3>
                <div className="space-y-2">
                  {data.potential_acquirers.map((acquirer) => (
                    <div
                      key={acquirer.id}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{acquirer.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {ACQUIRER_TYPE_LABELS[acquirer.type] || acquirer.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{acquirer.rationale}</p>
                      {acquirer.acquisition_history && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          History: {acquirer.acquisition_history}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comparable Transactions */}
            {data.comparable_transactions && data.comparable_transactions.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  Comparable Transactions
                </h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                        <TableHead className="text-xs">Target</TableHead>
                        <TableHead className="text-xs">Acquirer</TableHead>
                        <TableHead className="text-xs text-right">Value</TableHead>
                        <TableHead className="text-xs text-right">Multiple</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.comparable_transactions.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell className="text-sm font-medium">
                            {tx.target_company}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <ArrowRight className="h-3 w-3" />
                              {tx.acquirer}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-right">
                            {tx.deal_value || '—'}
                          </TableCell>
                          <TableCell className="text-sm text-right">
                            {tx.multiple_value ? (
                              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                                {tx.multiple_value}x {tx.multiple_type?.toUpperCase() || ''}
                              </span>
                            ) : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
