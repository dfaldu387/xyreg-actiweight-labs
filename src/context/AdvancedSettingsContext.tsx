import React, { createContext, useContext, ReactNode } from "react";

interface AdvancedSettingsContextType {
  /** Whether to show locked menu items in the L2 sidebar - always true (plan-based from DB) */
  showLockedMenus: boolean;
  /** @deprecated No longer used - plan restrictions come from database */
  setShowLockedMenus: (show: boolean) => void;
}

const AdvancedSettingsContext = createContext<AdvancedSettingsContextType | undefined>(undefined);

export function AdvancedSettingsProvider({ children }: { children: ReactNode }) {
  // Always show locked menus - restriction is based on plan from database
  // Lock icons are shown for restricted features based on usePlanMenuAccess hook
  const value: AdvancedSettingsContextType = {
    showLockedMenus: true, // Always true - plan-based restrictions from DB
    setShowLockedMenus: () => {}, // No-op - setting not user-configurable
  };

  return (
    <AdvancedSettingsContext.Provider value={value}>
      {children}
    </AdvancedSettingsContext.Provider>
  );
}

export function useAdvancedSettings() {
  const context = useContext(AdvancedSettingsContext);
  if (!context) {
    throw new Error("useAdvancedSettings must be used within an AdvancedSettingsProvider");
  }
  return context;
}
