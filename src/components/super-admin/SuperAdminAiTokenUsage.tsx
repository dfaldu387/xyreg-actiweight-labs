import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Coins,
  Zap,
  DollarSign,
  Clock,
  Eye,
  Download,
  Settings,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';

// --- Types ---

interface AiTokenRow {
  id: string;
  company_id: string;
  source: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  thinking_tokens: number;
  total_tokens: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface CompanyInfo {
  id: string;
  name: string;
}

interface OrgSummary {
  companyId: string;
  companyName: string;
  totalTokens: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalThinkingTokens: number;
  totalCalls: number;
  estimatedCost: number;
  bySource: Record<string, { tokens: number; inputTokens: number; outputTokens: number; thinkingTokens: number; calls: number }>;
  rows: AiTokenRow[];
}

// --- Helpers ---

// Vertex AI Gemini 2.5 Flash pricing (per 1M tokens)
const INPUT_COST_PER_MILLION = 0.30;
const OUTPUT_COST_PER_MILLION = 2.50; // covers both output + thinking/reasoning

function estimateCost(inputTokens: number, outputTokens: number, thinkingTokens: number): number {
  return (inputTokens / 1_000_000) * INPUT_COST_PER_MILLION
       + ((outputTokens + thinkingTokens) / 1_000_000) * OUTPUT_COST_PER_MILLION;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const SOURCE_LABELS: Record<string, string> = {
  professor_xyreg: 'Professor Xyreg',
  document_ai_assistant: 'Document AI Assistant',
  auto_fill_section: 'Auto-Fill Section',
  ai_suggestion: 'AI Suggestion',
  ai_user_needs: 'User Needs Generator',
  ai_system_requirements: 'System Requirements',
  ai_software_requirements: 'Software Requirements',
  ai_hardware_requirements: 'Hardware Requirements',
  ai_hazard_analysis: 'Hazard Analysis',
  ai_vv_plan: 'V&V Plan',
};

const SOURCE_COLORS: Record<string, string> = {
  professor_xyreg: '#6366f1',
  document_ai_assistant: '#f59e0b',
  auto_fill_section: '#10b981',
  ai_suggestion: '#ec4899',
  ai_user_needs: '#06b6d4',
  ai_system_requirements: '#f97316',
  ai_software_requirements: '#8b5cf6',
  ai_hardware_requirements: '#ef4444',
  ai_hazard_analysis: '#dc2626',
  ai_vv_plan: '#0d9488',
};

const BAR_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe', '#f5f3ff', '#e0e7ff', '#c7d2fe', '#a5b4fc'];

// --- Component ---

export default function SuperAdminAiTokenUsage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<AiTokenRow[]>([]);
  const [companies, setCompanies] = useState<CompanyInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Date range — default to current month
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const [dateFrom, setDateFrom] = useState(formatDate(firstOfMonth));
  const [dateTo, setDateTo] = useState(formatDate(now));

  // Detail modal
  const [detailOrg, setDetailOrg] = useState<OrgSummary | null>(null);
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const [detailSourceFilter, setDetailSourceFilter] = useState<Set<string>>(new Set());

  // --- Fetch data ---
  useEffect(() => {
    loadData();
  }, [dateFrom, dateTo]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [tokenRes, companyRes] = await Promise.all([
        supabase
          .from('ai_token_usage')
          .select('id, company_id, source, model, input_tokens, output_tokens, thinking_tokens, total_tokens, metadata, created_at')
          .gte('created_at', `${dateFrom}T00:00:00Z`)
          .lte('created_at', `${dateTo}T23:59:59Z`)
          .order('created_at', { ascending: false }),
        supabase
          .from('companies')
          .select('id, name')
          .or('is_archived.eq.false,is_archived.is.null')
          .not('name', 'is', null)
          .neq('name', ''),
      ]);

      if (tokenRes.error) throw tokenRes.error;
      if (companyRes.error) throw companyRes.error;

      setRows((tokenRes.data ?? []) as AiTokenRow[]);
      setCompanies((companyRes.data ?? []) as CompanyInfo[]);
    } catch (err) {
      console.error('Error loading AI token usage:', err);
      toast.error('Failed to load AI token usage data');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Derived data ---
  const companyMap = useMemo(() => {
    const m = new Map<string, string>();
    companies.forEach(c => m.set(c.id, c.name));
    return m;
  }, [companies]);

  const orgSummaries = useMemo(() => {
    const map = new Map<string, OrgSummary>();
    rows.forEach(r => {
      let s = map.get(r.company_id);
      if (!s) {
        s = {
          companyId: r.company_id,
          companyName: companyMap.get(r.company_id) || 'Unknown',
          totalTokens: 0,
          totalInputTokens: 0,
          totalOutputTokens: 0,
          totalThinkingTokens: 0,
          totalCalls: 0,
          estimatedCost: 0,
          bySource: {},
          rows: [],
        };
        map.set(r.company_id, s);
      }
      s.totalTokens += r.total_tokens;
      s.totalInputTokens += r.input_tokens;
      s.totalOutputTokens += r.output_tokens;
      s.totalThinkingTokens += r.thinking_tokens;
      s.totalCalls += 1;
      s.estimatedCost = estimateCost(s.totalInputTokens, s.totalOutputTokens, s.totalThinkingTokens);
      s.rows.push(r);
      if (!s.bySource[r.source]) s.bySource[r.source] = { tokens: 0, inputTokens: 0, outputTokens: 0, thinkingTokens: 0, calls: 0 };
      s.bySource[r.source].tokens += r.total_tokens;
      s.bySource[r.source].inputTokens += r.input_tokens;
      s.bySource[r.source].outputTokens += r.output_tokens;
      s.bySource[r.source].thinkingTokens += r.thinking_tokens;
      s.bySource[r.source].calls += 1;
    });
    return Array.from(map.values()).sort((a, b) => b.totalTokens - a.totalTokens);
  }, [rows, companyMap]);

  const totals = useMemo(() => {
    let tokens = 0, inputTokens = 0, outputTokens = 0, thinkingTokens = 0, calls = 0;
    const bySource: Record<string, { tokens: number; inputTokens: number; outputTokens: number; thinkingTokens: number; calls: number }> = {};
    rows.forEach(r => {
      tokens += r.total_tokens;
      inputTokens += r.input_tokens;
      outputTokens += r.output_tokens;
      thinkingTokens += r.thinking_tokens;
      calls += 1;
      if (!bySource[r.source]) bySource[r.source] = { tokens: 0, inputTokens: 0, outputTokens: 0, thinkingTokens: 0, calls: 0 };
      bySource[r.source].tokens += r.total_tokens;
      bySource[r.source].inputTokens += r.input_tokens;
      bySource[r.source].outputTokens += r.output_tokens;
      bySource[r.source].thinkingTokens += r.thinking_tokens;
      bySource[r.source].calls += 1;
    });
    return { tokens, inputTokens, outputTokens, thinkingTokens, calls, cost: estimateCost(inputTokens, outputTokens, thinkingTokens), bySource };
  }, [rows]);

  // Chart data — top 10 orgs
  const chartData = useMemo(() => {
    return orgSummaries.slice(0, 10).map(s => ({
      name: s.companyName.length > 12 ? s.companyName.substring(0, 12) + '...' : s.companyName,
      tokens: s.totalTokens,
    }));
  }, [orgSummaries]);

  // Average latency placeholder (not available from token data, show tokens/call)
  const avgTokensPerCall = totals.calls > 0 ? Math.round(totals.tokens / totals.calls) : 0;

  // --- Export CSV ---
  const handleExportCSV = () => {
    const header = 'Company,Source,Model,Input Tokens,Output Tokens,Thinking Tokens,Total Tokens,Estimated Cost,Date\n';
    const csvRows = rows.map(r => {
      const name = (companyMap.get(r.company_id) || 'Unknown').replace(/,/g, ' ');
      return `${name},${r.source},${r.model},${r.input_tokens},${r.output_tokens},${r.thinking_tokens},${r.total_tokens},${estimateCost(r.input_tokens, r.output_tokens, r.thinking_tokens).toFixed(6)},${r.created_at}`;
    });
    const blob = new Blob([header + csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `xyreg-ai-usage-${dateFrom}-to-${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  // --- Render ---
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-3 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">AI Token Usage</h1>
          <p className="text-sm text-muted-foreground mt-1">Monitor AI usage across all companies</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-sm">
            <Input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="h-9 w-[155px] text-sm"
            />
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <Input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="h-9 w-[155px] text-sm"
            />
          </div>
          <Button size="sm" variant="default" className="gap-1.5" onClick={handleExportCSV}>
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard icon={<Coins className="w-5 h-5 text-primary" />} label="TOTAL TOKENS" value={formatTokens(totals.tokens)} sub={`${totals.tokens.toLocaleString()} tokens`} />
        <SummaryCard icon={<Zap className="w-5 h-5 text-primary" />} label="TOTAL API CALLS" value={totals.calls.toLocaleString()} sub="0 cached" />
        <SummaryCard icon={<DollarSign className="w-5 h-5 text-primary" />} label="ESTIMATED COST" value={`$${totals.cost.toFixed(4)}`} sub="USD" />
        <SummaryCard icon={<Clock className="w-5 h-5 text-primary" />} label="AVG TOKENS/CALL" value={avgTokensPerCall.toLocaleString()} sub={`${avgTokensPerCall.toLocaleString()} tokens/call`} />
      </div>

      {/* Usage by Feature + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Feature breakdown */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Usage by Feature</h2>
              {Object.keys(totals.bySource).length > 3 && (
                <button className="text-xs text-primary underline hover:text-primary/80" onClick={() => setShowAllFeatures(true)}>
                  View All
                </button>
              )}
            </div>
            <div className="space-y-4">
              {Object.entries(totals.bySource).sort((a, b) => b[1].tokens - a[1].tokens).slice(0, 3).map(([source, data]) => {
                const pct = totals.tokens > 0 ? Math.round((data.tokens / totals.tokens) * 100) : 0;
                return (
                  <div key={source}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: SOURCE_COLORS[source] || '#94a3b8' }} />
                      <span className="text-sm font-medium">{SOURCE_LABELS[source] || source}</span>
                    </div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-lg font-bold">{formatTokens(data.tokens)}</span>
                      <span className="text-sm text-muted-foreground">{pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: SOURCE_COLORS[source] || '#94a3b8' }} />
                    </div>
                  </div>
                );
              })}
              {Object.keys(totals.bySource).length === 0 && (
                <p className="text-sm text-muted-foreground">No usage data in selected period</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bar chart */}
        <Card className="lg:col-span-2">
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Company Usage</h2>
            </div>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={formatTokens} />
                  <RechartsTooltip formatter={(value: number) => [value.toLocaleString(), 'Tokens']} />
                  <Bar dataKey="tokens" radius={[4, 4, 0, 0]} maxBarSize={48}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">No data</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Usage by Organization table */}
      <Card>
        <CardContent className="pt-5 pb-2 px-5">
          <h2 className="text-base font-semibold mb-3">Usage by Company</h2>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20 hover:bg-muted/20">
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Company Name</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Total Tokens</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">API Calls</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Estimated Cost</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground text-center">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orgSummaries.map(s => (
                  <TableRow key={s.companyId} className="hover:bg-muted/40">
                    <TableCell className="font-medium text-sm">{s.companyName}</TableCell>
                    <TableCell className="text-sm">{formatTokens(s.totalTokens)}</TableCell>
                    <TableCell className="text-sm">{s.totalCalls.toLocaleString()}</TableCell>
                    <TableCell className="text-sm">${s.estimatedCost.toFixed(4)}</TableCell>
                    <TableCell className="text-center">
                      <button className="text-sm text-primary underline hover:text-primary/80" onClick={() => { setDetailOrg(s); setDetailSourceFilter(new Set()); }}>
                        View
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
                {orgSummaries.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-sm text-muted-foreground">
                      No token usage recorded in this period
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* All Features Dialog */}
      <Dialog open={showAllFeatures} onOpenChange={setShowAllFeatures}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Usage by Feature</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto max-h-[calc(85vh-80px)] pr-1">
            {Object.entries(totals.bySource).sort((a, b) => b[1].tokens - a[1].tokens).map(([source, data]) => {
              const pct = totals.tokens > 0 ? Math.round((data.tokens / totals.tokens) * 100) : 0;
              return (
                <div key={source}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: SOURCE_COLORS[source] || '#94a3b8' }} />
                    <span className="text-sm font-medium">{SOURCE_LABELS[source] || source}</span>
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-lg font-bold">{formatTokens(data.tokens)}</span>
                    <span className="text-sm text-muted-foreground">{pct}%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>{data.calls} calls</span>
                    <span>${estimateCost(data.inputTokens, data.outputTokens, data.thinkingTokens).toFixed(4)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: SOURCE_COLORS[source] || '#94a3b8' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={!!detailOrg} onOpenChange={() => setDetailOrg(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">{detailOrg?.companyName} — Token Usage Detail</DialogTitle>
          </DialogHeader>
          {detailOrg && (
            <div className="space-y-4 max-h-[calc(85vh-80px)] flex flex-col overflow-hidden">
              {/* Source breakdown */}
              <div className="flex gap-3 overflow-x-auto pb-2 shrink-0">
                {Object.entries(detailOrg.bySource).map(([source, data]) => {
                  const isActive = detailSourceFilter.size === 0 || detailSourceFilter.has(source);
                  return (
                    <div
                      key={source}
                      className={`rounded-lg border p-3 min-w-[180px] shrink-0 cursor-pointer transition-all ${isActive ? 'ring-2 ring-primary/50' : 'opacity-40'}`}
                      onClick={() => {
                        setDetailSourceFilter(prev => {
                          const next = new Set(prev);
                          if (next.has(source)) {
                            next.delete(source);
                          } else {
                            next.add(source);
                          }
                          return next;
                        });
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: SOURCE_COLORS[source] || '#94a3b8' }} />
                        <span className="text-sm font-medium whitespace-nowrap">{SOURCE_LABELS[source] || source}</span>
                      </div>
                      <p className="text-lg font-bold">{formatTokens(data.tokens)}</p>
                      <p className="text-xs text-muted-foreground whitespace-nowrap">{data.calls} calls &middot; ${estimateCost(data.inputTokens, data.outputTokens, data.thinkingTokens).toFixed(4)}</p>
                    </div>
                  );
                })}
              </div>

              {/* Individual request log */}
              <div className="border rounded-lg overflow-y-auto flex-1 min-h-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/20 hover:bg-muted/20">
                      <TableHead className="text-xs uppercase">Source</TableHead>
                      <TableHead className="text-xs uppercase">Model</TableHead>
                      <TableHead className="text-xs uppercase">Input</TableHead>
                      <TableHead className="text-xs uppercase">Output</TableHead>
                      <TableHead className="text-xs uppercase">Thinking</TableHead>
                      <TableHead className="text-xs uppercase">Total</TableHead>
                      <TableHead className="text-xs uppercase">Est. Cost</TableHead>
                      <TableHead className="text-xs uppercase">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailOrg.rows.filter(r => detailSourceFilter.size === 0 || detailSourceFilter.has(r.source)).slice(0, 50).map(r => (
                      <TableRow key={r.id}>
                        <TableCell className="text-xs">{SOURCE_LABELS[r.source] || r.source}</TableCell>
                        <TableCell className="text-xs font-mono">{r.model}</TableCell>
                        <TableCell className="text-xs">{r.input_tokens.toLocaleString()}</TableCell>
                        <TableCell className="text-xs">{r.output_tokens.toLocaleString()}</TableCell>
                        <TableCell className="text-xs">{r.thinking_tokens.toLocaleString()}</TableCell>
                        <TableCell className="text-xs font-medium">{r.total_tokens.toLocaleString()}</TableCell>
                        <TableCell className="text-xs">${estimateCost(r.input_tokens, r.output_tokens, r.thinking_tokens).toFixed(4)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {(() => {
                  const filteredCount = detailOrg.rows.filter(r => detailSourceFilter.size === 0 || detailSourceFilter.has(r.source)).length;
                  return filteredCount > 50 ? (
                    <div className="px-4 py-2 text-xs text-muted-foreground border-t">
                      Showing 50 of {filteredCount} requests
                    </div>
                  ) : null;
                })()}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- Summary Card sub-component ---

function SummaryCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3 px-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10">{icon}</div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="text-xl font-bold mt-0.5">{value}</p>
            <p className="text-xs text-muted-foreground">{sub}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
