import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, FileText, ArrowLeft } from 'lucide-react';
import { SOP_FULL_CONTENT, SOPFullContent } from '@/data/sopFullContent';

interface SOPPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (sop: SOPFullContent) => void;
  onBack?: () => void;
}

export function SOPPickerModal({ open, onOpenChange, onSelect, onBack }: SOPPickerModalProps) {
  const [search, setSearch] = useState('');

  const sops = useMemo(() => {
    return Object.values(SOP_FULL_CONTENT).sort((a, b) =>
      a.sopNumber.localeCompare(b.sopNumber)
    );
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sops;
    return sops.filter(
      (s) =>
        s.sopNumber.toLowerCase().includes(q) ||
        s.title.toLowerCase().includes(q)
    );
  }, [sops, search]);

  const handleSelect = (sop: SOPFullContent) => {
    onSelect(sop);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {onBack && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="h-7 w-7 -ml-1"
                aria-label="Back"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <DialogTitle>Copy from SOP Document</DialogTitle>
          </div>
          <DialogDescription>
            Select an SOP to copy its content into this draft. You can edit everything after.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            placeholder="Search by SOP number or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          {filtered.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-10">
              No SOPs match "{search}".
            </div>
          ) : (
            <div className="grid gap-2 py-2">
              {filtered.map((sop) => (
                <button
                  key={sop.sopNumber}
                  type="button"
                  onClick={() => handleSelect(sop)}
                  className="flex items-start gap-3 rounded-md border border-border bg-background p-3 text-left transition-colors hover:border-primary/40 hover:bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <FileText className="h-4 w-4 mt-0.5 shrink-0 text-emerald-600" />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-foreground">
                      {sop.sopNumber} — {sop.title}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {sop.sections.length} section{sop.sections.length === 1 ? '' : 's'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
