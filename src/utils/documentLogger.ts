/**
 * Comprehensive logging utility for document operations
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  context: string;
  message: string;
  data?: any;
  userId?: string;
  productId?: string;
  companyId?: string;
}

class DocumentLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private isEnabled = true;

  /**
   * Log a message with context
   */
  log(level: LogLevel, context: string, message: string, data?: any, metadata?: {
    userId?: string;
    productId?: string;
    companyId?: string;
  }) {
    if (!this.isEnabled) return;

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      context,
      message,
      data,
      ...metadata
    };

    this.logs.unshift(entry);
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Console output for development
    if (process.env.NODE_ENV === 'development') {
      const consoleMethod = this.getConsoleMethod(level);
      consoleMethod(`[${context}] ${message}`, data, metadata);
    }
  }

  /**
   * Debug level logging
   */
  debug(context: string, message: string, data?: any, metadata?: any) {
    this.log(LogLevel.DEBUG, context, message, data, metadata);
  }

  /**
   * Info level logging
   */
  info(context: string, message: string, data?: any, metadata?: any) {
    this.log(LogLevel.INFO, context, message, data, metadata);
  }

  /**
   * Warning level logging
   */
  warn(context: string, message: string, data?: any, metadata?: any) {
    this.log(LogLevel.WARN, context, message, data, metadata);
  }

  /**
   * Error level logging
   */
  error(context: string, message: string, data?: any, metadata?: any) {
    this.log(LogLevel.ERROR, context, message, data, metadata);
  }

  /**
   * Get console method based on log level
   */
  private getConsoleMethod(level: LogLevel) {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug;
      case LogLevel.INFO:
        return console.info;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.ERROR:
        return console.error;
      default:
        return console.log;
    }
  }

  /**
   * Get logs filtered by criteria
   */
  getLogs(filter?: {
    level?: LogLevel;
    context?: string;
    since?: Date;
    productId?: string;
    companyId?: string;
  }): LogEntry[] {
    if (!filter) return [...this.logs];

    return this.logs.filter(log => {
      if (filter.level && log.level !== filter.level) return false;
      if (filter.context && !log.context.includes(filter.context)) return false;
      if (filter.since && log.timestamp < filter.since) return false;
      if (filter.productId && log.productId !== filter.productId) return false;
      if (filter.companyId && log.companyId !== filter.companyId) return false;
      return true;
    });
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * Enable or disable logging
   */
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Get logging statistics
   */
  getStats() {
    const stats = {
      total: this.logs.length,
      byLevel: {} as Record<LogLevel, number>,
      byContext: {} as Record<string, number>,
      oldestLog: this.logs[this.logs.length - 1]?.timestamp,
      newestLog: this.logs[0]?.timestamp
    };

    this.logs.forEach(log => {
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
      stats.byContext[log.context] = (stats.byContext[log.context] || 0) + 1;
    });

    return stats;
  }
}

// Create singleton instance
export const documentLogger = new DocumentLogger();

// Convenience functions
export const logDocumentOperation = (
  operation: string, 
  result: 'success' | 'error', 
  details?: any,
  metadata?: any
) => {
  const level = result === 'success' ? LogLevel.INFO : LogLevel.ERROR;
  documentLogger.log(
    level,
    'DocumentOperation',
    `${operation} ${result}`,
    details,
    metadata
  );
};

export const logPerformance = (
  operation: string,
  duration: number,
  metadata?: any
) => {
  documentLogger.info(
    'Performance',
    `${operation} completed in ${duration}ms`,
    { duration },
    metadata
  );
};
