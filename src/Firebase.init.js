// src/Firebase.init.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// On the live site, run the Google/Firebase auth handler on our own domain (proxied by
// vercel.json). Browsers that block third-party storage otherwise lose the sign-in result
// when the site (vercel.app) and authDomain (firebaseapp.com) differ.
const PROD_HOST = "sababa-tours.vercel.app";
const authDomain =
  typeof window !== "undefined" && window.location.hostname === PROD_HOST
    ? PROD_HOST
    : "tour-guide-553b5.firebaseapp.com";

const firebaseConfig = {
  apiKey: "AIzaSyAoj21_CgVl8LA9WUX-IfYIWYPQkzd1iN0",
  authDomain,
  projectId: "tour-guide-553b5",
  storageBucket: "tour-guide-553b5.appspot.com",
  messagingSenderId: "654153106265",
  appId: "1:654153106265:web:0e8cafc6ea37706c458248",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export auth instance
export const auth = getAuth(app);

// Default export for backward compatibility
export default app;
