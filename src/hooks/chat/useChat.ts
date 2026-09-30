import { useCallback, useEffect, useState } from 'react';
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  type Timestamp,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { logError } from '../../helpers/logger';
import { useProfile } from '../../stores/profile';

export type ChatMessage = {
  id: string;
  streamId: string;
  text: string;
  user: string;
  avatar?: string;
  createdAt?: Timestamp | null;
};

const MESSAGES = 'messages';
const MAX_MESSAGES = 100;

/**
 * Live chat via Firestore — uses the same "messages" collection as the web
 * so messages sync between web and app in realtime
 *
 * @param streamId  live id (same one the web uses in /live/:id)
 * @param canSend   false = read-only (e.g. before the live is connected)
 */
export const useChat = (streamId?: string, canSend: boolean = true) => {
  const profile = useProfile(s => s.profile);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!streamId) {
      setMessages([]);
      return;
    }

    const q = query(
      collection(db, MESSAGES),
      where('streamId', '==', streamId),
      orderBy('createdAt', 'asc'),
      // Note: don't use limitToLast() here — Firestore would need a composite index
      // on createdAt DESC which doesn't exist (only streamId + createdAt ASC) -> chat breaks
    );

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const data = snapshot.docs.map(
          d => ({ id: d.id, ...d.data() } as ChatMessage),
        );
        setError(null);
        // Render only the latest messages so the screen/keyboard stays smooth in busy chats
        setMessages(
          data.length > MAX_MESSAGES ? data.slice(-MAX_MESSAGES) : data,
        );
      },
      err => {
        // permission-denied  -> rejected by Firestore Security Rules
        // failed-precondition -> missing composite index (streamId + createdAt)
        //                        the error message includes a link to create it
        logError('Chat', 'onSnapshot', err.code, err.message);
        setError(err.message);
      },
    );

    return () => unsubscribe();
  }, [streamId]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || !streamId || !canSend || sending) return;

    const displayName =
      `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim() ||
      'ผู้ชม';
    const seed = encodeURIComponent(profile?.first_name || 'user');
    const avatar =
      (typeof profile?.profile_image === 'string' && profile.profile_image) ||
      `https://api.dicebear.com/7.x/initials/svg?seed=${seed}`;

    // Optimistic: clear the input right away, then write to Firestore
    setInput('');
    setSending(true);
    try {
      await addDoc(collection(db, MESSAGES), {
        streamId,
        text,
        user: displayName,
        avatar,
        createdAt: serverTimestamp(),
      });
      setError(null);
    } catch (err: any) {
      logError('Chat', 'sendMessage', err?.code, err?.message);
      setError(err?.message ?? 'ส่งข้อความไม่สำเร็จ');
      setInput(text); // restore the text so the user can retry
    } finally {
      setSending(false);
    }
  }, [input, streamId, canSend, sending, profile]);

  return { messages, input, setInput, sendMessage, sending, error };
};

export default useChat;
