import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, persistentLocalCache } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC9f1kDb2b_qaW1Y-F56Vok-7Djicke_Dw",
  authDomain: "personal-finanace-tracke-c26fd.firebaseapp.com",
  projectId: "personal-finanace-tracke-c26fd",
  storageBucket: "personal-finanace-tracke-c26fd.firebasestorage.app",
  messagingSenderId: "118555136487",
  appId: "1:118555136487:web:a10bf5402b6086f5602d42",
  measurementId: "G-QQWSH0X722"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache()
});
