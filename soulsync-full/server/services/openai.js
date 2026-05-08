// server/services/openai.js
// PRIMARY:  Groq (FREE) — console.groq.com — 6000 req/day, no credit card
// FALLBACK: Google Gemini (FREE) — aistudio.google.com/apikey — 1500 req/day
// LAST:     OpenAI (paid)

const MOOD_DESCRIPTORS = {
  love:    { emotion: 'romantic love, longing, deep adoration', imagery: 'moonlight, jasmine flowers, rain, gentle waves', poeticTone: 'tender, warm, yearning' },
  breakup: { emotion: 'heartbreak, nostalgia, loss', imagery: 'empty rooms, fading photographs, autumn leaves', poeticTone: 'melancholic, raw, reflective' },
  chill:   { emotion: 'peace, contentment, mindful presence', imagery: 'golden evenings, slow mornings, open windows', poeticTone: 'calm, warm, unhurried' },
  hype:    { emotion: 'fierce energy, ambition, confidence', imagery: 'blazing fire, open roads, rising sun', poeticTone: 'bold, electric, triumphant' },
};
const LANG_INSTRUCTIONS = {
  'Tamil': 'Write entirely in Tamil script. Rich Sangam-era vocabulary. Classical references (mullai, kurinji, neithal). Authentically Tamil.',
  'English': 'Contemporary English. Vivid sensory imagery. Conversational yet poetic like a real songwriter.',
  'Tamil + English (Tanglish)': 'Natural Tanglish mixing Tamil and English mid-sentence. Tamil script for Tamil, Roman for English. Example: "Unnai paarthen, my heart skipped — enna magic?" Effortless.',
};
const STYLE_GUIDANCE = {
  'Carnatic influenced': 'Rich internal rhyme (anuprasa), melodic phrase stretching for Carnatic music.',
  'Hip-hop / Trap': 'Strong rhyme schemes, punchlines, repeating hook with variation.',
  'Lo-fi / Ambient': 'Sparse, impressionistic, short fragmented lines, sensory focus.',
  'Pop ballad': 'Verse-chorus-bridge, singable climactic chorus, deliberate repetition.',
};

function buildMessages(mood, language, style, tempo, userContext, fanCount) {
  const desc   = MOOD_DESCRIPTORS[mood]   || MOOD_DESCRIPTORS.love;
  const langI  = LANG_INSTRUCTIONS[language] || LANG_INSTRUCTIONS['English'];
  const styleG = STYLE_GUIDANCE[style]    || STYLE_GUIDANCE['Pop ballad'];
  const fanCtx  = fanCount > 0 ? `\n${fanCount} real fans submitted "${mood}" mood.` : '';
  const userCtx = userContext?.trim() ? `\nFan wrote: "${userContext.trim()}" — weave this in.` : '';

  const systemPrompt = `You are an award-winning Tamil and English lyricist who wrote for A.R. Rahman and Anirudh. Return ONLY valid JSON — no markdown, no backticks, no text outside the JSON.`;

  const userPrompt = `Generate a complete song. Return ONLY valid JSON.

BRIEF:
- Mood: ${mood} (${desc.emotion})
- Language: ${language}  
- Style: ${style} — ${styleG}
- Tempo: ${tempo}
- Imagery: ${desc.imagery}
- Tone: ${desc.poeticTone}${fanCtx}${userCtx}

LANGUAGE: ${langI}

Return EXACTLY this JSON (nothing else):
{
  "title": "Song title",
  "lyrics": {
    "verse1": ["line1","line2","line3","line4"],
    "chorus": ["line1","line2","line3","line4"],
    "verse2": ["line1","line2","line3","line4"],
    "bridge": ["line1","line2"],
    "outro":  ["line1","line2"]
  },
  "metadata": {
    "rhymeScheme": "ABAB",
    "keyTheme": "one sentence",
    "suggestedRaagOrKey": "e.g. Kharaharapriya",
    "notesForArtist": "one sentence tip"
  }
}`;
  return { systemPrompt, userPrompt };
}

