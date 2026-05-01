import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ListChecks, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { seedGlobalWorkInstructions } from '@/services/seedGlobalWorkInstructionsClient';
import { GLOBAL_WI_CATALOG_TOTAL } from '@/constants/globalWiCatalogSpec';

interface GlobalWIRow {
  id: string;
  sop_template_key: string;
  wi_number: string;
  title: string;
  version: number;
}

/**
 * Embedded WI Catalog management. Rendered as a tab inside the
 * Super Admin Templates page so catalog mutations live next to the
 * regular template list.
 */
export function WICatalogSection() {
  const [rows, setRows] = useState<GlobalWIRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number; key: string } | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('global_work_instructions' as never)
      .select('id, sop_template_key, wi_number, title, version')
      .order('sop_template_key', { ascending: true })
      .order('wi_number', { ascending: true });
    if (error) toast.error(`Failed to load catalog: ${error.message}`);
    setRows(((data ?? []) as unknown) as GlobalWIRow[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, GlobalWIRow[]>();
    for (const r of rows) {
      if (!map.has(r.sop_template_key)) map.set(r.sop_template_key, []);
      map.get(r.sop_template_key)!.push(r);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [rows]);

  const runSeed = async (opts: { sopKeys?: string[]; replace: boolean; label: string }) => {
    if (opts.replace && !confirm(
      `${opts.label}?\n\nThis DELETES existing global WIs ${opts.sopKeys ? `for ${opts.sopKeys.join(', ')}` : ''} and re-creates them with the latest template.\nPer-company materializations are not affected.`,
    )) return;
    setBusy(opts.label);
    setProgress(null);
    try {
      const r = await seedGlobalWorkInstructions({
        sopKeys: opts.sopKeys,
        replace: opts.replace,
        onProgress: (done, total, key) => setProgress({ done, total, key }),
      });
      if (!r.success) {
        toast.error(r.error ?? 'Seeding failed');
        return;
      }
      const totals = Object.values(r.summary ?? {}).reduce(
        (a, s) => ({ inserted: a.inserted + s.inserted, failed: a.failed + s.failed }),
        { inserted: 0, failed: 0 },
      );
      toast.success(`${opts.label}: ${totals.inserted} inserted${totals.failed ? `, ${totals.failed} failed` : ''}`);
      await load();
    } finally {
      setBusy(null);
      setProgress(null);
    }
  };

  const catalogEmpty = rows.length === 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            Catalog status{' '}
            <Badge variant="outline" className="ml-2 font-mono">
              {rows.length} / {GLOBAL_WI_CATALOG_TOTAL}
            </Badge>
          </CardTitle>
          <div className="flex gap-2">
            {catalogEmpty ? (
              <Button
                onClick={() => runSeed({ replace: false, label: 'Generate WI catalog' })}
                disabled={!!busy}
                size="sm"
              >
                {busy === 'Generate WI catalog' ? (
                  <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />Generating…</>
                ) : (
                  <><ListChecks className="h-3.5 w-3.5 mr-2" />Generate WI catalog</>
                )}
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => runSeed({ replace: true, label: 'Regenerate WI catalog' })}
                disabled={!!busy}
                size="sm"
              >
                {busy === 'Regenerate WI catalog' ? (
                  <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />Regenerating…</>
                ) : (
                  <><RefreshCw className="h-3.5 w-3.5 mr-2" />Regenerate all</>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        {progress && (
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Processing {progress.key} — {progress.done}/{progress.total}
            </div>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Catalog ({rows.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading…</div>
          ) : grouped.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Catalog is empty. Click <strong>Generate WI catalog</strong> above.
            </div>
          ) : (
            <div className="space-y-6">
              {grouped.map(([sopKey, items]) => (
                <div key={sopKey}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-sm">
                      {sopKey} <span className="text-muted-foreground">· {items.length} WI{items.length === 1 ? '' : 's'}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!!busy}
                      onClick={() => runSeed({ sopKeys: [sopKey], replace: true, label: `Regenerate ${sopKey}` })}
                    >
                      {busy === `Regenerate ${sopKey}` ? (
                        <><Loader2 className="h-3 w-3 mr-1.5 animate-spin" />Regenerating…</>
                      ) : (
                        <><RefreshCw className="h-3 w-3 mr-1.5" />Regenerate</>
                      )}
                    </Button>
                  </div>
                  <div className="border rounded-md divide-y">
                    {items.map((r) => (
                      <div key={r.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                        <Badge variant="outline" className="font-mono text-xs">{r.wi_number}</Badge>
                        <span className="flex-1 truncate">{r.title}</span>
                        <span className="text-xs text-muted-foreground">v{r.version}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}