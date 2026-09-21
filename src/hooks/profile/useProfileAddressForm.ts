import { yupResolver } from '@hookform/resolvers/yup';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SubmitHandler, useForm, useWatch } from 'react-hook-form';
import {
  apiCreateProfileAddress,
  apiGetProfileAddressById,
} from '../../services/profile/profileAddress';
import type {
  AddressForm,
  CreateAddressPayload,
} from '../../types/data/profile/profileAddress.types';
import { profileAddressSchema } from '../../validation/profile/profileAddressSchema';
import { useAddressOptions } from '../address/useAddressOptions';

/** Convert value to number | undefined */
const toNumOrUndef = (v: any): number | undefined =>
  v === null || v === undefined || v === '' ? undefined : Number(v);

/** Convert value to number | null */
const toNumOrNull = (v: any): number | null =>
  v === null || v === undefined || v === '' ? null : Number(v);

/**
 * Manage profile address form:
 * - create/edit form state
 * - province/district/subdistrict dependency handling
 * - address detail hydration in edit mode
 */
export function useProfileAddressForm(editingId?: string) {
  const form = useForm<AddressForm>({
    resolver: yupResolver<AddressForm, any, AddressForm>(profileAddressSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      address: '',
      province: null,
      district: null,
      subdistrict: null,
      zip: '',
    },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  const {
    control,
    reset,
    setValue,
    handleSubmit,
    formState,
    trigger,
    clearErrors,
  } = form;

  // Watch selected ids from form
  const provinceIdRaw = useWatch({ control, name: 'province' });
  const districtIdRaw = useWatch({ control, name: 'district' });
  const subdistrictIdRaw = useWatch({ control, name: 'subdistrict' });

  const provinceId = useMemo(
    () => toNumOrUndef(provinceIdRaw),
    [provinceIdRaw],
  );
  const districtId = useMemo(
    () => toNumOrUndef(districtIdRaw),
    [districtIdRaw],
  );

  // Load dependent address options
  const {
    provinceItems,
    districtItems,
    subdistrictItems,
    loadingProvince,
    loadingDistrict,
    loadingSubdistrict,
    getZipcodeBySubdistrictId,
  } = useAddressOptions(provinceId, districtId);

  // Guard to avoid resetting dependent fields while hydrating edit data
  const hydratingRef = useRef(false);

  // Edit-detail states
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  /** Load address detail in edit mode */
  useEffect(() => {
    if (!editingId) return;

    const c = new AbortController();

    (async () => {
      try {
        setDetailError(null);
        setDetailLoading(true);
        hydratingRef.current = true;

        const d = await apiGetProfileAddressById({ id: editingId, signal: c.signal });

        reset({
          firstName: d.first_name ?? '',
          lastName: d.last_name ?? '',
          phone: d.phone_number ?? '',
          address: d.address ?? '',
          province: toNumOrNull(d.join_Province?.id),
          district: toNumOrNull(d.join_District?.id),
          subdistrict: toNumOrNull(d.join_Subdistrict?.id),
          zip: d.join_Subdistrict?.zip_code ?? (d as any)?.zip_code ?? '',
        });
      } catch (e: any) {
        // Ignore cancellation errors
        if (e?.name !== 'AbortError' && e?.name !== 'CanceledError') {
          setDetailError(e?.message || 'Failed to load address detail');
        }
      } finally {
        setDetailLoading(false);
      }
    })();

    return () => c.abort();
  }, [editingId, reset]);

  /** Release hydration guard when options are ready and selected ids are valid */
  useEffect(() => {
    if (!editingId) return;
    if (!provinceId) return;
    if (loadingDistrict || loadingSubdistrict) return;

    const di = toNumOrUndef(districtIdRaw);
    const si = toNumOrUndef(subdistrictIdRaw);

    const districtExists = di
      ? districtItems.some(it => Number(it.value) === di)
      : true;
    const subdistrictExists = si
      ? subdistrictItems.some(it => Number(it.value) === si)
      : true;

    if (districtExists && subdistrictExists) {
      hydratingRef.current = false;
    }
  }, [
    editingId,
    provinceId,
    districtIdRaw,
    subdistrictIdRaw,
    districtItems,
    subdistrictItems,
    loadingDistrict,
    loadingSubdistrict,
  ]);

  /** Reset district/subdistrict/zip when province changes */
  useEffect(() => {
    if (hydratingRef.current) return;
    setValue('district', null, { shouldValidate: false, shouldDirty: true });
    setValue('subdistrict', null, { shouldValidate: false, shouldDirty: true });
    setValue('zip', '', { shouldValidate: false, shouldDirty: true });
  }, [provinceIdRaw, setValue]);

  /** Reset subdistrict/zip when district changes */
  useEffect(() => {
    if (hydratingRef.current) return;
    setValue('subdistrict', null, { shouldValidate: false, shouldDirty: true });
    setValue('zip', '', { shouldValidate: false, shouldDirty: true });
  }, [districtIdRaw, setValue]);

  /** Auto-fill zip from selected subdistrict */
  useEffect(() => {
    if (hydratingRef.current) return;
    const z = getZipcodeBySubdistrictId(toNumOrUndef(subdistrictIdRaw)) || '';
    setValue('zip', z, { shouldValidate: false });
  }, [subdistrictIdRaw, getZipcodeBySubdistrictId, setValue]);

  const [submitLoading, setSubmitLoading] = useState(false);

  /** Map form model to API payload */
  const mapToPayload = useCallback((v: AddressForm): CreateAddressPayload => {
    if (v.province == null || v.district == null || v.subdistrict == null) {
      throw new Error('Please select province, district, and subdistrict.');
    }

    return {
      first_name: (v.firstName ?? '').trim(),
      last_name: (v.lastName ?? '').trim(),
      phone_number: (v.phone ?? '').trim(),
      address: (v.address ?? '').trim(),
      province_id: String(v.province),
      district_id: String(v.district),
      subdistrict_id: String(v.subdistrict),
    };
  }, []);

  /** Submit create address */
  const onSubmit: SubmitHandler<AddressForm> = useCallback(
    async values => {
      setSubmitLoading(true);
      try {
        const payload = mapToPayload(values);
        await apiCreateProfileAddress({ payload });
      } finally {
        setSubmitLoading(false);
      }
    },
    [mapToPayload],
  );

  // Combined busy state for UI
  const busy =
    formState.isSubmitting ||
    formState.isValidating ||
    submitLoading ||
    detailLoading;

  return {
    control,
    handleSubmit,
    onSubmit,
    trigger,
    clearErrors,
    busy,

    provinceId,
    districtId,

    provinceItems,
    districtItems,
    subdistrictItems,
    loadingProvince,
    loadingDistrict,
    loadingSubdistrict,

    detailLoading,
    detailError,
  };
}
