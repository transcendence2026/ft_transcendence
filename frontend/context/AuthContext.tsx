import React, { createContext, useState, useEffect, type ReactNode } from 'react';
import axios from 'axios';

// 1. Configuración global: permite que viajen las cookies HttpOnly en todas las peticiones
axios.defaults.withCredentials = true;

export interface LoginResponse {
    message?: string;
    requiresTwoFactor?: boolean;
    userId?: string;
    user?: User;
}

export interface User {
    id?: string;
    username: string;
    email: string;
    role?: string;
    isTwoFactorEnabled?: boolean;
}

interface AuthResponse {
	token: string;
  	accessToken?: string;
  	user: User;
}

interface AuthContextType {
    user: User | null;
    token: string | null; // Mantenido para evitar errores en componentes que aún lo busquen
    isAuthenticated: boolean;
    loading: boolean;
    login: (email: string, password: string) => Promise<LoginResponse>;
    register: (username: string, email: string, password: string) => Promise<void>;
    oauth42: () => void;
    completeOAuth: () => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    // 2. Interceptor de Axios: renovación transparente mediante cookies (Silent Refresh)
    useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;

                // Si responde 401 y no es una llamada ya en curso de refresh, login o logout
                if (
                    error.response?.status === 401 &&
                    !originalRequest?._retry &&
                    !originalRequest?.url?.includes('/api/auth/refresh') &&
                    !originalRequest?.url?.includes('/api/auth/login') &&
                    !originalRequest?.url?.includes('/api/auth/logout')
                ) {
                    originalRequest._retry = true;

                    try {
                        // El navegador envía automáticamente la cookie refreshToken a /api/auth/refresh
                        await axios.post('/api/auth/refresh');
                        // Reintentamos la petición original con la cookie accessToken recién renovada
                        return axios(originalRequest);
                    } catch (refreshErr) {
                        // Si el refreshToken también expiró (7 días), la sesión terminó
                        setUser(null);
                        return Promise.reject(refreshErr);
                    }
                }

                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.response.eject(interceptor);
        };
    }, []);

    // 3. Comprobación de sesión al arrancar o recargar (F5)
    const refreshUser = async () => {
        try {
            const response = await axios.get<User | { user: User }>('/api/auth/me');
            const data = response.data as any;
            const currentUser: User = data.user ? data.user : data;
            setUser(currentUser);

            // Redirección si ya está autenticado y accede a /login (excepto flujo 2FA)
            const params = new URLSearchParams(window.location.search);
            const isPending2Fa = params.has('userId');
            if (!isPending2Fa && (window.location.pathname === '/login' || window.location.pathname === '/login/')) {
                window.location.href = '/';
            }
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void refreshUser();
    }, []);

    // 4. Iniciar sesión
    const login = async (email: string, password: string): Promise<LoginResponse> => {
        const res = await axios.post<LoginResponse>('/api/auth/login', { email, password });

        if (res.data?.requiresTwoFactor) {
            return res.data;
        }

        // Si el login fue exitoso, el backend ya inyectó las cookies HttpOnly
        await refreshUser();
        window.location.href = '/';
        return res.data;
    };

    // 5. Registro
    const register = async (username: string, email: string, password: string) => {
        await axios.post('/api/auth/register', { username, email, password });
        await refreshUser();
        window.location.href = '/';
    };

    // 6. OAuth 42: Redirección al endpoint del backend
    const oauth42 = () => {
        window.location.href = '/api/auth/oauth/42';
    };

    const completeOAuth = async () => {
        await refreshUser();
        window.location.href = '/';
    };

    // 7. Cerrar sesión
    const logout = async () => {
        try {
            await axios.post('/api/auth/logout');
        } catch (err) {
            console.error('Error durante el logout:', err);
        } finally {
            setUser(null);
            // Reemplazamos la ubicación para no rebotar
            window.location.replace('/login');
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token: user ? 'cookie-session' : null,
                isAuthenticated: Boolean(user),
                loading,
                login,
                register,
                oauth42,
                completeOAuth,
                logout,
                refreshUser,
            }}
        >
            {children}
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