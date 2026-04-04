import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface HelpModeContextType {
  isComplianceMode: boolean;
  setComplianceMode: (value: boolean) => void;
  isHelpEnabled: boolean;
  setHelpEnabled: (value: boolean) => void;
}

const HelpModeContext = createContext<HelpModeContextType>({
  isComplianceMode: false,
  setComplianceMode: () => {},
  isHelpEnabled: true,
  setHelpEnabled: () => {},
});

export function HelpModeProvider({ children }: { children: ReactNode }) {
  const [isComplianceMode, setComplianceMode] = useState(() => {
    const saved = localStorage.getItem('help-compliance-mode');
    return saved === 'true';
  });

  const [isHelpEnabled, setHelpEnabled] = useState(() => {
    const saved = localStorage.getItem('help-hints-enabled');
    return saved !== 'false'; // default to true
  });

  useEffect(() => {
    localStorage.setItem('help-compliance-mode', String(isComplianceMode));
  }, [isComplianceMode]);

  useEffect(() => {
    localStorage.setItem('help-hints-enabled', String(isHelpEnabled));
  }, [isHelpEnabled]);

  return (
    <HelpModeContext.Provider value={{ isComplianceMode, setComplianceMode, isHelpEnabled, setHelpEnabled }}>
      {children}
    </HelpModeContext.Provider>
  );
}

export function useHelpMode() {
  return useContext(HelpModeContext);
}
