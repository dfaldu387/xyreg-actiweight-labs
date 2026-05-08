import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  CCR_STATUS_LABELS,
  CHANGE_TYPE_LABELS,
  CCR_SOURCE_LABELS,
  RISK_IMPACT_LABELS,
} from '@/types/changeControl';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';
import {
  History,
  FilePlus,
  Pencil,
  Trash2,
  CheckCircle2,
  Users,
  ArrowRight,
  ShieldCheck,
  XCircle,
  Calendar as CalendarIcon,
} from 'lucide-react';
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

type Meta = { label: string; icon: React.ComponentType<any>; tone: string; nodeTone: string };

const ACTION_META: Record<string, Meta> = {
  ccr_created: {
    label: 'Created',
    icon: FilePlus,
    tone: 'bg-green-100 text-green-800 border-green-200',
    nodeTone: 'bg-green-100 text-green-700 ring-green-200',
  },
  ccr_updated: {
    label: 'Updated',
    icon: Pencil,
    tone: 'bg-blue-100 text-blue-800 border-blue-200',
    nodeTone: 'bg-blue-100 text-blue-700 ring-blue-200',
  },
  ccr_deleted: {
    label: 'Deleted',
    icon: Trash2,
    tone: 'bg-red-100 text-red-800 border-red-200',
    nodeTone: 'bg-red-100 text-red-700 ring-red-200',
  },
};

// For ccr_updated entries, refine the meta based on which fields changed so
// the timeline conveys *what kind* of update happened at a glance.
function inferUpdateMeta(changes: FieldChange[]): Meta {
  if (changes.length === 0) return ACTION_META.ccr_updated;
  const fields = changes.map((c) => c.field);
  const has = (predicate: (f: string) => boolean) => fields.some(predicate);
  const all = (predicate: (f: string) => boolean) => fields.every(predicate);

  const isApprovalField = (f: string) =>
    f.endsWith('_approved') || f.endsWith('_approved_at') || f.endsWith('_approved_by');
  const isReviewerField = (f: string) => f.endsWith('_reviewer_id');

  if (has((f) => f === 'status')) {
    const statusChange = changes.find((c) => c.field === 'status');
    const toVal = String(statusChange?.newValue ?? '').toLowerCase();
    if (toVal === 'approved') {
      return {
        label: 'Approved',
        icon: ShieldCheck,
        tone: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        nodeTone: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
      };
    }
    if (toVal === 'rejected') {
      return {
        label: 'Rejected',
        icon: XCircle,
        tone: 'bg-red-100 text-red-800 border-red-200',
        nodeTone: 'bg-red-100 text-red-700 ring-red-200',
      };
    }
    if (toVal === 'closed') {
      return {
        label: 'Closed',
        icon: XCircle,
        tone: 'bg-slate-100 text-slate-800 border-slate-200',
        nodeTone: 'bg-slate-100 text-slate-700 ring-slate-200',
      };
    }
    return {
      label: 'Status changed',
      icon: ArrowRight,
      tone: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      nodeTone: 'bg-indigo-100 text-indigo-700 ring-indigo-200',
    };
  }
  if (all(isApprovalField)) {
    return {
      label: 'Approval recorded',
      icon: CheckCircle2,
      tone: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      nodeTone: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
    };
  }
  if (all(isReviewerField)) {
    return {
      label: 'Reviewers assigned',
      icon: Users,
      tone: 'bg-violet-100 text-violet-800 border-violet-200',
      nodeTone: 'bg-violet-100 text-violet-700 ring-violet-200',
    };
  }
  if (all((f) => TIMESTAMP_FIELDS.has(f))) {
    return {
      label: 'Date updated',
      icon: CalendarIcon,
      tone: 'bg-amber-100 text-amber-800 border-amber-200',
      nodeTone: 'bg-amber-100 text-amber-700 ring-amber-200',
    };
  }
  return ACTION_META.ccr_updated;
}

const HIDDEN_UPDATE_FIELDS = new Set([
  // Always change on touch — noisy in the diff list.
  // (created_at/updated_at/id are already excluded server-side.)
]);

// Fields whose values are user UUIDs; render the user's name in the audit log.
const USER_ID_FIELDS = new Set([
  'technical_reviewer_id',
  'quality_reviewer_id',
  'regulatory_reviewer_id',
  'technical_approved_by',
  'quality_approved_by',
  'regulatory_approved_by',
  'owner_id',
  'created_by',
  'updated_by',
]);

// Fields whose values are arrays of document UUIDs; render the document names.
const DOCUMENT_ID_ARRAY_FIELDS = new Set(['affected_documents']);

function parseDocIdArray(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string');
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter((v): v is string => typeof v === 'string');
      }
    } catch {
      // Not JSON; fall through and treat as single id.
    }
    return UUID_RE.test(value) ? [value] : [];
  }
  return [];
}

// Fields whose values are ISO timestamps; render as locale date/time.
const TIMESTAMP_FIELDS = new Set([
  'technical_approved_at',
  'quality_approved_at',
  'regulatory_approved_at',
  'submitted_at',
  'approved_at',
  'rejected_at',
  'closed_at',
  'implemented_date',
  'verified_date',
  'target_implementation_date',
]);

