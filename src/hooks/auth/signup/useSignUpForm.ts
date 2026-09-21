import { yupResolver } from '@hookform/resolvers/yup';
import { logWarn } from '../../../helpers/logger';
import { useCallback, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert } from 'react-native';
import {
  dateToEpochMillisecondsUTC,
  formatDateDDMMYYYY,
  parseDDMMYYYY,
} from '../../../helpers/dateHelper';
import { apiSignUp } from '../../../services/auth/auth';
import { AppColors } from '../../../styles/colors';
import {
  signUpSchema,
  SignUpValues,
} from '../../../validation/auth/signUpSchema';

type UseSignUpFormParams = {
  onPendingActivation?: (email: string) => void;
};

const DEFAULT_VALUES: SignUpValues = {
  email: '',
  firstName: '',
  lastName: '',
  phone: '',
  birthday: '',
  password: '',
  confirmPassword: '',
};

/**
 * Manage sign-up form state, validation, date handling, and submit flow.
 */
export function useSignUpForm(params?: UseSignUpFormParams) {
  const { onPendingActivation } = params || {};

  // React Hook Form setup
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    trigger,
    clearErrors,
    reset,
    formState,
  } = useForm<SignUpValues>({
    resolver: yupResolver(signUpSchema),
    defaultValues: DEFAULT_VALUES,
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  const { isSubmitting, errors, dirtyFields, touchedFields, isSubmitted } =
    formState;

  // UI states
  const [openDate, setOpenDate] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [dobDate, setDobDate] = useState<Date | null>(null);

  // Password helper color (error only after user interaction / submit)
  const showAsError =
    !!errors.password &&
    (dirtyFields.password || touchedFields.password || isSubmitted);
  const helperColor = showAsError ? AppColors.danger : AppColors.white;

  // Convert birthday string (DD/MM/YYYY) to safe Date for date picker
  const rawDate = watch('birthday');
  const safeDate = useMemo(
    () => parseDDMMYYYY(rawDate) ?? new Date(),
    [rawDate],
  );

  // Max selectable date = end of today
  const todayEnd = useMemo(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d;
  }, []);

  // Set birthday from Date picker and sync to form field
  const setBirthdayFromDate = useCallback(
    (d: Date) => {
      if (!d || Number.isNaN(d.getTime())) return;
      setDobDate(d);
      setValue('birthday', formatDateDDMMYYYY(d), {
        shouldValidate: true,
        shouldDirty: true,
      });
    },
    [setValue],
  );

  // Submit sign-up form
  const onSubmit = useCallback(
    async (values: SignUpValues) => {
      try {
        if (!dobDate) return;

        const payload = {
          email: values.email.trim(),
          first_name: values.firstName.trim(),
          last_name: values.lastName.trim(),
          phone_number: values.phone.replace(/\D/g, ''),
          date_of_birth: dateToEpochMillisecondsUTC(dobDate),
          password: values.password,
        };

        const res = await apiSignUp(payload);

        // Not activated yet -> forward to activation flow
        if (res?.is_activate === false) {
          onPendingActivation?.(payload.email);
          reset(DEFAULT_VALUES);
          setDobDate(null);
          setIsChecked(false);
          return;
        }
      } catch (e: any) {
        logWarn('Auth', 'sign up error', e?.message);
        Alert.alert(
          'เกิดข้อผิดพลาด',
          'ไม่สามารถดำเนินการได้ กรุณาลองใหม่อีกครั้งในภายหลัง',
        );
      }
    },
    [dobDate, onPendingActivation, reset],
  );

  return {
    control,
    handleSubmit,
    setValue,
    watch,
    trigger,
    clearErrors,
    isSubmitting,
    isValidating: formState.isValidating,

    openDate,
    setOpenDate,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    isChecked,
    setIsChecked,

    helperColor,
    safeDate,
    todayEnd,
    setBirthdayFromDate,

    onSubmit,
  };
}

export type { SignUpValues };
