// Application constants

export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
  TIMEOUT: parseInt(process.env.REACT_APP_API_TIMEOUT || '10000'),
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: process.env.REACT_APP_AUTH_TOKEN_KEY || 'fastpost_auth_token',
  REFRESH_TOKEN: process.env.REACT_APP_REFRESH_TOKEN_KEY || 'fastpost_refresh_token',
  USER_DATA: 'fastpost_user_data',
};

export const FEATURE_FLAGS = {
  OFFLINE_MODE: process.env.REACT_APP_ENABLE_OFFLINE_MODE === 'true',
  PUSH_NOTIFICATIONS: process.env.REACT_APP_ENABLE_PUSH_NOTIFICATIONS === 'true',
  ANALYTICS: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
};

export const LOG_LEVEL = process.env.REACT_APP_LOG_LEVEL || 'info';
export const DEBUG_MODE = process.env.REACT_APP_DEBUG_MODE === 'true';
