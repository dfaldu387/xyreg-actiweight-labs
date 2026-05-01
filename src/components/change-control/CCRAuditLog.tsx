import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';
import { History, Plus, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

type FieldChange = {
  field: string;
  oldValue?: string | null;
  newValue?: string | null;
};

type AuditEntry = {
  id: string;
  action: string;
  created_at: string;
  user_id: string | null;
  changes: FieldChange[] | null;
  user_name?: string;
};

const ACTION_META: Record<string, { label: string; icon: React.ComponentType<any>; tone: string }> = {
  ccr_created: { label: 'Created', icon: Plus, tone: 'bg-green-100 text-green-800 border-green-200' },
  ccr_updated: { label: 'Updated', icon: Pencil, tone: 'bg-blue-100 text-blue-800 border-blue-200' },
  ccr_deleted: { label: 'Deleted', icon: Trash2, tone: 'bg-red-100 text-red-800 border-red-200' },
};

const HIDDEN_UPDATE_FIELDS = new Set([
  // Always change on touch — noisy in the diff list.
  // (created_at/updated_at/id are already excluded server-side.)
]);

function formatFieldName(field: string): string {
  return field
    .replace(/_/g, ' ')
    .replace(/\bid\b/gi, 'ID')
    .replace(/^./, (c) => c.toUpperCase());
}

function truncate(value: string | null | undefined, max = 120): string {
  if (value === null || value === undefined || value === '') return '—';
  const str = String(value);
  return str.length > max ? str.slice(0, max) + '…' : str;
}

interface CCRAuditLogProps {
  ccrId: string;
}

export function CCRAuditLog({ ccrId }: CCRAuditLogProps) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('audit_trail_logs')
        .select('id, action, created_at, user_id, changes')
        .eq('entity_type', 'change_control_request')
        .eq('entity_id', ccrId)
        .order('created_at', { ascending: false });

      if (cancelled) return;
      if (error) {
        console.error('[CCRAuditLog] failed to load audit entries', error);
        setEntries([]);
        setLoading(false);
        return;
      }

      const rows = (data ?? []) as AuditEntry[];
      const userIds = Array.from(new Set(rows.map((r) => r.user_id).filter(Boolean))) as string[];
      let nameById = new Map<string, string>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, first_name, last_name, email')
          .in('id', userIds);
        nameById = new Map(
          (profiles ?? []).map((p: any) => {
            const full = `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim();
            return [p.id, full || p.email || 'Unknown user'];
          }),
        );
      }

      setEntries(
        rows.map((r) => ({ ...r, user_name: r.user_id ? nameById.get(r.user_id) || 'Unknown user' : 'System' })),
      );
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [ccrId]);

  if (loading) return <LoadingSpinner />;

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        No audit entries yet — every create, update, and delete will appear here.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => {
        const meta = ACTION_META[entry.action] ?? {
          label: entry.action,
          icon: History,
          tone: 'bg-muted text-muted-foreground border-border',
        };
        const Icon = meta.icon;
        const visibleChanges =
          entry.action === 'ccr_updated'
            ? (entry.changes ?? []).filter((c) => !HIDDEN_UPDATE_FIELDS.has(c.field))
            : [];

        return (
          <div key={entry.id} className="flex items-start gap-4 pb-4 border-b last:border-0">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={meta.tone}>{meta.label}</Badge>
                {entry.action === 'ccr_updated' && (
                  <span className="text-xs text-muted-foreground">
                    {visibleChanges.length} field{visibleChanges.length === 1 ? '' : 's'} changed
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {entry.user_name} • {format(new Date(entry.created_at), 'MMM d, yyyy HH:mm')}
              </p>

              {entry.action === 'ccr_updated' && visibleChanges.length > 0 && (
                <div className="mt-2 rounded-md border bg-muted/30 divide-y">
                  {visibleChanges.map((change, idx) => (
                    <div key={idx} className="px-3 py-2 text-sm">
                      <div className="font-medium">{formatFieldName(change.field)}</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-1 mt-0.5 text-xs">
                        <div>
                          <span className="text-muted-foreground">From: </span>
                          <span className="line-through opacity-70">{truncate(change.oldValue)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">To: </span>
                          <span>{truncate(change.newValue)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
