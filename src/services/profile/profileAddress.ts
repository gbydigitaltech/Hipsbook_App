import {
  AddressItem,
  AddressListResponse,
  CreateAddressPayload,
} from '../../types/data/profile/profileAddress.types';
import { asError } from '../asError';
import { privateApi } from '../http';

type RequestParams = {
  signal?: AbortSignal;
};

type AddressIdParams = RequestParams & {
  id: string;
};

type CreateProfileAddressParams = RequestParams & {
  payload: CreateAddressPayload;
};

type UpdateProfileAddressParams = RequestParams & {
  id: string;
  payload: CreateAddressPayload;
};

// Get all addresses in the current user's profile.
export const apiGetProfileAddress = async ({
  signal,
}: RequestParams = {}): Promise<AddressListResponse> => {
  try {
    const { data } = await privateApi.get<AddressListResponse>(
      '/address/list',
      { signal },
    );

    return data;
  } catch (err) {
    throw asError(err);
  }
};

// Get a single address by its ID.
export const apiGetProfileAddressById = async ({
  id,
  signal,
}: AddressIdParams): Promise<AddressItem> => {
  try {
    const { data } = await privateApi.get<AddressItem>(
      `/address/detail/${id}`,
      { signal },
    );

    return data;
  } catch (err) {
    throw asError(err);
  }
};

// Delete an address by ID.
export const apiDeleteProfileAddress = async ({
  id,
  signal,
}: AddressIdParams): Promise<void> => {
  try {
    await privateApi.delete(`/address/${id}`, { signal });
  } catch (err) {
    throw asError(err);
  }
};

// Create a new address.
export const apiCreateProfileAddress = async ({
  payload,
  signal,
}: CreateProfileAddressParams): Promise<void> => {
  try {
    await privateApi.post('/address', payload, { signal });
  } catch (err) {
    throw asError(err);
  }
};

// Update an existing address by ID.
export const apiUpdateProfileAddress = async ({
  id,
  payload,
  signal,
}: UpdateProfileAddressParams): Promise<void> => {
  try {
    await privateApi.patch(`/address/${id}`, payload, { signal });
  } catch (err) {
    throw asError(err);
  }
};
