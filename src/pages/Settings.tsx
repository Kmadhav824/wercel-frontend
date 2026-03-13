import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Github, ArrowLeft, Loader2, Link2, ShieldCheck, Unplug } from "lucide-react";

const AUTH_URL = import.meta.env.VITE_AUTH_URL || "http://localhost:4000";

type GithubProfile = {
    username: string;
    avatarUrl?: string;
    linkedAt?: string;
};

export default function Settings() {
    const { user, token, setUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [connectingGithub, setConnectingGithub] = useState(false);
    const [disconnectingGithub, setDisconnectingGithub] = useState(false);
    const [githubConfigured, setGithubConfigured] = useState(true);
    const [githubProfile, setGithubProfile] = useState<GithubProfile | null>(null);
    const [hasGithubLink, setHasGithubLink] = useState(false);

    const loadGithubStatus = async () => {
        if (!token) return;

        try {
            const res = await axios.get(`${AUTH_URL}/auth/github/status`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setHasGithubLink(Boolean(res.data.linked));
            setGithubProfile(res.data.profile ?? null);
            setGithubConfigured(true);
        } catch (err: any) {
            if (err.response?.status === 503) {
                setGithubConfigured(false);
                setHasGithubLink(false);
                setGithubProfile(null);
                return;
            }

            setHasGithubLink(false);
            setGithubProfile(null);
        }
    };

    useEffect(() => {
        if (token) {
            loadGithubStatus();
        }
    }, [token]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const github = params.get("github");
        const githubError = params.get("github_error");

        if (!github && !githubError) return;

        if (github === "linked") {
            toast.success("GitHub account linked successfully.");
            loadGithubStatus();
        }

        if (githubError) {
            toast.error(githubError);
        }

        navigate(location.pathname, { replace: true });
    }, [location.pathname, location.search, navigate, token]);

    const handleConnectGithub = async () => {
        if (!token) return;

        setConnectingGithub(true);

        try {
            const res = await axios.post(`${AUTH_URL}/auth/github/oauth/start`, {
                returnTo: `${window.location.origin}/settings`
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            window.location.assign(res.data.url);
        } catch (err: any) {
            if (err.response?.status === 503) {
                setGithubConfigured(false);
            }
            toast.error(err.response?.data?.error || "Failed to start GitHub linking");
        } finally {
            setConnectingGithub(false);
        }
    };

    const handleDisconnectGithub = async () => {
        if (!token) return;

        setDisconnectingGithub(true);

        try {
            await axios.delete(`${AUTH_URL}/auth/github/link`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHasGithubLink(false);
            setGithubProfile(null);
            toast.success("GitHub account disconnected.");
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to disconnect GitHub account");
        } finally {
            setDisconnectingGithub(false);
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
                                        {hasGithubLink && (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Connected</span>
                                        )}
                                    </h4>
                                    <p className="text-sm text-slate-400">Link your GitHub account directly to import repositories without creating a personal access token.</p>
                                </div>
                            </div>

                            <div className="space-y-5 pt-4 border-t border-white/5">
                                {hasGithubLink && githubProfile ? (
                                    <div className="bg-[#05050f] border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4 min-w-0">
                                            {githubProfile.avatarUrl ? (
                                                <img src={githubProfile.avatarUrl} alt="GitHub avatar" className="w-14 h-14 rounded-2xl border border-white/10 object-cover" />
                                            ) : (
                                                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                                                    <Github className="w-6 h-6 text-slate-300" />
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="text-sm text-slate-400 mb-1">Connected GitHub profile</p>
                                                <p className="text-lg font-semibold text-white truncate">@{githubProfile.username}</p>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    Linked {githubProfile.linkedAt ? new Date(githubProfile.linkedAt).toLocaleString() : "recently"}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleDisconnectGithub}
                                            disabled={disconnectingGithub}
                                            className="shrink-0 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 disabled:opacity-60"
                                        >
                                            {disconnectingGithub ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unplug className="w-4 h-4" />}
                                            Disconnect
                                        </button>
                                    </div>
                                ) : (
                                    <div className="bg-[#05050f] border border-white/10 rounded-2xl p-5 space-y-4">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                                                <Link2 className="w-5 h-5 text-indigo-300" />
                                            </div>
                                            <div>
                                                <h5 className="text-base font-semibold text-white">Connect with GitHub OAuth</h5>
                                                <p className="text-sm text-slate-400 mt-1">You will be redirected to GitHub to authorize repository access and then returned here automatically.</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                                <p className="text-sm font-medium text-white mb-1 flex items-center gap-2"><Github className="w-4 h-4 text-indigo-300" /> No PAT required</p>
                                                <p className="text-xs text-slate-400">Users can link GitHub directly using the standard GitHub approval screen.</p>
                                            </div>
                                            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                                <p className="text-sm font-medium text-white mb-1 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-indigo-300" /> Scoped access</p>
                                                <p className="text-xs text-slate-400">The connection is limited to the permissions needed to list and deploy repositories.</p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleConnectGithub}
                                            disabled={connectingGithub || !githubConfigured}
                                            className="bg-white text-black hover:bg-slate-200 px-6 py-3 rounded-xl text-sm font-bold transition-all inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {connectingGithub ? <Loader2 className="w-4 h-4 animate-spin" /> : <Github className="w-4 h-4" />}
                                            Connect GitHub
                                        </button>

                                        {!githubConfigured && (
                                            <p className="text-xs text-amber-300">GitHub OAuth is not configured on the server yet. Add the GitHub OAuth app environment variables in the auth service to enable this flow.</p>
                                        )}
                                    </div>
                                )}

                                <p className="text-xs text-slate-500">
                                    If you need private repository access, ensure your GitHub OAuth app is configured with the correct callback URL and repository scope.
                                </p>
                            </div>
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
                                        onClick={() => {
                                            toast((t) => (
                                                <div className="flex flex-col gap-3">
                                                    <p className="text-sm font-medium text-white">Cancel account deletion?</p>
                                                    <div className="flex gap-2 justify-end">
                                                        <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg">No</button>
                                                        <button onClick={async () => {
                                                            toast.dismiss(t.id);
                                                            try {
                                                                await axios.post(`${AUTH_URL}/auth/cancel-deletion`, {}, { headers: { Authorization: `Bearer ${token}` } });
                                                                if (user) setUser({ ...user, deletionScheduledAt: undefined });
                                                                toast.success("Deletion cancelled successfully!");
                                                            } catch (err) {
                                                                toast.error("Failed to cancel deletion.");
                                                            }
                                                        }} className="px-3 py-1.5 text-xs text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg">Yes, Cancel</button>
                                                    </div>
                                                </div>
                                            ), { duration: Infinity, style: { background: '#1a1a24', border: '1px solid rgba(255,255,255,0.1)' } });
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
                                        onClick={() => {
                                            toast((t) => (
                                                <div className="flex flex-col gap-3">
                                                    <p className="text-sm font-medium text-white">Schedule account for deletion?</p>
                                                    <div className="flex gap-2 justify-end">
                                                        <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg">Cancel</button>
                                                        <button onClick={async () => {
                                                            toast.dismiss(t.id);
                                                            try {
                                                                await axios.post(`${AUTH_URL}/auth/schedule-deletion`, {}, { headers: { Authorization: `Bearer ${token}` } });
                                                                const d = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
                                                                if (user) setUser({ ...user, deletionScheduledAt: d });
                                                                toast.success("Account scheduled for deletion.");
                                                            } catch (err) {
                                                                toast.error("Failed to schedule deletion.");
                                                            }
                                                        }} className="px-3 py-1.5 text-xs text-white bg-red-500 hover:bg-red-600 rounded-lg">Schedule Deletion</button>
                                                    </div>
                                                </div>
                                            ), { duration: Infinity, style: { background: '#1a1a24', border: '1px solid rgba(239, 68, 68, 0.3)' } });
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
