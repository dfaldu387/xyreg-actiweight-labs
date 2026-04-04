
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface ErrorLogEntry {
  timestamp: Date;
  error: Error | string;
  context: string;
  userId?: string;
  productId?: string;
  companyId?: string;
}

interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier: number;
}

/**
 * Enhanced error handling hook with logging, retry mechanisms, and user-friendly messages
 */
export function useEnhancedErrorHandling() {
  const [errorLog, setErrorLog] = useState<ErrorLogEntry[]>([]);
  const [retryCount, setRetryCount] = useState<Record<string, number>>({});

  /**
   * Log an error with context information
   */
  const logError = useCallback((
    error: Error | string, 
    context: string, 
    metadata?: {
      userId?: string;
      productId?: string;
      companyId?: string;
    }
  ) => {
    const entry: ErrorLogEntry = {
      timestamp: new Date(),
      error,
      context,
      ...metadata
    };

    setErrorLog(prev => [entry, ...prev.slice(0, 99)]); // Keep last 100 errors
    
    // Log to console for development
    console.error(`[${context}]`, error, metadata);

    // In production, you might want to send this to an error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Send to error tracking service (e.g., Sentry, LogRocket, etc.)
    }
  }, []);

  /**
   * Execute a function with retry logic and error handling
   */
  const withRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    operationId: string,
    config: RetryConfig = {
      maxAttempts: 3,
      delayMs: 1000,
      backoffMultiplier: 2
    }
  ): Promise<T | null> => {
    const currentRetryCount = retryCount[operationId] || 0;

    try {
      const result = await operation();
      
      // Reset retry count on success
      if (currentRetryCount > 0) {
        setRetryCount(prev => ({ ...prev, [operationId]: 0 }));
      }
      
      return result;
    } catch (error) {
      const newRetryCount = currentRetryCount + 1;
      
      logError(
        error instanceof Error ? error : new Error(String(error)),
        `Operation failed: ${operationId} (attempt ${newRetryCount})`
      );

      if (newRetryCount < config.maxAttempts) {
        setRetryCount(prev => ({ ...prev, [operationId]: newRetryCount }));
        
        // Calculate delay with exponential backoff
        const delay = config.delayMs * Math.pow(config.backoffMultiplier, newRetryCount - 1);
        
        toast.warning(`Operation failed, retrying in ${delay}ms... (${newRetryCount}/${config.maxAttempts})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return withRetry(operation, operationId, config);
      } else {
        // Max attempts reached
        setRetryCount(prev => ({ ...prev, [operationId]: 0 }));
        
        const userFriendlyMessage = getUserFriendlyErrorMessage(error, operationId);
        toast.error(userFriendlyMessage);
        
        return null;
      }
    }
  }, [retryCount, logError]);

  /**
   * Get user-friendly error message based on error type and context
   */
  const getUserFriendlyErrorMessage = useCallback((error: unknown, context: string): string => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Common error patterns and their user-friendly messages
    const errorPatterns = [
      {
        pattern: /network|fetch|connection/i,
        message: "Network connection issue. Please check your internet connection and try again."
      },
      {
        pattern: /unauthorized|authentication|auth/i,
        message: "Authentication error. Please log out and log back in."
      },
      {
        pattern: /not found|404/i,
        message: "The requested resource was not found. It may have been deleted or moved."
      },
      {
        pattern: /timeout/i,
        message: "The operation timed out. Please try again."
      },
      {
        pattern: /permission|forbidden|403/i,
        message: "You don't have permission to perform this action."
      },
      {
        pattern: /validation|invalid/i,
        message: "Invalid data provided. Please check your input and try again."
      }
    ];

    for (const { pattern, message } of errorPatterns) {
      if (pattern.test(errorMessage)) {
        return message;
      }
    }

    // Context-specific messages
    if (context.includes('document')) {
      return "There was an issue with the document operation. Please try again or contact support.";
    }
    
    if (context.includes('sync')) {
      return "Failed to sync data. Your changes may not be saved. Please refresh and try again.";
    }

    // Generic fallback
    return "An unexpected error occurred. Please try again or contact support if the problem persists.";
  }, []);

  /**
   * Handle errors with automatic logging and user notification
   */
  const handleError = useCallback((
    error: unknown, 
    context: string, 
    options: {
      showToast?: boolean;
      metadata?: Record<string, any>;
    } = {}
  ) => {
    const { showToast = true, metadata } = options;
    
    logError(
      error instanceof Error ? error : new Error(String(error)),
      context,
      metadata
    );

    if (showToast) {
      const userMessage = getUserFriendlyErrorMessage(error, context);
      toast.error(userMessage);
    }
  }, [logError, getUserFriendlyErrorMessage]);

  /**
   * Clear error log
   */
  const clearErrorLog = useCallback(() => {
    setErrorLog([]);
  }, []);

  return {
    errorLog,
    retryCount,
    logError,
    withRetry,
    handleError,
    getUserFriendlyErrorMessage,
    clearErrorLog
  };
}
