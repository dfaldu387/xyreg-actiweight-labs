
import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface UsePageExitProtectionOptions {
  hasUnsavedChanges: boolean;
  message?: string;
  enabled?: boolean;
}

export function usePageExitProtection({
  hasUnsavedChanges,
  message = 'You have unsaved changes. Are you sure you want to leave?',
  enabled = true
}: UsePageExitProtectionOptions) {
  
  // Prevent browser refresh/close
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, message, enabled]);

  // Create a custom navigation function that checks for unsaved changes
  const navigate = useNavigate();
  const location = useLocation();
  
  const navigateWithConfirmation = useCallback((to: string) => {
    if (hasUnsavedChanges && enabled) {
      const shouldLeave = window.confirm(message);
      if (shouldLeave) {
        navigate(to);
      }
    } else {
      navigate(to);
    }
  }, [hasUnsavedChanges, enabled, message, navigate]);

  return {
    navigateWithConfirmation
  };
}
