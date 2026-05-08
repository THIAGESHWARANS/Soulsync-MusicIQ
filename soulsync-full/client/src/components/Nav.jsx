// client/src/components/Nav.jsx
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Nav() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  const linkStyle = ({ isActive }) => ({
    background: isActive ? 'rgba(124,92,252,0.12)' : 'none',
    border: 'none',
    color: isActive ? '#7c5cfc' : '#8888aa',
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 14, fontWeight: 500,
    cursor: 'pointer', padding: '8px 16px',
    borderRadius: 8, textDecoration: 'none',
    transition: 'all .2s', display: 'inline-block',
  });

  return (
    <nav style={{
      position:'fixed', top:0, left:0, right:0, zIndex:100,
      backdropFilter:'blur(20px)', background:'rgba(7,7,15,0.9)',
      borderBottom:'1px solid rgba(255,255,255,0.08)',
      padding:'0 32px', height:64,
      display:'flex', alignItems:'center', justifyContent:'space-between',
    }}>
      {/* Logo */}
      <div
        onClick={() => navigate('/')}
        style={{
          fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:22, cursor:'pointer',
          background:'linear-gradient(135deg,#7c5cfc,#c45cfc)',
          WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
        }}
      >
        SoulSync
      </div>

      {/* Links */}
      <div style={{ display:'flex', gap:4 }}>
        <NavLink to="/"          style={linkStyle} end>Home</NavLink>
        <NavLink to="/create"    style={linkStyle}>Create</NavLink>
        <NavLink to="/generate"  style={linkStyle}>Generate</NavLink>
        {user && <NavLink to="/dashboard" style={linkStyle}>Dashboard</NavLink>}
      </div>

      {/* Auth */}
      <div style={{ display:'flex', gap:10, alignItems:'center' }}>
        {user ? (
          <>
            <span style={{ fontSize:13, color:'#8888aa' }}>
              {profile?.name || user.email}
              {profile?.role === 'artist' && (
                <span style={{ marginLeft:6, fontSize:10, background:'rgba(124,92,252,.15)', color:'#7c5cfc', padding:'2px 8px', borderRadius:100, fontWeight:700 }}>
                  ARTIST
                </span>
              )}
            </span>
            <button
              onClick={handleLogout}
              style={{ background:'transparent', border:'1px solid rgba(255,255,255,0.15)', color:'#8888aa', fontFamily:"'Space Grotesk',sans-serif", fontSize:13, fontWeight:500, cursor:'pointer', padding:'8px 18px', borderRadius:100, transition:'all .2s' }}
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" style={{ background:'transparent', border:'1px solid rgba(255,255,255,0.15)', color:'#e8e8f0', fontFamily:"'Space Grotesk',sans-serif", fontSize:13, fontWeight:500, cursor:'pointer', padding:'9px 20px', borderRadius:100, textDecoration:'none', transition:'all .2s' }}>
              Log in
            </NavLink>
            <NavLink to="/signup" style={{ background:'linear-gradient(135deg,#7c5cfc,#c45cfc)', border:'none', color:'#fff', fontFamily:"'Space Grotesk',sans-serif", fontSize:13, fontWeight:600, cursor:'pointer', padding:'9px 20px', borderRadius:100, textDecoration:'none' }}>
              Get started
            </NavLink>
          </>
        )}
      </div>
    </nav>
  );
}
