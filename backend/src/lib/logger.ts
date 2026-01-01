/**
 * Structured logging utility for Cloudflare Workers
 * Outputs JSON-formatted logs for easy parsing and monitoring
 */

export interface LogContext {
  path?: string;
  method?: string;
  clientId?: string;
  statusCode?: number;
  [key: string]: unknown;
}

export interface LogEntry {
  level: 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
  stack?: string;
  context?: LogContext;
}

class Logger {
  private formatLog(level: LogEntry['level'], message: string, context?: LogContext, stack?: string): string {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...(stack && { stack }),
      ...(context && Object.keys(context).length > 0 && { context }),
    };

    return JSON.stringify(entry);
  }

  info(message: string, context?: LogContext): void {
    console.log(this.formatLog('info', message, context));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatLog('warn', message, context));
  }

  error(error: Error | string, context?: LogContext): void {
    const message = error instanceof Error ? error.message : error;
    const stack = error instanceof Error ? error.stack : undefined;

    console.error(this.formatLog('error', message, context, stack));
  }
}

export const logger = new Logger();
