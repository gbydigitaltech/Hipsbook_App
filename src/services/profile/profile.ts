import {
  ProfileResponse,
  UpdateProfilePayload,
  UploadProfileImagePayload,
  UploadProfileImageResponse,
} from '../../types/data/profile/profile.types';
import { asError } from '../asError';
import { privateApi } from '../http';

type RequestParams = {
  signal?: AbortSignal;
};

type UpdateProfileParams = RequestParams & {
  payload: UpdateProfilePayload;
};

type UploadProfileImageParams = RequestParams & {
  payload: UploadProfileImagePayload;
};

const buildProfileImageFormData = (
  payload: UploadProfileImagePayload,
): FormData => {
  const formData = new FormData();

  formData.append('chunk', payload.chunk as any);
  formData.append('index', String(payload.index));
  formData.append('totalChunks', String(payload.totalChunks));
  formData.append('fileId', payload.fileId);

  return formData;
};

export const apiGetProfile = async ({
  signal,
}: RequestParams = {}): Promise<ProfileResponse> => {
  try {
    const { data } = await privateApi.get<ProfileResponse>('/profile', {
      signal,
    });

    return data;
  } catch (err) {
    throw asError(err);
  }
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

export const apiUploadProfileImage = async ({
  payload,
  signal,
}: UploadProfileImageParams): Promise<UploadProfileImageResponse> => {
  try {
    const formData = buildProfileImageFormData(payload);

    const { data } = await privateApi.post<UploadProfileImageResponse>(
      '/profile/image',
      formData,
      { signal },
    );

    return data;
  } catch (err) {
    throw asError(err);
  }
};
