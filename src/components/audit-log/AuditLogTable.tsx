
import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { getActionTypeConfig } from '@/utils/auditLogUtils';
import { AuditLogEmptyState } from './AuditLogEmptyState';
import { useTranslation } from '@/hooks/useTranslation';
import type { UnifiedAuditTrailEntry, FieldChange, AuditCategory } from '@/types/auditTrail';
import { AUDIT_CATEGORY_COLORS } from '@/types/auditTrail';
import { supabase } from '@/integrations/supabase/client';

const CATEGORY_LABEL_KEYS: Record<AuditCategory, string> = {
  document_record: 'auditLog.categories.documentsAndRecords',
  e_signature: 'auditLog.categories.eSignatures',
  user_access_security: 'auditLog.categories.userAccessAndSecurity',
  quality_process: 'auditLog.categories.qualityProcesses',
};

/**
 * Resolves IDs to names at display time. Falls back to stored name if entity was deleted.
 */
function ResolvedValue({ ids, storedValue, resolveFrom }: { ids?: string[]; storedValue?: string; resolveFrom?: string }) {
  const [resolved, setResolved] = useState<string | null>(null);

  useEffect(() => {
    if (!ids || ids.length === 0 || !resolveFrom) { setResolved(null); return; }

    let cancelled = false;
    (async () => {
      try {
        let names: string[] = [];
        if (resolveFrom === 'document_authors') {
          // Authors can be in user_company_access→user_profiles, user_invitations, or document_authors
          const resolved: Record<string, string> = {};
          const { data: companyUsers } = await supabase.from('user_company_access').select('user_id, user_profiles!inner(id, first_name, last_name, email)').in('user_id', ids);
          (companyUsers || []).forEach((u: any) => { const p = u.user_profiles; if (p) resolved[u.user_id] = `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.email || ''; });
          const remaining = ids.filter(id => !resolved[id]);
          if (remaining.length > 0) {
            const { data: invitations } = await supabase.from('user_invitations').select('id, first_name, last_name, email').in('id', remaining);
            (invitations || []).forEach(inv => { resolved[inv.id] = `${inv.first_name || ''} ${inv.last_name || ''}`.trim() || inv.email || ''; });
          }
          const still = ids.filter(id => !resolved[id]);
          if (still.length > 0) {
            const { data: docAuthors } = await supabase.from('document_authors').select('id, name, last_name').in('id', still);
            (docAuthors || []).forEach(a => { resolved[a.id] = `${a.name || ''} ${a.last_name || ''}`.trim(); });
          }
          names = ids.map(id => resolved[id]).filter(Boolean);
        } else if (resolveFrom === 'reviewer_groups') {
          const { data } = await supabase.from('reviewer_groups').select('id, name').in('id', ids);
          names = (data || []).map(r => r.name || '');
        } else if (resolveFrom === 'reference_documents') {
          const { data } = await supabase.from('reference_documents').select('id, file_name').in('id', ids);
          names = (data || []).map(r => r.file_name || '');
        } else if (resolveFrom === 'company_phases') {
          const { data } = await supabase.from('company_phases').select('id, name').in('id', ids);
          names = (data || []).map(r => r.name || '');
        }
        if (!cancelled) {
          const result = names.filter(Boolean).join(', ');
          setResolved(result || null);
        }
      } catch {
        // Fall back to stored value
      }
    })();
    return () => { cancelled = true; };
  }, [ids, resolveFrom]);

  return <>{resolved ?? storedValue ?? '(empty)'}</>;
}

/** Render a change value — resolve from IDs if available, otherwise use stored string */
function ChangeValue({ change, side }: { change: FieldChange; side: 'old' | 'new' }) {
  const ids = side === 'old' ? change.oldIds : change.newIds;
  const stored = side === 'old' ? change.oldValue : change.newValue;
  if (ids && ids.length > 0 && change.resolveFrom) {
    return <ResolvedValue ids={ids} storedValue={stored} resolveFrom={change.resolveFrom} />;
  }
  return <>{stored || '(empty)'}</>;
}

interface AuditLogTableProps {
  entries: UnifiedAuditTrailEntry[];
  isLoading?: boolean;
}

const formatTimestamp = (timestamp: string) => {
  const d = new Date(timestamp);
  const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return { date, time };
};

export function AuditLogTable({ entries, isLoading = false }: AuditLogTableProps) {
  const { lang } = useTranslation();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-muted-foreground">{lang('auditLog.table.loading')}</span>
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return <AuditLogEmptyState filterCount={0} totalCount={0} />;
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>{lang('auditLog.table.category')}</TableHead>
              <TableHead>{lang('auditLog.table.action')}</TableHead>
              <TableHead>{lang('auditLog.table.entity')}</TableHead>
              <TableHead>{lang('auditLog.table.who')}</TableHead>
              <TableHead>{lang('auditLog.table.when')}</TableHead>
              <TableHead>{lang('auditLog.table.why')}</TableHead>
              <TableHead>{lang('auditLog.table.ipAddress')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => {
              const actionConfig = getActionTypeConfig(entry.action);
              const { date, time } = formatTimestamp(entry.timestamp);
              const hasChanges = entry.changes && entry.changes.length > 0;
              const isExpanded = expandedRows.has(entry.id);
              const categoryColor = AUDIT_CATEGORY_COLORS[entry.category] || '';
              const categoryLabel = CATEGORY_LABEL_KEYS[entry.category] ? lang(CATEGORY_LABEL_KEYS[entry.category]) : entry.category;

              return (
                <React.Fragment key={entry.id}>
                  <TableRow
                    className={`hover:bg-muted/50 transition-colors duration-200 ${hasChanges ? 'cursor-pointer' : ''}`}
                    onClick={() => hasChanges && toggleRow(entry.id)}
                  >
                    <TableCell className="w-8 px-2">
                      {hasChanges && (
                        isExpanded
                          ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${categoryColor}`}>
                        {categoryLabel}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${actionConfig.bgColor}`}></div>
                        <span className="text-sm font-medium">{entry.action}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium">{entry.entityName}</div>
                        <div className="text-xs text-muted-foreground">{entry.entityType}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium">{entry.userName}</div>
                        <div className="text-xs text-muted-foreground">{entry.userEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="text-sm">{date}</div>
                        <div className="text-xs text-muted-foreground">{time}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground max-w-[200px] truncate" title={entry.reason}>
                        {entry.reason || '—'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-mono text-muted-foreground">
                        {entry.ipAddress || '—'}
                      </div>
                    </TableCell>
                  </TableRow>
                  {/* Expanded changes row */}
                  {isExpanded && hasChanges && (
                    <TableRow className="bg-muted/30">
                      <TableCell colSpan={8} className="py-3 px-8">
                        <div className="space-y-2">
                          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{lang('auditLog.table.changes')}</div>
                          <div className="grid gap-1">
                            {entry.changes!.map((change, i) => (
                              <div key={i} className="flex items-baseline gap-3 text-sm whitespace-nowrap overflow-hidden">
                                <span className="font-medium min-w-[180px] shrink-0">{change.field}</span>
                                <span className="text-red-600 line-through truncate max-w-[200px]" title={change.oldValue}><ChangeValue change={change} side="old" /></span>
                                <span className="text-muted-foreground shrink-0">&rarr;</span>
                                <span className="text-green-600 truncate max-w-[200px]" title={change.newValue}><ChangeValue change={change} side="new" /></span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {entries.map((entry) => {
          const actionConfig = getActionTypeConfig(entry.action);
          const { date, time } = formatTimestamp(entry.timestamp);
          const categoryColor = AUDIT_CATEGORY_COLORS[entry.category] || '';
          const categoryLabel = CATEGORY_LABEL_KEYS[entry.category] ? lang(CATEGORY_LABEL_KEYS[entry.category]) : entry.category;
          const hasChanges = entry.changes && entry.changes.length > 0;
          const isExpanded = expandedRows.has(entry.id);

          return (
            <div
              key={entry.id}
              className="bg-card border rounded-lg p-4 space-y-3 hover:bg-muted/30 transition-colors duration-200"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${actionConfig.bgColor}`}></div>
                  <span className="font-medium text-sm">{entry.action}</span>
                </div>
                <Badge variant="outline" className={`text-xs ${categoryColor}`}>
                  {categoryLabel}
                </Badge>
              </div>

              {/* Entity */}
              <div>
                <div className="text-sm font-medium">{entry.entityName}</div>
                <div className="text-xs text-muted-foreground">{entry.entityType}</div>
              </div>

              {/* Reason */}
              {entry.reason && (
                <div className="text-sm text-muted-foreground italic">
                  {lang('auditLog.table.why')}: {entry.reason}
                </div>
              )}

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t text-xs text-muted-foreground">
                <div>
                  <div className="font-medium">{lang('auditLog.table.who')}</div>
                  <div>{entry.userName}</div>
                  <div>{entry.userEmail}</div>
                </div>
                <div>
                  <div className="font-medium">{lang('auditLog.table.when')}</div>
                  <div>{date} {time}</div>
                </div>
                <div className="col-span-2">
                  <div className="font-medium">{lang('auditLog.table.ipAddress')}</div>
                  <div className="font-mono">{entry.ipAddress || '—'}</div>
                </div>
              </div>

              {/* Changes */}
              {hasChanges && (
                <div
                  className="pt-2 border-t cursor-pointer"
                  onClick={() => toggleRow(entry.id)}
                >
                  <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                    {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    {lang('auditLog.table.fieldChanges', { count: entry.changes!.length })}
                  </div>
                  {isExpanded && (
                    <div className="mt-2 space-y-1">
                      {entry.changes!.map((change, i) => (
                        <div key={i} className="flex items-baseline gap-2 text-xs whitespace-nowrap overflow-hidden">
                          <span className="font-medium min-w-[120px] shrink-0">{change.field}</span>
                          <span className="text-red-600 line-through truncate max-w-[120px]" title={change.oldValue}><ChangeValue change={change} side="old" /></span>
                          <span className="text-muted-foreground shrink-0">→</span>
                          <span className="text-green-600 truncate max-w-[120px]" title={change.newValue}><ChangeValue change={change} side="new" /></span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
