// client/src/context/AuthContext.jsx — Phase 2
// Provides Firebase user + Firestore profile to the entire app.
// Wrap your app with <AuthProvider> and consume with useAuth().

import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase.js';
import { registerUser, loginUser } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,        setUser]        = useState(null);   // Firebase Auth user
  const [profile,     setProfile]     = useState(null);   // Firestore profile
  const [loading,     setLoading]     = useState(true);   // waiting for onAuthStateChanged

  // ── Listen to Firebase auth state ──────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Load Firestore profile
        try {
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (snap.exists()) setProfile(snap.data());
        } catch { /* profile may not exist yet */ }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  // ── Sign up ─────────────────────────────────────────────────
  async function signup({ name, email, password, role = 'fan' }) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    // Register profile on backend (sets Firestore doc + custom claim)
    await registerUser({ uid: cred.user.uid, name, email, role });
    // Refresh token to get new custom claims
    await cred.user.getIdToken(true);
    const snap = await getDoc(doc(db, 'users', cred.user.uid));
    setProfile(snap.exists() ? snap.data() : null);
    return cred.user;
  }

  // ── Log in ──────────────────────────────────────────────────
  async function login(email, password) {
    const cred  = await signInWithEmailAndPassword(auth, email, password);
    const token = await cred.user.getIdToken();
    // Verify on backend + get profile
    const data  = await loginUser(token);
    setProfile(data.user);
    return cred.user;
  }

  // ── Log out ─────────────────────────────────────────────────
  async function logout() {
    await signOut(auth);
    setUser(null);
    setProfile(null);
  }

  // ── Get fresh ID token (used by API calls) ──────────────────
  async function getToken() {
    if (!user) return null;
    return user.getIdToken();
  }

  const value = { user, profile, loading, signup, login, logout, getToken };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
