import { useNavigate } from "react-router-dom";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useAuth } from "../../context/AuthContext";

function DashboardContent() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <main className="min-h-screen bg-[#141312] px-6 py-10 font-serif text-[#e6e1df] sm:px-10">
      <section className="mx-auto max-w-3xl rounded bg-[#1d1b1a] p-8 shadow-2xl sm:p-12">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="font-sans text-xs font-semibold uppercase tracking-widest text-[#a88a83]">
              Dashboard
            </p>
            <h1 className="mt-3 text-4xl tracking-[-0.04em]">
              Welcome, {user?.username ?? "user"}.
            </h1>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded border border-[#ef6540] px-4 py-2 font-sans text-sm font-semibold text-[#ffb4a1] transition-colors hover:bg-[#ef6540]/10"
          >
            Log out
          </button>
        </div>

        <div className="mt-10 border-t border-[#363433] pt-6 font-sans text-sm text-[#e0bfb7]">
          <p>Your account is authenticated.</p>
          <p className="mt-2 text-[#a88a83]">Email: {user?.email ?? "-"}</p>
        </div>
      </section>
    </main>
  );
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
