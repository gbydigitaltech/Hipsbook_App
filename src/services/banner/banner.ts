import { publicApi } from '../http';

type GetBannerParams = {
  signal?: AbortSignal;
};

// Get banner settings from the server.
export const apiGetBanner = async ({ signal }: GetBannerParams = {}) => {
  const { data } = await publicApi.get('/settings/Banner', { signal });
  return data;
};
