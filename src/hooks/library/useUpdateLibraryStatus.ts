import { useCallback, useState } from 'react';
import { log } from '../../helpers/logger';
import { apiUpdateLibraryStatus } from '../../services/library/library';

export const useUpdateLibraryStatus = () => {
  const [isLoading, setIsLoading] = useState(false);

  const updateLibraryStatus = useCallback(
    async ({ libraryId, status }: { libraryId: string; status: string }) => {
      try {
        setIsLoading(true);

        const res = await apiUpdateLibraryStatus({
          libraryId,
          status,
        });

        return res;
      } catch (err: any) {
        if (err?.name === 'AbortError' || err?.name === 'CanceledError') return;
        log('Library', 'updateLibraryStatus error', err?.message ?? err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return {
    isLoading,
    updateLibraryStatus,
  };
};
