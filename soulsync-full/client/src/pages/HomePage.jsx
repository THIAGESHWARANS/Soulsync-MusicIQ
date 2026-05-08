// client/src/pages/HomePage.jsx — Phase 4: Trends + Community Feed
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTrends, getTopSongs } from '../services/api.js';

const MOOD_META = {
  love:    { emoji:'❤️', label:'Love',    color:'#fc5c8a', bg:'rgba(252,92,138,0.08)' },
  breakup: { emoji:'💔', label:'Breakup', color:'#5c8afc', bg:'rgba(92,138,252,0.08)' },
  chill:   { emoji:'🌊', label:'Chill',   color:'#5cfcca', bg:'rgba(92,252,202,0.08)' },
  hype:    { emoji:'🔥', label:'Hype',    color:'#fcbf5c', bg:'rgba(252,191,92,0.08)' },
};

// Fallback data so UI never looks empty before API loads
const FALLBACK_TRENDS = [
  { mood:'love',    percentage:78, count:487 },
  { mood:'breakup', percentage:51, count:312 },
  { mood:'chill',   percentage:47, count:289 },
  { mood:'hype',    percentage:26, count:159 },
];
const FALLBACK_SONGS = [
  { songId:'1', title:'Kathal Mazhai', mood:'love',    language:'Tamil',   style:'Carnatic influenced', likes:1200 },
  { songId:'2', title:'Missing You Tonight', mood:'breakup', language:'English',  style:'Pop ballad',         likes:876  },
  { songId:'3', title:'Slow Sunday',   mood:'chill',   language:'Tanglish', style:'Lo-fi / Ambient',    likes:654  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [trends, setTrends] = useState(FALLBACK_TRENDS);
  const [songs,  setSongs]  = useState(FALLBACK_SONGS);
  const [likedIds, setLikedIds] = useState(new Set());

  useEffect(() => {
    getTrends().then(d => { if (d.trends?.length) setTrends(d.trends); }).catch(() => {});
    getTopSongs(6).then(d => { if (d.songs?.length) setSongs(d.songs); }).catch(() => {});
  }, []);

  function toggleLike(id) {
    setLikedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div style={{ background:'#07070f', minHeight:'100vh', paddingTop:64, fontFamily:"'Space Grotesk',sans-serif", color:'#e8e8f0' }}>
      {/* Hero */}
      <div style={{ padding:'90px 32px 60px', textAlign:'center', background:'radial-gradient(ellipse 80% 50% at 50% 0%,rgba(124,92,252,.12) 0%,transparent 70%)' }}>
        <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:'clamp(34px,5.5vw,66px)', fontWeight:800, lineHeight:1.05, marginBottom:20 }}>
          Your feelings become<br/>
          <span style={{ background:'linear-gradient(135deg,#7c5cfc,#c45cfc,#fc5c8a)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>music.</span>
        </h1>
        <p style={{ fontSize:17, color:'#8888aa', maxWidth:500, margin:'0 auto 36px', lineHeight:1.75 }}>
          Share your mood with an artist. Watch AI transform collective emotions into Tamil and English songs — in real time.
        </p>
        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          <button onClick={() => navigate('/create')} style={{ background:'linear-gradient(135deg,#7c5cfc,#c45cfc)', border:'none', color:'#fff', fontFamily:"'Space Grotesk',sans-serif", fontSize:15, fontWeight:600, cursor:'pointer', padding:'14px 32px', borderRadius:100 }}>
            Share your mood
          </button>
          <button onClick={() => navigate('/generate')} style={{ background:'transparent', border:'1px solid rgba(255,255,255,0.2)', color:'#e8e8f0', fontFamily:"'Space Grotesk',sans-serif", fontSize:15, fontWeight:500, cursor:'pointer', padding:'14px 32px', borderRadius:100 }}>
            Generate a song
          </button>
        </div>
      </div>

      {/* Trends */}
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 32px 60px' }}>
        <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:26, fontWeight:700, marginBottom:6 }}>Trending moods right now</h2>
        <p style={{ color:'#8888aa', fontSize:14, marginBottom:26 }}>Live aggregation from the last 24 hours</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:14, marginBottom:52 }}>
          {trends.map(t => {
            const m = MOOD_META[t.mood] || MOOD_META.love;
            return (
              <div key={t.mood} onClick={() => navigate('/create')}
                style={{ background:'rgba(255,255,255,0.04)', border:`1px solid rgba(255,255,255,0.08)`, borderRadius:16, padding:'20px', cursor:'pointer', position:'relative', overflow:'hidden', transition:'transform .2s' }}
                onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'}
                onMouseLeave={e=>e.currentTarget.style.transform='none'}
              >
                <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:m.color, borderRadius:'16px 16px 0 0' }}/>
                <div style={{ fontSize:28, marginBottom:10 }}>{m.emoji}</div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:16, marginBottom:4 }}>{m.label}</div>
                <div style={{ fontSize:12, color:'#8888aa', marginBottom:14 }}>{t.count || '—'} fans feeling this</div>
                <div style={{ background:'rgba(255,255,255,0.07)', borderRadius:100, height:5, marginBottom:8 }}>
                  <div style={{ height:5, borderRadius:100, background:m.color, width:`${t.percentage}%`, transition:'width 1.2s ease' }}/>
                </div>
                <div style={{ fontSize:22, fontWeight:700, color:m.color }}>{t.percentage}%</div>
              </div>
            );
          })}
        </div>

        {/* Community feed */}
        <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:26, fontWeight:700, marginBottom:6 }}>Top community songs</h2>
        <p style={{ color:'#8888aa', fontSize:14, marginBottom:26 }}>Voted and loved by fans like you</p>
        <div style={{ display:'grid', gap:12 }}>
          {songs.map(s => {
            const m = MOOD_META[s.mood] || MOOD_META.love;
            const liked = likedIds.has(s.songId);
            return (
              <div key={s.songId} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:'16px 20px', display:'flex', alignItems:'center', gap:16, transition:'all .2s', cursor:'pointer' }}
                onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.15)'}
                onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'}
              >
                <div style={{ width:48, height:48, borderRadius:10, background:`rgba(${m.color === '#fc5c8a' ? '252,92,138' : m.color === '#5c8afc' ? '92,138,252' : m.color === '#5cfcca' ? '92,252,202' : '252,191,92'},.15)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>
                  {m.emoji}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:600, fontSize:15, marginBottom:3, display:'flex', alignItems:'center', gap:8 }}>
                    {s.title}
                    <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:100, background:`${m.bg}`, color:m.color }}>{m.label}</span>
                  </div>
                  <div style={{ fontSize:12, color:'#8888aa' }}>
                    {s.language} · {s.style}
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                  <button onClick={e=>{e.stopPropagation();toggleLike(s.songId)}}
                    style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, lineHeight:1 }}>
                    {liked ? '❤️' : '🤍'}
                  </button>
                  <span style={{ fontSize:12, color:'#8888aa', minWidth:30 }}>
                    {liked ? (s.likes||0)+1 : s.likes||0}
                  </span>
                  <button onClick={() => navigate('/generate')}
                    style={{ background:'none', border:'none', cursor:'pointer', fontSize:16, lineHeight:1 }}>▶️</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
