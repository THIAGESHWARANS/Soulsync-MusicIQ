// server/middleware/auth.js
// Phase 2 — Verifies Firebase ID tokens sent in Authorization header
// Usage: router.get('/protected', requireAuth, handler)

import { getAuth } from 'firebase-admin/auth';
import { initFirebase } from '../services/firebase.js';

initFirebase(); // ensure Firebase Admin is initialised

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  try {
    const decoded = await getAuth().verifyIdToken(token);
    req.user = {
      uid:   decoded.uid,
      email: decoded.email,
      role:  decoded.role || 'fan',   // custom claim set at registration
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
  }
}

// Optional auth — attaches user if token present, continues either way
export async function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try {
      const decoded = await getAuth().verifyIdToken(token);
      req.user = { uid: decoded.uid, email: decoded.email, role: decoded.role || 'fan' };
    } catch { /* ignore */ }
  }
  next();
}
