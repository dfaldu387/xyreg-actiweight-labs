import React from 'react';
import { format } from 'date-fns';
import { Clock, CheckCircle, FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { PendingItem } from '@/hooks/useRBRPulseStatus';

interface NodeItemsListDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  items: PendingItem[];
  variant: 'pending' | 'approved';
}

const statusBadgeStyles: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700 border-gray-300',
  pending: 'bg-amber-50 text-amber-700 border-amber-300',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-300',
  rejected: 'bg-red-50 text-red-700 border-red-300',
};

export function NodeItemsListDialog({
  isOpen,
  onClose,
  title,
  items,
  variant,
}: NodeItemsListDialogProps) {
  const IconComponent = variant === 'pending' ? Clock : CheckCircle;
  const headerBg = variant === 'pending' ? 'bg-amber-50' : 'bg-emerald-50';
  const headerText = variant === 'pending' ? 'text-amber-700' : 'text-emerald-700';
  const iconColor = variant === 'pending' ? 'text-amber-600' : 'text-emerald-600';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className={cn('p-4 -m-6 mb-0 rounded-t-lg', headerBg)}>
          <div className="flex items-center gap-2">
            <IconComponent className={cn('h-5 w-5', iconColor)} />
            <DialogTitle className={headerText}>
              {title} ({items.length})
            </DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground text-sm">
            {variant === 'pending' 
              ? 'Items awaiting review and approval'
              : 'Items that have been reviewed and approved'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] mt-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">
                {variant === 'pending' 
                  ? 'No pending items' 
                  : 'No approved items'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div 
                  key={item.id} 
                  className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm font-semibold text-foreground truncate">
                        {item.documentId}
                      </p>
                      <p className="text-sm text-muted-foreground truncate mt-0.5">
                        {item.name}
                      </p>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        'text-[10px] shrink-0 capitalize',
                        statusBadgeStyles[item.status] || statusBadgeStyles.pending
                      )}
                    >
                      {item.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>Created: {format(new Date(item.createdAt), 'MMM d, yyyy')}</span>
                    {item.dueDate && (
                      <span className={cn(
                        new Date(item.dueDate) < new Date() && 'text-destructive font-medium'
                      )}>
                        Due: {format(new Date(item.dueDate), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
