// client/src/pages/DashboardPage.jsx — Phase 8: Artist Dashboard
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getTrends, getTopSongs, getMyEmotions } from '../services/api.js';

const MOOD_META = {
  love:    { emoji:'❤️', label:'Love',    color:'#fc5c8a' },
  breakup: { emoji:'💔', label:'Breakup', color:'#5c8afc' },
  chill:   { emoji:'🌊', label:'Chill',   color:'#5cfcca' },
  hype:    { emoji:'🔥', label:'Hype',    color:'#fcbf5c' },
};

export default function DashboardPage() {
  const { profile } = useAuth();
  const navigate    = useNavigate();
  const [trends,      setTrends]      = useState([]);
  const [topSongs,    setTopSongs]    = useState([]);
  const [myEmotions,  setMyEmotions]  = useState([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      getTrends().catch(() => ({ trends:[], total:0 })),
      getTopSongs(5).catch(() => ({ songs:[] })),
      getMyEmotions().catch(() => ({ emotions:[] })),
    ]).then(([t, s, e]) => {
      setTrends(t.trends || []);
      setTopSongs(s.songs || []);
      setMyEmotions(e.emotions || []);
      setLoading(false);
    });
  }, []);

  const totalFans     = 1247;   // would come from analytics in production
  const totalMoods    = myEmotions.length;
  const totalSongs    = topSongs.length;
  const totalLikes    = topSongs.reduce((a, s) => a + (s.likes || 0), 0);

  return (
    <div style={{ background:'#07070f', minHeight:'100vh', paddingTop:64, fontFamily:"'Space Grotesk',sans-serif", color:'#e8e8f0' }}>
      <div style={{ maxWidth:980, margin:'0 auto', padding:'56px 28px' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:18, marginBottom:36 }}>
          <div style={{ width:60, height:60, borderRadius:'50%', background:'linear-gradient(135deg,#7c5cfc,#c45cfc)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26 }}>
            🎵
          </div>
          <div>
            <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:26, fontWeight:800, marginBottom:2 }}>
              {profile?.name ? `${profile.name}'s Dashboard` : 'Artist Dashboard'}
            </h2>
            <p style={{ color:'#8888aa', fontSize:14 }}>
              {profile?.role === 'artist' ? 'Artist account' : 'Fan account'} · Here's what your audience is feeling today
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12, marginBottom:32 }}>
          {[
            { val: totalFans.toLocaleString(), label:'Total fans',        color:'#7c5cfc' },
            { val: totalMoods,                 label:'My mood submissions', color:'#fc5c8a' },
            { val: totalSongs,                 label:'Songs generated',   color:'#5cfcca' },
            { val: totalLikes.toLocaleString(),label:'Total likes',       color:'#fcbf5c' },
          ].map(s => (
            <div key={s.label} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:13, padding:'18px 16px' }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:30, fontWeight:800, marginBottom:3, color:s.color }}>{loading ? '…' : s.val}</div>
              <div style={{ fontSize:12, color:'#8888aa' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Two columns */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>

          {/* Mood breakdown */}
          <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:15, padding:22 }}>
            <h3 style={{ fontWeight:700, fontSize:15, marginBottom:18 }}>Audience mood breakdown</h3>
            {(trends.length ? trends : Object.keys(MOOD_META).map(m=>({mood:m,percentage:0,count:0}))).map(t => {
              const m = MOOD_META[t.mood] || MOOD_META.love;
              return (
                <div key={t.mood} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                  <div style={{ fontSize:14, minWidth:80 }}>{m.emoji} {m.label}</div>
                  <div style={{ flex:1, background:'rgba(255,255,255,0.07)', borderRadius:100, height:8 }}>
                    <div style={{ height:8, borderRadius:100, background:m.color, width:`${t.percentage}%`, transition:'width 1.2s ease' }}/>
                  </div>
                  <div style={{ fontSize:12, fontWeight:700, color:m.color, minWidth:36, textAlign:'right' }}>{t.percentage}%</div>
                </div>
              );
            })}
            <button onClick={() => navigate('/generate')}
              style={{ marginTop:18, width:'100%', background:'linear-gradient(135deg,#7c5cfc,#c45cfc)', border:'none', color:'#fff', fontFamily:"'Space Grotesk',sans-serif", fontSize:13, fontWeight:700, cursor:'pointer', padding:12, borderRadius:10 }}>
              Generate song from top trend →
            </button>
          </div>

          {/* Top songs */}
          <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:15, padding:22 }}>
            <h3 style={{ fontWeight:700, fontSize:15, marginBottom:18 }}>Top songs</h3>
            {topSongs.length === 0 && !loading && (
              <div style={{ textAlign:'center', padding:'28px 0', color:'#555580', fontSize:13 }}>
                No songs yet. <span style={{ color:'#7c5cfc', cursor:'pointer' }} onClick={()=>navigate('/generate')}>Generate one →</span>
              </div>
            )}
            {topSongs.map((s, i) => {
              const m = MOOD_META[s.mood] || MOOD_META.love;
              return (
                <div key={s.songId} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom: i < topSongs.length-1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                  <div style={{ width:34, height:34, borderRadius:8, background:`rgba(${m.color === '#fc5c8a' ? '252,92,138' : m.color === '#5c8afc' ? '92,138,252' : m.color === '#5cfcca' ? '92,252,202' : '252,191,92'},.15)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>{m.emoji}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{s.title}</div>
                    <div style={{ fontSize:11, color:'#8888aa' }}>{s.language} · {s.style}</div>
                  </div>
                  <div style={{ fontSize:12, color:'#8888aa' }}>❤️ {s.likes || 0}</div>
                </div>
              );
            })}
            <button onClick={() => navigate('/generate')}
              style={{ marginTop:16, width:'100%', background:'transparent', border:'1px solid rgba(255,255,255,0.1)', color:'#8888aa', fontFamily:"'Space Grotesk',sans-serif", fontSize:13, fontWeight:600, cursor:'pointer', padding:11, borderRadius:10 }}>
              ✍️ Generate a new song
            </button>
          </div>
        </div>

        {/* My recent mood submissions */}
        {myEmotions.length > 0 && (
          <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:15, padding:22, marginTop:18 }}>
            <h3 style={{ fontWeight:700, fontSize:15, marginBottom:18 }}>My recent mood submissions</h3>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {myEmotions.slice(0, 20).map((e, i) => {
                const m = MOOD_META[e.mood] || MOOD_META.love;
                return (
                  <div key={i} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:9, padding:'7px 12px', fontSize:12, display:'flex', alignItems:'center', gap:6 }}>
                    {m.emoji} {m.label}
                    {e.text && <span style={{ color:'#555580' }}>· "{e.text.slice(0,30)}{e.text.length>30?'…':''}"</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
