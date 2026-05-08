// server/controllers/trendsController.js — Phase 4: Trend Analytics
import { getDb } from '../services/firebase.js';

// GET /api/trends
export async function handleGetTrends(req, res, next) {
  try {
    const hours  = parseInt(req.query.hours) || 24;
    const since  = new Date(Date.now() - hours * 60 * 60 * 1000);
    const db     = getDb();

    const snap = await db.collection('emotions')
      .where('createdAt', '>=', since)
      .get();

    const counts = { love: 0, breakup: 0, chill: 0, hype: 0 };
    snap.forEach(doc => {
      const { mood } = doc.data();
      if (counts[mood] !== undefined) counts[mood]++;
    });

    const total  = Object.values(counts).reduce((a, b) => a + b, 0);
    const trends = Object.entries(counts)
      .map(([mood, count]) => ({
        mood,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return res.json({ trends, total, since: since.toISOString(), hours });
  } catch (err) {
    next(err);
  }
}
