export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  info(message: string, data?: any) {
    console.log(`[${this.context}] INFO: ${message}`, data || '');
  }

  warn(message: string, data?: any) {
    console.warn(`[${this.context}] WARN: ${message}`, data || '');
  }

  error(message: string, error?: Error | unknown, data?: any) {
    console.error(`[${this.context}] ERROR: ${message}`, {
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error,
      ...data
    });
  }

  debug(message: string, data?: any) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[${this.context}] DEBUG: ${message}`, data || '');
    }
  }
}

// Create context-aware logger
export function createContextLogger(context: string): Logger {
  return new Logger(context);
}
