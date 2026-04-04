import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface MissionControlContextType {
  selectedCompanyId: string | null;
  selectedCompanyName: string | null;
  setSelectedCompany: (companyId: string | null, companyName: string | null) => void;
}

const MissionControlContext = createContext<MissionControlContextType | undefined>(undefined);

export function MissionControlProvider({ children }: { children: React.ReactNode }) {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedCompanyName, setSelectedCompanyName] = useState<string | null>(null);
  const location = useLocation();

  // Reset state ONLY when on company-specific mission control routes
  // DO NOT reset when navigating away from mission control - we need to preserve the selection
  useEffect(() => {
    const isCompanyMissionControl = location.pathname.includes('/mission-control') && location.pathname.includes('/app/company/');
    
    // Only reset when on company-specific mission control route (context should come from URL, not Mission Control selection)
    if (isCompanyMissionControl) {
      setSelectedCompanyId(null);
      setSelectedCompanyName(null);
    }
  }, [location.pathname]);

  const setSelectedCompany = (companyId: string | null, companyName: string | null) => {
    setSelectedCompanyId(companyId);
    setSelectedCompanyName(companyName);
  };

  return (
    <MissionControlContext.Provider value={{
      selectedCompanyId,
      selectedCompanyName,
      setSelectedCompany
    }}>
      {children}
    </MissionControlContext.Provider>
  );
}

export function useMissionControl() {
  const context = useContext(MissionControlContext);
  if (context === undefined) {
    throw new Error('useMissionControl must be used within a MissionControlProvider');
  }
  return context;
}