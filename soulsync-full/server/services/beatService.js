// server/services/beatService.js
//
// LOCAL MusicGen setup — runs 100% free on your machine, forever.
//
// REQUIRES: Python bridge running on port 5001
//   → cd server && python musicgen_server.py
//   (first run downloads ~1 GB model, subsequent runs load from cache)
//
// FALLBACK: fal.ai API if local bridge isn't running
//   → Add FAL_API_KEY to .env for cloud fallback (free signup credits)

const MOOD_MUSIC = {
  love: {
    genre: 'romantic pop ballad',
    instruments: 'acoustic guitar, piano, soft strings, gentle percussion',
    vibe: 'warm, longing, intimate',
    demoUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  },
  breakup: {
    genre: 'emotional indie pop',
    instruments: 'piano, soft electric guitar, ambient pads, brushed drums',
    vibe: 'melancholic, cathartic',
    demoUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  },
  chill: {
    genre: 'lo-fi chill hop',
    instruments: 'mellow synth, acoustic piano, soft bass, vinyl crackle',
    vibe: 'peaceful, dreamy',
    demoUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  },
  hype: {
    genre: 'high energy trap',
    instruments: '808 bass, trap hi-hats, punchy snares, crowd energy',
    vibe: 'powerful, electric',
    demoUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  },
};

const STYLE_MUSIC = {
  'Carnatic influenced': 'with Carnatic classical elements, veena, mridangam, kanjira, ragam melodic phrases',
  'Hip-hop / Trap':      'hip-hop trap production, 808s, trap hi-hats',
  'Lo-fi / Ambient':     'lo-fi aesthetic, tape warmth, vinyl texture, ambient drift',
  'Pop ballad':          'cinematic pop production, orchestral swells, polished mix',
};

export function buildMusicPrompt({ mood, style, language, title = '' }) {
  const md = MOOD_MUSIC[mood] || MOOD_MUSIC.love;
  const sd = STYLE_MUSIC[style] || '';
  const langHint = language?.includes('Tamil') ? 'South Indian Tamil film music influences, ' : '';
  return [
    `${md.genre} ${sd}`,
    `${langHint}${md.instruments}`,
    md.vibe,
    title ? `inspired by "${title}"` : '',
    'high quality studio production, no vocals, instrumental',
  ].filter(Boolean).join(', ');
}

// ═══════════════════════════════════════════════════════════════════════════
// LOCAL — Python MusicGen bridge on port 5001
// Start it with: python server/musicgen_server.py
// ═══════════════════════════════════════════════════════════════════════════
async function localGenerate(prompt, duration = 30) {
  const BRIDGE_URL = process.env.MUSICGEN_BRIDGE_URL || 'http://127.0.0.1:5001';

  // Quick health check first so we fail fast if bridge isn't running
  try {
    await fetch(`${BRIDGE_URL}/`, { signal: AbortSignal.timeout(2000) });
  } catch {
    throw new Error('Local MusicGen bridge not running — start it with: python server/musicgen_server.py');
  }

  console.log('🎵 Local MusicGen (port 5001)...');

  const res = await fetch(`${BRIDGE_URL}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, duration }),
    signal: AbortSignal.timeout(300_000), // 5 min timeout for slow CPUs
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`MusicGen bridge error (${res.status}): ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  console.log('✅ Local beat ready!');
  return {
    provider: 'local-musicgen',
    audioUrl: data.audioUrl,
    imageUrl: null,
    model: 'musicgen-small',
    duration: data.duration || duration,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// fal.ai CLOUD FALLBACK — used if local bridge isn't running
// Free signup credits, then $0.006/clip. Set FAL_API_KEY in .env to enable.
// ═══════════════════════════════════════════════════════════════════════════
async function falGenerate(prompt, duration = 30) {
  const key = process.env.FAL_API_KEY;
  if (!key) throw new Error('FAL_API_KEY not set');

  console.log('🎵 fal.ai fallback → fal-ai/ace-step');

  const submitRes = await fetch('https://queue.fal.run/fal-ai/ace-step', {
    method: 'POST',
    headers: { Authorization: `Key ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, duration, lyrics: '', guidance_scale: 4 }),
  });

  if (!submitRes.ok) {
    const err = await submitRes.text();
    if (submitRes.status === 401) throw new Error('FAL_API_KEY invalid');
    if (submitRes.status === 402) throw new Error('fal.ai credits exhausted');
    throw new Error(`fal.ai (${submitRes.status}): ${err.slice(0, 200)}`);
  }

  const { request_id } = await submitRes.json();

  for (let i = 0; i < 60; i++) {
    await sleep(3000);
    const pollRes = await fetch(
      `https://queue.fal.run/fal-ai/ace-step/requests/${request_id}/status`,
      { headers: { Authorization: `Key ${key}` } }
    );
    if (!pollRes.ok) continue;
    const status = await pollRes.json();
    console.log(`   Poll ${i + 1}: ${status.status}`);

    if (status.status === 'COMPLETED') {
      const resultRes = await fetch(
        `https://queue.fal.run/fal-ai/ace-step/requests/${request_id}`,
        { headers: { Authorization: `Key ${key}` } }
      );
      const result = await resultRes.json();
      const audioUrl = result?.audio?.url || result?.audio_url || result?.output?.audio?.url;
      if (!audioUrl) throw new Error('fal.ai: no audio URL in response');
      console.log('✅ fal.ai beat ready!');
      return { provider: 'fal', audioUrl, imageUrl: null, model: 'ace-step', duration };
    }
    if (status.status === 'FAILED') throw new Error(`fal.ai failed: ${status.error}`);
  }
  throw new Error('fal.ai timed out');
}

// ═══════════════════════════════════════════════════════════════════════════
// Demo mode fallback
// ═══════════════════════════════════════════════════════════════════════════
function demoGenerate(mood) {
  const md = MOOD_MUSIC[mood] || MOOD_MUSIC.love;
  console.log('🎵 Demo mode — start Python bridge or add FAL_API_KEY for real audio');
  return { provider: 'demo', audioUrl: md.demoUrl, imageUrl: null, model: 'demo', duration: 30, isDemo: true };
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════
export async function generateBeat({ mood, style, language, title, duration = 30 }) {
  const prompt = buildMusicPrompt({ mood, style, language, title });
  console.log(`\n🎵 Beat request | mood:${mood} style:${style} lang:${language}`);
  const errors = [];

  // 1. Try local Python bridge first (free, always)
  try {
    return { ...await localGenerate(prompt, duration), prompt };
  } catch (e) {
    console.warn('⚠️  Local:', e.message);
    errors.push(`Local: ${e.message}`);
  }

  // 2. Try fal.ai cloud fallback
  if (process.env.FAL_API_KEY) {
    try {
      return { ...await falGenerate(prompt, duration), prompt };
    } catch (e) {
      console.warn('⚠️  fal.ai:', e.message);
      errors.push(`fal.ai: ${e.message}`);
    }
  }

  // 3. Demo audio so UI never breaks
  return { ...demoGenerate(mood), prompt, errors };
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
