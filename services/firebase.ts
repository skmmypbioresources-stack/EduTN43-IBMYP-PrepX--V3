import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth();

// Sign in anonymously in the background so that security rules can authenticate the client securely
signInAnonymously(auth)
  .then(() => {
    console.log("Background anonymous sign-in successful.");
  })
  .catch((err) => {
    console.log("Background anonymous sign-in not available or failed. Operating in guest mode:", err);
  });
