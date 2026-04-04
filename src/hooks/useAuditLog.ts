import { useState, useEffect, useRef } from 'react';
import { AuditLogService } from '@/services/auditLogService';
import { useAuth } from '@/context/AuthContext';

interface UseAuditLogOptions {
  documentId: string;
  companyId: string;
  autoLogView?: boolean;
}

export function useAuditLog({
  documentId,
  companyId,
  autoLogView = true
}: UseAuditLogOptions) {
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState<string>('');
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const sessionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoggedView = useRef<boolean>(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize session tracking with debouncing
  useEffect(() => {
    if (!user?.id || !documentId || !companyId || documentId === '' || companyId === '') {
      return;
    }

    // Clear any existing debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Debounce the initialization to prevent multiple rapid calls
    debounceTimeoutRef.current = setTimeout(() => {
      const newSessionId = AuditLogService.generateSessionId();
      setSessionId(newSessionId);
      setSessionStartTime(Date.now());
      hasLoggedView.current = false;

      // Log initial view only once per session
      if (autoLogView && !hasLoggedView.current) {
        AuditLogService.logView(documentId, companyId, newSessionId);
        hasLoggedView.current = true;
      }

      // Set up session duration tracking
      if (sessionIntervalRef.current) {
        clearInterval(sessionIntervalRef.current);
      }

      sessionIntervalRef.current = setInterval(() => {
        const duration = Math.floor((Date.now() - sessionStartTime) / 1000);
        if (duration > 0 && newSessionId) {
          AuditLogService.updateSessionDuration(newSessionId, duration);
        }
      }, 30000); // Update every 30 seconds
    }, 1000); // 1 second debounce

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (sessionIntervalRef.current) {
        clearInterval(sessionIntervalRef.current);
      }
    };
  }, [documentId, companyId, user?.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sessionIntervalRef.current) {
        clearInterval(sessionIntervalRef.current);
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const logView = () => {
    if (!user?.id || !documentId || !companyId || documentId === '' || companyId === '') {
      return;
    }

    if (!hasLoggedView.current) {
      AuditLogService.logView(documentId, companyId, sessionId);
      hasLoggedView.current = true;
    }
  };

  return {
    logView,
    sessionId
  };
} 