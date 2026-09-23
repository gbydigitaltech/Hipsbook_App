import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
  FIREBASE_MEASUREMENT_ID,
} from '@env';

/**
 * Firebase (web JS SDK) — ใช้ตัวเดียวกับฝั่งเว็บ เพื่อให้แชท live sync
 * ข้ามเว็บ↔แอปได้ (collection "messages" เดียวกัน)
 *
 * ค่า config อ่านจาก .env (FIREBASE_*) — เอาค่าเดียวกับ firebase.ts
 * ของฝั่งเว็บมาใส่ได้เลย ค่าเหล่านี้เป็น public client config ไม่ใช่ secret
 */
const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
  measurementId: FIREBASE_MEASUREMENT_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

/**
 * initializeFirestore + long-polling: จำเป็นบน React Native เพราะ
 * transport แบบ streaming ของ Firestore มักต่อไม่ติดใน Hermes/new arch
 */
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
