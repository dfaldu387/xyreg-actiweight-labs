
import { useState, useEffect } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  isConnected: boolean;
  error: string | null;
}

export function useNetworkStatus() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isConnected: true,
    error: null
  });

  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus({
        isOnline: true,
        isConnected: true,
        error: null
      });
    };

    const handleOffline = () => {
      setNetworkStatus({
        isOnline: false,
        isConnected: false,
        error: 'Network connection lost'
      });
    };

    // Simplified connectivity test with proper timeout
    const testConnectivity = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // Reduced timeout

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/`, 
          {
            method: 'HEAD',
            signal: controller.signal,
            headers: {
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
            }
          }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        setNetworkStatus(prev => ({
          ...prev,
          isConnected: true,
          error: null
        }));
      } catch (error) {
        setNetworkStatus(prev => ({
          ...prev,
          isConnected: false,
          error: error instanceof Error ? error.message : 'Connection test failed'
        }));
      }
    };

    // Initial connectivity test only if online
    if (navigator.onLine) {
      testConnectivity();
    }

    // Set up event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Reduced frequency for connectivity test
    const intervalId = setInterval(() => {
      if (navigator.onLine) {
        testConnectivity();
      }
    }, 60000); // Test every 60 seconds instead of 30

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, []);

  return networkStatus;
}
