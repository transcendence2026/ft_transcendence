import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ComponentPlayground from "./pages/ComponentPlayground";
import Profile from "./pages/Profile";
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

              {/* Playground de componentes del equipo */}
              <Route path="/components" element={<ComponentPlayground />} />

              {/* Cualquier otra URL va al dashboard */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </NotificationProvider>
      </WebSocketProvider>
    </AuthProvider>
  );
}