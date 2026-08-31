import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";

import { auth, googleProvider } from "../firebase";

// =====================================
// EMAIL / PASSWORD — SIGN UP
// =====================================
export const signUpWithEmail = async (name, email, password) => {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  const user = userCredential.user;

  if (name?.trim()) {
    await updateProfile(user, {
      displayName: name.trim(),
    });
  }

  return user;
};

// =====================================
// EMAIL / PASSWORD — LOGIN
// =====================================
export const loginWithEmail = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );

  return userCredential.user;
};

// =====================================
// GOOGLE LOGIN
// =====================================
export const loginWithGoogle = async () => {
  const userCredential = await signInWithPopup(
    auth,
    googleProvider
  );

  return userCredential.user;
};

// =====================================
// LOGOUT
// =====================================
export const logoutUser = async () => {
  await signOut(auth);
};

// =====================================
// AUTH STATE LISTENER
// =====================================
export const observeAuthState = (callback) => {
  return onAuthStateChanged(auth, callback);
};