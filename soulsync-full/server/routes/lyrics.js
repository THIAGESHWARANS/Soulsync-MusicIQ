// server/routes/lyrics.js — Phase 5
import { Router } from 'express';
import { aiLimiter } from '../middleware/rateLimiter.js';
import { optionalAuth } from '../middleware/auth.js';
import { handleGenerateLyrics, handleGetTopSongs, handleGetSong } from '../controllers/lyricsController.js';

const router = Router();
router.post('/generate', aiLimiter, optionalAuth, handleGenerateLyrics);
router.get('/top',       handleGetTopSongs);
router.get('/:songId',   handleGetSong);
export default router;
