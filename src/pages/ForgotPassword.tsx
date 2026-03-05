import { useState, FormEvent } from "react";
import { Link } from "react-router-dom";
import axios, { AxiosError } from "axios";
import { Rocket, Mail, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";

const AUTH_URL = import.meta.env.VITE_AUTH_URL || "http://localhost:4000";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await axios.post(`${AUTH_URL}/auth/forgot-password`, { email });
            setSent(true);
        } catch (err: unknown) {
            const axiosErr = err as AxiosError<{ error?: string }>;
            setError(axiosErr.response?.data?.error ?? "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen bg-[#06060c] text-slate-100 font-sans flex items-center justify-center overflow-hidden selection:bg-indigo-500/30">
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[20%] w-[50%] h-[50%] bg-indigo-700/15 blur-[160px] rounded-full mix-blend-screen" />
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

                <div className="relative">
                    <div className="absolute -inset-[1px] bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-pink-500/30 rounded-2xl blur-sm opacity-60" />
                    <div className="relative bg-[#0a0a16]/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-8 shadow-2xl">

                        {!sent ? (
                            <>
                                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6">
                                    <Mail className="w-6 h-6 text-indigo-400" />
                                </div>
                                <h1 className="text-2xl font-bold text-white mb-1">Forgot password?</h1>
                                <p className="text-slate-400 text-sm mb-8">
                                    Enter your email and we'll send you a link to reset your password.
                                </p>

                                {error && (
                                    <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-6 text-red-400 text-sm">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label htmlFor="forgot-email" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                            <input
                                                id="forgot-email"
                                                type="email"
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="you@example.com"
                                                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        id="forgot-submit-btn"
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] disabled:opacity-50 active:scale-[0.98] flex items-center justify-center gap-2"
                                    >
                                        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Sending...</span></> : "Send Reset Link"}
                                    </button>
                                </form>
                            </>
                        ) : (
                            /* Success state */
                            <div className="text-center py-4">
                                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                                </div>
                                <h2 className="text-xl font-bold text-white mb-2">Check your inbox</h2>
                                <p className="text-slate-400 text-sm mb-2">
                                    We've sent a password reset link to:
                                </p>
                                <p className="text-indigo-300 font-semibold mb-6">{email}</p>
                                <p className="text-slate-500 text-xs mb-8">
                                    The link expires in 1 hour. Check your spam folder if you don't see it.
                                </p>
                                <button
                                    onClick={() => { setSent(false); setEmail(""); }}
                                    className="text-slate-400 hover:text-white text-sm transition-colors underline underline-offset-4"
                                >
                                    Try a different email
                                </button>
                            </div>
                        )}

                        <div className="mt-8 pt-6 border-t border-white/5">
                            <Link
                                to="/login"
                                className="flex items-center justify-center gap-2 text-slate-400 hover:text-white text-sm transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to Sign In
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
