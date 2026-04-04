import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface InvestorPreviewContextType {
  isPreviewOpen: boolean;
  openPreview: (options?: { openScorecard?: boolean }) => void;
  closePreview: () => void;
  togglePreview: () => void;
  shouldOpenScorecard: boolean;
  clearScorecardFlag: () => void;
}

const InvestorPreviewContext = createContext<InvestorPreviewContextType | null>(null);

interface InvestorPreviewProviderProps {
  children: ReactNode;
}

export function InvestorPreviewProvider({ children }: InvestorPreviewProviderProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [shouldOpenScorecard, setShouldOpenScorecard] = useState(false);

  const openPreview = useCallback((options?: { openScorecard?: boolean }) => {
    if (options?.openScorecard) {
      setShouldOpenScorecard(true);
    }
    setIsPreviewOpen(true);
  }, []);
  
  const closePreview = useCallback(() => setIsPreviewOpen(false), []);
  const togglePreview = useCallback(() => setIsPreviewOpen(prev => !prev), []);
  const clearScorecardFlag = useCallback(() => setShouldOpenScorecard(false), []);

  return (
    <InvestorPreviewContext.Provider value={{ 
      isPreviewOpen, 
      openPreview, 
      closePreview, 
      togglePreview,
      shouldOpenScorecard,
      clearScorecardFlag
    }}>
      {children}
    </InvestorPreviewContext.Provider>
  );
}

export function useInvestorPreview() {
  const context = useContext(InvestorPreviewContext);
  if (!context) {
    // Return no-op functions if not within provider (graceful fallback)
    return {
      isPreviewOpen: false,
      openPreview: () => {},
      closePreview: () => {},
      togglePreview: () => {},
      shouldOpenScorecard: false,
      clearScorecardFlag: () => {},
    };
  }
  return context;
}
