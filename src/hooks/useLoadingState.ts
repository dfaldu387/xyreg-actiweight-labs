
import { useState, useCallback, useRef } from 'react';

interface LoadingState {
  isLoading: boolean;
  error: string | null;
  loadingKey: string | null;
}

export function useLoadingState() {
  const [state, setState] = useState<LoadingState>({
    isLoading: false,
    error: null,
    loadingKey: null
  });
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const setLoading = useCallback((key: string, isLoading: boolean) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (isLoading) {
      setState(prev => ({ ...prev, isLoading: true, loadingKey: key, error: null }));
    } else {
      // Debounce loading state changes to prevent flashing
      timeoutRef.current = setTimeout(() => {
        setState(prev => ({ ...prev, isLoading: false, loadingKey: null }));
      }, 100);
    }
  }, []);
  
  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error, isLoading: false, loadingKey: null }));
  }, []);
  
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);
  
  return {
    ...state,
    setLoading,
    setError,
    clearError
  };
}
