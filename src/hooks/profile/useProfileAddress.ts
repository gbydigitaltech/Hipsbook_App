import { useCallback, useEffect, useState } from 'react';
import {
  apiDeleteProfileAddress,
  apiGetProfileAddress,
} from '../../services/profile/profileAddress';
import { AddressItem } from '../../types/data/profile/profileAddress.types';

/**
 * Manage profile address list (load, refetch, delete).
 */
export const useAddressesProfile = () => {
  const [items, setItems] = useState<AddressItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** Get profile addresses */
  const getProfileAddress = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const res = await apiGetProfileAddress({ signal });
      setItems(res || []);
      setError(null);
    } catch (e: any) {
      // Ignore request cancellation
      if (e?.name !== 'CanceledError' && e?.name !== 'AbortError') {
        setError(e?.message ?? 'Failed to load addresses');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /** Delete address and update local list */
  const deleteProfileAddress = useCallback(async (id: string) => {
    try {
      setLoading(true);
      await apiDeleteProfileAddress({ id });
      setItems(prev => prev.filter(a => a.id !== id));
    } catch (e: any) {
      setError(e?.message ?? 'Failed to delete address');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    const c = new AbortController();
    getProfileAddress(c.signal);
    return () => c.abort();
  }, [getProfileAddress]);

  return {
    items,
    loading,
    error,
    refetch: getProfileAddress,
    deleteProfileAddress,
  };
};
