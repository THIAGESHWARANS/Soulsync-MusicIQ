// client/src/pages/SignupPage.jsx — Phase 2
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function SignupPage() {
  const { signup }  = useAuth();
  const navigate    = useNavigate();

  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [role,     setRole]     = useState('fan');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await signup({ name: name.trim(), email: email.trim(), password, role });
      navigate(role === 'artist' ? '/dashboard' : '/create');
    } catch (err) {
      setError(friendlyError(err.message));
    } finally {
      setLoading(false);
    }
  }

  function friendlyError(msg) {
    if (msg.includes('email-already-in-use')) return 'This email is already registered. Try logging in.';
    if (msg.includes('weak-password')) return 'Password is too weak. Use at least 6 characters.';
    return msg;
  }

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.logo}>SoulSync</div>
        <h2 style={S.heading}>Join SoulSync</h2>
        <p style={S.sub}>Create your free account and start shaping the next song</p>

        {error && <div style={S.errorBox}>{error}</div>}

        {/* Role selector */}
        <div style={S.roleRow}>
          {[{ id:'fan', emoji:'🎤', label:"I'm a Fan" }, { id:'artist', emoji:'🎵', label:"I'm an Artist" }].map(r => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRole(r.id)}
              style={{ ...S.roleBtn, ...(role === r.id ? S.roleBtnActive : {}) }}
            >
              <span style={{ fontSize:20 }}>{r.emoji}</span>
              <span>{r.label}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={S.fieldGroup}>
            <label style={S.label}>Full name</label>
            <input style={S.input} type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" required/>
          </div>
          <div style={S.fieldGroup}>
            <label style={S.label}>Email</label>
            <input style={S.input} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@email.com" required/>
          </div>
          <div style={S.fieldGroup}>
            <label style={S.label}>Password</label>
            <input style={S.input} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Min. 6 characters" required/>
          </div>
          <button style={{ ...S.btn, opacity: loading ? 0.65 : 1 }} type="submit" disabled={loading}>
            {loading ? <><Spinner/> Creating account…</> : 'Create account'}
          </button>
        </form>

        <p style={S.switch}>
          Already have an account? <Link to="/login" style={S.link}>Log in</Link>
        </p>
      </div>
    </div>
  );
}

function Spinner() {
  return <span style={{ display:'inline-block', width:14, height:14, border:'2px solid rgba(255,255,255,.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin .7s linear infinite', marginRight:8, verticalAlign:'middle' }}/>;
}

const S = {
  page: { display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#07070f', padding:24 },
  card: { background:'#0d0d1a', border:'1px solid rgba(255,255,255,0.1)', borderRadius:22, padding:'40px 36px', width:'100%', maxWidth:440, fontFamily:"'Space Grotesk',sans-serif" },
  logo: { fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:22, background:'linear-gradient(135deg,#7c5cfc,#c45cfc)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', marginBottom:24 },
  heading: { fontFamily:"'Syne',sans-serif", fontSize:26, fontWeight:800, color:'#e8e8f0', marginBottom:6 },
  sub:  { fontSize:14, color:'#8888aa', marginBottom:24, lineHeight:1.6 },
  errorBox: { background:'rgba(252,92,92,.1)', border:'1px solid rgba(252,92,92,.3)', borderRadius:11, padding:'12px 14px', color:'#fc7c7c', fontSize:13, marginBottom:20 },
  roleRow: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:22 },
  roleBtn: { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:11, padding:'14px', textAlign:'center', cursor:'pointer', fontFamily:"'Space Grotesk',sans-serif", fontSize:13, fontWeight:600, color:'#8888aa', display:'flex', flexDirection:'column', alignItems:'center', gap:6, transition:'all .2s' },
  roleBtnActive: { borderColor:'#7c5cfc', color:'#7c5cfc', background:'rgba(124,92,252,0.1)' },
  fieldGroup: { marginBottom:16 },
  label: { display:'block', fontSize:11, fontWeight:700, letterSpacing:'.6px', textTransform:'uppercase', color:'#8888aa', marginBottom:8 },
  input: { width:'100%', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:11, padding:'13px 16px', color:'#e8e8f0', fontFamily:"'Space Grotesk',sans-serif", fontSize:14, outline:'none', boxSizing:'border-box' },
  btn: { width:'100%', background:'linear-gradient(135deg,#7c5cfc,#c45cfc)', border:'none', color:'#fff', fontFamily:"'Space Grotesk',sans-serif", fontSize:15, fontWeight:700, cursor:'pointer', padding:17, borderRadius:13, marginTop:8, display:'flex', alignItems:'center', justifyContent:'center' },
  switch: { textAlign:'center', marginTop:20, fontSize:13, color:'#8888aa' },
  link: { color:'#7c5cfc', textDecoration:'none', fontWeight:600 },
};
