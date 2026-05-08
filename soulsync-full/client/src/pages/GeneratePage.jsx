// client/src/pages/GeneratePage.jsx — Phase 5 (lyrics) + Phase 6 (beat)
import { useState } from 'react';
import { generateLyrics, generateBeat } from '../services/api.js';
import BeatPlayer from '../components/BeatPlayer.jsx';

const MOODS     = [
  { id:'love',    emoji:'❤️',  label:'Love',    desc:'Romantic · longing' },
  { id:'breakup', emoji:'💔',  label:'Breakup', desc:'Heartbreak · nostalgia' },
  { id:'chill',   emoji:'🌊',  label:'Chill',   desc:'Peaceful · lo-fi' },
  { id:'hype',    emoji:'🔥',  label:'Hype',    desc:'Energy · power' },
];
const LANGUAGES  = ['Tamil','English','Tamil + English (Tanglish)'];
const STYLES     = ['Carnatic influenced','Hip-hop / Trap','Lo-fi / Ambient','Pop ballad'];
const TEMPOS     = ['Slow (60–80 BPM)','Medium (90–110 BPM)','Fast (120–140 BPM)'];
const MOOD_COLORS = {
  love:    { border:'#fc5c8a', bg:'rgba(252,92,138,0.1)' },
  breakup: { border:'#5c8afc', bg:'rgba(92,138,252,0.1)' },
  chill:   { border:'#5cfcca', bg:'rgba(92,252,202,0.1)' },
  hype:    { border:'#fcbf5c', bg:'rgba(252,191,92,0.1)' },
};
const SEC_LABELS  = { verse1:'Verse 1', chorus:'Chorus', verse2:'Verse 2', bridge:'Bridge', outro:'Outro' };
const SEC_COLORS  = { verse1:'#7c5cfc', chorus:'#fc5c8a', verse2:'#7c5cfc', bridge:'#5cfcca', outro:'#fcbf5c' };
const BEAT_STATUS = ['Sending request to music AI…','AI is composing your beat…','Generating instruments and melody…','Applying style and tempo…','Almost done — final mix…'];

