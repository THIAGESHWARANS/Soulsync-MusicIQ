// client/src/services/api.js — central API layer (Phases 2–6)
import { auth } from './firebase.js';

const BASE = import.meta.env.VITE_API_URL || '/api';

// ── Generic fetch wrapper ─────────────────────────────────────
async function apiFetch(path, options = {}, requireAuth = false) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };

  // Attach Firebase ID token if logged in
  if (requireAuth || auth.currentUser) {
    const token = await auth.currentUser?.getIdToken().catch(() => null);
    if (token) headers['Authorization'] = `Bearer ${token}`;
    else if (requireAuth) throw new Error('Not authenticated');
  }

  const res  = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({ error: `Server error ${res.status}` }));
  if (!res.ok) throw new Error(data.error || `Request failed ${res.status}`);
  return data;
}

// ── Phase 2: Auth ─────────────────────────────────────────────
export const registerUser = (body) =>
  apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(body) });

export const loginUser = (idToken) =>
  apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ idToken }) });

export const getMe = () => apiFetch('/auth/me', {}, true);

export const updateMe = (body) =>
  apiFetch('/auth/me', { method: 'PUT', body: JSON.stringify(body) }, true);

// ── Phase 3: Emotions ─────────────────────────────────────────
export const submitEmotion = (body) =>
  apiFetch('/emotions', { method: 'POST', body: JSON.stringify(body) });

export const getMyEmotions = () => apiFetch('/emotions/mine', {}, true);

// ── Phase 4: Trends ───────────────────────────────────────────
export const getTrends = (hours = 24) => apiFetch(`/trends?hours=${hours}`);

// ── Phase 5: Lyrics ───────────────────────────────────────────
export const generateLyrics = (body) =>
  apiFetch('/lyrics/generate', { method: 'POST', body: JSON.stringify(body) });

export const getTopSongs = (limit = 10) => apiFetch(`/lyrics/top?limit=${limit}`);

export const getSong = (id) => apiFetch(`/lyrics/${id}`);

// ── Phase 6: Beats ────────────────────────────────────────────
export const generateBeat = (body) =>
  apiFetch('/beats/generate', { method: 'POST', body: JSON.stringify(body) });

export const getTopBeats = (limit = 10) => apiFetch(`/beats/top?limit=${limit}`);

export const getBeat = (id) => apiFetch(`/beats/${id}`);

export const recordPlay = (beatId) =>
  apiFetch(`/beats/${beatId}/play`, { method: 'POST' }).catch(() => {});
