// server/controllers/lyricsController.js — Phase 5: AI Lyrics
import { generateLyrics } from '../services/openai.js';
import { getDb }          from '../services/firebase.js';

const VALID_MOODS    = ['love','breakup','chill','hype'];
const VALID_LANGUAGES = ['Tamil','English','Tamil + English (Tanglish)'];
const VALID_STYLES   = ['Carnatic influenced','Hip-hop / Trap','Lo-fi / Ambient','Pop ballad'];
const VALID_TEMPOS   = ['Slow (60–80 BPM)','Medium (90–110 BPM)','Fast (120–140 BPM)'];

// POST /api/lyrics/generate
export async function handleGenerateLyrics(req, res, next) {
  try {
    const { mood, language='Tamil', style='Carnatic influenced', tempo='Slow (60–80 BPM)', userContext='', fanCount=0 } = req.body;
    const userId   = req.user?.uid   || null;
    const artistId = req.body.artistId || null;

    if (!VALID_MOODS.includes(mood))      return res.status(400).json({ error: 'Invalid mood.' });
    if (!VALID_LANGUAGES.includes(language)) return res.status(400).json({ error: 'Invalid language.' });
    if (!VALID_STYLES.includes(style))    return res.status(400).json({ error: 'Invalid style.' });
    if (!VALID_TEMPOS.includes(tempo))    return res.status(400).json({ error: 'Invalid tempo.' });
    if (userContext?.length > 500)        return res.status(400).json({ error: 'userContext max 500 chars.' });

    const startTime = Date.now();
    const result    = await generateLyrics({ mood, language, style, tempo, userContext, fanCount });
    const ms        = Date.now() - startTime;

    let songId = null;
    try {
      const db     = getDb();
      const docRef = await db.collection('songs').add({
        ...result,
        mood, language, style, tempo, userContext: userContext||null,
        fanCount, userId, artistId,
        likes: 0, shares: 0,
        createdAt: new Date(),
        generationMs: ms,
        tokensUsed: result.usage?.totalTokens || 0,
      });
      songId = docRef.id;
    } catch (e) { console.warn('Firestore save failed:', e.message); }

    return res.json({ success:true, songId, ...result, generationMs: ms });
  } catch (err) { next(err); }
}

// GET /api/lyrics/top
export async function handleGetTopSongs(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit)||10, 50);
    const db    = getDb();
    const snap  = await db.collection('songs').orderBy('likes','desc').limit(limit).get();
    return res.json({ songs: snap.docs.map(d => ({ songId:d.id, ...d.data() })) });
  } catch (err) { next(err); }
}

// GET /api/lyrics/:songId
export async function handleGetSong(req, res, next) {
  try {
    const doc = await getDb().collection('songs').doc(req.params.songId).get();
    if (!doc.exists) return res.status(404).json({ error: 'Song not found.' });
    return res.json({ songId:doc.id, ...doc.data() });
  } catch (err) { next(err); }
}
