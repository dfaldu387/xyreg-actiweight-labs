import React, { useState, useEffect, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Link2, X, Search, Loader2, Tag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface LinkedDoc {
  id: string;
  name: string;
  documentType?: string;
  tags?: string[];
}

interface ValidationEvidenceLinkerProps {
  linkedDocIds: string[];
  onLinkDoc: (docId: string) => void;
  onUnlinkDoc: (docId: string) => void;
  freeTextNotes: string;
  onNotesChange: (notes: string) => void;
  companyId: string;
  disabled?: boolean;
}

export function ValidationEvidenceLinker({
  linkedDocIds,
  onLinkDoc,
  onUnlinkDoc,
  freeTextNotes,
  onNotesChange,
  companyId,
  disabled = false,
}: ValidationEvidenceLinkerProps) {
  const [linkedDocs, setLinkedDocs] = useState<LinkedDoc[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableDocs, setAvailableDocs] = useState<LinkedDoc[]>([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [loadingLinked, setLoadingLinked] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Fetch names for already-linked doc IDs
  useEffect(() => {
    if (linkedDocIds.length === 0) {
      setLinkedDocs([]);
      return;
    }
    setLoadingLinked(true);
    supabase
      .from('phase_assigned_document_template')
      .select('id, name')
      .in('id', linkedDocIds)
      .then(({ data }) => {
        setLinkedDocs((data || []).map(d => ({ id: d.id, name: d.name })));
        setLoadingLinked(false);
      });
  }, [linkedDocIds]);

  // Fetch available docs when picker opens — deduplicate by name
  useEffect(() => {
    if (!pickerOpen || !companyId) return;
    setLoadingAvailable(true);
    supabase
      .from('phase_assigned_document_template')
      .select('id, name, document_type, tags')
      .eq('company_id', companyId)
      .order('name')
      .then(({ data }) => {
        const seen = new Map<string, LinkedDoc>();
        for (const d of data || []) {
          if (!seen.has(d.name)) {
            const rawTags = Array.isArray(d.tags) ? d.tags as string[] : [];
            seen.set(d.name, {
              id: d.id,
              name: d.name,
              documentType: d.document_type || undefined,
              tags: rawTags,
            });
          }
        }
        setAvailableDocs(Array.from(seen.values()));
        setLoadingAvailable(false);
      });
  }, [pickerOpen, companyId]);

  // Reset tag filter when picker closes
  useEffect(() => {
    if (!pickerOpen) setSelectedTags([]);
  }, [pickerOpen]);

  // Extract unique tags from available docs
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    availableDocs.forEach(d => d.tags?.forEach(t => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [availableDocs]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const filteredDocs = availableDocs.filter(d => {
    if (linkedDocIds.includes(d.id)) return false;
    if (searchQuery && !d.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (selectedTags.length > 0 && !selectedTags.some(t => d.tags?.includes(t))) return false;
    return true;
  });

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium flex items-center gap-1.5">
        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
        Evidence & Document References
      </Label>

      {/* Linked documents */}
      {linkedDocs.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {linkedDocs.map(doc => (
            <Badge
              key={doc.id}
              variant="secondary"
              className="text-xs flex items-center gap-1 pr-1"
            >
              <FileText className="h-3 w-3 shrink-0" />
              <span className="truncate max-w-[180px]">{doc.name}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => onUnlinkDoc(doc.id)}
                  className="ml-0.5 hover:text-destructive transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}
      {loadingLinked && linkedDocIds.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Loading linked documents...
        </div>
      )}

      {/* Link document button */}
      {!disabled && (
        <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1.5">
              <Link2 className="h-3.5 w-3.5" />
              Link Doc CI
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-sm">Link Document CI as Evidence</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search documents..."
                  className="pl-8 h-8 text-sm"
                />
              </div>

              {/* Tag filter */}
              {allTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 items-center">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  {allTags.map(tag => (
                    <Badge
                      key={tag}
                      variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                      className="text-xs cursor-pointer select-none"
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <ScrollArea className="h-[280px]">
                {loadingAvailable ? (
                  <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading...
                  </div>
                ) : filteredDocs.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    {searchQuery || selectedTags.length > 0 ? 'No matching documents found' : 'No documents available'}
                  </p>
                ) : (
                  <div className="space-y-1">
                    {filteredDocs.map(doc => (
                      <button
                        key={doc.id}
                        type="button"
                        onClick={() => {
                          onLinkDoc(doc.id);
                          setPickerOpen(false);
                          setSearchQuery('');
                        }}
                        className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted/50 transition-colors"
                      >
                        <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">{doc.name}</span>
                        {doc.documentType && (
                          <span className="ml-auto text-xs text-muted-foreground shrink-0">
                            {doc.documentType}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Free-text notes */}
      <Textarea
        value={freeTextNotes}
        onChange={e => onNotesChange(e.target.value)}
        placeholder="Additional evidence notes, external references, or manual document citations..."
        rows={2}
        disabled={disabled}
        className="resize-none"
      />
    </div>
  );
}