import React, { useMemo, useState } from 'react';
import { CommunicationThread } from '@/types/communications';
import { ThreadCardClickable } from './ThreadCardClickable';
import { ThreadDetailSheet } from './ThreadDetailSheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Shield, Pencil, FlaskConical, FileCheck, Scale, MessageSquare } from 'lucide-react';
import {
  COMM_MODULE_LABELS,
  COMM_MODULE_ORDER,
  CommModule,
  groupThreadsByModule,
} from '@/lib/communications/moduleGrouping';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface ThreadKanbanBoardProps {
  threads: CommunicationThread[];
}

const MODULE_ICON: Record<CommModule, React.ReactNode> = {
  risk: <Shield className="h-3.5 w-3.5 text-rose-600" />,
  designControl: <Pencil className="h-3.5 w-3.5 text-blue-600" />,
  vv: <FlaskConical className="h-3.5 w-3.5 text-violet-600" />,
  qms: <FileCheck className="h-3.5 w-3.5 text-emerald-600" />,
  regulatory: <Scale className="h-3.5 w-3.5 text-amber-600" />,
  general: <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />,
};

const MODULE_ACCENT: Record<CommModule, string> = {
  risk: 'border-t-rose-400',
  designControl: 'border-t-blue-400',
  vv: 'border-t-violet-400',
  qms: 'border-t-emerald-400',
  regulatory: 'border-t-amber-400',
  general: 'border-t-muted-foreground/40',
};

export function ThreadKanbanBoard({ threads }: ThreadKanbanBoardProps) {
  const [selectedThread, setSelectedThread] = useState<CommunicationThread | null>(null);
  const [showClosed, setShowClosed] = useState<Record<CommModule, boolean>>({
    risk: false, designControl: false, vv: false, qms: false, regulatory: false, general: false,
  });
  const queryClient = useQueryClient();

  // Split open vs closed; group each by module
  const { openByModule, closedByModule } = useMemo(() => {
    const open = threads.filter(t => t.status !== 'Closed');
    const closed = threads.filter(t => t.status === 'Closed');
    return {
      openByModule: groupThreadsByModule(open),
      closedByModule: groupThreadsByModule(closed),
    };
  }, [threads]);

  const handleClose = async (thread: CommunicationThread) => {
    const { error } = await supabase
      .from('communication_threads')
      .update({ status: 'Closed' })
      .eq('id', thread.id);
    if (error) {
      toast.error('Failed to close thread');
      return;
    }
    toast.success('Thread closed', {
      action: {
        label: 'Undo',
        onClick: async () => {
          await supabase
            .from('communication_threads')
            .update({ status: 'Active' })
            .eq('id', thread.id);
          queryClient.invalidateQueries({ queryKey: ['communication-threads'] });
        },
      },
    });
    queryClient.invalidateQueries({ queryKey: ['communication-threads'] });
    queryClient.invalidateQueries({ queryKey: ['communication-threads-stats'] });
  };

  return (
    <>
      <ScrollArea className="w-full">
        <div className="flex gap-3 pb-3 min-w-max">
          {COMM_MODULE_ORDER.map((mod) => {
            const openItems = openByModule[mod];
            const closedItems = closedByModule[mod];
            const isOpen = showClosed[mod];

            return (
              <div
                key={mod}
                className={`w-[300px] flex-shrink-0 rounded-md border bg-muted/30 border-t-4 ${MODULE_ACCENT[mod]}`}
              >
                <div className="px-3 py-2 flex items-center justify-between border-b bg-background/60 rounded-t-sm">
                  <div className="flex items-center gap-2">
                    {MODULE_ICON[mod]}
                    <span className="text-sm font-semibold">{COMM_MODULE_LABELS[mod]}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">{openItems.length}</Badge>
                </div>

                <div className="p-2 space-y-2 min-h-[120px]">
                  {openItems.length === 0 ? (
                    <div className="text-xs text-muted-foreground italic px-2 py-6 text-center">
                      No threads
                    </div>
                  ) : (
                    openItems.map((t) => (
                      <ThreadCardClickable
                        key={t.id}
                        thread={t}
                        onClick={setSelectedThread}
                        onArchive={handleClose}
                      />
                    ))
                  )}

                  {closedItems.length > 0 && (
                    <div className="pt-2 mt-2 border-t border-dashed">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start h-7 text-xs text-muted-foreground"
                        onClick={() => setShowClosed(s => ({ ...s, [mod]: !s[mod] }))}
                      >
                        {isOpen ? <ChevronDown className="h-3 w-3 mr-1" /> : <ChevronRight className="h-3 w-3 mr-1" />}
                        Closed ({closedItems.length})
                      </Button>
                      {isOpen && (
                        <div className="space-y-2 mt-2 opacity-70">
                          {closedItems.map((t) => (
                            <ThreadCardClickable
                              key={t.id}
                              thread={t}
                              onClick={setSelectedThread}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <ThreadDetailSheet
        thread={selectedThread}
        open={!!selectedThread}
        onOpenChange={(open) => { if (!open) setSelectedThread(null); }}
      />
    </>
  );
}