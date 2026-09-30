import { useCallback, useEffect, useRef } from 'react';
import { doc, increment, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { logWarn } from '../../helpers/logger';

/** One like-counter doc per live: liveLikes/{streamId} = { count } */
const LIKES = 'liveLikes';
/** Batch rapid taps into a single write (saves writes) */
const FLUSH_MS = 600;
/** Max hearts shown from others per update (keeps the screen from flooding) */
const MAX_BURST = 12;

/**
 * Realtime hearts via Firestore
 * - sendLike(): send a heart (our own heart is shown immediately by the UI)
 * - onRemote(n): called when others sent n hearts (seen by both host and viewers)
 */
export const useLiveLikes = (
  streamId: string | undefined,
  onRemote: (count: number) => void,
) => {
  const pendingRef = useRef(0); // tapped but not written yet
  const ownInFlightRef = useRef(0); // written, waiting for the snapshot echo (not counted as others')
  const lastCountRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onRemoteRef = useRef(onRemote);
  onRemoteRef.current = onRemote;

  useEffect(() => {
    lastCountRef.current = null;
    if (!streamId) return;
    const unsub = onSnapshot(
      doc(db, LIKES, streamId),
      snap => {
        const count = (snap.data()?.count as number | undefined) ?? 0;
        const prev = lastCountRef.current;
        lastCountRef.current = count;
        if (prev == null) return; // first snapshot = initial value, don't play hearts
        let delta = count - prev;
        if (delta <= 0) return;
        // Subtract our own (already played when tapped)
        const own = Math.min(delta, ownInFlightRef.current);
        ownInFlightRef.current -= own;
        delta -= own;
        if (delta > 0) onRemoteRef.current(Math.min(delta, MAX_BURST));
      },
      err => logWarn('Likes', 'onSnapshot', err.code, err.message),
    );
    return () => unsub();
  }, [streamId]);

  const flush = useCallback(async () => {
    timerRef.current = null;
    const n = pendingRef.current;
    pendingRef.current = 0;
    if (!streamId || n <= 0) return;
    ownInFlightRef.current += n;
    try {
      await setDoc(
        doc(db, LIKES, streamId),
        { count: increment(n) },
        { merge: true },
      );
    } catch (e: any) {
      ownInFlightRef.current = Math.max(0, ownInFlightRef.current - n);
      // e.g. Firestore rules don't allow writes to this collection yet -> hearts still show locally
      logWarn('Likes', 'send failed', e?.code, e?.message);
    }
  }, [streamId]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const sendLike = useCallback(() => {
    pendingRef.current += 1;
    if (!timerRef.current) timerRef.current = setTimeout(flush, FLUSH_MS);
  }, [flush]);

  return { sendLike };
};

export default useLiveLikes;
