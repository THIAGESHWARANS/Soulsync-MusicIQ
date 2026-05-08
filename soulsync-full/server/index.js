// server/index.js — SoulSync backend entry point (Phases 1–6)
import 'dotenv/config';
import express from 'express';
import cors    from 'cors';
import helmet  from 'helmet';
import morgan  from 'morgan';

import { apiLimiter }   from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRouter      from './routes/auth.js';
import emotionsRouter  from './routes/emotions.js';
import trendsRouter    from './routes/trends.js';
import lyricsRouter    from './routes/lyrics.js';
import beatsRouter     from './routes/beats.js';

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Security & parsing ────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.use(express.json({ limit: '16kb' }));
app.use(morgan('dev'));

// ── Health check ──────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({
  status: 'ok',
  timestamp: new Date().toISOString(),
  services: {
    openai:    !!process.env.OPENAI_API_KEY,
    suno:      !!process.env.SUNO_API_KEY,
    replicate: !!process.env.REPLICATE_API_TOKEN,
    firebase:  !!process.env.FIREBASE_PROJECT_ID,
  },
}));

// ── Routes (all rate limited) ─────────────────────────────────
app.use('/api', apiLimiter);
app.use('/api/auth',     authRouter);      // Phase 2
app.use('/api/emotions', emotionsRouter);  // Phase 3
app.use('/api/trends',   trendsRouter);    // Phase 4
app.use('/api/lyrics',   lyricsRouter);    // Phase 5
app.use('/api/beats',    beatsRouter);     // Phase 6

app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`\n🎵  SoulSync server → http://localhost:${PORT}`);
  console.log(`    OpenAI   : ${process.env.OPENAI_API_KEY      ? '✅' : '⚠️  missing'}`);
  console.log(`    Suno     : ${process.env.SUNO_API_KEY        ? '✅' : '⚠️  missing'}`);
  console.log(`    Replicate: ${process.env.REPLICATE_API_TOKEN  ? '✅' : '⚠️  missing'}`);
  console.log(`    Firebase : ${process.env.FIREBASE_PROJECT_ID  ? '✅' : '⚠️  missing'}\n`);
});

export default app;
