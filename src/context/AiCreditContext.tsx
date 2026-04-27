import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAiCreditCheck } from '@/hooks/useAiCreditCheck';
import { NoCreditDialog } from '@/components/ai/NoCreditDialog';

interface AiCreditContextType {
  requireCredits: () => boolean;
  remaining: number;
  used: number;
  limit: number;
  hasCredits: boolean;
  refetchCredits: () => void;
}

const AiCreditContext = createContext<AiCreditContextType>({
  requireCredits: () => true,
  remaining: 0,
  used: 0,
  limit: 0,
  hasCredits: true,
  refetchCredits: () => {},
});

// Global function to trigger the dialog from anywhere (services, hooks, etc.)
let globalShowNoCreditDialog: (() => void) | null = null;

export function showNoCreditDialog() {
  if (globalShowNoCreditDialog) {
    globalShowNoCreditDialog();
  }
}

export function AiCreditProvider({ children }: { children: React.ReactNode }) {
  const { creditStatus, checkCredits, refetchCredits } = useAiCreditCheck();
  const [dialogOpen, setDialogOpen] = useState(false);

  const openDialog = useCallback(() => {
    setDialogOpen(true);
  }, []);

  // Register global function
  useEffect(() => {
    globalShowNoCreditDialog = openDialog;
    return () => { globalShowNoCreditDialog = null; };
  }, [openDialog]);

  // Listen for custom 'no-ai-credits' event from anywhere in the app
  useEffect(() => {
    const handler = () => setDialogOpen(true);
    window.addEventListener('no-ai-credits', handler);
    return () => window.removeEventListener('no-ai-credits', handler);
  }, []);

  const requireCredits = useCallback((): boolean => {
    const hasCredits = checkCredits();
    if (!hasCredits) {
      setDialogOpen(true);
      return false;
    }
    return true;
  }, [checkCredits]);

  return (
    <AiCreditContext.Provider
      value={{
        requireCredits,
        remaining: creditStatus.remaining,
        used: creditStatus.used,
        limit: creditStatus.limit,
        hasCredits: creditStatus.hasCredits,
        refetchCredits,
      }}
    >
      {children}
      <NoCreditDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        used={creditStatus.used}
        limit={creditStatus.limit}
      />
    </AiCreditContext.Provider>
  );
}

export function useAiCredits() {
  return useContext(AiCreditContext);
}
