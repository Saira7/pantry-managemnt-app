import { initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore, persistentLocalCache } from 'firebase/firestore';
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Use environment variables for sensitive information
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const firestore = initializeFirestore(app, {
  localCache: persistentLocalCache()
});
const auth = getAuth(app);



let analytics;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
  }
}).catch(console.error);

const provider = new GoogleAuthProvider();
export { firestore, analytics, auth, provider };


