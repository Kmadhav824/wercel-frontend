import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { AxiosError } from "axios";
import { Rocket, Mail, Lock, Loader2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
    const { login, googleAuth } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [gLoading, setGLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await login(email, password);
            navigate("/");
        } catch (err: unknown) {
            const axiosErr = err as AxiosError<{ error?: string }>;
            setError(axiosErr.response?.data?.error ?? "Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogle = useGoogleLogin({
        onSuccess: async (tokenResp) => {
            setGLoading(true);
            setError("");
            try {
                await googleAuth(tokenResp.access_token);
                navigate("/");
            } catch {
                setError("Google sign-in failed. Please try again.");
            } finally {
                setGLoading(false);
            }
        },
        onError: () => setError("Google sign-in was cancelled."),
    });

    return (
        <div className="relative min-h-screen bg-[#06060c] text-slate-100 font-sans flex items-center justify-center overflow-hidden selection:bg-indigo-500/30">
            {/* Background blobs */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-700/20 blur-[140px] rounded-full mix-blend-screen" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[60%] bg-fuchsia-700/10 blur-[140px] rounded-full mix-blend-screen" />
                <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
            </div>

            <div className="relative z-10 w-full max-w-md px-4 py-12">
                {/* Logo */}
                <div className="flex items-center justify-center gap-3 mb-10">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-[1px] shadow-lg shadow-indigo-500/30">
                        <div className="w-full h-full rounded-[11px] bg-[#06060c] flex items-center justify-center">
                            <Rocket className="w-5 h-5 text-white" strokeWidth={2.5} />
                        </div>
                    </div>
                    <span className="text-2xl font-bold tracking-tight text-white">Nexus</span>
                </div>

                {/* Card */}
                <div className="relative group">
                    <div className="absolute -inset-[1px] bg-gradient-to-r from-indigo-500/40 via-purple-500/40 to-pink-500/40 rounded-2xl blur-sm opacity-60" />
                    <div className="relative bg-[#0a0a16]/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                        <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
                        <p className="text-slate-400 text-sm mb-8">Sign in to your Nexus account</p>

                        {/* Error banner */}
                        {error && (
                            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-6 text-red-400 text-sm">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Google button */}
                        <button
                            id="google-signin-btn"
                            type="button"
                            onClick={() => handleGoogle()}
                            disabled={gLoading || loading}
                            className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl py-3 px-4 text-sm font-semibold text-white transition-all mb-6 disabled:opacity-50"
                        >
                            {gLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <svg className="w-4 h-4" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                            )}
                            Continue with Google
                        </button>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="flex-1 h-px bg-white/10" />
                            <span className="text-slate-500 text-xs font-medium">or continue with email</span>
                            <div className="flex-1 h-px bg-white/10" />
                        </div>

                        {/* Email/Password form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label htmlFor="login-email" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        id="login-email"
                                        type="email"
                                        required
                                        autoComplete="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label htmlFor="login-password" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</label>
                                    <Link to="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        id="login-password"
                                        type={showPass ? "text" : "password"}
                                        required
                                        autoComplete="current-password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-10 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass((p) => !p)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                    >
                                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                id="login-submit-btn"
                                type="submit"
                                disabled={loading || gLoading}
                                className="w-full relative overflow-hidden bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] disabled:opacity-50 active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Signing in...</span></> : "Sign In"}
                            </button>
                        </form>

                        <p className="text-center text-slate-500 text-sm mt-6">
                            Don't have an account?{" "}
                            <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                                Create one
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
