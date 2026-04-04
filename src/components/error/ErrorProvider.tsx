
import React, { createContext, useContext, ReactNode } from 'react';
import { errorReporting, type ErrorContext } from '@/utils/errorReporting';

interface ErrorContextType {
  reportError: (message: string, context?: ErrorContext) => void;
  reportApiError: (endpoint: string, error: Error, context?: ErrorContext) => void;
  reportComponentError: (componentName: string, error: Error, context?: ErrorContext) => void;
}

const ErrorReportingContext = createContext<ErrorContextType | null>(null);

interface ErrorProviderProps {
  children: ReactNode;
}

export function ErrorProvider({ children }: ErrorProviderProps) {
  const reportError = (message: string, context?: ErrorContext) => {
    errorReporting.reportError({
      level: 'error',
      message,
      context
    });
  };

  const reportApiError = (endpoint: string, error: Error, context?: ErrorContext) => {
    errorReporting.reportError({
      level: 'error',
      message: `API Error at ${endpoint}: ${error.message}`,
      stack: error.stack,
      context: {
        ...context,
        action: 'api_call',
        additional: { endpoint }
      }
    });
  };

  const reportComponentError = (componentName: string, error: Error, context?: ErrorContext) => {
    errorReporting.reportError({
      level: 'error',
      message: `Component Error in ${componentName}: ${error.message}`,
      stack: error.stack,
      context: {
        ...context,
        component: componentName,
        action: 'component_error'
      }
    });
  };

  return (
    <ErrorReportingContext.Provider value={{
      reportError,
      reportApiError,
      reportComponentError
    }}>
      {children}
    </ErrorReportingContext.Provider>
  );
}

export function useErrorReporting() {
  const context = useContext(ErrorReportingContext);
  if (!context) {
    throw new Error('useErrorReporting must be used within an ErrorProvider');
  }
  return context;
}
