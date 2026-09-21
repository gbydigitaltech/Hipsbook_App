import { useEffect, useState } from 'react';
import { logError } from '../../helpers/logger';
import { apiGetSearchTag } from '../../services/inventory/inventory';

/**
 * Get search tags once on mount.
 */
export const useSearchTag = () => {
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);

    apiGetSearchTag()
      .then(res => {
        // Use API tag list (fallback to empty array)
        setTags(res?.tag ?? []);
      })
      .catch(err => {
        logError('Course', 'search tag error:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return { tags, loading };
};
