// Simple logging utility

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const getCurrentLogLevel = (): LogLevel => {
  return (process.env.REACT_APP_LOG_LEVEL || 'info') as LogLevel;
};

const shouldLog = (level: LogLevel): boolean => {
  const currentLevel = LOG_LEVELS[getCurrentLogLevel()];
  return LOG_LEVELS[level] >= currentLevel;
};

export const logger = {
  debug: (message: string, data?: any) => {
    if (shouldLog('debug')) {
      console.debug(`[DEBUG] ${message}`, data);
    }
  },
  info: (message: string, data?: any) => {
    if (shouldLog('info')) {
      console.log(`[INFO] ${message}`, data);
    }
  },
  warn: (message: string, data?: any) => {
    if (shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, data);
    }
  },
  error: (message: string, data?: any) => {
    if (shouldLog('error')) {
      console.error(`[ERROR] ${message}`, data);
    }
  },
};
