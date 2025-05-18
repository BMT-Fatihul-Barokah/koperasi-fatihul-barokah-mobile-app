/**
 * Centralized logging utility for the Koperasi Fatihul Barokah mobile app
 * Provides consistent logging with context and categories
 */

// Log categories for better organization
export enum LogCategory {
  AUTH = 'Auth',
  DATABASE = 'Database',
  NOTIFICATIONS = 'Notifications',
  TRANSACTIONS = 'Transactions',
  LOAN = 'Loan',
  TABUNGAN = 'Tabungan',
  DASHBOARD = 'Dashboard',
  DATA = 'Data',
  SYSTEM = 'System'
}

/**
 * Logger utility class with static methods for different log levels
 */
export class Logger {
  /**
   * Log debug level message
   */
  static debug(module: string | LogCategory, message: string, data?: any): void {
    if (__DEV__) {
      console.log(`[${module}] ${message}`, data || '');
    }
  }
  
  /**
   * Log info level message
   */
  static info(module: string | LogCategory, message: string, data?: any): void {
    console.log(`[${module}] ${message}`, data || '');
  }
  
  /**
   * Log warning level message
   */
  static warn(module: string | LogCategory, message: string, data?: any): void {
    console.warn(`[${module}] ${message}`, data || '');
  }
  
  /**
   * Log error level message
   */
  static error(module: string | LogCategory, message: string, error?: any): void {
    console.error(`[${module}] ${message}`, error || '');
  }
}
