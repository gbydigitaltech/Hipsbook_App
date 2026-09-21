import { useCallback, useEffect, useState } from 'react';
import { log } from '../../../helpers/logger';
import { Alert } from 'react-native';
import type { AuthApiError } from '../../../services/auth/auth';
import { apiSendOtp } from '../../../services/auth/auth';
import { useOtpStore } from '../../../stores/otp';

export default function useOtpFlow() {
  const {
    createTime,
    expireTime,
    isRequesting,
    setMeta,
    clearMeta,
    setIsRequesting,
  } = useOtpStore();

  const [remainingMs, setRemainingMs] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize OTP on mount / when expireTime changes:
  // - Reuse current OTP if still valid
  // - Request new OTP if expired or missing
  useEffect(() => {
    const initOtp = async () => {
      try {
        setIsLoading(true);

        // Reuse existing OTP if not expired
        if (expireTime && expireTime > Date.now()) {
          setRemainingMs(Math.max(0, expireTime - Date.now()));
          return;
        }

        // Request a new OTP
        setIsRequesting(true);
        const res = await apiSendOtp();

        if (!res?.create || !res?.expire) {
          throw new Error('Invalid OTP payload from server');
        }

        setMeta(res.create, res.expire);
        setRemainingMs(Math.max(0, res.expire - Date.now()));
      } catch (e) {
        const err = e as AuthApiError;
        const payload =
          err?.responseData ?? (err as any)?.response?.data ?? undefined;

        // Soft-success fallback:
        // Some APIs may return valid create/expire in error payload
        if (payload?.create && payload?.expire) {
          log('OTP', 'init soft-success -> use server payload');
          setMeta(payload.create, payload.expire);
          setRemainingMs(Math.max(0, payload.expire - Date.now()));
          return;
        }

        Alert.alert(
          'เกิดข้อผิดพลาด',
          'ไม่สามารถส่งรหัสยืนยันได้ในขณะนี้ กรุณาลองใหม่อีกครั้งภายหลัง',
        );
      } finally {
        setIsLoading(false);
        setIsRequesting(false);
      }
    };

    initOtp();
  }, [expireTime, setIsRequesting, setMeta]);

  // Start a 1-second countdown timer based on expireTime
  useEffect(() => {
    if (!expireTime) return;

    setRemainingMs(Math.max(0, expireTime - Date.now()));

    const id = setInterval(() => {
      const diff = Math.max(0, expireTime - Date.now());
      setRemainingMs(diff);
      if (diff <= 0) clearInterval(id);
    }, 1000);

    return () => clearInterval(id);
  }, [expireTime]);

  // Resend OTP only when:
  // - timer reached zero
  // - not currently loading
  // - not already requesting
  const handleResend = useCallback(
    async (afterResend?: () => void) => {
      if (remainingMs > 0 || isLoading || isRequesting) return;

      try {
        setIsRequesting(true);
        setIsLoading(true);

        const res = await apiSendOtp();

        if (!res?.create || !res?.expire) {
          throw new Error('Invalid OTP payload from server');
        }

        setMeta(res.create, res.expire);
        setRemainingMs(Math.max(0, res.expire - Date.now()));
        afterResend?.();

        Alert.alert(
          'ส่งรหัสยืนยันใหม่เรียบร้อย',
          'กรุณาตรวจสอบอีเมลของคุณอีกครั้ง',
        );
      } catch (e) {
        const err = e as AuthApiError;
        const payload =
          err?.responseData ?? (err as any)?.response?.data ?? undefined;

        // Soft-success fallback for resend
        if (payload?.create && payload?.expire) {
          log('OTP', 'resend soft-success -> use server payload');
          setMeta(payload.create, payload.expire);
          setRemainingMs(Math.max(0, payload.expire - Date.now()));
          afterResend?.();
          return;
        }

        Alert.alert(
          'เกิดข้อผิดพลาด',
          'ไม่สามารถส่งรหัสใหม่ได้ในขณะนี้ กรุณาลองใหม่อีกครั้งภายหลัง',
        );
      } finally {
        setIsLoading(false);
        setIsRequesting(false);
      }
    },
    [remainingMs, isLoading, isRequesting, setMeta, setIsRequesting],
  );

  // Format milliseconds to "MM : SS"
  const formatTime = useCallback((ms: number) => {
    const total = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${String(m).padStart(2, '0')} : ${String(s).padStart(2, '0')}`;
  }, []);

  return {
    createTime,
    expireTime,
    remainingMs,
    isLoading,
    handleResend,
    formatTime,
    clearMeta,
  };
}
