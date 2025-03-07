import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics, setAnalyticsCollectionEnabled } from 'firebase/analytics';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyBU0GPDGzO73A6mXtiOWcltmuCfbzhEKm8",
  authDomain: "tucomercio-uy-1e77d.firebaseapp.com",
  projectId: "tucomercio-uy-1e77d",
  storageBucket: "tucomercio-uy-1e77d.firebasestorage.app",
  messagingSenderId: "896329328499",
  appId: "1:896329328499:web:8e99102038477224438706",
  measurementId: "G-3ZXK9NGYZ4"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Habilitar la recolección de analytics
setAnalyticsCollectionEnabled(analytics, true);