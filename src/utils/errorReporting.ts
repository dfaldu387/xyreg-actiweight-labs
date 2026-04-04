// Centralized error reporting and logging utilities

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  companyId?: string;
  productId?: string;
  additional?: Record<string, any>;
}

export interface ErrorReport {
  id: string;
  timestamp: string;
  level: 'critical' | 'error' | 'warning' | 'info';
  message: string;
  stack?: string;
  context?: ErrorContext;
  url: string;
  userAgent: string;
}

class ErrorReportingService {
  private errors: ErrorReport[] = [];
  private maxErrors = 100;

  constructor() {
    this.loadStoredErrors();
    this.setupGlobalErrorHandlers();
  }

  private loadStoredErrors() {
    try {
      const stored = localStorage.getItem('app_error_reports');
      if (stored) {
        this.errors = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load stored error reports:', e);
    }
  }

  private saveErrors() {
    try {
      localStorage.setItem('app_error_reports', JSON.stringify(this.errors));
    } catch (e) {
      console.warn('Failed to save error reports:', e);
    }
  }

  private setupGlobalErrorHandlers() {
    // Global unhandled error handler
    window.addEventListener('error', (event) => {
      this.reportError({
        level: 'critical',
        message: event.message,
        stack: event.error?.stack,
        context: {
          component: 'global',
          action: 'unhandled_error'
        }
      });
    });

    // Global unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError({
        level: 'critical',
        message: `Unhandled promise rejection: ${event.reason}`,
        stack: event.reason?.stack,
        context: {
          component: 'global',
          action: 'unhandled_promise_rejection'
        }
      });
    });
  }

  reportError(params: {
    level: 'critical' | 'error' | 'warning' | 'info';
    message: string;
    stack?: string;
    context?: ErrorContext;
  }) {
    const errorReport: ErrorReport = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      level: params.level,
      message: params.message,
      stack: params.stack,
      context: params.context,
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    this.errors.unshift(errorReport);
    
    // Keep only the most recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    this.saveErrors();

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      const logLevel = params.level === 'critical' || params.level === 'error' ? 'error' : 'warn';
      console[logLevel]('Error Report:', errorReport);
    }

    return errorReport.id;
  }

  getErrors(): ErrorReport[] {
    return [...this.errors];
  }

  getErrorsByLevel(level: 'critical' | 'error' | 'warning' | 'info'): ErrorReport[] {
    return this.errors.filter(error => error.level === level);
  }

  clearErrors() {
    this.errors = [];
    localStorage.removeItem('app_error_reports');
  }

  exportErrors(): string {
    return JSON.stringify({
      errors: this.errors,
      exportTime: new Date().toISOString(),
      url: window.location.href
    }, null, 2);
  }

  private generateId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Create singleton instance
export const errorReporting = new ErrorReportingService();

// Convenience functions for common error types
export const reportApiError = (endpoint: string, error: Error, context?: ErrorContext) => {
  return errorReporting.reportError({
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

export const reportComponentError = (componentName: string, error: Error, context?: ErrorContext) => {
  return errorReporting.reportError({
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

export const reportValidationError = (field: string, value: any, context?: ErrorContext) => {
  return errorReporting.reportError({
    level: 'warning',
    message: `Validation Error: Invalid value for ${field}`,
    context: {
      ...context,
      action: 'validation_error',
      additional: { field, value }
    }
  });
};
