import axios from 'axios';

export type ApiError = Error & {
  isApiError: true;
  status?: number;
  serverMessage?: string;
  serverCode?: string | number;
  responseData?: unknown;
  originalError?: unknown;
  isCanceled: boolean;
};

export const isApiError = (err: unknown): err is ApiError => {
  return (
    err instanceof Error &&
    (err as ApiError).name === 'ApiError' &&
    (err as ApiError).isApiError === true
  );
};

const isCanceledError = (err: unknown): boolean => {
  const e = err as any;
  return (
    e?.code === 'ERR_CANCELED' ||
    e?.name === 'AbortError' ||
    e?.name === 'CanceledError' ||
    e?.message === 'canceled' ||
    axios.isCancel?.(err as any) === true
  );
};

const safeJson = (v: unknown): string => {
  try {
    const text = JSON.stringify(v);
    return text.length > 300 ? `${text.slice(0, 300)}...` : text;
  } catch {
    return 'Unknown error';
  }
};

const normalizeMessage = (value: unknown): string => {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  if (Array.isArray(value)) {
    const joined = value
      .map(item => {
        if (typeof item === 'string') return item.trim();
        return safeJson(item);
      })
      .filter(Boolean)
      .join(', ');

    return joined || 'Unknown error';
  }

  if (value && typeof value === 'object') {
    const msg = (value as any).message;
    if (typeof msg === 'string' && msg.trim()) {
      return msg.trim();
    }

    const detail = (value as any).detail;
    if (typeof detail === 'string' && detail.trim()) {
      return detail.trim();
    }

    return safeJson(value);
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return 'Unknown error';
};

const makeApiError = (
  message: string,
  extras?: Partial<Omit<ApiError, 'name' | 'message' | 'isApiError'>>,
  cause?: unknown,
): ApiError => {
  const out = new Error(message) as ApiError;

  out.name = 'ApiError';
  out.isApiError = true;
  out.isCanceled = false;
  out.originalError = cause;

  if (extras) {
    out.status = extras.status;
    out.serverMessage = extras.serverMessage;
    out.serverCode = extras.serverCode;
    out.responseData = extras.responseData;
    out.originalError = extras.originalError ?? cause;
    out.isCanceled = extras.isCanceled ?? false;
  }

  if (cause && !(out as any).cause) {
    (out as any).cause = cause;
  }

  return out;
};

export const asError = (err: unknown): ApiError => {
  // 1) canceled request
  if (isCanceledError(err)) {
    const message =
      err instanceof Error && err.message?.trim()
        ? err.message.trim()
        : 'Request canceled';

    return makeApiError(
      message,
      {
        isCanceled: true,
      },
      err,
    );
  }

  // 2) axios error
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const data = err.response?.data as any;

    // network / timeout / no response
    if (!err.response) {
      const message =
        err.code === 'ECONNABORTED'
          ? 'Request timeout'
          : err.message?.trim() || 'Network Error';

      return makeApiError(
        message,
        {
          isCanceled: false,
          originalError: err,
        },
        err,
      );
    }

    const candidate =
      data?.message ??
      data?.error?.message ??
      data?.error ??
      data?.detail ??
      data?.title ??
      data?.errors ??
      data?.non_field_errors ??
      err.message;

    const message = normalizeMessage(candidate);

    const serverCodeRaw = data?.code ?? data?.error_code;
    const serverCode =
      typeof serverCodeRaw === 'string' || typeof serverCodeRaw === 'number'
        ? serverCodeRaw
        : undefined;

    const serverMessageCandidate =
      data?.message ??
      data?.error?.message ??
      data?.error ??
      data?.detail ??
      data?.title ??
      data?.errors ??
      data?.non_field_errors;

    const serverMessage = normalizeMessage(serverMessageCandidate);

    return makeApiError(
      message,
      {
        status,
        serverMessage:
          serverMessage !== 'Unknown error' ? serverMessage : undefined,
        serverCode,
        responseData: data,
        isCanceled: false,
        originalError: err,
      },
      err,
    );
  }

  // 3) native error
  if (err instanceof Error) {
    return makeApiError(
      err.message?.trim() || 'Unknown error',
      {
        isCanceled: false,
        originalError: err,
      },
      err,
    );
  }

  // 4) unknown
  return makeApiError(
    normalizeMessage(err),
    {
      isCanceled: false,
      originalError: err,
    },
    err,
  );
};
