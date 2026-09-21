import { useEffect, useMemo, useState } from 'react';
import {
  apiGetDistrictsByProvince,
  apiGetProvinces,
  apiGetSubdistrictsByDistrict,
} from '../../services/address/address';
import {
  District,
  Province,
  Subdistrict,
} from '../../types/data/address/address.types';

export type PickerItem = { label: string; value: number };

/** Convert to number (invalid => undefined) */
const toNum = (v: unknown): number | undefined => {
  if (v === null || v === undefined || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

/** Get province id from possible key names */
const getProvinceId = (d: any): number =>
  Number(d?.province_id ?? d?.provinceId ?? d?.provinceID ?? d?.province);

/** Get district id from possible key names */
const getDistrictId = (s: any): number =>
  Number(s?.district_id ?? s?.districtId ?? s?.districtID ?? s?.district);

/** Map API rows to picker items */
const toPickerItems = (rows: any[] = []): PickerItem[] =>
  rows.map(row => ({
    label: String(row?.name_th ?? row?.name ?? ''),
    value: Number(row?.id),
  }));

/** Load province/district/subdistrict options + zipcode helper */
export function useAddressOptions(
  selectedProvinceId?: number | null,
  selectedDistrictId?: number | null,
) {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [subdistricts, setSubdistricts] = useState<Subdistrict[]>([]);

  const [loadingProvince, setLoadingProvince] = useState(false);
  const [loadingDistrict, setLoadingDistrict] = useState(false);
  const [loadingSubdistrict, setLoadingSubdistrict] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const pid = toNum(selectedProvinceId);
  const did = toNum(selectedDistrictId);

  // Load provinces once
  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        setLoadingProvince(true);
        const res = await apiGetProvinces(controller.signal);
        setProvinces(res ?? []);
      } catch (e) {
        if ((e as any)?.name !== 'AbortError') setError(e);
      } finally {
        setLoadingProvince(false);
      }
    })();

    return () => controller.abort();
  }, []);

  // Load districts when province changes
  useEffect(() => {
    setDistricts([]);
    setSubdistricts([]);
    if (!pid) return;

    const controller = new AbortController();

    (async () => {
      try {
        setLoadingDistrict(true);
        const res = await apiGetDistrictsByProvince(pid, controller.signal);
        setDistricts((res ?? []).filter((d: any) => getProvinceId(d) === pid));
      } catch (e) {
        if ((e as any)?.name !== 'AbortError') setError(e);
      } finally {
        setLoadingDistrict(false);
      }
    })();

    return () => controller.abort();
  }, [pid]);

  // Load subdistricts when district changes
  useEffect(() => {
    setSubdistricts([]);
    if (!did) return;

    const controller = new AbortController();

    (async () => {
      try {
        setLoadingSubdistrict(true);
        const res = await apiGetSubdistrictsByDistrict(did, controller.signal);
        setSubdistricts(
          (res ?? []).filter((s: any) => getDistrictId(s) === did),
        );
      } catch (e) {
        if ((e as any)?.name !== 'AbortError') setError(e);
      } finally {
        setLoadingSubdistrict(false);
      }
    })();

    return () => controller.abort();
  }, [did]);

  const provinceItems = useMemo(
    () => toPickerItems(provinces as any[]),
    [provinces],
  );
  const districtItems = useMemo(
    () => toPickerItems(districts as any[]),
    [districts],
  );
  const subdistrictItems = useMemo(
    () => toPickerItems(subdistricts as any[]),
    [subdistricts],
  );

  /** Find zipcode by subdistrict id */
  const getZipcodeBySubdistrictId = (subdistrictId?: number | null): string => {
    const sid = toNum(subdistrictId);
    if (!sid) return '';
    const found = subdistricts.find((x: any) => Number(x?.id) === sid);
    return found?.zipcode ?? '';
  };

  return {
    provinceItems,
    districtItems,
    subdistrictItems,
    loadingProvince,
    loadingDistrict,
    loadingSubdistrict,
    error,
    getZipcodeBySubdistrictId,
  };
}
