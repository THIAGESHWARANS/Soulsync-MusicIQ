// server/routes/trends.js — Phase 4
import { Router } from 'express';
import { handleGetTrends } from '../controllers/trendsController.js';
const router = Router();
router.get('/', handleGetTrends);
export default router;
