import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./src/pages/Login";
import Register from "./components/Register";
import ProtectedRoute from "./components/ProtectedRoute";

const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <main className="grid min-h-screen place-items-center bg-[#141817] px-4 py-8 text-[#f3f0e8]">
      <section className="w-full max-w-130 rounded-[22px] border border-[rgba(128,145,135,0.5)] bg-[rgba(22,28,27,0.92)] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.28)] max-sm:p-5">
        <p className="mb-2 text-[0.78rem] font-medium uppercase tracking-[0.12em] text-[#d8f36b]">
          Dashboard
        </p>
        <h1 className="mb-4 text-[clamp(2.4rem,6vw,4rem)] leading-none tracking-[-0.06em]">
          Welcome back, {user?.username ?? "player"}.
        </h1>
        <p className="mb-6 text-[#d5ddd6]">
          Your authenticated session is active and your profile information is
          loaded from the backend.
        </p>

        <div className="my-6 grid grid-cols-2 gap-4 max-sm:grid-cols-1">
          <div className="flex flex-col gap-2 rounded-[14px] border border-[rgba(122,138,129,0.5)] bg-[rgba(27,35,32,0.9)] p-4">
            <span className="text-[0.82rem] uppercase tracking-[0.04em] text-[#b7c2b9]">
              Username
            </span>
            <strong className="text-[1.1rem]">{user?.username ?? "N/A"}</strong>
          </div>
          <div className="flex flex-col gap-2 rounded-[14px] border border-[rgba(122,138,129,0.5)] bg-[rgba(27,35,32,0.9)] p-4">
            <span className="text-[0.82rem] uppercase tracking-[0.04em] text-[#b7c2b9]">
              Email
            </span>
            <strong className="text-[1.1rem]">{user?.email ?? "N/A"}</strong>
          </div>
        </div>

        <button
          type="button"
          className="mt-2 w-full rounded-xl bg-linear-to-br from-[#d8f36b] to-[#b4df38] px-4 py-[0.95rem] font-semibold text-[#111814] transition-transform hover:-translate-y-px"
          onClick={logout}
        >
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
    const token = params.get("token");
    const username = params.get("username");
    const email = params.get("email");

    if (token) {
      completeOAuth(
        token,
        username ? { username, email: email ?? "" } : undefined,
      );
      navigate("/dashboard", { replace: true });
      return;
    }

    navigate("/login", { replace: true });
  }, [completeOAuth, navigate]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#141817] px-4 py-8 text-[#f3f0e8]">
      <section className="w-full max-w-130 rounded-[22px] border border-[rgba(128,145,135,0.5)] bg-[rgba(22,28,27,0.92)] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.28)] max-sm:p-5">
        <p className="mb-2 text-[0.78rem] font-medium uppercase tracking-[0.12em] text-[#d8f36b]">
          Authenticating
        </p>
        <h1 className="mb-4 text-[clamp(2.4rem,6vw,4rem)] leading-none tracking-[-0.06em]">
          Signing you in…
        </h1>
      </section>
    </main>
  );
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
