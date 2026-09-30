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
 * Firebase (web JS SDK) — same project as the web so live chat syncs
 * between web and app (same "messages" collection)
 *
 * Config is read from .env (FIREBASE_*) — use the same values as the web's firebase.ts.
 * These are public client config values, not secrets
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
 * initializeFirestore + long-polling: required on React Native because
 * Firestore's streaming transport often fails to connect on Hermes/new arch
 */
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
