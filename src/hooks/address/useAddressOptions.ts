import { useCallback, useEffect, useMemo } from 'react';
import { QueryClient, useQuery, useQueryClient } from '@tanstack/react-query';
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

/*
 * Address data almost never changes, so it is cached for the whole app
 * session: provinces load once, and every district/subdistrict list that was
 * opened before shows instantly the next time.
 */
const ADDRESS_CACHE = {
  staleTime: Infinity,
  gcTime: Infinity,
} as const;

/** How many subdistrict lists to prefetch in parallel */
const PREFETCH_CONCURRENCY = 3;

export const addressKeys = {
  provinces: ['address', 'provinces'] as const,
  districts: (pid: number) => ['address', 'districts', pid] as const,
  subdistricts: (did: number) => ['address', 'subdistricts', did] as const,
};

const fetchProvinces = async (signal?: AbortSignal) =>
  toRows(await apiGetProvinces(signal)) as Province[];

const fetchDistricts = async (pid: number, signal?: AbortSignal) => {
  const rows = toRows(await apiGetDistrictsByProvince(pid, signal));
  const kept = keepChildrenOf(rows, pid, getProvinceId);
  if (kept.length === 0) {
    logWarn(
      'Address',
      `no districts for province=${pid} (raw rows=${rows.length})`,
    );
  } else {
    log('Address', `districts province=${pid} count=${kept.length}`);
  }
  return kept as District[];
};

const fetchSubdistricts = async (did: number, signal?: AbortSignal) => {
  const rows = toRows(await apiGetSubdistrictsByDistrict(did, signal));
  const kept = keepChildrenOf(rows, did, getDistrictId);
  if (kept.length === 0) {
    logWarn(
      'Address',
      `no subdistricts for district=${did} (raw rows=${rows.length})`,
    );
  }
  return kept as Subdistrict[];
};

/** Start loading provinces early (e.g. on the address list screen) */
export const prefetchProvinces = (client: QueryClient) =>
  client.prefetchQuery({
    queryKey: addressKeys.provinces,
    queryFn: ({ signal }) => fetchProvinces(signal),
    ...ADDRESS_CACHE,
  });

/** Load province/district/subdistrict options + zipcode helper */
export function useAddressOptions(
  selectedProvinceId?: number | null,
  selectedDistrictId?: number | null,
) {
  const client = useQueryClient();
  const pid = toNum(selectedProvinceId);
  const did = toNum(selectedDistrictId);

  const provincesQ = useQuery({
    queryKey: addressKeys.provinces,
    queryFn: ({ signal }) => fetchProvinces(signal),
    ...ADDRESS_CACHE,
  });

  const districtsQ = useQuery({
    queryKey: addressKeys.districts(pid ?? 0),
    queryFn: ({ signal }) => fetchDistricts(pid as number, signal),
    enabled: !!pid,
    ...ADDRESS_CACHE,
  });

  const subdistrictsQ = useQuery({
    queryKey: addressKeys.subdistricts(did ?? 0),
    queryFn: ({ signal }) => fetchSubdistricts(did as number, signal),
    enabled: !!did,
    ...ADDRESS_CACHE,
  });

  const districts = useMemo(
    () => (pid ? districtsQ.data ?? [] : []),
    [pid, districtsQ.data],
  );
  const subdistricts = useMemo(
    () => (did ? subdistrictsQ.data ?? [] : []),
    [did, subdistrictsQ.data],
  );

  // Once districts are in, load their subdistricts in the background (a few
  // at a time, so a big province like Bangkok doesn't fire 50 requests at
  // once). Picking a district then shows its list instantly.
  useEffect(() => {
    if (!pid || districts.length === 0) return;
    let cancelled = false;
    const ids = districts
      .map((d: any) => toNum(d?.id))
      .filter((id): id is number => !!id);

    const worker = async () => {
      while (!cancelled && ids.length > 0) {
        const id = ids.shift() as number;
        await client
          .prefetchQuery({
            queryKey: addressKeys.subdistricts(id),
            queryFn: ({ signal }) => fetchSubdistricts(id, signal),
            ...ADDRESS_CACHE,
          })
          .catch(() => {});
      }
    };
    for (let i = 0; i < PREFETCH_CONCURRENCY; i++) worker();

    return () => {
      cancelled = true;
    };
  }, [client, pid, districts]);

  const provinceItems = useMemo(
    () => toPickerItems((provincesQ.data ?? []) as any[]),
    [provincesQ.data],
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
  const getZipcodeBySubdistrictId = useCallback(
    (subdistrictId?: number | null): string => {
      const sid = toNum(subdistrictId);
      if (!sid) return '';
      const found = subdistricts.find((x: any) => Number(x?.id) === sid);
      const z = (found as any)?.zipcode ?? (found as any)?.zip_code ?? '';
      return z ? String(z) : '';
    },
    [subdistricts],
  );

  const firstError =
    provincesQ.error ?? districtsQ.error ?? subdistrictsQ.error ?? null;
  useEffect(() => {
    if (firstError && !isCanceled(firstError)) {
      logWarn('Address', 'load address options failed', firstError);
    }
  }, [firstError]);

  return {
    provinceItems,
    districtItems,
    subdistrictItems,
    // "loading" only when there is nothing cached yet
    loadingProvince: provincesQ.isPending,
    loadingDistrict: !!pid && districtsQ.isPending,
    loadingSubdistrict: !!did && subdistrictsQ.isPending,
    error: firstError,
    getZipcodeBySubdistrictId,
  };
}
