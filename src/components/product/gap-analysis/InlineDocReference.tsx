import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Link2, Plus, X, Search, Check, ExternalLink, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { CreateDocFromGapDialog, type GapContext } from './CreateDocFromGapDialog';

export interface DocReferenceValue {
  documents?: string[];
  urls?: string[];
  comment?: string;
  documentStatuses?: Record<string, string>;
}

interface InlineDocReferenceProps {
  label: string;
  value: DocReferenceValue;
  onChange: (value: DocReferenceValue) => void;
  productId?: string;
  companyId?: string;
  gapContext?: GapContext;
  required?: boolean;
}

export function InlineDocReference({ label, value, onChange, productId, companyId, gapContext, required }: InlineDocReferenceProps) {
  const [docDialogOpen, setDocDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const docs = value?.documents || [];
  const urls = value?.urls || [];
  const comment = value?.comment || '';

  // Fetch linked doc details
  const { data: linkedDocs = [] } = useQuery({
    queryKey: ['inline-doc-ref-details', docs],
    queryFn: async () => {
      if (docs.length === 0) return [];
      const { data, error } = await supabase
        .from('company_template_documents_by_phase')
        .select('id, name, status, document_type')
        .in('id', docs);
      if (error) throw error;
      return data || [];
    },
    enabled: docs.length > 0,
  });

  // Sync document statuses into the value so isStepComplete can check approval
  useEffect(() => {
    if (linkedDocs.length === 0) return;
    const statuses: Record<string, string> = {};
    linkedDocs.forEach(d => { statuses[d.id] = d.status || 'Not Started'; });
    const current = value?.documentStatuses;
    if (JSON.stringify(statuses) !== JSON.stringify(current)) {
      onChange({ ...value, documentStatuses: statuses });
    }
  }, [linkedDocs]);

  // Fetch available CI documents for picker
  const { data: availableDocs = [] } = useQuery({
    queryKey: ['inline-doc-ref-available', productId, companyId],
    queryFn: async () => {
      let query = supabase
        .from('company_template_documents_by_phase')
        .select('id, name, status, document_type, phase_name')
        .order('name');
      if (companyId) {
        query = query.eq('company_id', companyId);
        if (productId) {
          query = query.or(`product_id.eq.${productId},product_id.is.null`);
        }
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: docDialogOpen && (!!productId || !!companyId),
  });

  const filteredDocs = availableDocs.filter(d =>
    d.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleDoc = (docId: string) => {
    const isLinked = docs.includes(docId);
    const newDocs = isLinked ? docs.filter(id => id !== docId) : [...docs, docId];
    onChange({ ...value, documents: newDocs });
  };

  const removeDoc = (docId: string) => {
    const newStatuses = { ...value?.documentStatuses };
    delete newStatuses[docId];
    onChange({ ...value, documents: docs.filter(id => id !== docId), documentStatuses: newStatuses });
  };

  const addUrl = () => {
    if (!urlInput.trim()) return;
    onChange({ ...value, urls: [...urls, urlInput.trim()] });
    setUrlInput('');
    setShowUrlInput(false);
  };

  const removeUrl = (url: string) => {
    onChange({ ...value, urls: urls.filter(u => u !== url) });
  };

  const updateComment = (c: string) => {
    onChange({ ...value, comment: c });
  };

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'approved' || s === 'completed') return 'bg-emerald-500/10 text-emerald-700 border-emerald-200';
    if (s === 'in review' || s === 'in progress') return 'bg-amber-500/10 text-amber-700 border-amber-200';
    if (s === 'not started' || s === 'draft') return 'bg-destructive/10 text-destructive border-destructive/30';
    return 'bg-muted text-muted-foreground';
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {label}
        {required === true && <span className="text-destructive ml-0.5">*</span>}
        {required === false && <span className="text-muted-foreground text-xs ml-1">(optional)</span>}
      </Label>
      <div className="rounded-md border border-border bg-card p-3 space-y-2">
        {/* Linked documents */}
        {linkedDocs.map(doc => (
          <div key={doc.id} className="flex items-center gap-2 text-sm">
            <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span className="truncate flex-1">{doc.name}</span>
            {doc.status && (
              <Badge variant="outline" className={cn('text-[9px] h-4 px-1', getStatusColor(doc.status))}>
                {doc.status}
              </Badge>
            )}
            <button type="button" onClick={() => removeDoc(doc.id)} className="text-muted-foreground hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {/* URLs */}
        {urls.map((url, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <Link2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <a href={url} target="_blank" rel="noopener noreferrer" className="truncate flex-1 text-primary hover:underline">
              {url}
            </a>
            <button type="button" onClick={() => removeUrl(url)} className="text-muted-foreground hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {/* URL input */}
        {showUrlInput && (
          <div className="flex items-center gap-2">
            <Input
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              placeholder="https://..."
              className="h-7 text-xs"
              onKeyDown={e => e.key === 'Enter' && addUrl()}
            />
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={addUrl}>Add</Button>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => { setShowUrlInput(false); setUrlInput(''); }}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Section / comment */}
        <Input
          value={comment}
          onChange={e => updateComment(e.target.value)}
          placeholder="Section reference, e.g. Section 4.2"
          className="h-7 text-xs"
        />

        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-1">
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setDocDialogOpen(true)}>
            <FileText className="h-3 w-3" /> Link CI Document
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setShowUrlInput(true)}>
            <Link2 className="h-3 w-3" /> Add URL
          </Button>
        </div>
      </div>

      {/* Document picker dialog */}
      <Dialog open={docDialogOpen} onOpenChange={setDocDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Link CI Document</DialogTitle>
          </DialogHeader>
          {gapContext && (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1.5 text-xs mb-2 border-dashed border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/30"
              onClick={() => { setDocDialogOpen(false); setCreateDialogOpen(true); }}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Create & Draft with AI
            </Button>
          )}
          <div className="relative mb-2">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search documents..."
              className="pl-8 h-8 text-xs"
            />
          </div>
          <ScrollArea className="h-64">
            <div className="space-y-1">
              {filteredDocs.map(doc => {
                const isLinked = docs.includes(doc.id);
                return (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => toggleDoc(doc.id)}
                    className={cn(
                      'w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-left hover:bg-muted/50 transition-colors',
                      isLinked && 'bg-primary/5'
                    )}
                  >
                    <div className={cn(
                      'h-4 w-4 rounded border flex items-center justify-center flex-shrink-0',
                      isLinked ? 'bg-primary border-primary text-primary-foreground' : 'border-border'
                    )}>
                      {isLinked && <Check className="h-3 w-3" />}
                    </div>
                    <span className="truncate flex-1">{doc.name}</span>
                    {doc.status && (
                      <Badge variant="outline" className={cn('text-[9px] h-4 px-1', getStatusColor(doc.status))}>
                        {doc.status}
                      </Badge>
                    )}
                  </button>
                );
              })}
              {filteredDocs.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No documents found</p>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Create Doc From Gap Dialog */}
      {gapContext && (
        <CreateDocFromGapDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          gapContext={gapContext}
          productId={productId}
          companyId={companyId}
          onCreated={(docId) => {
            onChange({ ...value, documents: [...docs, docId] });
          }}
        />
      )}
    </div>
  );
}
