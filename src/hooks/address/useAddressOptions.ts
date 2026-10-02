import { useEffect, useMemo, useState } from 'react';
import { log, logWarn } from '../../helpers/logger';
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

/** Get province id from possible key names (undefined if the row has none) */
const getProvinceId = (d: any): number | undefined =>
  toNum(
    d?.province_id ??
      d?.provinceId ??
      d?.provinceID ??
      d?.join_Province?.id ??
      (typeof d?.province === 'object' ? d?.province?.id : d?.province),
  );

/** Get district id from possible key names (undefined if the row has none) */
const getDistrictId = (s: any): number | undefined =>
  toNum(
    s?.district_id ??
      s?.districtId ??
      s?.districtID ??
      s?.join_District?.id ??
      (typeof s?.district === 'object' ? s?.district?.id : s?.district),
  );

/** Accept a plain array or a wrapped list ({ data: [...] }, { items: [...] }, ...) */
const toRows = (res: any): any[] => {
  if (Array.isArray(res)) return res;
  for (const k of ['data', 'items', 'result', 'rows', 'list']) {
    const v = res?.[k];
    if (Array.isArray(v)) return v;
    if (Array.isArray(v?.data)) return v.data;
  }
  return [];
};

/**
 * The server already filters by parent id. Only drop rows whose parent id is
 * present AND different (rows without a parent field are kept, otherwise a
 * missing field would empty the whole list).
 */
const keepChildrenOf = (
  rows: any[],
  parentId: number,
  getParent: (r: any) => number | undefined,
): any[] =>
  rows.filter(r => {
    const p = getParent(r);
    return p === undefined || p === parentId;
  });

/** Request was aborted (axios/asError use different names/flags) */
const isCanceled = (e: any): boolean =>
  e?.isCanceled === true ||
  e?.name === 'AbortError' ||
  e?.name === 'CanceledError' ||
  e?.code === 'ERR_CANCELED';

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
        setProvinces(toRows(res));
      } catch (e) {
        if (!isCanceled(e)) {
          logWarn('Address', 'load provinces failed', e);
          setError(e);
        }
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
        const rows = toRows(res);
        const kept = keepChildrenOf(rows, pid, getProvinceId);
        if (kept.length === 0) {
          logWarn(
            'Address',
            `no districts for province=${pid} (raw rows=${
              rows.length
            }) sample=${JSON.stringify(Array.isArray(res) ? res[0] : res)}`,
          );
        } else {
          log('Address', `districts province=${pid} count=${kept.length}`);
        }
        setDistricts(kept);
      } catch (e) {
        if (!isCanceled(e)) {
          logWarn('Address', `load districts failed province=${pid}`, e);
          setError(e);
        }
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
        const rows = toRows(res);
        const kept = keepChildrenOf(rows, did, getDistrictId);
        if (kept.length === 0) {
          logWarn(
            'Address',
            `no subdistricts for district=${did} (raw rows=${
              rows.length
            }) sample=${JSON.stringify(Array.isArray(res) ? res[0] : res)}`,
          );
        }
        setSubdistricts(kept);
      } catch (e) {
        if (!isCanceled(e)) {
          logWarn('Address', `load subdistricts failed district=${did}`, e);
          setError(e);
        }
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
    const z = (found as any)?.zipcode ?? (found as any)?.zip_code ?? '';
    return z ? String(z) : '';
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
