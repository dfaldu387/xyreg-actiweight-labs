import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Pencil, Sparkles, FileText, Copy } from 'lucide-react';

interface DraftEmptyStateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerateManually: () => void;
  onAutoFillByAI: () => void;
  onCopyFromSOP: () => void;
}

export function DraftEmptyStateModal({
  open,
  onOpenChange,
  onGenerateManually,
  onAutoFillByAI,
  onCopyFromSOP,
}: DraftEmptyStateModalProps) {
  const options = [
    {
      key: 'manual',
      icon: Pencil,
      title: 'Start from Scratch',
      description: 'Start with a blank document and write the content yourself.',
      onClick: onGenerateManually,
      iconClass: 'text-primary bg-primary/10',
    },
    {
      key: 'ai',
      icon: Sparkles,
      title: 'Auto-fill by AI',
      description: 'Let AI draft every section based on your company and product context.',
      onClick: onAutoFillByAI,
      iconClass: 'text-primary bg-primary/10',
    },
    {
      key: 'sop',
      icon: Copy,
      title: 'Copy from SOP Document',
      description: 'Pick an existing SOP from the Xyreg library and copy its content as a starting point.',
      onClick: onCopyFromSOP,
      iconClass: 'text-primary bg-primary/10',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>How would you like to start this draft?</DialogTitle>
          <DialogDescription>
            This document is empty. Choose how you want to add content.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-2">
          {options.map(({ key, icon: Icon, title, description, onClick, iconClass }) => (
            <button
              key={key}
              type="button"
              onClick={onClick}
              className="flex items-start gap-3 rounded-lg border border-border bg-background p-4 text-left transition-colors hover:border-primary/40 hover:bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${iconClass}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-foreground">{title}</div>
                <div className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{description}</div>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
