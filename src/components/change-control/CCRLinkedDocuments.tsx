import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, X, ExternalLink } from 'lucide-react';
import { fetchLinkedDocs, type LinkedCCRDoc } from '@/services/ccrLinkedDocsService';
import { CCRDocumentPicker } from './CCRDocumentPicker';
import { useUpdateCCR } from '@/hooks/useChangeControlData';
import type { ChangeControlRequest } from '@/types/changeControl';
import { splitDocPrefix } from '@/utils/templateNameUtils';
import { formatSopDisplayId } from '@/constants/sopAutoSeedTiers';
import { DocumentDraftDrawer } from '@/components/product/documents/DocumentDraftDrawer';
import { supabase } from '@/integrations/supabase/client';

interface CCRLinkedDocumentsProps {
  ccr: ChangeControlRequest;
  onVisibleCountChange?: (count: number) => void;
}

const EDITABLE_STATUSES = new Set(['draft', 'under_review']);

export function CCRLinkedDocuments({ ccr, onVisibleCountChange }: CCRLinkedDocumentsProps) {
  const editable = EDITABLE_STATUSES.has(ccr.status);
  const linkedIds = useMemo(
    () => (Array.isArray(ccr.affected_documents) ? ccr.affected_documents : []),
    [ccr.affected_documents]
  );

  const [pickerOpen, setPickerOpen] = useState(false);
  const updateCCR = useUpdateCCR();
  type OpenDoc = { id: string; name: string; type: string };
  const [openDocs, setOpenDocs] = useState<OpenDoc[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const selectedDoc = openDocs.find(d => d.id === activeDocId) || null;

  const openDoc = (doc: OpenDoc) => {
    setOpenDocs(prev => (prev.some(d => d.id === doc.id) ? prev : [...prev, doc]));
    setActiveDocId(doc.id);
  };
  const closeDoc = (id: string) => {
    setOpenDocs(prev => {
      const next = prev.filter(d => d.id !== id);
      if (activeDocId === id) {
        setActiveDocId(next.length ? next[next.length - 1].id : null);
      }
      return next;
    });
  };

  // Keep doc-reference clicks inside this CCR drawer instead of letting
  // LiveEditor fall through to a hard navigation that opens Document Control.
  useEffect(() => {
    const handler = (e: Event) => {
      if (!selectedDoc) return;
      const detail = (e as CustomEvent).detail || {};
      const { docId, docName } = detail as { docId?: string; docName?: string };
      if (!docId && !docName) return;
      // Cancel synchronously so LiveEditor's dispatchEvent returns false
      // and skips its navigate(url) fallback to Document Control.
      e.preventDefault();
      void (async () => {
        try {
        let row: { id: string; name: string | null; document_type: string | null } | null = null;
        if (docId) {
          const { data } = await supabase
            .from('phase_assigned_document_template')
            .select('id, name, document_type')
            .eq('id', docId)
            .maybeSingle();
          row = data as any;
        }
        if (!row && docName) {
          const { data } = await supabase
            .from('phase_assigned_document_template')
            .select('id, name, document_type')
            .eq('company_id', ccr.company_id)
            .ilike('name', `%${docName}%`)
            .limit(1)
            .maybeSingle();
          row = data as any;
        }
        if (row) {
          openDoc({
            id: row.id,
            name: row.name || docName || 'Document',
            type: row.document_type || 'document',
          });
        }
        } catch { /* keep current doc open */ }
      })();
    };
    window.addEventListener('xyreg:openDocumentDraft', handler as EventListener);
    return () => window.removeEventListener('xyreg:openDocumentDraft', handler as EventListener);
  }, [selectedDoc, ccr.company_id]);

  const { data: rawDocs = [], isLoading } = useQuery({
    queryKey: ['ccr-linked-docs', ccr.id, linkedIds.join(',')],
    queryFn: () => fetchLinkedDocs(linkedIds),
    enabled: linkedIds.length > 0,
  });

  // Resolve a clean reference badge (avoid raw DS-<uuid> placeholders)
  // and a title without redundant prefix.
  const decorate = (d: LinkedCCRDoc) => {
    const ref = d.document_reference || '';
    const isPlaceholder = ref && /^DS-[0-9a-f-]{8,}/i.test(ref);
    const rawRef = d.document_number || (isPlaceholder ? '' : ref) || '';
    // Enforce 3-part Xyreg numbering (TYPE-SUBPREFIX-NUMBER) for SOPs
    const displayRef = /^SOP-\d{3}$/i.test(rawRef)
      ? formatSopDisplayId(rawRef.toUpperCase())
      : rawRef;
    const { title } = splitDocPrefix(d.name || '');
    const displayTitle = title || d.name || 'Untitled';
    return { displayRef, displayTitle };
  };

  // De-duplicate rows that share the same reference (e.g. two CIs both
  // numbered SOP-030). Keep the most recently updated one.
  const docs = useMemo(() => {
    const decorated = rawDocs.map((d) => ({ doc: d, ...decorate(d) }));
    const byRef = new Map<string, typeof decorated[number]>();
    const noRef: typeof decorated = [];
    for (const item of decorated) {
      const key = item.displayRef.trim().toLowerCase();
      if (!key) {
        noRef.push(item);
        continue;
      }
      const existing = byRef.get(key);
      if (
        !existing ||
        new Date(item.doc.updated_at ?? 0).getTime() >
          new Date(existing.doc.updated_at ?? 0).getTime()
      ) {
        byRef.set(key, item);
      }
    }
    return [...byRef.values(), ...noRef];
  }, [rawDocs]);

  // Backfill: ensure every currently-linked doc carries this CCR's ref.
  useEffect(() => {
    if (!linkedIds.length || !ccr.ccr_id) return;
    (async () => {
      try {
        await supabase
          .from('phase_assigned_document_template')
          .update({ change_control_ref: ccr.ccr_id })
          .in('id', linkedIds)
          .or(`change_control_ref.is.null,change_control_ref.neq.${ccr.ccr_id}`);
      } catch (e) {
        console.error('CCR ref backfill failed', e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ccr.ccr_id, linkedIds.join(',')]);

  useEffect(() => {
    if (!onVisibleCountChange) return;
    if (linkedIds.length === 0) {
      onVisibleCountChange(0);
    } else if (!isLoading) {
      onVisibleCountChange(docs.length);
    }
  }, [docs.length, isLoading, linkedIds.length, onVisibleCountChange]);

  // Stamp / clear the CCR reference on each compliance instance so the
  // SOP header's "Change Control Ref." auto-fills for every linked doc.
  const stampCCRRefOnDocs = async (docIds: string[], ref: string | null) => {
    if (!docIds.length) return;
    try {
      if (ref === null) {
        // Only clear when the doc still points at THIS CCR
        await supabase
          .from('phase_assigned_document_template')
          .update({ change_control_ref: null })
          .in('id', docIds)
          .eq('change_control_ref', ccr.ccr_id);
      } else {
        await supabase
          .from('phase_assigned_document_template')
          .update({ change_control_ref: ref })
          .in('id', docIds);
      }
    } catch (e) {
      console.error('Failed to sync change_control_ref on linked docs', e);
    }
  };

  const handleConnect = (newIds: string[]) => {
    if (!newIds.length) return;
    const merged = Array.from(new Set([...linkedIds, ...newIds]));
    updateCCR.mutate(
      { id: ccr.id, affected_documents: merged },
      { onSuccess: () => stampCCRRefOnDocs(newIds, ccr.ccr_id) },
    );
  };

  const handleUnlink = (docId: string) => {
    const next = linkedIds.filter((id) => id !== docId);
    updateCCR.mutate(
      { id: ccr.id, affected_documents: next },
      { onSuccess: () => stampCCRRefOnDocs([docId], null) },
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Connected Documents
          <Badge variant="secondary" className="ml-2">
            {isLoading ? linkedIds.length : docs.length}
          </Badge>
        </CardTitle>
        {editable && (
          <Button size="sm" onClick={() => setPickerOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Connect documents
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {linkedIds.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No documents connected yet. Use “Connect documents” to link the SOPs, design files,
            specs or other documents this change affects.
          </p>
        ) : isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="divide-y border rounded-md">
            {docs.map(({ doc: d, displayRef, displayTitle }) => (
              <div
                key={d.id}
                className="flex items-center gap-3 p-3 hover:bg-muted/40 cursor-pointer group"
                onClick={() =>
                  openDoc({
                    id: d.id,
                    name: displayTitle,
                    type: d.document_type || 'document',
                  })
                }
              >
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {displayRef && (
                      <Badge variant="outline" className="text-xs font-mono">
                        {displayRef}
                      </Badge>
                    )}
                    <span className="text-sm font-medium truncate">{displayTitle}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {d.document_type || 'Document'}
                    {d.updated_at ? ` · updated ${new Date(d.updated_at).toLocaleDateString()}` : ''}
                  </p>
                </div>
                {d.status && (
                  <Badge variant="secondary" className="text-xs capitalize">
                    {d.status.replace(/_/g, ' ')}
                  </Badge>
                )}
                <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
                {editable && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnlink(d.id);
                    }}
                    aria-label="Unlink document"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <CCRDocumentPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        companyId={ccr.company_id}
        alreadyLinkedIds={linkedIds}
        onConfirm={handleConnect}
      />

      <DocumentDraftDrawer
        open={!!selectedDoc}
        onOpenChange={(open) => { if (!open) { setOpenDocs([]); setActiveDocId(null); } }}
        documentId={selectedDoc?.id || ''}
        documentName={selectedDoc?.name || ''}
        documentType={selectedDoc?.type || ''}
        companyId={ccr.company_id}
        tabs={openDocs.map(d => ({ id: d.id, name: d.name }))}
        activeTabId={activeDocId || undefined}
        onSelectTab={(id) => setActiveDocId(id)}
        onCloseTab={(id) => closeDoc(id)}
      />
    </Card>
  );
}