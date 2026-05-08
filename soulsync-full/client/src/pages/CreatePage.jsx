// client/src/pages/CreatePage.jsx — Phase 3: Mood Submission
import { useState } from 'react';
import { submitEmotion } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

const MOODS = [
  { id:'love',    emoji:'❤️',  label:'Love',    desc:'Romantic · longing · adoration' },
  { id:'breakup', emoji:'💔',  label:'Breakup', desc:'Heartbreak · nostalgia · pain' },
  { id:'chill',   emoji:'🌊',  label:'Chill',   desc:'Peaceful · calm · lo-fi vibes' },
  { id:'hype',    emoji:'🔥',  label:'Hype',    desc:'Energy · excitement · power' },
];
const MOOD_SEL = {
  love:    { border:'#fc5c8a', bg:'rgba(252,92,138,0.1)' },
  breakup: { border:'#5c8afc', bg:'rgba(92,138,252,0.1)' },
  chill:   { border:'#5cfcca', bg:'rgba(92,252,202,0.1)' },
  hype:    { border:'#fcbf5c', bg:'rgba(252,191,92,0.1)' },
};

export default function CreatePage() {
  const { user } = useAuth();
  const [mood,     setMood]     = useState(null);
  const [text,     setText]     = useState('');
  const [language, setLanguage] = useState('Tamil');
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [error,    setError]    = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!mood) { setError('Please select a mood first.'); return; }
    setError(''); setLoading(true);
    try {
      await submitEmotion({ mood, text: text.trim(), language });
      setSuccess(true);
      setTimeout(() => { setSuccess(false); setMood(null); setText(''); }, 3500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ background:'#07070f', minHeight:'100vh', paddingTop:64, fontFamily:"'Space Grotesk',sans-serif", color:'#e8e8f0' }}>
      <div style={{ maxWidth:660, margin:'0 auto', padding:'56px 28px' }}>
        <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:34, fontWeight:800, marginBottom:8 }}>Share your mood</h2>
        <p style={{ color:'#8888aa', marginBottom:36, fontSize:15, lineHeight:1.7 }}>
          Tell us how you're feeling. Your emotion joins thousands of others to inspire the next song.
          {!user && <span style={{ display:'block', marginTop:8, fontSize:13, color:'#555580' }}>You can submit anonymously or <a href="/signup" style={{ color:'#7c5cfc', textDecoration:'none' }}>create an account</a> to save your history.</span>}
        </p>

        {success && (
          <div style={{ background:'rgba(92,252,202,0.08)', border:'1px solid rgba(92,252,202,0.25)', borderRadius:14, padding:'18px 20px', marginBottom:24, textAlign:'center' }}>
            <div style={{ fontSize:28, marginBottom:8 }}>🎉</div>
            <div style={{ fontWeight:700, color:'#5cfcca', marginBottom:4 }}>Mood submitted!</div>
            <div style={{ fontSize:13, color:'#8888aa' }}>You're now part of the next song. Check the Generate page to see it come alive.</div>
          </div>
        )}

        {error && (
          <div style={{ background:'rgba(252,92,92,.1)', border:'1px solid rgba(252,92,92,.3)', borderRadius:11, padding:'12px 14px', color:'#fc7c7c', fontSize:13, marginBottom:20 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Mood selector */}
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'.6px', textTransform:'uppercase', color:'#8888aa', marginBottom:12 }}>How are you feeling?</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:28 }}>
            {MOODS.map(m => {
              const sel = mood === m.id;
              const sc  = MOOD_SEL[m.id];
              return (
                <button key={m.id} type="button" onClick={() => setMood(m.id)}
                  style={{ background: sel ? sc.bg : 'rgba(255,255,255,0.04)', border:`2px solid ${sel ? sc.border : 'rgba(255,255,255,0.1)'}`, borderRadius:14, padding:'18px 12px', cursor:'pointer', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:8, transition:'all .2s', fontFamily:"'Space Grotesk',sans-serif" }}>
                  <span style={{ fontSize:34 }}>{m.emoji}</span>
                  <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:16, color:'#e8e8f0' }}>{m.label}</span>
                  <span style={{ fontSize:12, color:'#8888aa' }}>{m.desc}</span>
                </button>
              );
            })}
          </div>

          {/* Text */}
          <div style={{ marginBottom:20 }}>
            <label style={{ display:'block', fontSize:11, fontWeight:700, letterSpacing:'.6px', textTransform:'uppercase', color:'#8888aa', marginBottom:8 }}>
              Describe your feeling <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0 }}>(optional)</span>
            </label>
            <textarea
              value={text} onChange={e=>setText(e.target.value)} maxLength={500} rows={3}
              placeholder="e.g. Missing someone who lives far away, the rain reminds me of them…"
              style={{ width:'100%', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:11, padding:'13px 16px', color:'#e8e8f0', fontFamily:"'Space Grotesk',sans-serif", fontSize:14, outline:'none', resize:'none', boxSizing:'border-box' }}
            />
            <div style={{ fontSize:11, color:'#555580', textAlign:'right', marginTop:4 }}>{text.length}/500</div>
          </div>

          {/* Language */}
          <div style={{ marginBottom:28 }}>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:'.6px', textTransform:'uppercase', color:'#8888aa', marginBottom:10 }}>Preferred language</div>
            <div style={{ display:'flex', gap:8 }}>
              {['Tamil','English','Both'].map(l => (
                <button key={l} type="button" onClick={() => setLanguage(l === 'Both' ? 'Tamil + English (Tanglish)' : l)}
                  style={{ flex:1, background: language.startsWith(l === 'Both' ? 'Tamil + English' : l) ? 'rgba(124,92,252,0.1)' : 'rgba(255,255,255,0.04)', border:`1px solid ${language.startsWith(l === 'Both' ? 'Tamil + English' : l) ? '#7c5cfc' : 'rgba(255,255,255,0.1)'}`, borderRadius:9, padding:10, cursor:'pointer', fontFamily:"'Space Grotesk',sans-serif", fontSize:13, fontWeight:600, color: language.startsWith(l === 'Both' ? 'Tamil + English' : l) ? '#7c5cfc' : '#8888aa', transition:'all .2s' }}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading}
            style={{ width:'100%', background:'linear-gradient(135deg,#7c5cfc,#c45cfc)', border:'none', color:'#fff', fontFamily:"'Space Grotesk',sans-serif", fontSize:15, fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer', padding:17, borderRadius:13, opacity: loading ? 0.65 : 1, display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
            {loading
              ? <><span style={{ width:16, height:16, border:'2px solid rgba(255,255,255,.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin .7s linear infinite', display:'inline-block' }}/> Submitting…</>
              : 'Submit my mood ✨'}
          </button>
        </form>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
