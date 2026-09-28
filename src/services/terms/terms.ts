import { ToSResponse } from '../../types/data/terms/term.type';
import { asError } from '../asError';
import { publicApi } from '../http';

export const apiGetTermOfService = async ({
  signal,
}: {
  signal?: AbortSignal;
} = {}): Promise<ToSResponse> => {
  try {
    const { data } = await publicApi.post<ToSResponse>(
      '/settings',
      { key: 'ToS' },
      { signal },
    );
    return data;
  } catch (err: unknown) {
    throw asError(err);
  }
};
