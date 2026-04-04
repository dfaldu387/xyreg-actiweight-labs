import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface ImpersonationData {
  impersonatedBy: string;
  impersonatedByEmail: string;
  impersonatedAt: string;
  originalUserEmail: string;
}

const IMPERSONATION_STORAGE_KEY = 'impersonation_data';

export function useImpersonation() {
  const [impersonationData, setImpersonationData] = useState<ImpersonationData | null>(null);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const { user } = useAuth();

  // Check for impersonation data in localStorage
  useEffect(() => {
    const checkImpersonationData = () => {
      const storedData = localStorage.getItem(IMPERSONATION_STORAGE_KEY);
      if (storedData) {
        try {
          const data = JSON.parse(storedData);
          setImpersonationData(data);
          setIsImpersonating(true);
          console.log('[useImpersonation] Impersonation data found in localStorage:', data);
        } catch (error) {
          console.error('[useImpersonation] Error parsing stored impersonation data:', error);
          localStorage.removeItem(IMPERSONATION_STORAGE_KEY);
        }
      } else {
        setImpersonationData(null);
        setIsImpersonating(false);
      }
    };

    checkImpersonationData();
    
    // Also check after a small delay to handle any timing issues
    const timeoutId = setTimeout(checkImpersonationData, 100);
    
    return () => clearTimeout(timeoutId);
  }, []);

  // Clear impersonation data
  const clearImpersonation = () => {
    localStorage.removeItem(IMPERSONATION_STORAGE_KEY);
    setImpersonationData(null);
    setIsImpersonating(false);
    console.log('Impersonation cleared');
  };

  // Check if current user is being impersonated
  const isBeingImpersonated = isImpersonating && impersonationData && user?.email === impersonationData.originalUserEmail;

  return {
    impersonationData,
    isImpersonating,
    isBeingImpersonated,
    clearImpersonation
  };
}
