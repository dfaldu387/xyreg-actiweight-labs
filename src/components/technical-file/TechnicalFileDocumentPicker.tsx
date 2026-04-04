import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface TechnicalFileDocumentPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  sectionId: string;
  sectionLabel: string;
}

export function TechnicalFileDocumentPicker({
  open,
  onOpenChange,
  productId,
  sectionId,
  sectionLabel,
}: TechnicalFileDocumentPickerProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [initialized, setInitialized] = useState(false);

  // Fetch all product documents from phase_assigned_document_template
  const { data: documents } = useQuery({
    queryKey: ['tf-picker-documents', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('phase_assigned_document_template')
        .select('id, name, document_type, status')
        .eq('product_id', productId)
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  // Fetch existing links for this section
  const { data: existingLinks } = useQuery({
    queryKey: ['tf-doc-links', productId, sectionId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('technical_file_document_links')
        .select('document_id')
        .eq('product_id', productId)
        .eq('section_id', sectionId);
      if (error) throw error;
      return (data || []).map((d: any) => d.document_id as string);
    },
    enabled: open,
  });

  // Initialize selected state from existing links
  React.useEffect(() => {
    if (existingLinks && !initialized) {
      setSelected(new Set(existingLinks));
      setInitialized(true);
    }
  }, [existingLinks, initialized]);

  // Reset when dialog closes
  React.useEffect(() => {
    if (!open) setInitialized(false);
  }, [open]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const currentLinked = new Set<string>(existingLinks || []);
      const toAdd = [...selected].filter(id => !currentLinked.has(id));
      const toRemove = [...currentLinked].filter(id => !selected.has(id));

      if (toRemove.length > 0) {
        const { error } = await (supabase as any)
          .from('technical_file_document_links')
          .delete()
          .eq('product_id', productId)
          .eq('section_id', sectionId)
          .in('document_id', toRemove as string[]);
        if (error) throw error;
      }

      if (toAdd.length > 0) {
        const rows = toAdd.map(docId => ({
          product_id: productId,
          section_id: sectionId,
          document_id: docId,
        }));
        const { error } = await (supabase as any)
          .from('technical_file_document_links')
          .insert(rows);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tf-doc-links', productId, sectionId] });
      queryClient.invalidateQueries({ queryKey: ['tf-section-documents'] });
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

  const filtered = documents?.filter(d =>
    d.name?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base">Link Documents to {sectionLabel}</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 min-h-[200px] max-h-[400px]">
          {filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              No documents found for this product.
            </div>
          ) : (
            filtered.map(doc => (
              <label
                key={doc.id}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
              >
                <Checkbox
                  checked={selected.has(doc.id)}
                  onCheckedChange={() => toggle(doc.id)}
                />
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm flex-1 truncate">{doc.name}</span>
                {doc.document_type && (
                  <Badge variant="outline" className="text-xs shrink-0">
                    {doc.document_type}
                  </Badge>
                )}
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
