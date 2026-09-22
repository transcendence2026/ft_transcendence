import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ComponentPlayground from "./pages/ComponentPlayground";
import Profile from "./pages/Profile";
import { AuthProvider } from "../context/AuthContext";
import { WebSocketProvider } from "../context/WebSocketContext";
import { NotificationProvider } from "../context/NotificationContext";

export default function App() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <NotificationProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/components" element={<ComponentPlayground />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
        </NotificationProvider>
      </WebSocketProvider>
    </AuthProvider>
  );
}
