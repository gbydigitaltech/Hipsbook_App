import {
  ProfileResponse,
  UpdateProfilePayload,
  UploadProfileImagePayload,
  UploadProfileImageResponse,
} from '../../types/data/profile/profile.types';
import { logWarn } from '../../helpers/logger';
import { ApiError, asError } from '../asError';
import { privateApi } from '../http';
import { apiUploadFile } from '../upload/upload';

type RequestParams = {
  signal?: AbortSignal;
};

type UpdateProfileParams = RequestParams & {
  payload: UpdateProfilePayload;
};

type UploadProfileImageParams = RequestParams & {
  payload: UploadProfileImagePayload;
};

export const apiGetProfile = async ({
  signal,
}: RequestParams = {}): Promise<ProfileResponse> => {
  try {
    const { data } = await privateApi.post<ProfileResponse>(
      '/profile',
      {},
      { signal },
    );

    return data;
  } catch (err) {
    // POST only (no GET fallback), and log the cause clearly
    throw logProfileError(asError(err), 'POST');
  }
};

// Log the cause clearly: status + server message
const logProfileError = (e: ApiError, method: string): ApiError => {
  if (!e.isCanceled) {
    logWarn(
      'Profile',
      `${method} /profile failed status=${e.status ?? 'NO_RESPONSE'} msg=${
        e.serverMessage ?? e.message
      }`,
    );
  }
  return e;
};

export const apiUpdateProfile = async ({
  payload,
  signal,
}: UpdateProfileParams): Promise<ProfileResponse> => {
  try {
    const { data } = await privateApi.patch<ProfileResponse>(
      '/profile',
      payload,
      { signal },
    );

    return data;
  } catch (err) {
    throw asError(err);
  }
};

// Uses the shared upload endpoint /backoffice/versity/upload-file
// (the old /profile/image returned 500), then PATCH /profile with the returned url
export const apiUploadProfileImage = async ({
  payload,
  signal,
}: UploadProfileImageParams): Promise<UploadProfileImageResponse> => {
  const res = await apiUploadFile(
    {
      uri: payload.chunk.uri,
      name: payload.fileId || payload.chunk.name,
      type: payload.chunk.type,
      prefixKey: 'User-profile_image',
    },
    { signal },
  );
  const raw = (res.raw ?? {}) as Partial<UploadProfileImageResponse>;
  return {
    key: res.key ?? raw.key ?? '',
    url: res.url ?? raw.url ?? '',
    contentType: raw.contentType ?? payload.chunk.type,
    bucket: raw.bucket ?? '',
    originalName: raw.originalName ?? payload.chunk.name,
    fileId: raw.fileId ?? payload.fileId,
  };
};
