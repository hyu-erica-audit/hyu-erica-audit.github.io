import { getApp, getApps, initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app-check.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore-lite.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-storage.js";
const firebaseConfig = {
  apiKey: "AIzaSyC2p_mJCAsQ2BsTSkijciVUa33nnQbVmiI",
  authDomain: "hyu-audit.firebaseapp.com",
  projectId: "hyu-audit",
  storageBucket: "hyu-audit.firebasestorage.app",
  messagingSenderId: "189769918625",
  appId: "1:189769918625:web:37c211da612c8fc88da8e0",
  measurementId: "G-3ZX2MSZ1VE"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const appCheckKey = "__hyuAuditFirebaseAppCheck";

if (!globalThis[appCheckKey]) {
  globalThis[appCheckKey] = initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider("6LcP9QMtAAAAAKPWND5Sfoxe7LN4_BYPsn1x8egj"),
    isTokenAutoRefreshEnabled: true
  });
}

export const appCheck = globalThis[appCheckKey];
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
