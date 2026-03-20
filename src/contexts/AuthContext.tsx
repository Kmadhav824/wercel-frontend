import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";

const AUTH_URL = import.meta.env.VITE_AUTH_URL || "http://localhost:4000";

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    plan: "free" | "pro" | "enterprise";
    createdAt?: string;
    lastLoginAt?: string;
    loginCount?: number;
    deletionScheduledAt?: string;
}

interface AuthContextValue {
    user: AuthUser | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    googleAuth: (idToken: string) => Promise<void>;
    logout: () => void;
    setUser: (user: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Rehydrate from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem("nexus_token");
        if (stored) {
            setToken(stored);
            axios
                .get(`${AUTH_URL}/auth/me`, { headers: { Authorization: `Bearer ${stored}` } })
                .then((r) => setUser(r.data.user))
                .catch(() => { localStorage.removeItem("nexus_token"); setToken(null); })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const persist = (token: string, user: AuthUser) => {
        localStorage.setItem("nexus_token", token);
        setToken(token);
        setUser(user);
    };

    const login = async (email: string, password: string) => {
        const { data } = await axios.post(`${AUTH_URL}/auth/login`, { email, password });
        persist(data.token, data.user);
    };

    const register = async (name: string, email: string, password: string) => {
        const { data } = await axios.post(`${AUTH_URL}/auth/register`, { name, email, password });
        persist(data.token, data.user);
    };

    const googleAuth = async (idToken: string) => {
        const { data } = await axios.post(`${AUTH_URL}/auth/google`, { idToken });
        persist(data.token, data.user);
    };

    const logout = () => {
        if (token) {
            axios.post(`${AUTH_URL}/auth/logout`, {}, { headers: { Authorization: `Bearer ${token}` } })
                .catch(() => { });
        }
        localStorage.removeItem("nexus_token");
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, googleAuth, logout, setUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
    return ctx;
}
