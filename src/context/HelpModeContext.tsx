import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface HelpModeContextType {
  isComplianceMode: boolean;
  setComplianceMode: (value: boolean) => void;
  isHelpEnabled: boolean;
  setHelpEnabled: (value: boolean) => void;
  isAdvisoryBoardVisible: boolean;
  setAdvisoryBoardVisible: (value: boolean) => void;
}

const HelpModeContext = createContext<HelpModeContextType>({
  isComplianceMode: false,
  setComplianceMode: () => {},
  isHelpEnabled: true,
  setHelpEnabled: () => {},
  isAdvisoryBoardVisible: true,
  setAdvisoryBoardVisible: () => {},
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

  const [isAdvisoryBoardVisible, setAdvisoryBoardVisible] = useState(() => {
    const saved = localStorage.getItem('xyreg-advisory-board-visible');
    return saved !== 'false'; // default to true
  });

  useEffect(() => {
    localStorage.setItem('help-compliance-mode', String(isComplianceMode));
  }, [isComplianceMode]);

  useEffect(() => {
    localStorage.setItem('help-hints-enabled', String(isHelpEnabled));
  }, [isHelpEnabled]);

  useEffect(() => {
    localStorage.setItem('xyreg-advisory-board-visible', String(isAdvisoryBoardVisible));
  }, [isAdvisoryBoardVisible]);

  return (
    <HelpModeContext.Provider value={{ isComplianceMode, setComplianceMode, isHelpEnabled, setHelpEnabled, isAdvisoryBoardVisible, setAdvisoryBoardVisible }}>
      {children}
    </HelpModeContext.Provider>
  );
}

export function useHelpMode() {
  return useContext(HelpModeContext);
}
