import axios from 'axios';
import { log, logWarn } from '../../helpers/logger';
import { asError } from '../asError';
import { privateApi } from '../http';

/**
 * Simple file upload (not chunked)
 * POST /backoffice/versity/upload-file  (form-data: chunk, fileId, prefixKey)
 * DELETE /backoffice/versity/delete-file?key=...
 * Note: the develop server can only delete keys that start with develop/
 */
const UPLOAD_PATH = '/backoffice/versity/upload-file';
const DELETE_PATH = '/backoffice/versity/delete-file';

/** Short message for users/debugging */
export const describeUploadError = (err: unknown): string => {
  const e = err as any;
  const status = e?.status ?? e?.response?.status;
  const msg = e?.serverMessage ?? e?.message ?? 'unknown';
  return status ? `${status} ${msg}` : msg;
};

export type UploadFileInput = {
  uri: string;
  /** File name (used as fileId) — guessed from the uri if omitted */
  name?: string;
  /** Mime type, e.g. image/jpeg */
  type?: string;
  /** Key prefix, must be one the server allows, e.g. User-profile_image */
  prefixKey: string;
};

export type UploadFileResult = {
  /** File key (used for deletion) */
  key?: string;
  /** Display URL (if the server returns one) */
  url?: string;
  raw: unknown;
};

const guessName = (uri: string, type?: string): string => {
  const last = uri.split('?')[0].split('/').pop();
  if (last && last.includes('.')) return last;
  const ext = type?.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';
  return `file-${Date.now()}.${ext}`;
};

const guessType = (name: string): string => {
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'heic':
      return 'image/heic';
    case 'gif':
      return 'image/gif';
    case 'pdf':
      return 'application/pdf';
    default:
      return 'image/jpeg';
  }
};

// Find a string in the response flexibly (exact shape not confirmed yet)
const findString = (
  obj: any,
  keys: string[],
  depth = 0,
): string | undefined => {
  if (!obj || typeof obj !== 'object' || depth > 3) return undefined;
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string' && v.trim()) return v;
  }
  for (const v of Object.values(obj)) {
    const found = findString(v, keys, depth + 1);
    if (found) return found;
  }
  return undefined;
};

export const apiUploadFile = async (
  input: UploadFileInput,
  { signal }: { signal?: AbortSignal } = {},
): Promise<UploadFileResult> => {
  const name = input.name ?? guessName(input.uri, input.type);
  const type = input.type ?? guessType(name);

  const formData = new FormData();
  formData.append('chunk', { uri: input.uri, name, type } as any);
  formData.append('fileId', name);
  formData.append('prefixKey', input.prefixKey);

  try {
    const { data } = await privateApi.post(UPLOAD_PATH, formData, {
      signal,
      timeout: 60000,
    });
    log('Upload', `upload-file ok raw=${JSON.stringify(data)}`);
    return {
      key: findString(data, ['key', 'Key', 'fileKey', 'path']),
      url: findString(data, [
        'url',
        'Url',
        'fileUrl',
        'file_url',
        'location',
        'Location',
        'link',
      ]),
      raw: data,
    };
  } catch (err) {
    const e = asError(err);
    if (!e.isCanceled) {
      const body = axios.isAxiosError(err) ? err.response?.data : undefined;
      logWarn(
        'Upload',
        `upload-file failed url=${UPLOAD_PATH} status=${
          e.status ?? 'NO_RESPONSE'
        } msg=${e.serverMessage ?? e.message} body=${JSON.stringify(
          body ?? null,
        )}`,
      );
    }
    throw e;
  }
};

export const apiDeleteFile = async (
  key: string,
  { signal }: { signal?: AbortSignal } = {},
): Promise<void> => {
  try {
    await privateApi.delete(DELETE_PATH, { params: { key }, signal });
    log('Upload', `delete-file ok key=${key}`);
  } catch (err) {
    const e = asError(err);
    if (!e.isCanceled) {
      logWarn(
        'Upload',
        `delete-file failed key=${key} status=${e.status ?? 'NO_RESPONSE'}`,
      );
    }
    throw e;
  }
};
