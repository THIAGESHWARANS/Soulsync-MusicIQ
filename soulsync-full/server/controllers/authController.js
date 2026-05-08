// server/controllers/authController.js — Phase 2: Authentication
import { getAuth } from 'firebase-admin/auth';
import { getDb, initFirebase } from '../services/firebase.js';

initFirebase();

// POST /api/auth/register
// Called after client creates Firebase Auth account.
// Stores user profile in Firestore and sets custom role claim.
export async function handleRegister(req, res, next) {
  try {
    const { uid, name, email, role = 'fan' } = req.body;

    if (!uid || !name || !email) {
      return res.status(400).json({ error: 'uid, name, and email are required.' });
    }
    if (!['fan', 'artist'].includes(role)) {
      return res.status(400).json({ error: 'role must be "fan" or "artist".' });
    }

    const db = getDb();

    // Store user profile in Firestore
    await db.collection('users').doc(uid).set({
      uid,
      name:      name.trim(),
      email:     email.toLowerCase(),
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Set custom claim so the role is available in ID tokens
    await getAuth().setCustomUserClaims(uid, { role });

    console.log(`✅ User registered: ${email} as ${role}`);
    return res.status(201).json({ success: true, uid, name, email, role });

  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login
// Client sends their Firebase ID token; server verifies and returns profile.
export async function handleLogin(req, res, next) {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ error: 'idToken is required.' });

    const decoded = await getAuth().verifyIdToken(idToken);
    const db      = getDb();
    const userDoc = await db.collection('users').doc(decoded.uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User profile not found. Please register first.' });
    }

    const profile = userDoc.data();
    console.log(`✅ Login: ${profile.email}`);
    return res.json({ success: true, user: profile });

  } catch (err) {
    if (err.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
    next(err);
  }
}

// GET /api/auth/me  (requires requireAuth middleware)
export async function handleGetMe(req, res, next) {
  try {
    const db  = getDb();
    const doc = await db.collection('users').doc(req.user.uid).get();
    if (!doc.exists) return res.status(404).json({ error: 'Profile not found.' });
    return res.json({ user: doc.data() });
  } catch (err) {
    next(err);
  }
}

// PUT /api/auth/me  (requires requireAuth middleware)
export async function handleUpdateMe(req, res, next) {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'name is required.' });

    const db = getDb();
    await db.collection('users').doc(req.user.uid).update({
      name: name.trim(),
      updatedAt: new Date(),
    });
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
