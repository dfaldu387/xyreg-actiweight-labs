import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface ContentGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  title: string;
  sectionTitle?: string;
  sources?: string[];
}

export function ContentGenerationModal({
  isOpen,
  onClose,
  content,
  title,
  sectionTitle,
  sources = []
}: ContentGenerationModalProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast.success('Content copied to clipboard');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold">{title}</div>
              {sectionTitle && (
                <div className="text-sm text-muted-foreground">For section: {sectionTitle}</div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-hidden">
          <ScrollArea className="flex-1 max-h-[400px] border rounded-md p-4">
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {content}
            </div>
          </ScrollArea>

          {sources.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Sources:</div>
              <div className="flex flex-wrap gap-1">
                {sources.map((source, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {source}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button onClick={handleCopy} className="flex-1">
              <Copy className="w-4 h-4 mr-2" />
              Copy Content
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}