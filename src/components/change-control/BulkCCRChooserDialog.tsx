import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Link2, Search, FileText } from 'lucide-react';
import { useCCRsByCompany, useUpdateCCR } from '@/hooks/useChangeControlData';
import { CCR_STATUS_LABELS, CCR_STATUS_COLORS, type CCRWithRelations } from '@/types/changeControl';
import { toast } from '@/hooks/use-toast';

interface BulkCCRChooserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  documentIds: string[];
  documentCount: number;
  onCreateNew: () => void;
  onAttached?: () => void;
}

export function BulkCCRChooserDialog({
  open,
  onOpenChange,
  companyId,
  documentIds,
  documentCount,
  onCreateNew,
  onAttached,
}: BulkCCRChooserDialogProps) {
  const [search, setSearch] = useState('');
  const [selectedCcrId, setSelectedCcrId] = useState<string | null>(null);

  const { data: ccrs = [], isLoading } = useCCRsByCompany(companyId);
  const updateCcr = useUpdateCCR();

  const openCcrs = useMemo(() => {
    return ccrs.filter(
      c => c.status !== 'closed' && c.status !== 'rejected'
    );
  }, [ccrs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return openCcrs;
    return openCcrs.filter(
      c =>
        c.ccr_id.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q)
    );
  }, [openCcrs, search]);

  const selected = useMemo(
    () => openCcrs.find(c => c.id === selectedCcrId) || null,
    [openCcrs, selectedCcrId]
  );

  const handleAttach = async () => {
    if (!selected) return;
    const existing = Array.isArray(selected.affected_documents) ? selected.affected_documents : [];
    const merged = Array.from(new Set([...existing, ...documentIds]));
    try {
      await updateCcr.mutateAsync({
        id: selected.id,
        affected_documents: merged,
      });
      toast({
        title: 'Documents attached',
        description: `${documentCount} document(s) added to ${selected.ccr_id}.`,
      });
      onAttached?.();
      onOpenChange(false);
      setSelectedCcrId(null);
      setSearch('');
    } catch (e) {
      // useUpdateCCR already toasts on error
    }
  };

  const handleCreate = () => {
    onOpenChange(false);
    setSelectedCcrId(null);
    setSearch('');
    onCreateNew();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Add {documentCount} document{documentCount === 1 ? '' : 's'} to a Change Request</DialogTitle>
          <DialogDescription>
            Attach the selected document{documentCount === 1 ? '' : 's'} to an existing open CCR, or create a new one.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="existing" className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing" className="gap-2">
              <Link2 className="h-4 w-4" /> Attach to existing
            </TabsTrigger>
            <TabsTrigger value="new" className="gap-2">
              <Plus className="h-4 w-4" /> Create new
            </TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="space-y-3 mt-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by CCR ID or title…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <ScrollArea className="h-[280px] border rounded-md">
              {isLoading ? (
                <div className="p-4 text-sm text-muted-foreground">Loading CCRs…</div>
              ) : filtered.length === 0 ? (
                <div className="p-6 text-sm text-muted-foreground text-center">
                  {openCcrs.length === 0
                    ? 'No open Change Requests available. Create a new one instead.'
                    : 'No CCRs match your search.'}
                </div>
              ) : (
                <div className="divide-y">
                  {filtered.map((ccr) => {
                    const isSelected = ccr.id === selectedCcrId;
                    return (
                      <button
                        key={ccr.id}
                        type="button"
                        onClick={() => setSelectedCcrId(ccr.id)}
                        className={`w-full text-left p-3 hover:bg-muted/50 transition-colors flex items-start gap-3 ${
                          isSelected ? 'bg-muted' : ''
                        }`}
                      >
                        <FileText className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-medium">{ccr.ccr_id}</span>
                            <Badge variant="outline" className="text-xs">
                              {CCR_STATUS_LABELS[ccr.status]}
                            </Badge>
                          </div>
                          <p className="text-sm mt-1 truncate">{ccr.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {Array.isArray(ccr.affected_documents) ? ccr.affected_documents.length : 0} document(s) currently affected
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAttach}
                disabled={!selected || updateCcr.isPending}
              >
                {selected ? `Attach to ${selected.ccr_id}` : 'Select a CCR'}
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="new" className="space-y-3 mt-4">
            <div className="border rounded-md p-6 text-center space-y-3">
              <Plus className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="text-sm">
                Create a brand-new Change Control Request with these {documentCount} document{documentCount === 1 ? '' : 's'} pre-attached.
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-1" /> Create new CCR
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}