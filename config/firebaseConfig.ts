import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBQ3fNtZgFBjqlSFC-rBdjfcUxMZhoN8Og",
  authDomain: "careconnect-56620.firebaseapp.com",
  projectId: "careconnect-56620",
  storageBucket: "careconnect-56620.firebasestorage.app",
  messagingSenderId: "448044170176",
  appId: "1:448044170176:web:b8bf5f25f7183cd0bba625",
  measurementId: "G-KPDV2NXBCG"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
