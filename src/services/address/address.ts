import {
  DistrictListResponse,
  ProvinceListResponse,
  SubdistrictListResponse,
} from '../../types/data/address/address.types';
import { publicApi, request } from '../http';

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
  return request(publicApi.post('/backoffice/province', {}, { signal }));
};

export const apiGetDistrictsByProvince = (
  provinceId: string | number,
  signal?: AbortSignal,
): Promise<DistrictListResponse> => {
  const pid = toNum(provinceId, 'province ID');

  return request(
    publicApi.post(
      '/backoffice/district',
      // API expects a string id, e.g. "94"
      { province: String(pid) },
      { signal },
    ),
  );
};

export const apiGetSubdistrictsByDistrict = (
  districtId: string | number,
  signal?: AbortSignal,
): Promise<SubdistrictListResponse> => {
  const did = toNum(districtId, 'district ID');

  return request(
    publicApi.post(
      '/backoffice/subdistrict',
      // API expects a string id, e.g. "9410"
      { district: String(did) },
      { signal },
    ),
  );
};