// Fields whose values are booleans; render as Yes/No (or Approved/Pending for *_approved).
const BOOLEAN_FIELDS = new Set([
  'technical_approved',
  'quality_approved',
  'regulatory_approved',
  'regulatory_impact',
]);

// Fields whose values are enum strings; render the human label instead of the
// raw underscore-separated database value (`under_review` → `Under Review`).
const ENUM_LABELS: Record<string, Record<string, string>> = {
  status: CCR_STATUS_LABELS as Record<string, string>,
  change_type: CHANGE_TYPE_LABELS as Record<string, string>,
  source_type: CCR_SOURCE_LABELS as Record<string, string>,
  risk_impact: RISK_IMPACT_LABELS as Record<string, string>,
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}([T\s]\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/;

function formatFieldName(field: string): string {
  return field
    .replace(/_/g, ' ')
    .replace(/\bid\b/gi, '')
    .replace(/^./, (c) => c.toUpperCase());
}

function truncate(value: string | null | undefined, max = 120): string {
  if (value === null || value === undefined || value === '') return '—';
  const str = String(value);
  return str.length > max ? str.slice(0, max) + '…' : str;
}

function formatTimestamp(value: string): string {
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return format(d, 'MMM d, yyyy HH:mm');
  } catch {
    return value;
  }
}

function formatBoolean(field: string, value: any): string {
  const truthy = value === true || value === 'true';
  if (field.endsWith('_approved')) return truthy ? 'Approved' : 'Pending';
  return truthy ? 'Yes' : 'No';
}

interface CCRAuditLogProps {
  ccrId: string;
}

