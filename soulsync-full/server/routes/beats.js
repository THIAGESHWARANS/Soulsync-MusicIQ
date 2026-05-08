// server/routes/beats.js — Phase 6
import { Router } from 'express';
import { aiLimiter } from '../middleware/rateLimiter.js';
import { optionalAuth } from '../middleware/auth.js';
import {
  handleGenerateBeat, handleGetTopBeats,
  handleGetBeat, handleRecordPlay, handlePreviewPrompt,
} from '../controllers/beatController.js';

const router = Router();
router.post('/generate',        aiLimiter, optionalAuth, handleGenerateBeat);
router.get('/preview-prompt',   handlePreviewPrompt);
router.get('/top',              handleGetTopBeats);
router.get('/:beatId',          handleGetBeat);
router.post('/:beatId/play',    handleRecordPlay);
export default router;
