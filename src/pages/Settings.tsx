import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Github, Save, CheckCircle2, ArrowLeft, Loader2, Key } from "lucide-react";

const AUTH_URL = import.meta.env.VITE_AUTH_URL || "http://localhost:4000";

export default function Settings() {
    const { user, token, setUser } = useAuth();
    const [githubToken, setGithubToken] = useState("");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const [hasToken, setHasToken] = useState(false);

    useEffect(() => {
        if (token) {
            axios.get(`${AUTH_URL}/auth/github/repos`, {
                headers: { Authorization: `Bearer ${token}` }
            }).then(() => {
                setHasToken(true);
            }).catch(() => {
                setHasToken(false);
            });
        }
    }, [token]);

    const handleLinkGithub = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!githubToken) return;

        setSaving(true);
        setSaved(false);

        try {
            await axios.put(`${AUTH_URL}/auth/github/link`, {
                token: githubToken
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setHasToken(true);
            setSaved(true);
            setGithubToken(""); // Clear after saving for security feeling

            setTimeout(() => setSaved(false), 3000);
        } catch (err: any) {
            if (err.response?.status === 404) {
                alert("Backend endpoint not found. Please ensure you have deployed the latest backend code containing the /auth/github routes.");
            } else {
                alert(err.response?.data?.error || "Error linking GitHub token");
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#06060c] text-white">
            {/* Navigation */}
            <nav className="border-b border-white/5 bg-[#06060c]/80 backdrop-blur-2xl sticky top-0 z-50">
                <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center h-16">
                        <Link to="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                            <span className="font-medium text-sm">Back to Dashboard</span>
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <h1 className="text-3xl font-bold tracking-tight mb-8">Account Settings</h1>

                <div className="bg-[#0a0a16]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden divide-y divide-white/5">

                    {/* Profile Details */}
                    <div className="p-8 flex flex-col md:flex-row gap-8 items-start mb-4">
                        <div className="w-full md:w-1/3 space-y-2">
                            <h3 className="text-lg font-semibold text-white">Profile details</h3>
                            <p className="text-sm text-slate-400">Your personal information and avatar.</p>
                        </div>

                        <div className="w-full md:w-2/3 bg-white/5 border border-white/10 rounded-xl p-6 flex items-center gap-6">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center border-4 border-[#0a0a16] shadow-xl shrink-0">
                                {user?.avatar ? (
                                    <img src={user.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <span className="text-2xl font-bold">{user?.name?.charAt(0).toUpperCase()}</span>
                                )}
                            </div>
                            <div className="space-y-1">
                                <div className="text-xl font-bold">{user?.name}</div>
                                <div className="text-slate-400 text-sm">{user?.email}</div>
                                {user?.id && <div className="text-xs font-mono text-slate-600 mt-2 mt-2 pt-2 border-t border-white/5">ID: {user.id}</div>}
                            </div>
                        </div>
                    </div>

                    {/* Integrations */}
                    <div className="p-8 flex flex-col md:flex-row gap-8 items-start">
                        <div className="w-full md:w-1/3 space-y-2">
                            <h3 className="text-lg font-semibold text-white">Integrations</h3>
                            <p className="text-sm text-slate-400">Connect third-party apps and Git providers to your account.</p>
                        </div>

                        <div className="w-full md:w-2/3 bg-white/5 border border-white/10 rounded-xl p-6">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 bg-[#24292e] rounded-xl flex items-center justify-center border border-white/10 shrink-0">
                                    <Github className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-lg flex items-center gap-2">
                                        GitHub Platform
                                        {hasToken && (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Connected</span>
                                        )}
                                    </h4>
                                    <p className="text-sm text-slate-400">Import repositories automatically to deploy them.</p>
                                </div>
                            </div>

                            <form onSubmit={handleLinkGithub} className="space-y-4 pt-4 border-t border-white/5">
                                <div>
                                    <label htmlFor="token" className="block text-sm font-medium text-slate-300 mb-2">Personal Access Token (PAT)</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Key className="h-5 w-5 text-slate-500" />
                                        </div>
                                        <input
                                            type="password"
                                            id="token"
                                            value={githubToken}
                                            onChange={(e) => setGithubToken(e.target.value)}
                                            placeholder="ghp_xxxxxxxxxxxxxxxxxxx"
                                            className="block w-full pl-10 pr-3 py-3 bg-[#05050f] border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                                            required
                                        />
                                    </div>
                                    <p className="mt-2 text-xs text-slate-500">
                                        Generate a classic token in GitHub Settings &rarr; Developer settings with `repo` scope. We store it securely.
                                    </p>
                                </div>

                                <div className="flex items-center gap-4">
                                    <button
                                        type="submit"
                                        disabled={saving || !githubToken}
                                        className="bg-white text-black hover:bg-slate-200 px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Save Token
                                    </button>

                                    {saved && (
                                        <span className="text-emerald-400 text-sm font-medium flex items-center gap-1.5 animate-in fade-in">
                                            <CheckCircle2 className="w-4 h-4" /> Saved automatically
                                        </span>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Account Deletion */}
                    <div className="p-8 flex flex-col md:flex-row gap-8 items-start">
                        <div className="w-full md:w-1/3 space-y-2">
                            <h3 className="text-lg font-semibold text-red-500">Danger Zone</h3>
                            <p className="text-sm text-slate-400">Permanently remove your account and all associated projects from Nexus.</p>
                        </div>

                        <div className="w-full md:w-2/3 bg-red-500/5 border border-red-500/20 rounded-xl p-6">
                            {user?.deletionScheduledAt ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-red-400 bg-red-500/10 p-4 rounded-lg border border-red-500/20">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <div>
                                            <p className="font-bold">Account Deletion Scheduled</p>
                                            <p className="text-sm">Your account and all artifacts will be permanently deleted on {new Date(user.deletionScheduledAt).toLocaleDateString()}.</p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-400">Changed your mind? You can cancel the deletion process. If you log out and log back in, it will also be cancelled automatically.</p>

                                    <button
                                        onClick={async () => {
                                            if (!confirm("Are you sure you want to cancel the account deletion?")) return;
                                            try {
                                                await axios.post(`${AUTH_URL}/auth/cancel-deletion`, {}, { headers: { Authorization: `Bearer ${token}` } });
                                                if (user) setUser({ ...user, deletionScheduledAt: undefined });
                                                alert("Deletion cancelled successfully!");
                                            } catch (err) {
                                                alert("Failed to cancel deletion.");
                                            }
                                        }}
                                        className="bg-white text-black hover:bg-slate-200 px-6 py-2.5 rounded-xl text-sm font-bold transition-all"
                                    >
                                        Cancel Deletion
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-sm text-slate-300">
                                        If you schedule your account for deletion, you will enter a 30-day grace period. During this time, your services will remain active. If you do not log in or cancel the request within 30 days, your account, projects, and deployed artifacts will be permanently removed.
                                    </p>
                                    <button
                                        onClick={async () => {
                                            if (!confirm("Are you absolutely sure you want to schedule your account for deletion?")) return;
                                            try {
                                                await axios.post(`${AUTH_URL}/auth/schedule-deletion`, {}, { headers: { Authorization: `Bearer ${token}` } });

                                                // Approximating date for immediate UI feedback
                                                const d = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
                                                if (user) setUser({ ...user, deletionScheduledAt: d });
                                                alert("Account scheduled for deletion.");
                                            } catch (err) {
                                                alert("Failed to schedule deletion.");
                                            }
                                        }}
                                        className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/30 px-6 py-2.5 rounded-xl text-sm font-bold transition-all"
                                    >
                                        Schedule Account Deletion
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
