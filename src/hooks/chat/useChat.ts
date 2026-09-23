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

/**
 * แชท live ผ่าน Firestore — ใช้ collection "messages" ตัวเดียวกับฝั่งเว็บ
 * เพื่อให้ข้อความ sync ข้ามเว็บ↔แอปแบบ realtime
 *
 * @param streamId  id ของ live (ตัวเดียวกับที่เว็บใช้ในลิงก์ /live/:id)
 * @param canSend   false = โหมดดูอย่างเดียว (เช่นตอนยังต่อไลฟ์ไม่ติด)
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
    );

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const data = snapshot.docs.map(
          d => ({ id: d.id, ...d.data() } as ChatMessage),
        );
        setError(null);
        setMessages(data);
      },
      err => {
        // permission-denied  -> Firestore Security Rules ปฏิเสธ
        // failed-precondition -> ยังไม่มี composite index (streamId + createdAt)
        //                        ตัว message จะมีลิงก์สร้าง index มาให้
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

    // optimistic: ล้างช่องพิมพ์ทันที แล้วค่อยยิงขึ้น Firestore
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
      setInput(text); // คืนข้อความให้ผู้ใช้ลองส่งใหม่
    } finally {
      setSending(false);
    }
  }, [input, streamId, canSend, sending, profile]);

  return { messages, input, setInput, sendMessage, sending, error };
};

export default useChat;
