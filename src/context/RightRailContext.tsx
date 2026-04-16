import React, { createContext, useContext, useState, useCallback } from 'react';

interface RightRailContextValue {
  isRightRailOpen: boolean;
  setRightRailOpen: (open: boolean) => void;
}

const RightRailContext = createContext<RightRailContextValue>({
  isRightRailOpen: false,
  setRightRailOpen: () => {},
});

export function RightRailProvider({ children }: { children: React.ReactNode }) {
  const [isRightRailOpen, setRightRailOpen] = useState(false);
  return (
    <RightRailContext.Provider value={{ isRightRailOpen, setRightRailOpen }}>
      {children}
    </RightRailContext.Provider>
  );
}

export function useRightRail() {
  return useContext(RightRailContext);
}

/**
 * Hook that registers a right rail as open on mount and closes on unmount.
 * Drop this into any sidebar component that uses the fixed right rail pattern.
 */
export function useRegisterRightRail() {
  const { setRightRailOpen } = useRightRail();
  React.useEffect(() => {
    setRightRailOpen(true);
    return () => setRightRailOpen(false);
  }, [setRightRailOpen]);
}
