/**
 * Logging utilities for benchmark runner
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private level: LogLevel = LogLevel.INFO;

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.INFO) {
      console.log(`[INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }

  success(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.INFO) {
      console.log(`\x1b[32m[SUCCESS]\x1b[0m ${message}`, ...args);
    }
  }

  progress(current: number, total: number, message?: string): void {
    if (this.level <= LogLevel.INFO) {
      const percent = Math.round((current / total) * 100);
      const bar = '='.repeat(Math.floor(percent / 2)) + ' '.repeat(50 - Math.floor(percent / 2));
      const msg = message ? ` - ${message}` : '';
      process.stdout.write(`\r[${bar}] ${percent}% (${current}/${total})${msg}`);
      if (current === total) {
        process.stdout.write('\n');
      }
    }
  }
}

export const logger = new Logger();
