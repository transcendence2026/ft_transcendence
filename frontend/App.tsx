import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import ProtectedRoute from './components/ProtectedRoute';

const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <main className="dashboard-shell">
      <section className="panel">
        <p className="eyebrow">Dashboard</p>
        <h1>Welcome back, {user?.username ?? 'player'}.</h1>
        <p className="intro">Your authenticated session is active and your profile information is loaded from the backend.</p>

        <div className="summary-grid">
          <div>
            <span className="label">Username</span>
            <strong>{user?.username ?? 'N/A'}</strong>
          </div>
          <div>
            <span className="label">Email</span>
            <strong>{user?.email ?? 'N/A'}</strong>
          </div>
        </div>

        <button type="button" className="primary-button" onClick={logout}>
          Logout
        </button>
      </section>
    </main>
  );
};

const OAuthCallback = () => {
  const navigate = useNavigate();
  const { completeOAuth } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const username = params.get('username');
    const email = params.get('email');

    if (token) {
      completeOAuth(token, username ? { username, email: email ?? '' } : undefined);
      navigate('/dashboard', { replace: true });
      return;
    }

    navigate('/login', { replace: true });
  }, [completeOAuth, navigate]);

  return <main className="auth-shell"><section className="panel"><p className="eyebrow">Authenticating</p><h1>Signing you in…</h1></section></main>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/oauth/callback" element={<OAuthCallback />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;