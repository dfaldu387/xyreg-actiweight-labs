import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface ThreadDocumentPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  threadId: string;
  companyId: string;
}

export function ThreadDocumentPicker({
  open,
  onOpenChange,
  threadId,
  companyId,
}: ThreadDocumentPickerProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [initialized, setInitialized] = useState(false);

  // Fetch all company documents
  const { data: documents } = useQuery({
    queryKey: ['thread-picker-documents', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('phase_assigned_document_template')
        .select('id, name, document_type, tags')
        .eq('company_id', companyId)
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: open && !!companyId,
  });

  // Fetch existing links
  const { data: existingLinks } = useQuery({
    queryKey: ['thread-doc-links', threadId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('thread_document_links')
        .select('document_id')
        .eq('thread_id', threadId);
      if (error) throw error;
      return (data || []).map((d: any) => d.document_id as string);
    },
    enabled: open && !!threadId,
  });

  useEffect(() => {
    if (existingLinks && !initialized) {
      setSelected(new Set(existingLinks));
      setInitialized(true);
    }
  }, [existingLinks, initialized]);

  useEffect(() => {
    if (!open) {
      setInitialized(false);
      setSearch('');
    }
  }, [open]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const currentLinked = new Set<string>(existingLinks || []);
      const toAdd = [...selected].filter(id => !currentLinked.has(id));
      const toRemove = [...currentLinked].filter(id => !selected.has(id));

      if (toRemove.length > 0) {
        const { error } = await (supabase as any)
          .from('thread_document_links')
          .delete()
          .eq('thread_id', threadId)
          .in('document_id', toRemove);
        if (error) throw error;
      }

      if (toAdd.length > 0) {
        const { data: { user } } = await supabase.auth.getUser();
        const rows = toAdd.map(docId => ({
          thread_id: threadId,
          document_id: docId,
          linked_by: user?.id || null,
        }));
        const { error } = await (supabase as any)
          .from('thread_document_links')
          .insert(rows);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thread-doc-links', threadId] });
      toast.success('Document links updated');
      onOpenChange(false);
    },
    onError: () => toast.error('Failed to update document links'),
  });

  const toggle = (docId: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(docId) ? next.delete(docId) : next.add(docId);
      return next;
    });
  };

  const lowerSearch = search.toLowerCase();
  const filtered = documents?.filter(d => {
    if (!lowerSearch) return true;
    const nameMatch = d.name?.toLowerCase().includes(lowerSearch);
    const tagMatch = (d.tags as string[] || []).some(
      (t: string) => t.toLowerCase().includes(lowerSearch)
    );
    return nameMatch || tagMatch;
  }) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base">Link Documents</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or tag..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 min-h-[200px] max-h-[400px]">
          {filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              No documents found.
            </div>
          ) : (
            filtered.map(doc => (
              <label
                key={doc.id}
                className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
              >
                <Checkbox
                  checked={selected.has(doc.id)}
                  onCheckedChange={() => toggle(doc.id)}
                  className="mt-0.5"
                />
                <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm block truncate">{doc.name}</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {doc.document_type && (
                      <Badge variant="outline" className="text-xs">
                        {doc.document_type}
                      </Badge>
                    )}
                    {(doc.tags as string[] || []).slice(0, 3).map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </label>
            ))
          )}
        </div>

        <div className="flex justify-between items-center pt-2 border-t">
          <span className="text-xs text-muted-foreground">{selected.size} selected</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
