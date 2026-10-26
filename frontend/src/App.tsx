import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ComponentPlayground from "./pages/ComponentPlayground";
import Profile from "./pages/Profile";
import Chat from "./pages/Chat";
import Notifications from "./pages/Notifications";
import { TermsOfService } from "./pages/TermsOfService";
import { PrivacyPolicy } from "./pages/PrivacyPolicy";
import { Footer } from "./components/Footer";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { WebSocketProvider } from "../context/WebSocketContext";
import { NotificationProvider } from "../context/NotificationContext";

// Componente para proteger rutas privadas (Dashboard)
function PrivateRoute({ children }: { children: React.ReactElement }) {
  const { token, loading } = useAuth();
  if (loading) return null; // Espera a que termine la comprobación inicial
  return token ? children : <Navigate to="/login" replace />;
}

// Componente para evitar que un usuario ya logueado vuelva a ver Login o Register
function PublicOnlyRoute({ children }: { children: React.ReactElement }) {
  const { token, loading } = useAuth();
  if (loading) return null;
  return token ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <NotificationProvider>
          <BrowserRouter>
            <div className="min-h-screen flex flex-col bg-gray-950 text-white">
              <main className="flex-1">
                <Routes>
                  {/* Rutas exclusivas para invitados */}
                  <Route
                    path="/login"
                    element={
                      <PublicOnlyRoute>
                        <Login />
                      </PublicOnlyRoute>
                    }
                  />
                  <Route
                    path="/register"
                    element={
                      <PublicOnlyRoute>
                        <Register />
                      </PublicOnlyRoute>
                    }
                  />

                  {/* Rutas protegidas para usuarios logueados */}
                  <Route
                    path="/dashboard"
                    element={
                      <PrivateRoute>
                        <Dashboard />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <PrivateRoute>
                        <Profile />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/profile/:id"
                    element={
                      <PrivateRoute>
                        <Profile />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/chat"
                    element={
                      <PrivateRoute>
                        <Chat />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/notifications"
                    element={
                      <PrivateRoute>
                        <Notifications />
                      </PrivateRoute>
                    }
                  />

                  {/* Páginas institucionales públicas */}
                  <Route path="/terms" element={<TermsOfService />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />

                  {/* Playground de componentes del equipo */}
                  <Route path="/components" element={<ComponentPlayground />} />

                  {/* Cualquier otra URL va al dashboard */}
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </main>

              {/* Pie de página accesible en todas las vistas */}
              <Footer />
            </div>
          </BrowserRouter>
        </NotificationProvider>
      </WebSocketProvider>
    </AuthProvider>
  );
}