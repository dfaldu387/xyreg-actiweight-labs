import React, { createContext, useContext, useState, ReactNode } from 'react';

interface GapAnalysisHelpState {
  framework: string | null;
  section: string | null;
}

interface GapAnalysisHelpContextType extends GapAnalysisHelpState {
  setGapHelpContext: (framework: string | null, section: string | null) => void;
}

const GapAnalysisHelpContext = createContext<GapAnalysisHelpContextType>({
  framework: null,
  section: null,
  setGapHelpContext: () => {},
});

export function GapAnalysisHelpProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GapAnalysisHelpState>({ framework: null, section: null });

  const setGapHelpContext = (framework: string | null, section: string | null) => {
    setState({ framework, section });
  };

  return (
    <GapAnalysisHelpContext.Provider value={{ ...state, setGapHelpContext }}>
      {children}
    </GapAnalysisHelpContext.Provider>
  );
}

export function useGapAnalysisHelp() {
  return useContext(GapAnalysisHelpContext);
}