export function CCRAuditLog({ ccrId }: CCRAuditLogProps) {
  // Use react-query so the audit log auto-refetches when callers
  // invalidate ['ccr-audit-log'] (e.g. after CCR transitions / updates).
  const { data: entries = [], isLoading: loading } = useQuery({
    queryKey: ['ccr-audit-log', ccrId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_trail_logs')
        .select('id, action, created_at, user_id, changes')
        .eq('entity_type', 'change_control_request')
        .eq('entity_id', ccrId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[CCRAuditLog] failed to load audit entries', error);
        return [] as AuditEntry[];
      }

      const rows = (data ?? []) as AuditEntry[];
      const idsToResolve = new Set<string>();
      const docIdsToResolve = new Set<string>();
      try {
        rows.forEach((r) => {
          if (r.user_id) idsToResolve.add(r.user_id);
          if (!Array.isArray(r.changes)) return;
          r.changes.forEach((c) => {
            if (!c) return;
            if (USER_ID_FIELDS.has(c.field)) {
              [c.oldValue, c.newValue].forEach((v) => {
                if (typeof v === 'string' && UUID_RE.test(v)) idsToResolve.add(v);
              });
            }
            if (DOCUMENT_ID_ARRAY_FIELDS.has(c.field)) {
              [c.oldValue, c.newValue].forEach((v) => {
                parseDocIdArray(v).forEach((id) => docIdsToResolve.add(id));
              });
            }
          });
        });
      } catch (e) {
        console.error('[CCRAuditLog] failed to scan audit changes for user IDs', e);
      }

      let nameById = new Map<string, string>();
      if (idsToResolve.size > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('user_profiles')
          .select('id, first_name, last_name, email')
          .in('id', Array.from(idsToResolve));
        if (profilesError) {
          console.error('[CCRAuditLog] failed to load user profiles', profilesError);
        }
        nameById = new Map(
          (profiles ?? []).map((p: any) => {
            const full = `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim();
            return [p.id, full || p.email || 'Unknown user'];
          }),
        );
      }

      let docNameById = new Map<string, string>();
      if (docIdsToResolve.size > 0) {
        const { data: docs, error: docsError } = await supabase
          .from('phase_assigned_document_template')
          .select('id, name, document_reference, document_number')
          .in('id', Array.from(docIdsToResolve));
        if (docsError) {
          console.error('[CCRAuditLog] failed to load document names', docsError);
        }
        docNameById = new Map(
          (docs ?? []).map((d: any) => {
            const ref = d.document_reference || d.document_number || '';
            const name = d.name || 'Untitled document';
            return [d.id, ref ? `${ref} ${name}`.trim() : name];
          }),
        );
      }

      const resolveValue = (field: string, value: any) => {
        if (value === null || value === undefined || value === '') return value;
        if (USER_ID_FIELDS.has(field)) {
          if (typeof value === 'string' && UUID_RE.test(value)) {
            return nameById.get(value) ?? value;
          }
          return value;
        }
        if (DOCUMENT_ID_ARRAY_FIELDS.has(field)) {
          const ids = parseDocIdArray(value);
          if (ids.length === 0) return value;
          return ids.map((id) => docNameById.get(id) ?? id).join(', ');
        }
        if (BOOLEAN_FIELDS.has(field) || typeof value === 'boolean') {
          return formatBoolean(field, value);
        }
        if (TIMESTAMP_FIELDS.has(field) && typeof value === 'string' && ISO_DATE_RE.test(value)) {
          return formatTimestamp(value);
        }
        const enumMap = ENUM_LABELS[field];
        if (enumMap && typeof value === 'string' && enumMap[value]) {
          return enumMap[value];
        }
        return value;
      };

      return rows.map((r) => ({
        ...r,
        user_name: r.user_id ? nameById.get(r.user_id) || 'Unknown user' : 'System',
        changes: Array.isArray(r.changes)
          ? r.changes.map((c) => ({
              ...c,
              oldValue: resolveValue(c.field, c.oldValue),
              newValue: resolveValue(c.field, c.newValue),
            }))
          : r.changes,
      })) as AuditEntry[];
    },
    enabled: !!ccrId,
  });

  if (loading) return <LoadingSpinner />;

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        No audit entries yet — every create, update, and delete will appear here.
      </p>
    );
  }

  return (
    <ol className="space-y-2">
      {entries.map((entry) => {
        const baseMeta: Meta = ACTION_META[entry.action] ?? {
          label: entry.action,
          icon: History,
          tone: 'bg-muted text-muted-foreground border-border',
          nodeTone: 'bg-muted text-muted-foreground ring-border',
        };
        const visibleChanges =
          entry.action === 'ccr_updated'
            ? (entry.changes ?? []).filter((c) => !HIDDEN_UPDATE_FIELDS.has(c.field))
            : [];
        const meta =
          entry.action === 'ccr_updated' ? inferUpdateMeta(visibleChanges) : baseMeta;
        const Icon = meta.icon;
        const isApprovalRow = meta.label === 'Approval recorded';

        return (
          <li
            key={entry.id}
            className="rounded-lg border bg-card hover:bg-muted/30 transition-colors px-3 py-2.5"
          >
            <div className="flex items-start gap-3">
              <div
                className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center ${meta.nodeTone}`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                {/* Top row: badge + actor inline on the left, timestamp on right */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge variant="outline" className={`${meta.tone} shrink-0`}>
                      {meta.label}
                    </Badge>
                    <span className="text-sm font-medium text-foreground truncate">
                      {entry.user_name}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                    {format(new Date(entry.created_at), 'MMM d, yyyy · HH:mm')}
                  </span>
                </div>

                {/* Detail body: change summary */}
                {entry.action === 'ccr_updated' && visibleChanges.length > 0 && (
                  <div className="mt-1.5">
                    {isApprovalRow ? (
                      <ApprovalSummary changes={visibleChanges} />
                    ) : (
                      <ul className="space-y-0.5 text-sm">
                        {visibleChanges.map((change, idx) => {
                          const hasOld =
                            change.oldValue !== null &&
                            change.oldValue !== undefined &&
                            change.oldValue !== '';
                          return (
                            <li
                              key={idx}
                              className="flex items-baseline gap-2 leading-snug"
                            >
                              <span className="font-medium text-foreground/70 shrink-0 text-xs uppercase tracking-wide">
                                {formatFieldName(change.field)}
                              </span>
                              <span className="text-muted-foreground break-words text-sm">
                                {hasOld && (
                                  <>
                                    <span className="line-through opacity-60">
                                      {truncate(change.oldValue, 60)}
                                    </span>
                                    <span className="mx-1.5 text-muted-foreground/60">→</span>
                                  </>
                                )}
                                <span className="text-foreground font-medium">
                                  {truncate(change.newValue, 80)}
                                </span>
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

const GATE_LABELS: Record<string, string> = {
  technical: 'Technical',
  quality: 'Quality',
  regulatory: 'Regulatory',
};

function ApprovalSummary({ changes }: { changes: FieldChange[] }) {
  // Group changes by gate prefix (technical / quality / regulatory).
  const gates = new Map<string, { approved?: any; approvedAt?: any; approvedBy?: any }>();
  for (const c of changes) {
    const m = c.field.match(/^(technical|quality|regulatory)_(approved|approved_at|approved_by)$/);
    if (!m) continue;
    const gate = m[1];
    const kind = m[2] as 'approved' | 'approved_at' | 'approved_by';
    const entry = gates.get(gate) ?? {};
    if (kind === 'approved') entry.approved = c.newValue;
    if (kind === 'approved_at') entry.approvedAt = c.newValue;
    if (kind === 'approved_by') entry.approvedBy = c.newValue;
    gates.set(gate, entry);
  }
  if (gates.size === 0) return null;

  return (
    <div className="mt-1 text-sm text-muted-foreground">
      {Array.from(gates.entries()).map(([gate, info]) => {
        const isRevoked =
          info.approved === 'Pending' || info.approved === false || info.approved === 'false';
        const label = GATE_LABELS[gate] ?? gate;
        const verb = isRevoked ? 'revoked' : 'approved';
        const tone = isRevoked ? 'text-amber-700' : 'text-emerald-700';
        return (
          <div key={gate} className="flex items-baseline gap-1.5">
            <span className={`font-medium ${tone}`}>{label}</span>
            <span>
              {verb}
              {!isRevoked && info.approvedBy ? ` by ${info.approvedBy}` : ''}
            </span>
          </div>
        );
      })}
    </div>
  );
}
