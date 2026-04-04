
import { useState, useEffect } from 'react';

export interface SimplifiedNetworkStatus {
  isOnline: boolean;
  error: string | null;
}

export function useSimplifiedNetworkStatus(): SimplifiedNetworkStatus {
  const [networkStatus, setNetworkStatus] = useState<SimplifiedNetworkStatus>({
    isOnline: navigator.onLine,
    error: null
  });

  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus({
        isOnline: true,
        error: null
      });
    };

    const handleOffline = () => {
      setNetworkStatus({
        isOnline: false,
        error: 'Network connection lost'
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return networkStatus;
}
