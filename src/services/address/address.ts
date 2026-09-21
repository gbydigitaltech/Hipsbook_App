import {
  DistrictListResponse,
  ProvinceListResponse,
  SubdistrictListResponse,
} from '../../types/data/address/address.types';
import { privateApi, request } from '../http';

const toNum = (v: string | number, fieldName = 'ID'): number => {
  const n = Number(v);
  if (!Number.isFinite(n)) {
    throw new Error(`Invalid ${fieldName}`);
  }
  return n;
};

export const apiGetProvinces = (
  signal?: AbortSignal,
): Promise<ProvinceListResponse> => {
  return request(privateApi.get('/backoffice/province', { signal }));
};

export const apiGetDistrictsByProvince = (
  provinceId: string | number,
  signal?: AbortSignal,
): Promise<DistrictListResponse> => {
  const pid = toNum(provinceId, 'province ID');

  return request(
    privateApi.get('/backoffice/district', {
      params: { province_id: pid },
      signal,
    }),
  );
};

export const apiGetSubdistrictsByDistrict = (
  districtId: string | number,
  signal?: AbortSignal,
): Promise<SubdistrictListResponse> => {
  const did = toNum(districtId, 'district ID');

  return request(
    privateApi.get('/backoffice/subdistrict', {
      params: { district_id: did },
      signal,
    }),
  );
};
