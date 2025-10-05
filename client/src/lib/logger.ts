/**
 * Centralized logging service for the application
 * Provides structured logging with different log levels
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  error?: Error;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private logHistory: LogEntry[] = [];
  private maxHistorySize = 100;

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
    };
  }

  private formatMessage(entry: LogEntry): string {
    const { level, message, timestamp, context } = entry;
    let formatted = `[${timestamp}] [${level}] ${message}`;

    if (context && Object.keys(context).length > 0) {
      formatted += ` | Context: ${JSON.stringify(context)}`;
    }

    return formatted;
  }

  private addToHistory(entry: LogEntry): void {
    this.logHistory.push(entry);

    // Keep history size limited
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }
  }

  private shouldLog(level: LogLevel): boolean {
    // In production, only log WARN and ERROR
    if (!this.isDevelopment) {
      return level === LogLevel.WARN || level === LogLevel.ERROR;
    }
    return true;
  }

  /**
   * Log debug information (development only)
   */
  debug(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.DEBUG, message, context);
    this.addToHistory(entry);

    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatMessage(entry), context);
    }
  }

  /**
   * Log informational messages
   */
  info(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.INFO, message, context);
    this.addToHistory(entry);

    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage(entry), context);
    }
  }

  /**
   * Log warnings
   */
  warn(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.WARN, message, context);
    this.addToHistory(entry);

    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage(entry), context);
    }
  }

  /**
   * Log errors with optional Error object
   */
  error(message: string, error?: Error, context?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.ERROR, message, context, error);
    this.addToHistory(entry);

    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage(entry), error, context);
    }

    // In production, you might want to send errors to a service like Sentry
    if (!this.isDevelopment && error) {
      // TODO: Send to error tracking service
      // Example: Sentry.captureException(error, { contexts: { custom: context } });
    }
  }

  /**
   * Get recent log history
   */
  getHistory(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logHistory.filter(entry => entry.level === level);
    }
    return [...this.logHistory];
  }

  /**
   * Clear log history
   */
  clearHistory(): void {
    this.logHistory = [];
  }

  /**
   * Export logs as JSON for debugging
   */
  exportLogs(): string {
    return JSON.stringify(this.logHistory, null, 2);
  }
}

// Export singleton instance
export const logger = new Logger();

// Convenience exports
export const log = {
  debug: (message: string, context?: Record<string, any>) => logger.debug(message, context),
  info: (message: string, context?: Record<string, any>) => logger.info(message, context),
  warn: (message: string, context?: Record<string, any>) => logger.warn(message, context),
  error: (message: string, error?: Error, context?: Record<string, any>) => logger.error(message, error, context),
};
