import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB0-dGQ_hOULBLAqTqT30KhGKj1ryhEiTY",
  authDomain: "designai-27c11.firebaseapp.com",
  projectId: "designai-27c11",
  storageBucket: "designai-27c11.firebasestorage.app",
  messagingSenderId: "180154712417",
  appId: "1:180154712417:web:4356d83725df9f03340520",
  measurementId: "G-5EVTSBXT55"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app;