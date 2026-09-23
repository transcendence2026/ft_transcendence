import React, { createContext, useState, useEffect, type ReactNode } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

interface User {
  username: string;
  email: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  oauth42: () => void;
  completeOAuth: (token: string, user?: User) => void;
  logout: () => void;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? (JSON.parse(storedUser) as User) : null;
  });
  const [loading, setLoading] = useState<boolean>(true);

  // CAPTURAR EL TOKEN DE 42 AL VOLVER DE LA REDIRECCIÓN
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');

    if (urlToken) {
      localStorage.setItem('token', urlToken);
      setToken(urlToken);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // COMPROBACION DE TOKEN INICIAL
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      void axios
        .get<User | { user: User }>(`${API_BASE_URL}/api/auth/me`)
        .then((response) => {
          // Si el backend devuelve { user: ... } usa eso; si devuelve el objeto directo, usa response.data
          const data = response.data as any;
          const nextUser: User = data.user ? data.user : data;

          localStorage.setItem('user', JSON.stringify(nextUser));
          setUser(nextUser);

		  // Si el usuario ya está autenticado y sigue en la pantalla de login, redirige a la vista principal
          if (window.location.pathname === '/login' || window.location.pathname === '/login/') {
            window.location.href = '/';
          }
        })
        .catch((err) => {
          console.error('Error al verificar sesión en /me:', err);
          // Solo borramos si el backend rechaza explícitamente el token con 401 Unauthorized
          if (err.response && err.response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setToken(null);
            setUser(null);
          }
        })
        .finally(() => {
          setLoading(false);
        });
      return;
    }

    delete axios.defaults.headers.common['Authorization'];
    localStorage.removeItem('user');
    setUser(null);
    setLoading(false);
  }, [token]);

  const persistSession = (authToken: string, authUser: User) => {
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(authUser));
    setToken(authToken);
    setUser(authUser);
  };

  const login = async (email: string, password: string) => {
    const res = await axios.post<AuthResponse>(`${API_BASE_URL}/api/auth/login`, { email, password });
    persistSession(res.data.token, res.data.user);
	window.location.href = '/';
  };

  const register = async (username: string, email: string, password: string) => {
    const res = await axios.post<AuthResponse>(`${API_BASE_URL}/api/auth/register`, { username, email, password });
    persistSession(res.data.token, res.data.user);
	window.location.href = '/';
  };

  const oauth42 = () => {
    window.location.href = `${API_BASE_URL}/api/auth/oauth/42`;
  };

  const completeOAuth = (authToken: string, authUser?: User) => {
    const normalizedUser = authUser ?? { username: '42 User', email: '' };
    persistSession(authToken, normalizedUser);
	window.location.href = '/';
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
	window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ token, user, login, register, oauth42, completeOAuth, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};