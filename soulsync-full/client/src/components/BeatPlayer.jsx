// client/src/components/BeatPlayer.jsx — Phase 6
import { useState, useEffect, useRef, useCallback } from 'react';
import { recordPlay } from '../services/api.js';

const MOOD_COLORS = {
  love:    { primary:'#fc5c8a', glow:'rgba(252,92,138,0.35)',  bg:'rgba(252,92,138,0.08)'  },
  breakup: { primary:'#5c8afc', glow:'rgba(92,138,252,0.35)', bg:'rgba(92,138,252,0.08)'  },
  chill:   { primary:'#5cfcca', glow:'rgba(92,252,202,0.35)', bg:'rgba(92,252,202,0.08)'  },
  hype:    { primary:'#fcbf5c', glow:'rgba(252,191,92,0.35)', bg:'rgba(252,191,92,0.08)'  },
};

const PROVIDER_LABELS = { suno:'Suno AI', replicate:'MusicGen', demo:'Demo' };

export default function BeatPlayer({ beat, mood = 'love', onClose }) {
  const audioRef          = useRef(null);
  const [playing,  setPlaying]  = useState(false);
  const [progress, setProgress] = useState(0);
  const [current,  setCurrent]  = useState(0);
  const [duration, setDuration] = useState(beat?.duration || 30);
  const [volume,   setVolume]   = useState(0.8);
  const [muted,    setMuted]    = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const playRecordedRef         = useRef(false);
  const waveAnimRef             = useRef(null);

  const colors = MOOD_COLORS[mood] || MOOD_COLORS.love;

  // Wave bars heights (stable reference)
  const barHeights = useRef(
    Array.from({ length: 44 }, (_, i) =>
      Math.round(12 + Math.sin(i * 0.65) * 14 + Math.sin(i * 1.2) * 9)
    )
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !beat?.audioUrl) return;

    const onMeta  = () => { setLoading(false); setDuration(audio.duration || beat.duration || 30); };
    const onError = () => { setLoading(false); setError('Could not load audio. Check the URL.'); };
    const onEnded = () => { setPlaying(false); setProgress(0); setCurrent(0); stopWave(); };
    const onTime  = () => {
      if (!audio.duration) return;
      const pct = (audio.currentTime / audio.duration) * 100;
      setProgress(pct);
      setCurrent(audio.currentTime);
    };

    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('canplay',        onMeta);
    audio.addEventListener('error',          onError);
    audio.addEventListener('ended',          onEnded);
    audio.addEventListener('timeupdate',     onTime);
    audio.volume = volume;

    return () => {
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('canplay',        onMeta);
      audio.removeEventListener('error',          onError);
      audio.removeEventListener('ended',          onEnded);
      audio.removeEventListener('timeupdate',     onTime);
    };
  }, [beat?.audioUrl]);

  function startWave() {
    stopWave();
    waveAnimRef.current = setInterval(() => {
      document.querySelectorAll('.ss-wave-bar').forEach((bar, i) => {
        const base  = barHeights.current[i] || 20;
        const wiggle = (Math.random() - 0.5) * 8;
        bar.style.height = Math.max(4, base + wiggle) + 'px';
      });
    }, 110);
  }

  function stopWave() {
    if (waveAnimRef.current) clearInterval(waveAnimRef.current);
    document.querySelectorAll('.ss-wave-bar').forEach((bar, i) => {
      bar.style.height = (barHeights.current[i] || 20) + 'px';
    });
  }

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || error) return;
    if (playing) {
      audio.pause(); setPlaying(false); stopWave();
    } else {
      try {
        await audio.play();
        setPlaying(true); startWave();
        if (!playRecordedRef.current && beat?.beatId) {
          recordPlay(beat.beatId);
          playRecordedRef.current = true;
        }
      } catch { setError('Playback blocked. Click play again.'); }
    }
  }, [playing, error, beat]);

  const seek = useCallback((e) => {
    const audio = audioRef.current;
    if (!audio?.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    audio.currentTime = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * audio.duration;
  }, []);

  const skip = useCallback((s) => {
    const audio = audioRef.current;
    if (audio?.duration) audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + s));
  }, []);

  const fmt = (s) => {
    if (!isFinite(s)) return '0:00';
    return `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
  };

  if (!beat) return null;

  return (
    <div style={{ border:`1px solid ${colors.primary}40`, borderRadius:20, padding:'22px 22px 18px', background:`linear-gradient(135deg,${colors.bg} 0%,rgba(13,13,26,0.97) 100%)`, fontFamily:"'Space Grotesk',sans-serif", color:'#e8e8f0' }}>
      <audio ref={audioRef} src={beat.audioUrl} preload="metadata" crossOrigin="anonymous" />

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:18 }}>
        <div style={{ width:10, height:10, borderRadius:'50%', background:colors.primary, boxShadow:`0 0 10px ${colors.glow}`, flexShrink:0 }}/>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:17, marginBottom:3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {beat.title || 'Generated Beat'}
          </div>
          <div style={{ fontSize:12, color:'#8888aa', display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
            <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:100, background:colors.bg, color:colors.primary, border:`1px solid ${colors.primary}50` }}>
              {PROVIDER_LABELS[beat.provider] || 'AI'}
            </span>
            <span>·</span><span>{beat.model || ''}</span>
            <span>·</span><span>{fmt(duration)}</span>
          </div>
        </div>
        {onClose && <button onClick={onClose} style={{ background:'rgba(255,255,255,.07)', border:'none', color:'#8888aa', cursor:'pointer', width:28, height:28, borderRadius:'50%', fontSize:13 }}>✕</button>}
      </div>

      {/* Waveform */}
      <div style={{ display:'flex', alignItems:'center', gap:2, height:52, marginBottom:12, cursor:'pointer' }} onClick={seek}>
        {barHeights.current.map((h, i) => (
          <div
            key={i}
            className="ss-wave-bar"
            style={{ flex:'1 0 0', minWidth:3, height:h+'px', borderRadius:2, background: (i/44)*100 < progress ? colors.primary : 'rgba(255,255,255,0.11)', transition:'background .15s', transformOrigin:'center' }}
          />
        ))}
      </div>

      {/* Progress */}
      <div style={{ cursor:'pointer', padding:'7px 0', marginBottom:2 }} onClick={seek}>
        <div style={{ position:'relative', height:4, background:'rgba(255,255,255,.1)', borderRadius:100 }}>
          <div style={{ position:'absolute', left:0, top:0, bottom:0, width:`${progress}%`, borderRadius:100, background:`linear-gradient(90deg,${colors.primary},${colors.glow.replace('0.35','0.9')})`, transition:'width .1s linear' }}/>
          <div style={{ position:'absolute', top:'50%', left:`calc(${progress}% - 6px)`, width:12, height:12, borderRadius:'50%', background:colors.primary, transform:'translateY(-50%)', transition:'left .1s linear', boxShadow:`0 0 8px ${colors.glow}` }}/>
        </div>
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:18 }}>
        <span style={{ fontSize:11, color:'#8888aa' }}>{fmt(current)}</span>
        <span style={{ fontSize:11, color:'#8888aa' }}>{fmt(duration)}</span>
      </div>

      {/* Controls */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:14, marginBottom:16 }}>
        <button onClick={() => skip(-10)} style={{ background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', color:'#e8e8f0', cursor:'pointer', width:38, height:38, borderRadius:'50%', fontSize:11, fontWeight:600 }}>-10</button>
        <button onClick={togglePlay} disabled={loading && !error}
          style={{ border:'none', width:54, height:54, borderRadius:'50%', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', background:`linear-gradient(135deg,${colors.primary},${colors.glow.replace('0.35','0.8')})`, boxShadow: playing ? `0 0 22px ${colors.glow}` : 'none', transition:'all .25s' }}>
          {loading && !error
            ? <span style={{ width:20, height:20, border:'2px solid rgba(255,255,255,.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin .7s linear infinite', display:'inline-block' }}/>
            : playing
              ? <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
              : <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>
          }
        </button>
        <button onClick={() => skip(10)} style={{ background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', color:'#e8e8f0', cursor:'pointer', width:38, height:38, borderRadius:'50%', fontSize:11, fontWeight:600 }}>+10</button>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginLeft:4 }}>
          <button onClick={() => { const m=!muted; setMuted(m); if(audioRef.current) audioRef.current.muted=m; }} style={{ background:'none', border:'none', cursor:'pointer', fontSize:18 }}>
            {muted || volume===0 ? '🔇' : volume<0.5 ? '🔉' : '🔊'}
          </button>
          <input type="range" min="0" max="1" step="0.05" value={muted?0:volume}
            onChange={e=>{ const v=parseFloat(e.target.value); setVolume(v); if(audioRef.current) audioRef.current.volume=v; }}
            style={{ width:72, accentColor:'#7c5cfc', cursor:'pointer' }}/>
        </div>
      </div>

      {error && <div style={{ background:'rgba(252,92,92,.1)', border:'1px solid rgba(252,92,92,.3)', borderRadius:10, padding:'9px 13px', fontSize:12, color:'#fc7c7c', marginBottom:10 }}>⚠️ {error}</div>}
      {beat.demoNote && <div style={{ background:'rgba(252,191,92,.07)', border:'1px solid rgba(252,191,92,.2)', borderRadius:9, padding:'9px 13px', fontSize:11, color:'#fcbf5c', marginBottom:10 }}>🔧 {beat.demoNote}</div>}
      {beat.prompt && (
        <details style={{ marginBottom:12 }}>
          <summary style={{ fontSize:12, color:'#8888aa', cursor:'pointer' }}>🎼 Music prompt</summary>
          <div style={{ marginTop:8, fontSize:11, color:'#5555aa', background:'rgba(255,255,255,.03)', borderRadius:8, padding:'9px 12px', lineHeight:1.65, fontStyle:'italic' }}>{beat.prompt}</div>
        </details>
      )}
      <div style={{ display:'flex', gap:8 }}>
        <a href={beat.audioUrl} download={(beat.title||'beat')+'.mp3'} target="_blank" rel="noreferrer"
          style={{ flex:1, background:`linear-gradient(135deg,${colors.primary},${colors.glow.replace('0.35','0.8')})`, border:'none', borderRadius:9, color:'#fff', fontFamily:"'Space Grotesk',sans-serif", fontSize:12, fontWeight:700, cursor:'pointer', padding:11, textAlign:'center', textDecoration:'none', display:'block' }}>
          ⬇️ Download
        </a>
        <button onClick={() => navigator.clipboard?.writeText(window.location.origin+'/beat/'+(beat.beatId||''))}
          style={{ flex:1, background:'transparent', border:'1px solid rgba(255,255,255,.12)', borderRadius:9, color:'#8888aa', fontFamily:"'Space Grotesk',sans-serif", fontSize:12, fontWeight:600, cursor:'pointer', padding:11 }}>
          🔗 Share
        </button>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
