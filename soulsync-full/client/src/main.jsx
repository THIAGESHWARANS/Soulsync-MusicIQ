// client/src/main.jsx — App entry point (Phases 1–6)
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Nav           from './components/Nav.jsx';

import HomePage      from './pages/HomePage.jsx';
import LoginPage     from './pages/LoginPage.jsx';
import SignupPage    from './pages/SignupPage.jsx';
import CreatePage    from './pages/CreatePage.jsx';
import GeneratePage  from './pages/GeneratePage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';

// ── Global CSS reset ──────────────────────────────────────────
const globalCSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: #07070f;
    color: #e8e8f0;
    font-family: 'Space Grotesk', sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
  select option { background: #111128; }
  input::placeholder, textarea::placeholder { color: #8888aa; }
  a { color: inherit; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 3px; }
`;
const styleEl = document.createElement('style');
styleEl.textContent = globalCSS;
document.head.appendChild(styleEl);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Nav is always visible, hides itself on /login and /signup */}
        <NavWrapper />
        <Routes>
          {/* Public routes */}
          <Route path="/"         element={<HomePage />} />
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/signup"   element={<SignupPage />} />
          <Route path="/create"   element={<CreatePage />} />
          <Route path="/generate" element={<GeneratePage />} />

          {/* Protected routes (require login) */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }/>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

// Hide Nav on auth pages
function NavWrapper() {
  const path = window.location.pathname;
  if (path === '/login' || path === '/signup') return null;
  return <Nav />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