export default function GeneratePage() {
  const [mood,        setMood]       = useState('love');
  const [language,    setLanguage]   = useState('Tamil');
  const [style,       setStyle]      = useState('Carnatic influenced');
  const [tempo,       setTempo]      = useState('Slow (60–80 BPM)');
  const [userContext, setUserContext]= useState('');

  const [lyricsResult,  setLyricsResult]  = useState(null);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [lyricsError,   setLyricsError]   = useState('');
  const [lyricsCopied,  setLyricsCopied]  = useState(false);

  const [beatResult,   setBeatResult]   = useState(null);
  const [beatLoading,  setBeatLoading]  = useState(false);
  const [beatError,    setBeatError]    = useState('');
  const [beatStatus,   setBeatStatus]   = useState('');

  async function handleGenerateLyrics() {
    setLyricsLoading(true); setLyricsError('');
    try {
      const data = await generateLyrics({ mood, language, style, tempo, userContext });
      setLyricsResult(data);
    } catch (e) { setLyricsError(e.message); }
    finally { setLyricsLoading(false); }
  }

  async function handleGenerateBeat() {
    setBeatLoading(true); setBeatError(''); setBeatResult(null);
    setBeatStatus(BEAT_STATUS[0]);
    let idx = 0;
    const timer = setInterval(() => {
      idx = (idx + 1) % BEAT_STATUS.length;
      setBeatStatus(BEAT_STATUS[idx]);
    }, 9000);
    try {
      const data = await generateBeat({
        mood, style, tempo, language,
        title: lyricsResult?.title || '',
        duration: 30,
        songId: lyricsResult?.songId || null,
      });
      setBeatResult(data);
    } catch (e) { setBeatError(e.message); }
    finally { clearInterval(timer); setBeatLoading(false); setBeatStatus(''); }
  }

  function copyLyrics() {
    if (!lyricsResult) return;
    const txt = Object.entries(lyricsResult.lyrics || {})
      .map(([s, lines]) => `[${SEC_LABELS[s] || s}]\n${lines.join('\n')}`)
      .join('\n\n');
    navigator.clipboard.writeText(`${lyricsResult.title}\n\n${txt}`).catch(() => {});
    setLyricsCopied(true);
    setTimeout(() => setLyricsCopied(false), 2000);
  }

  return (
    <div style={{ background:'#07070f', minHeight:'100vh', paddingTop:64, fontFamily:"'Space Grotesk',sans-serif", color:'#e8e8f0' }}>
      <div style={{ maxWidth:1080, margin:'0 auto', padding:'56px 28px' }}>
        <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:34, fontWeight:800, marginBottom:8 }}>Generate a song</h2>
        <p style={{ color:'#8888aa', marginBottom:32, fontSize:15, lineHeight:1.7 }}>
          AI writes lyrics and composes a beat — driven by your audience's collective mood.
        </p>

        {/* ── Settings panel ─────────────────────── */}
        <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:18, padding:'24px', marginBottom:24 }}>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:18 }}>⚙️ Settings</div>

          {/* Mood */}
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'.6px', textTransform:'uppercase', color:'#8888aa', marginBottom:10 }}>Mood</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:18 }}>
            {MOODS.map(m => {
              const sel = mood === m.id;
              const sc  = MOOD_COLORS[m.id];
              return (
                <button key={m.id} onClick={() => setMood(m.id)}
                  style={{ background: sel ? sc.bg : 'rgba(255,255,255,0.04)', border:`2px solid ${sel ? sc.border : 'rgba(255,255,255,0.1)'}`, borderRadius:12, padding:'14px 8px', cursor:'pointer', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:6, fontFamily:"'Space Grotesk',sans-serif", transition:'all .2s' }}>
                  <span style={{ fontSize:24 }}>{m.emoji}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:'#e8e8f0' }}>{m.label}</span>
                  <span style={{ fontSize:11, color:'#8888aa' }}>{m.desc}</span>
                </button>
              );
            })}
          </div>

          {/* Selects */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
            {[['Language', LANGUAGES, language, setLanguage], ['Music style', STYLES, style, setStyle]].map(([lbl, opts, val, set]) => (
              <div key={lbl}>
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:'.6px', textTransform:'uppercase', color:'#8888aa', marginBottom:8 }}>{lbl}</div>
                <select value={val} onChange={e=>set(e.target.value)}
                  style={{ width:'100%', background:'#111128', border:'1px solid rgba(255,255,255,0.1)', borderRadius:9, padding:'11px 13px', color:'#e8e8f0', fontFamily:"'Space Grotesk',sans-serif", fontSize:13, cursor:'pointer', outline:'none' }}>
                  {opts.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:'.6px', textTransform:'uppercase', color:'#8888aa', marginBottom:8 }}>Tempo</div>
              <select value={tempo} onChange={e=>setTempo(e.target.value)}
                style={{ width:'100%', background:'#111128', border:'1px solid rgba(255,255,255,0.1)', borderRadius:9, padding:'11px 13px', color:'#e8e8f0', fontFamily:"'Space Grotesk',sans-serif", fontSize:13, cursor:'pointer', outline:'none' }}>
                {TEMPOS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:'.6px', textTransform:'uppercase', color:'#8888aa', marginBottom:8 }}>Fan feeling (optional)</div>
              <input value={userContext} onChange={e=>setUserContext(e.target.value)} maxLength={500}
                placeholder="e.g. Missing someone far away…"
                style={{ width:'100%', background:'#111128', border:'1px solid rgba(255,255,255,0.1)', borderRadius:9, padding:'11px 13px', color:'#e8e8f0', fontFamily:"'Space Grotesk',sans-serif", fontSize:13, outline:'none', boxSizing:'border-box' }}/>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <button onClick={handleGenerateLyrics} disabled={lyricsLoading}
              style={{ background:'linear-gradient(135deg,#7c5cfc,#c45cfc)', border:'none', color:'#fff', fontFamily:"'Space Grotesk',sans-serif", fontSize:14, fontWeight:700, cursor: lyricsLoading ? 'not-allowed' : 'pointer', padding:15, borderRadius:11, opacity: lyricsLoading ? 0.65 : 1, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              {lyricsLoading ? <><Spinner/> Composing…</> : '✍️ Generate lyrics'}
            </button>
            <button onClick={handleGenerateBeat} disabled={beatLoading}
              style={{ background:'linear-gradient(135deg,#fc5c8a,#fc915c)', border:'none', color:'#fff', fontFamily:"'Space Grotesk',sans-serif", fontSize:14, fontWeight:700, cursor: beatLoading ? 'not-allowed' : 'pointer', padding:15, borderRadius:11, opacity: beatLoading ? 0.65 : 1, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              {beatLoading ? <><Spinner/> {beatStatus}</> : '🎵 Generate beat'}
            </button>
          </div>
        </div>

        {/* ── Results side by side ─────────────────── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:22 }}>

          {/* Left: Lyrics */}
          <div>
            {lyricsError && <ErrBox msg={lyricsError}/>}
            {lyricsResult ? (
              <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:18, padding:24 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20, gap:12 }}>
                  <div>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, marginBottom:4 }}>{lyricsResult.title}</div>
                    <div style={{ fontSize:12, color:'#8888aa' }}>{mood} · {language} · {lyricsResult.usage?.totalTokens || 0} tokens</div>
                  </div>
                  <button onClick={copyLyrics}
                    style={{ background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.12)', borderRadius:9, color:'#e8e8f0', fontFamily:"'Space Grotesk',sans-serif", fontSize:12, fontWeight:600, cursor:'pointer', padding:'8px 14px', whiteSpace:'nowrap' }}>
                    {lyricsCopied ? '✅ Copied' : '📋 Copy'}
                  </button>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:20, maxHeight:400, overflowY:'auto', marginBottom:16 }}>
                  {Object.entries(lyricsResult.lyrics || {}).map(([sec, lines]) => (
                    <div key={sec} style={{ borderLeft:`2px solid rgba(255,255,255,0.08)`, paddingLeft:16 }}>
                      <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'1px', color:SEC_COLORS[sec]||'#7c5cfc', marginBottom:8 }}>{SEC_LABELS[sec]||sec}</div>
                      {lines.map((l,i) => <div key={i} style={{ fontSize:15, lineHeight:2.1, fontStyle:'italic', color:'#dcdcf0' }}>{l}</div>)}
                    </div>
                  ))}
                </div>
                {lyricsResult.metadata && (
                  <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, padding:'14px 16px' }}>
                    {[['Theme', lyricsResult.metadata.keyTheme],['Key / Raag', lyricsResult.metadata.suggestedRaagOrKey],['Artist note', lyricsResult.metadata.notesForArtist]].filter(([,v])=>v).map(([k,v]) => (
                      <div key={k} style={{ marginBottom:8 }}>
                        <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.5px', color:'#8888aa', marginBottom:2 }}>{k}</div>
                        <div style={{ fontSize:13, color:'#c8c8e8' }}>{v}</div>
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={handleGenerateLyrics} disabled={lyricsLoading}
                  style={{ width:'100%', marginTop:14, background:'transparent', border:'1px solid rgba(255,255,255,0.1)', color:'#8888aa', fontFamily:"'Space Grotesk',sans-serif", fontSize:13, fontWeight:600, cursor:'pointer', padding:12, borderRadius:10 }}>
                  🔄 Regenerate
                </button>
              </div>
            ) : (
              <Placeholder icon="✍️" text="Lyrics will appear here" sub="Click 'Generate lyrics' to create a song from the audience's mood"/>
            )}
          </div>

          {/* Right: Beat */}
          <div>
            {beatLoading && (
              <div style={{ background:'rgba(252,191,92,0.07)', border:'1px solid rgba(252,191,92,0.2)', borderRadius:10, padding:'11px 14px', fontSize:12, color:'#fcbf5c', lineHeight:1.7, marginBottom:12 }}>
                ⏱ Beat generation takes 30–90 seconds. The AI is composing your music in real time.
              </div>
            )}
            {beatError && <ErrBox msg={beatError}/>}
            {beatResult
              ? <BeatPlayer beat={beatResult} mood={mood} onClose={() => setBeatResult(null)}/>
              : <Placeholder icon="🎧" text="Beat will appear here" sub={lyricsResult ? `Ready to compose a beat for "${lyricsResult.title}"` : "Generate lyrics first, then create a matching beat"}/>
            }
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function Spinner() {
  return <span style={{ width:14, height:14, border:'2px solid rgba(255,255,255,.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin .7s linear infinite', display:'inline-block' }}/>;
}
function ErrBox({ msg }) {
  return <div style={{ background:'rgba(252,92,92,.1)', border:'1px solid rgba(252,92,92,.25)', borderRadius:12, padding:'14px 16px', fontSize:13, color:'#fc7c7c', marginBottom:14 }}>⚠️ {msg}</div>;
}
function Placeholder({ icon, text, sub }) {
  return (
    <div style={{ background:'rgba(255,255,255,0.03)', border:'2px dashed rgba(255,255,255,0.08)', borderRadius:18, padding:'44px 24px', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
      <div style={{ fontSize:44, opacity:.3 }}>{icon}</div>
      <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:15, color:'#5555aa' }}>{text}</div>
      <div style={{ fontSize:12, color:'#444466', maxWidth:240, lineHeight:1.6 }}>{sub}</div>
    </div>
  );
}
