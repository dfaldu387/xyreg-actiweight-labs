import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { FileText, Link2, Plus, X, ChevronDown, Search, Check, ExternalLink, Sparkles } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { CreateDocFromGapDialog, type GapContext } from './CreateDocFromGapDialog';
import { autoLinkToTechnicalFile } from '@/utils/technicalFileAutoLink';

interface ClauseEvidencePanelProps {
  itemId: string;
  productId?: string;
  companyId?: string;
  gapContext?: GapContext;
  /** Whether evidence is required (true=*, false=optional, undefined=no indicator) */
  evidenceRequired?: boolean;
}

export function ClauseEvidencePanel({ itemId, productId, companyId, gapContext, evidenceRequired }: ClauseEvidencePanelProps) {
  const [open, setOpen] = useState(true);
  const [docDialogOpen, setDocDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch linked document IDs
  const { data: linkedDocIds = [] } = useQuery({
    queryKey: ['clause-evidence-doc-links', itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gap_document_links')
        .select('document_id')
        .eq('gap_item_id', itemId);
      if (error) throw error;
      return data.map(l => l.document_id);
    },
    enabled: !!itemId,
  });

  // Fetch linked document details
  const { data: linkedDocs = [] } = useQuery({
    queryKey: ['clause-evidence-linked-docs', itemId, linkedDocIds.length],
    queryFn: async () => {
      if (linkedDocIds.length === 0) return [];
      const { data, error } = await supabase
        .from('company_template_documents_by_phase')
        .select('id, name, status, document_type')
        .in('id', linkedDocIds);
      if (error) throw error;
      return data || [];
    },
    enabled: linkedDocIds.length > 0,
  });

  // Fetch evidence URLs
  const { data: evidenceUrls = [] } = useQuery({
    queryKey: ['clause-evidence-urls', itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gap_analysis_items')
        .select('evidence_links')
        .eq('id', itemId)
        .single();
      if (error) throw error;
      const links = Array.isArray(data?.evidence_links) ? data.evidence_links : [];
      return links.filter((l: any) => typeof l === 'string' && l.startsWith('http')).map(String);
    },
    enabled: !!itemId,
  });

  // Fetch all available CI documents for picker
  const { data: availableDocs = [] } = useQuery({
    queryKey: ['clause-evidence-available-docs', productId, companyId],
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

  const toggleDocLink = async (docId: string) => {
    setIsLinking(true);
    try {
      const isLinked = linkedDocIds.includes(docId);
      if (isLinked) {
        const { error } = await supabase
          .from('gap_document_links')
          .delete()
          .eq('gap_item_id', itemId)
          .eq('document_id', docId);
        if (error) throw error;
        toast.success('Document unlinked');
      } else {
        const { error } = await supabase
          .from('gap_document_links')
          .insert({
            gap_item_id: itemId,
            document_id: docId,
            ...(user?.id && { user_id: user.id }),
          });
        if (error) throw error;
        toast.success('Document linked');
        // Auto-link to Technical File (best-effort)
        autoLinkToTechnicalFile(itemId, docId, productId).then(() =>
          queryClient.invalidateQueries({ queryKey: ['technical-file-doc-links'] })
        );
      }
      await queryClient.invalidateQueries({ queryKey: ['clause-evidence-doc-links', itemId] });
      await queryClient.invalidateQueries({ queryKey: ['clause-evidence-linked-docs', itemId] });
      await queryClient.invalidateQueries({ queryKey: ['gap-ci-counts', itemId] });
    } catch (e: any) {
      toast.error('Failed to update link');
    } finally {
      setIsLinking(false);
    }
  };

  const addUrl = async () => {
    if (!urlInput.trim()) return;
    try {
      const { data } = await supabase
        .from('gap_analysis_items')
        .select('evidence_links')
        .eq('id', itemId)
        .single();
      const current = Array.isArray(data?.evidence_links) ? data.evidence_links : [];
      const { error } = await supabase
        .from('gap_analysis_items')
        .update({ evidence_links: [...current, urlInput.trim()] })
        .eq('id', itemId);
      if (error) throw error;
      setUrlInput('');
      setShowUrlInput(false);
      await queryClient.invalidateQueries({ queryKey: ['clause-evidence-urls', itemId] });
      toast.success('URL added');
    } catch {
      toast.error('Failed to add URL');
    }
  };

  const removeUrl = async (url: string) => {
    try {
      const { data } = await supabase
        .from('gap_analysis_items')
        .select('evidence_links')
        .eq('id', itemId)
        .single();
      const current = Array.isArray(data?.evidence_links) ? data.evidence_links : [];
      const updated = current.filter((l: any) => l !== url);
      const { error } = await supabase
        .from('gap_analysis_items')
        .update({ evidence_links: updated })
        .eq('id', itemId);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ['clause-evidence-urls', itemId] });
      toast.success('URL removed');
    } catch {
      toast.error('Failed to remove URL');
    }
  };

  const totalEvidence = linkedDocs.length + evidenceUrls.length;

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'approved' || s === 'completed') return 'bg-emerald-500/10 text-emerald-700 border-emerald-200';
    if (s === 'in review' || s === 'in progress') return 'bg-amber-500/10 text-amber-700 border-amber-200';
    return 'bg-muted text-muted-foreground';
  };

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen} className="rounded-lg border border-border mb-6">
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/30 transition-colors">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Evidence & References
              {evidenceRequired === true && <span className="text-destructive ml-0.5">*</span>}
              {evidenceRequired === false && <span className="text-muted-foreground font-normal normal-case tracking-normal ml-1.5 text-[10px]">(optional — filling all fields above is sufficient documentation)</span>}
            </h4>
            {totalEvidence > 0 && (
              <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                {totalEvidence}
              </Badge>
            )}
          </div>
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
        </CollapsibleTrigger>

        <CollapsibleContent className="px-4 pb-4 space-y-3">
          {/* Linked Documents */}
          {linkedDocs.length > 0 && (
            <div className="space-y-1.5">
              {linkedDocs.map(doc => (
                <div key={doc.id} className="flex items-center gap-2 text-sm py-1.5 px-2 rounded bg-muted/30">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="flex-1 truncate text-foreground">{doc.name}</span>
                  <Badge variant="outline" className={cn("text-[10px] h-5", getStatusColor(doc.status))}>
                    {doc.status}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => toggleDocLink(doc.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* URLs */}
          {evidenceUrls.length > 0 && (
            <div className="space-y-1.5">
              {evidenceUrls.map((url, i) => (
                <div key={i} className="flex items-center gap-2 text-sm py-1.5 px-2 rounded bg-muted/30">
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <a href={url} target="_blank" rel="noopener noreferrer" className="flex-1 truncate text-primary hover:underline text-xs">
                    {url}
                  </a>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeUrl(url)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* URL inline input */}
          {showUrlInput && (
            <div className="flex items-center gap-2">
              <Input
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                placeholder="https://..."
                className="text-sm h-8 flex-1"
                onKeyDown={e => e.key === 'Enter' && addUrl()}
              />
              <Button size="sm" className="h-8" onClick={addUrl}>Add</Button>
              <Button size="sm" variant="ghost" className="h-8" onClick={() => { setShowUrlInput(false); setUrlInput(''); }}>
                Cancel
              </Button>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-1">
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={() => setDocDialogOpen(true)}>
              <FileText className="h-3 w-3" />
              Link CI Document
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={() => setShowUrlInput(true)} disabled={showUrlInput}>
              <Link2 className="h-3 w-3" />
              Add URL
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* CI Document Picker Dialog */}
      <Dialog open={docDialogOpen} onOpenChange={setDocDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-base">Link CI Document</DialogTitle>
          </DialogHeader>

          {gapContext && (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1.5 text-xs mb-2 border-dashed border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/30"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setDocDialogOpen(false);
                setTimeout(() => setCreateDialogOpen(true), 150);
              }}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Create & Draft with AI
            </Button>
          )}

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search documents..."
              className="pl-9 text-sm h-9"
            />
          </div>

          <ScrollArea className="flex-1 min-h-0 max-h-[60vh] -mx-2 overflow-y-auto">
            <div className="px-2 space-y-0.5">
              {filteredDocs.length === 0 ? (
                <p className="text-sm text-muted-foreground italic py-4 text-center">No documents found</p>
              ) : (
                filteredDocs.map(doc => {
                  const isLinked = linkedDocIds.includes(doc.id);
                  return (
                    <button
                      key={doc.id}
                      onClick={() => toggleDocLink(doc.id)}
                      disabled={isLinking}
                      className={cn(
                        "w-full flex items-center gap-2.5 p-2.5 rounded-md text-left transition-colors",
                        isLinked ? "bg-primary/5 border border-primary/20" : "hover:bg-muted/50"
                      )}
                    >
                      <div className={cn(
                        "h-5 w-5 rounded border flex items-center justify-center flex-shrink-0",
                        isLinked ? "bg-primary border-primary text-primary-foreground" : "border-border"
                      )}>
                        {isLinked && <Check className="h-3 w-3" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {doc.document_type && (
                            <span className="text-[10px] text-muted-foreground">{doc.document_type}</span>
                          )}
                          {doc.phase_name && (
                            <span className="text-[10px] text-muted-foreground">• {doc.phase_name}</span>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className={cn("text-[10px] h-5 flex-shrink-0", getStatusColor(doc.status))}>
                        {doc.status}
                      </Badge>
                    </button>
                  );
                })
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
          onCreated={async (docId) => {
            // Auto-link the new doc
            try {
              await supabase.from('gap_document_links').insert({
                gap_item_id: itemId,
                document_id: docId,
                ...(user?.id && { user_id: user.id }),
              });
              await queryClient.invalidateQueries({ queryKey: ['clause-evidence-doc-links', itemId] });
              await queryClient.invalidateQueries({ queryKey: ['clause-evidence-linked-docs', itemId] });
              // Auto-link to Technical File (best-effort)
              autoLinkToTechnicalFile(itemId, docId, productId).then(() =>
                queryClient.invalidateQueries({ queryKey: ['technical-file-doc-links'] })
              );
            } catch (e) {
              console.error('Auto-link failed:', e);
            }
          }}
        />
      )}
    </>
  );
}
