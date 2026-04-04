import React, { createContext, useContext, ReactNode } from 'react';

interface RestrictedFeatureContextType {
  isRestricted: boolean;
  planName: string | null;
  featureName: string;
  requiredPlan?: string;
}

const RestrictedFeatureContext = createContext<RestrictedFeatureContextType>({
  isRestricted: false,
  planName: null,
  featureName: '',
});

interface RestrictedFeatureProviderProps {
  children: ReactNode;
  isRestricted: boolean;
  planName: string | null;
  featureName: string;
  requiredPlan?: string;
}

/**
 * Provider component that wraps content to indicate restricted/preview mode.
 * When isRestricted is true, all interactive elements inside should be disabled.
 */
export function RestrictedFeatureProvider({
  children,
  isRestricted,
  planName,
  featureName,
  requiredPlan,
}: RestrictedFeatureProviderProps) {
  return (
    <RestrictedFeatureContext.Provider
      value={{ isRestricted, planName, featureName, requiredPlan }}
    >
      {children}
    </RestrictedFeatureContext.Provider>
  );
}

/**
 * Hook to check if current feature is in restricted/preview mode.
 * Use this in components to disable interactions when restricted.
 */
export function useRestrictedFeature() {
  const context = useContext(RestrictedFeatureContext);
  return context;
}

export default RestrictedFeatureContext;