function parseResponse(raw) {
  let clean = raw.trim();
  if (clean.startsWith('```')) clean = clean.replace(/^```(?:json)?\s*/i,'').replace(/```\s*$/,'').trim();
  const start = clean.indexOf('{'); const end = clean.lastIndexOf('}');
  if (start !== -1 && end !== -1) clean = clean.slice(start, end + 1);
  const parsed = JSON.parse(clean);
  if (!parsed.lyrics || !parsed.title) throw new Error('AI response incomplete — retry.');
  return parsed;
}

async function generateWithGroq({ systemPrompt, userPrompt }) {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('GROQ_API_KEY not set');
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type':'application/json', Authorization:`Bearer ${key}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role:'system', content:systemPrompt },{ role:'user', content:userPrompt }],
      temperature: 0.85, max_tokens: 1400,
      response_format: { type:'json_object' },
    }),
  });
  if (!res.ok) { const e=await res.json().catch(()=>({})); throw new Error(`Groq (${res.status}): ${e.error?.message||res.statusText}`); }
  const data = await res.json();
  return { raw: data.choices[0].message.content, tokens: data.usage?.total_tokens, model: data.model };
}

async function generateWithGemini({ systemPrompt, userPrompt }) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY not set');
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({
      contents: [{ parts:[{ text: systemPrompt + '\n\n' + userPrompt }] }],
      generationConfig: { temperature:0.85, maxOutputTokens:1400, responseMimeType:'application/json' },
    }),
  });
  if (!res.ok) { const e=await res.json().catch(()=>({})); throw new Error(`Gemini (${res.status}): ${e.error?.message||res.statusText}`); }
  const data = await res.json();
  const raw  = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error('Gemini returned empty response');
  return { raw, tokens: null, model:'gemini-1.5-flash' };
}

async function generateWithOpenAI({ systemPrompt, userPrompt }) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY not set');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type':'application/json', Authorization:`Bearer ${key}` },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL||'gpt-4o',
      messages: [{ role:'system', content:systemPrompt },{ role:'user', content:userPrompt }],
      temperature:0.88, max_tokens:1200, response_format:{ type:'json_object' },
    }),
  });
  if (!res.ok) { const e=await res.json().catch(()=>({})); throw new Error(`OpenAI (${res.status}): ${e.error?.message||res.statusText}`); }
  const data = await res.json();
  return { raw:data.choices[0].message.content, tokens:data.usage?.total_tokens, model:data.model };
}

export async function generateLyrics({ mood, language, style, tempo, userContext='', fanCount=0 }) {
  const msgs = buildMessages(mood, language, style, tempo, userContext, fanCount);
  const errors = [];

  if (process.env.GROQ_API_KEY) {
    try {
      console.log('🤖 Using Groq (free)...');
      const { raw, tokens, model } = await generateWithGroq(msgs);
      const p = parseResponse(raw);
      console.log(`✅ Groq done | ${model} | ${tokens} tokens`);
      return { title:p.title, lyrics:p.lyrics, metadata:p.metadata||{}, usage:{ totalTokens:tokens, model } };
    } catch(e) { console.warn('⚠️  Groq failed:', e.message); errors.push('Groq: '+e.message); }
  }

  if (process.env.GEMINI_API_KEY) {
    try {
      console.log('🤖 Using Gemini (free)...');
      const { raw, tokens, model } = await generateWithGemini(msgs);
      const p = parseResponse(raw);
      console.log(`✅ Gemini done`);
      return { title:p.title, lyrics:p.lyrics, metadata:p.metadata||{}, usage:{ totalTokens:tokens, model } };
    } catch(e) { console.warn('⚠️  Gemini failed:', e.message); errors.push('Gemini: '+e.message); }
  }

  if (process.env.OPENAI_API_KEY) {
    try {
      console.log('🤖 Using OpenAI (paid)...');
      const { raw, tokens, model } = await generateWithOpenAI(msgs);
      const p = parseResponse(raw);
      console.log(`✅ OpenAI done | ${model}`);
      return { title:p.title, lyrics:p.lyrics, metadata:p.metadata||{}, usage:{ totalTokens:tokens, model } };
    } catch(e) { console.warn('⚠️  OpenAI failed:', e.message); errors.push('OpenAI: '+e.message); }
  }

  throw new Error(`All providers failed:\n${errors.join('\n')}\n\nGet FREE key: console.groq.com → add GROQ_API_KEY to server/.env`);
}
