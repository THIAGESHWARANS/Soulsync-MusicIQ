// server/routes/emotions.js — Phase 3
import { Router } from 'express';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { handleSubmitEmotion, handleGetMyEmotions } from '../controllers/emotionsController.js';

const router = Router();
router.post('/',      optionalAuth, handleSubmitEmotion);
router.get('/mine',   requireAuth,  handleGetMyEmotions);
export default router;
