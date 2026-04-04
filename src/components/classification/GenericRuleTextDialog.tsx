import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink, FileText } from 'lucide-react';

interface GenericRuleTextDialogProps {
  isOpen: boolean;
  onClose: () => void;
  rule: { id: string; title: string; text: string; source: string } | null;
  marketName: string;
  regulationDescription: string;
  officialUrl: string;
  officialLinkText: string;
}

export function GenericRuleTextDialog({ 
  isOpen, 
  onClose, 
  rule,
  marketName,
  regulationDescription,
  officialUrl,
  officialLinkText
}: GenericRuleTextDialogProps) {
  if (!rule) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {rule.title} - Official Text
          </DialogTitle>
          <DialogDescription>
            Official regulatory text from {regulationDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-semibold text-sm text-muted-foreground mb-2">
              Source: {rule.source}
            </h4>
            <div className="prose prose-sm max-w-none">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {rule.text}
              </p>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
            <h4 className="font-semibold text-amber-800 dark:text-amber-200 text-sm mb-2">
              Important Notice
            </h4>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              This text is provided for reference purposes. Always consult the official {marketName} publication 
              for the most current and legally binding version of the regulation. This tool is not a substitute 
              for professional regulatory advice.
            </p>
          </div>

          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(officialUrl, '_blank')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              {officialLinkText}
            </Button>
            
            <Button onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
