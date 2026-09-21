/**
 * Central logger for dev only — fully silent in production (__DEV__ === false).
 * Usage with a tag: log('HTTP', ...), logWarn('Auth', ...), logError('Player', ...)
 * Never log sensitive data (tokens, passwords, full bodies).
 */

const isDev = typeof __DEV__ !== 'undefined' && __DEV__;

export const log = (tag: string, ...args: unknown[]): void => {
  if (isDev) console.log(`[${tag}]`, ...args);
};

export const logWarn = (tag: string, ...args: unknown[]): void => {
  if (isDev) console.warn(`[${tag}]`, ...args);
};

export const logError = (tag: string, ...args: unknown[]): void => {
  if (isDev) console.error(`[${tag}]`, ...args);
};
