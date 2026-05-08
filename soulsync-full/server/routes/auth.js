// server/routes/auth.js — Phase 2
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { handleRegister, handleLogin, handleGetMe, handleUpdateMe } from '../controllers/authController.js';

const router = Router();
router.post('/register', handleRegister);
router.post('/login',    handleLogin);
router.get('/me',        requireAuth, handleGetMe);
router.put('/me',        requireAuth, handleUpdateMe);
export default router;
