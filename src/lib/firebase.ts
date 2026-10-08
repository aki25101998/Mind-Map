import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';

const defaultFirebaseConfig = {
  apiKey: 'AIzaSyBa-VjXKmN9SsdBEUZTU6hiAojirVLfH5I',
  authDomain: 'mind-map-yoogi-2026.firebaseapp.com',
  projectId: 'mind-map-yoogi-2026',
  storageBucket: 'mind-map-yoogi-2026.firebasestorage.app',
  messagingSenderId: '29280470857',
  appId: '1:29280470857:web:c59547d3b9d4f48fee3c98'
};

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY || defaultFirebaseConfig.apiKey;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || defaultFirebaseConfig.projectId;

export const isFirebaseConfigured = Boolean(apiKey && projectId);

const firebaseConfig = {
  apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || defaultFirebaseConfig.authDomain,
  projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || defaultFirebaseConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || defaultFirebaseConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || defaultFirebaseConfig.appId
};

const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null as any;

export const auth = isFirebaseConfigured ? getAuth(app) : null as any;
export const db = isFirebaseConfigured ? initializeFirestore(app, { ignoreUndefinedProperties: true }) : null as any;

