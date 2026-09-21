import { Buffer } from 'buffer';
import { logError } from './logger';

/** Check if token has JWT-like shape: "header.payload.signature" */
export const looksJwt = (token: string): boolean => {
  return typeof token === 'string' && token.split('.').length === 3;
};

/** Decode base64url string to UTF-8 text */
const base64UrlDecode = (str: string): string => {
  // Convert base64url chars to base64 chars
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');

  // Add missing "=" padding for valid base64 length
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    '=',
  );

  return Buffer.from(padded, 'base64').toString('utf-8');
};

/**
 * Decode JWT payload into object.
 * Returns null if token is malformed or payload is not valid JSON.
 */
export const decodeJwt = (token: string): Record<string, any> | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const json = base64UrlDecode(parts[1]);
    return JSON.parse(json);
  } catch {
    return null;
  }
};

/** Extract "activate_id" from access token. Returns null when missing/invalid. */
export const getActivateIdFromAccess = (access: string): string | null => {
  if (!access || !looksJwt(access)) return null;

  const payload = decodeJwt(access);
  const raw = payload?.activate_id;

  return raw == null ? null : String(raw).trim();
};

/** True when activate_id === "2" (business rule: account is activated) */
export const isActivatedV2 = (access: string): boolean => {
  return getActivateIdFromAccess(access) === '2';
};

/**
 * Check token expiry from "exp" claim (seconds since epoch).
 * Returns true when token is invalid, missing exp, or already expired.
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    if (!looksJwt(token)) return true;

    const payload = decodeJwt(token);
    const exp = payload?.exp;
    const now = Math.floor(Date.now() / 1000);

    return typeof exp === 'number' ? now >= exp : true;
  } catch (error) {
    logError('App', 'Failed to check token expiration:', error);
    return true;
  }
};
