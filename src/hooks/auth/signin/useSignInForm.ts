// src/hooks/auth/signin/useSignInForm.ts
import { yupResolver } from '@hookform/resolvers/yup';
import { logError } from '../../../helpers/logger';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert } from 'react-native';
import { apiSignIn } from '../../../services/auth/auth';
import {
  signInSchema,
  SignInValues,
} from '../../../validation/auth/signInSchema';

type UseSignInFormParams = {
  onPendingActivation?: (payload: {
    email: string;
    password: string;
    rememberMe: boolean;
  }) => void;
  onSuccess?: (provider?: string) => void;
};

/** Manage sign-in form state, validation, and submit flow */
export function useSignInForm(params?: UseSignInFormParams) {
  const { onPendingActivation, onSuccess } = params || {};
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false); // remember me

  const {
    control,
    handleSubmit,
    trigger,
    clearErrors,
    reset,
    formState: { isSubmitting },
  } = useForm<SignInValues>({
    resolver: yupResolver(signInSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  /** Submit email/password sign-in */
  const onSubmit = useCallback(
    async (values: SignInValues) => {
      try {
        const email = values.email.trim();
        const password = values.password;

        const response = await apiSignIn({
          email,
          password,
          remember_me: isChecked,
        });

        // Account not activated: forward data to OTP activation flow
        if (response?.is_activate === false) {
          onPendingActivation?.({
            email,
            password,
            rememberMe: isChecked,
          });
          reset();
          return;
        }

        // Normal sign-in success
        onSuccess?.(response?.provider);
        reset();
      } catch (err) {
        logError('Auth', 'sign in error', err);
        Alert.alert(
          'ไม่สามารถเข้าสู่ระบบได้',
          'กรุณาตรวจสอบอีเมลหรือรหัสผ่าน แล้วลองใหม่อีกครั้ง',
        );
      }
    },
    [isChecked, onPendingActivation, onSuccess, reset],
  );

  return {
    control,
    handleSubmit,
    trigger,
    clearErrors,
    reset,
    isSubmitting,
    showPassword,
    setShowPassword,
    isChecked,
    setIsChecked,
    onSubmit,
  };
}

export type { SignInValues };
