import { UpdatePasswordPayload } from '../../types/data/profile/profilePassword.types';
import { asError } from '../asError';
import { privateApi } from '../http';

type UpdatePasswordParams = {
  payload: UpdatePasswordPayload;
  signal?: AbortSignal;
};

// Update current user's password
export const apiUpdatePassword = async ({
  payload,
  signal,
}: UpdatePasswordParams): Promise<void> => {
  try {
    await privateApi.put('/security/password', payload, { signal });
  } catch (err) {
    throw asError(err);
  }
};
