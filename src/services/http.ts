import { API_BASE_URL } from '@env';
import { log, logWarn } from '../helpers/logger';
import axios, {
  AxiosError,
  AxiosHeaders,
  AxiosInstance,
  AxiosRequestConfig,
} from 'axios';
import { decodeJwt } from '../helpers/jwtUtils';
import { getTokens } from '../helpers/keychain';
import { apiRefreshToken } from './auth/auth';
import { asError } from './asError';

export const request = async <T>(promise: Promise<{ data: T }>): Promise<T> => {
  try {
    const { data } = await promise;
    return data;
  } catch (err) {
    throw asError(err);
  }
};

export let onLogout: (() => void) | undefined;

export const setOnLogout = (fn?: () => void): void => {
  onLogout = fn;
};

type RetryableRequestConfig = AxiosRequestConfig & {
  _retry?: boolean;
};

const toAxiosHeaders = (h: AxiosRequestConfig['headers']): AxiosHeaders => {
  if (h instanceof AxiosHeaders) return h;

  const headers = new AxiosHeaders();
  if (!h) return headers;

  Object.entries(h as Record<string, unknown>).forEach(([key, value]) => {
    if (typeof value !== 'undefined') {
      headers.set(key, value as any);
    }
  });

  return headers;
};

const BASE_URL = (API_BASE_URL || '').replace(/\/+$/, '');

export const publicApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    Accept: 'application/json',
  },
  timeout: 15000,
});

export const privateApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    Accept: 'application/json',
  },
  timeout: 15000,
});

let refreshing: Promise<string | null> | null = null;
let isLoggingOut = false;

const triggerLogout = (): void => {
  if (isLoggingOut) return;
  isLoggingOut = true;
  onLogout?.();
};

const refreshTokens = async (): Promise<string | null> => {
  try {
    const rt = (await getTokens())?.refreshToken;
    if (!rt) return null;

    const res = await apiRefreshToken(rt);
    return res?.access_token ?? null;
  } catch (err) {
    logWarn('Auth', 'refresh token failed', err);
    return null;
  }
};

const getSharedRefreshPromise = async (): Promise<string | null> => {
  if (!refreshing) {
    refreshing = refreshTokens();
  }

  try {
    return await refreshing;
  } finally {
    refreshing = null;
  }
};

const ensureFreshAccess = async (): Promise<string | null> => {
  const tokens = await getTokens();
  const access = tokens?.accessToken ?? null;
  const refresh = tokens?.refreshToken ?? null;

  if (!access) return null;

  const exp = decodeJwt(access)?.exp;
  if (!exp) return access;

  const now = Math.floor(Date.now() / 1000);
  const marginSec = 30;

  if (exp - now > marginSec) {
    return access;
  }

  if (!refresh) {
    return access;
  }

  const newAccess = await getSharedRefreshPromise();
  return newAccess ?? access;
};

privateApi.interceptors.request.use(async config => {
  const access = await ensureFreshAccess();
  const headers = toAxiosHeaders(config.headers);

  if (access) {
    headers.set('Authorization', `Bearer ${access}`);
  }

  if (config.data instanceof FormData) {
    headers.delete('Content-Type');
    headers.delete('content-type');
    config.transformRequest = [data => data];
  } else if (!headers.get('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  config.headers = headers;
  return config;
});

privateApi.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const original = error.config as RetryableRequestConfig | undefined;

    if (!original || status !== 401) {
      throw error;
    }

    if (original.url?.includes('/auth/token')) {
      triggerLogout();
      throw error;
    }

    if (original._retry) {
      triggerLogout();
      throw error;
    }

    original._retry = true;

    const newAccess = await getSharedRefreshPromise();

    if (!newAccess) {
      triggerLogout();
      throw error;
    }

    const headers = toAxiosHeaders(original.headers);
    headers.set('Authorization', `Bearer ${newAccess}`);

    if (original.data instanceof FormData) {
      headers.delete('Content-Type');
      headers.delete('content-type');
    } else if (!headers.get('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    original.headers = headers;

    return privateApi.request(original);
  },
);

// ---- Dev-only HTTP logging (auto-disabled in production) ----
const requestStartTimes = new WeakMap<object, number>();

const attachLogging = (client: AxiosInstance): void => {
  client.interceptors.request.use(config => {
    requestStartTimes.set(config, Date.now());
    const method = config.method?.toUpperCase() ?? 'GET';
    log('HTTP', `→ ${method} ${config.baseURL ?? ''}${config.url ?? ''}`);
    return config;
  });

  client.interceptors.response.use(
    res => {
      const started = requestStartTimes.get(res.config) ?? Date.now();
      const ms = Date.now() - started;
      const method = res.config.method?.toUpperCase() ?? 'GET';
      log('HTTP', `← ${res.status} ${method} ${res.config.url ?? ''} (${ms}ms)`);
      return res;
    },
    (error: AxiosError) => {
      const cfg = error.config;
      const started = cfg ? requestStartTimes.get(cfg) ?? Date.now() : Date.now();
      const ms = Date.now() - started;
      const method = cfg?.method?.toUpperCase() ?? '';
      logWarn(
        'HTTP',
        `✗ ${error.response?.status ?? 'ERR'} ${method} ${cfg?.url ?? ''} (${ms}ms)`,
      );
      return Promise.reject(error);
    },
  );
};

attachLogging(publicApi);
attachLogging(privateApi);
