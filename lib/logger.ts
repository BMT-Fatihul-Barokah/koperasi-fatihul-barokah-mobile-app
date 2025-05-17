/**
 * Centralized logging utility for the Koperasi Fatihul Barokah mobile app
 * Provides consistent logging with context and log levels
 */

// Log levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4 // Use this to disable all logging
}

// Current log level - can be adjusted based on environment
// In production, this should be set to INFO or higher
const currentLogLevel = __DEV__ ? LogLevel.DEBUG : LogLevel.INFO;

// Modules that should be logged even in production
const criticalModules = ['Auth', 'API', 'Database', 'Error'];

interface LogOptions {
  // Force logging regardless of log level
  force?: boolean;
  // Additional data to log
  data?: any;
}

/**
 * Log a message with the given level and module
 */
function log(level: LogLevel, module: string, message: string, options?: LogOptions): void {
  // Skip logging if level is below current level and not forced
  if (level < currentLogLevel && !options?.force && !criticalModules.includes(module)) {
    return;
  }

  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const prefix = `[${timestamp}][${module}]`;
  
  switch (level) {
    case LogLevel.DEBUG:
      if (options?.data) {
        console.log(`${prefix} ${message}`, options.data);
      } else {
        console.log(`${prefix} ${message}`);
      }
      break;
    case LogLevel.INFO:
      if (options?.data) {
        console.log(`${prefix} ${message}`, options.data);
      } else {
        console.log(`${prefix} ${message}`);
      }
      break;
    case LogLevel.WARN:
      if (options?.data) {
        console.warn(`${prefix} ${message}`, options.data);
      } else {
        console.warn(`${prefix} ${message}`);
      }
      break;
    case LogLevel.ERROR:
      if (options?.data) {
        console.error(`${prefix} ${message}`, options.data);
      } else {
        console.error(`${prefix} ${message}`);
      }
      break;
  }
}

/**
 * Logger utility with methods for different log levels
 */
export const Logger = {
  debug: (module: string, message: string, data?: any) => 
    log(LogLevel.DEBUG, module, message, { data }),
  
  info: (module: string, message: string, data?: any) => 
    log(LogLevel.INFO, module, message, { data }),
  
  warn: (module: string, message: string, data?: any) => 
    log(LogLevel.WARN, module, message, { data }),
  
  error: (module: string, message: string, error?: any) => 
    log(LogLevel.ERROR, module, message, { data: error }),
  
  // Force logging regardless of level
  critical: (module: string, message: string, data?: any) => 
    log(LogLevel.ERROR, module, message, { force: true, data }),
};
