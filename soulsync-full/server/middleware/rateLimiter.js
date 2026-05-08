// server/middleware/rateLimiter.js
import rateLimit from 'express-rate-limit';

// General API — 100 req per 15 min per IP
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a moment.' },
});

// AI generation — 10 req per minute per IP
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI generation rate limit reached. Wait 60 seconds.' },
});
