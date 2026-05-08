// server/controllers/emotionsController.js — Phase 3: Mood Collection
import { getDb } from '../services/firebase.js';

const VALID_MOODS = ['love', 'breakup', 'chill', 'hype'];

// POST /api/emotions
export async function handleSubmitEmotion(req, res, next) {
  try {
    const { mood, text = '', language = 'Tamil' } = req.body;
    const userId = req.user?.uid || null;

    if (!VALID_MOODS.includes(mood)) {
      return res.status(400).json({ error: `Invalid mood. Must be one of: ${VALID_MOODS.join(', ')}` });
    }
    if (text.length > 500) {
      return res.status(400).json({ error: 'Text must be under 500 characters.' });
    }

    const db = getDb();
    const docRef = await db.collection('emotions').add({
      mood,
      text:      text.trim() || null,
      language,
      userId,
      createdAt: new Date(),
    });

    console.log(`📊 Emotion submitted: ${mood} by ${userId || 'anonymous'}`);
    return res.status(201).json({ success: true, emotionId: docRef.id });

  } catch (err) {
    next(err);
  }
}

// GET /api/emotions/mine  (requires auth)
export async function handleGetMyEmotions(req, res, next) {
  try {
    const db   = getDb();
    const snap = await db.collection('emotions')
      .where('userId', '==', req.user.uid)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const emotions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return res.json({ emotions });
  } catch (err) {
    next(err);
  }
}
