import { InventoryFilterResponse } from '../../types/data/inventory/inventory-filter.types';
import { SearchTagResponse } from '../../types/data/inventory/inventory-search.types';
import { publicApi, request } from '../http';

type RequestParams = {
  signal?: AbortSignal;
};

// Get inventory filter options used by the UI.
export const apiGetInventoryFilter = async ({
  signal,
}: RequestParams = {}): Promise<InventoryFilterResponse> => {
  return request(
    publicApi.get<InventoryFilterResponse>('/inventory/filter', { signal }),
  );
};

// Get search tags for quick keyword suggestions.
export const apiGetSearchTag = async ({
  signal,
}: RequestParams = {}): Promise<SearchTagResponse> => {
  return request(publicApi.get<SearchTagResponse>('/search/tag', { signal }));
};
