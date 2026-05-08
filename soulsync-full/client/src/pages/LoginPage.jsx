// client/src/pages/LoginPage.jsx — Phase 2
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const location    = useLocation();
  const from        = location.state?.from?.pathname || '/dashboard';

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(friendlyError(err.message));
    } finally {
      setLoading(false);
    }
  }

  function friendlyError(msg) {
    if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential'))
      return 'Incorrect email or password.';
    if (msg.includes('too-many-requests')) return 'Too many attempts. Please wait a minute.';
    return msg;
  }

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.logo}>SoulSync</div>
        <h2 style={S.heading}>Welcome back</h2>
        <p style={S.sub}>Log in to save your moods and songs</p>

        {error && <div style={S.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={S.fieldGroup}>
            <label style={S.label}>Email</label>
            <input style={S.input} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@email.com" required autoFocus/>
          </div>
          <div style={S.fieldGroup}>
            <label style={S.label}>Password</label>
            <input style={S.input} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required/>
          </div>
          <button style={{ ...S.btn, opacity: loading ? 0.65 : 1 }} type="submit" disabled={loading}>
            {loading ? <><Spinner/> Logging in…</> : 'Log in'}
          </button>
        </form>

        <p style={S.switch}>
          Don't have an account? <Link to="/signup" style={S.link}>Sign up free</Link>
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
  card: { background:'#0d0d1a', border:'1px solid rgba(255,255,255,0.1)', borderRadius:22, padding:'40px 36px', width:'100%', maxWidth:420, fontFamily:"'Space Grotesk',sans-serif" },
  logo: { fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:22, background:'linear-gradient(135deg,#7c5cfc,#c45cfc)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', marginBottom:24 },
  heading: { fontFamily:"'Syne',sans-serif", fontSize:26, fontWeight:800, color:'#e8e8f0', marginBottom:6 },
  sub:  { fontSize:14, color:'#8888aa', marginBottom:28, lineHeight:1.6 },
  errorBox: { background:'rgba(252,92,92,.1)', border:'1px solid rgba(252,92,92,.3)', borderRadius:11, padding:'12px 14px', color:'#fc7c7c', fontSize:13, marginBottom:20 },
  fieldGroup: { marginBottom:16 },
  label: { display:'block', fontSize:11, fontWeight:700, letterSpacing:'.6px', textTransform:'uppercase', color:'#8888aa', marginBottom:8 },
  input: { width:'100%', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:11, padding:'13px 16px', color:'#e8e8f0', fontFamily:"'Space Grotesk',sans-serif", fontSize:14, outline:'none', boxSizing:'border-box' },
  btn: { width:'100%', background:'linear-gradient(135deg,#7c5cfc,#c45cfc)', border:'none', color:'#fff', fontFamily:"'Space Grotesk',sans-serif", fontSize:15, fontWeight:700, cursor:'pointer', padding:17, borderRadius:13, marginTop:8, display:'flex', alignItems:'center', justifyContent:'center' },
  switch: { textAlign:'center', marginTop:20, fontSize:13, color:'#8888aa' },
  link: { color:'#7c5cfc', textDecoration:'none', fontWeight:600 },
};
