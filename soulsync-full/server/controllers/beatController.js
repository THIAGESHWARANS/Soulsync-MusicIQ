// server/controllers/beatController.js — Phase 6: AI Beat Generation
import { generateBeat, buildMusicPrompt } from '../services/beatService.js';
import { getDb } from '../services/firebase.js';

const VALID_MOODS    = ['love','breakup','chill','hype'];
const VALID_STYLES   = ['Carnatic influenced','Hip-hop / Trap','Lo-fi / Ambient','Pop ballad'];
const VALID_TEMPOS   = ['Slow (60–80 BPM)','Medium (90–110 BPM)','Fast (120–140 BPM)'];
const VALID_LANGUAGES = ['Tamil','English','Tamil + English (Tanglish)'];

// POST /api/beats/generate
export async function handleGenerateBeat(req, res, next) {
  try {
    const { mood, style='Carnatic influenced', tempo='Slow (60–80 BPM)', language='Tamil', title='', duration=30, songId=null } = req.body;
    const userId = req.user?.uid || null;

    if (!VALID_MOODS.includes(mood))       return res.status(400).json({ error: 'Invalid mood.' });
    if (!VALID_STYLES.includes(style))     return res.status(400).json({ error: 'Invalid style.' });
    if (!VALID_TEMPOS.includes(tempo))     return res.status(400).json({ error: 'Invalid tempo.' });
    if (!VALID_LANGUAGES.includes(language)) return res.status(400).json({ error: 'Invalid language.' });

    const dur = Math.min(Math.max(parseInt(duration)||30, 15), 120);
    const startTime = Date.now();
    const result    = await generateBeat({ mood, style, language, title: title.trim(), duration: dur });
    const ms        = Date.now() - startTime;

    let beatId = null;
    try {
      const db     = getDb();
      const docRef = await db.collection('beats').add({
        ...result, mood, style, tempo, language, title: title||null,
        userId, songId: songId||null,
        plays: 0, likes: 0, downloads: 0,
        createdAt: new Date(), generationMs: ms,
      });
      beatId = docRef.id;
      if (songId) await db.collection('songs').doc(songId).update({ beatId, beatUrl: result.audioUrl });
    } catch (e) { console.warn('Firestore save failed:', e.message); }

    return res.json({ success:true, beatId, ...result, generationMs: ms });
  } catch (err) { next(err); }
}

// GET /api/beats/top
export async function handleGetTopBeats(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit)||10, 50);
    const db    = getDb();
    const snap  = await db.collection('beats').orderBy('plays','desc').limit(limit).get();
    return res.json({ beats: snap.docs.map(d => ({ beatId:d.id, ...d.data() })) });
  } catch (err) { next(err); }
}

// GET /api/beats/:beatId
export async function handleGetBeat(req, res, next) {
  try {
    const doc = await getDb().collection('beats').doc(req.params.beatId).get();
    if (!doc.exists) return res.status(404).json({ error: 'Beat not found.' });
    return res.json({ beatId:doc.id, ...doc.data() });
  } catch (err) { next(err); }
}

// POST /api/beats/:beatId/play
export async function handleRecordPlay(req, res, next) {
  try {
    const { FieldValue } = await import('firebase-admin/firestore');
    await getDb().collection('beats').doc(req.params.beatId).update({
      plays: FieldValue.increment(1),
    });
    return res.json({ success: true });
  } catch { return res.json({ success: false }); }
}

// GET /api/beats/preview-prompt
export async function handlePreviewPrompt(req, res) {
  const { mood='love', style='Carnatic influenced', language='Tamil', title='' } = req.query;
  return res.json({ prompt: buildMusicPrompt({ mood, style, language, title }) });
}
