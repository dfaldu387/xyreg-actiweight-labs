import React, { createContext, useContext, useState, useCallback } from 'react';
import { CommunicationThread } from '@/types/communications';
import { ThreadDetailSheet } from '@/components/communications/ThreadDetailSheet';
import { supabase } from '@/integrations/supabase/client';

interface ThreadSheetContextType {
  openThread: (threadId: string) => void;
  closeThread: () => void;
}

const ThreadSheetContext = createContext<ThreadSheetContextType | undefined>(undefined);

export function ThreadSheetProvider({ children }: { children: React.ReactNode }) {
  const [thread, setThread] = useState<CommunicationThread | null>(null);
  const [open, setOpen] = useState(false);

  const openThread = useCallback(async (threadId: string) => {
    try {
      // Fetch thread
      const { data: threadData, error: threadError } = await supabase
        .from('communication_threads')
        .select('*')
        .eq('id', threadId)
        .single();

      if (threadError || !threadData) {
        console.error('[ThreadSheetContext] Failed to fetch thread:', threadError);
        return;
      }

      // Fetch participants
      const { data: participants } = await supabase
        .from('thread_participants')
        .select('id, user_id, role, joined_at')
        .eq('thread_id', threadId);

      // Fetch user profiles for participants
      const userIds = (participants || []).map((p: any) => p.user_id).filter(Boolean);
      let profileMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, email, first_name, last_name')
          .in('id', userIds);
        if (profiles) {
          profileMap = Object.fromEntries(profiles.map(p => [p.id, p]));
        }
      }

      // Merge participants with profiles
      const enrichedParticipants = (participants || []).map((p: any) => ({
        ...p,
        user_profiles: profileMap[p.user_id] || null,
      }));

      const fullThread = { ...threadData, participants: enrichedParticipants };
      setThread(fullThread as CommunicationThread);
      setOpen(true);
    } catch (err) {
      console.error('[ThreadSheetContext] Error opening thread:', err);
    }
  }, []);

  const closeThread = useCallback(() => {
    setOpen(false);
    setThread(null);
  }, []);

  return (
    <ThreadSheetContext.Provider value={{ openThread, closeThread }}>
      {children}
      <ThreadDetailSheet
        thread={thread}
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) closeThread();
        }}
      />
    </ThreadSheetContext.Provider>
  );
}

export function useThreadSheet() {
  const context = useContext(ThreadSheetContext);
  if (!context) {
    throw new Error('useThreadSheet must be used within a ThreadSheetProvider');
  }
  return context;
}
