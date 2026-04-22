import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { Github, ArrowLeft, Loader2, Link2, ShieldCheck, Unplug, Sun, Moon, Bell, LockKeyhole, Mail, GitBranch, Download, Sparkles, LogOut, Crown, RefreshCcw, CreditCard, CircleDollarSign, KeyRound, Eye, EyeOff } from "lucide-react";

const AUTH_URL = import.meta.env.VITE_AUTH_URL || "http://localhost:4000";

type GithubProfile = {
    username: string;
    avatarUrl?: string;
    linkedAt?: string;
};

type NotificationPreferences = {
    deploymentSuccess: boolean;
    deploymentFailure: boolean;
    weeklyDigest: boolean;
    securityAlerts: boolean;
};

type DeploymentPreferences = {
    defaultBranch: string;
    autoDeployOnPush: boolean;
    autoOpenLogs: boolean;
    autoRefreshScreenshot: boolean;
};

type PaidPlan = "pro" | "enterprise";

type BillingDetails = {
    plan: "free" | "pro" | "enterprise";
    subscriptionId?: string;
    planId?: string;
    status: string;
    currentStart?: string;
    currentEnd?: string;
    endedAt?: string;
    planChangedAt?: string;
};

type BillingResponse = {
    configured: boolean;
    webhookConfigured?: boolean;
    keyId: string | null;
    plans: Record<PaidPlan, {
        label: string;
        planId: string;
        enabled: boolean;
        description: string;
    }>;
    billing: BillingDetails;
};

const NOTIFICATION_PREFS_KEY = "nexus_settings_notification_prefs";
const DEPLOYMENT_PREFS_KEY = "nexus_settings_deployment_prefs";

const defaultNotificationPreferences: NotificationPreferences = {
    deploymentSuccess: true,
    deploymentFailure: true,
    weeklyDigest: false,
    securityAlerts: true,
};

const defaultDeploymentPreferences: DeploymentPreferences = {
    defaultBranch: "main",
    autoDeployOnPush: true,
    autoOpenLogs: true,
    autoRefreshScreenshot: false,
};

export default function Settings() {
    const { user, token, setUser, logout, refreshUser } = useAuth();
    const { theme, setTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [connectingGithub, setConnectingGithub] = useState(false);
    const [disconnectingGithub, setDisconnectingGithub] = useState(false);
    const [githubConfigured, setGithubConfigured] = useState(true);
    const [githubProfile, setGithubProfile] = useState<GithubProfile | null>(null);
    const [hasGithubLink, setHasGithubLink] = useState(false);
    const [sendingPasswordReset, setSendingPasswordReset] = useState(false);
    const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(defaultNotificationPreferences);
    const [deploymentPreferences, setDeploymentPreferences] = useState<DeploymentPreferences>(defaultDeploymentPreferences);
    const [billing, setBilling] = useState<BillingResponse | null>(null);
    const [billingLoading, setBillingLoading] = useState(false);
    const [billingAction, setBillingAction] = useState<"pro" | "enterprise" | "sync" | "cancel" | null>(null);

    // Change-password form state
    const [changePwOpen, setChangePwOpen] = useState(false);
    const [changePwCurrent, setChangePwCurrent] = useState("");
    const [changePwNew, setChangePwNew] = useState("");
    const [changePwConfirm, setChangePwConfirm] = useState("");
    const [changePwLoading, setChangePwLoading] = useState(false);
    const [changePwShowCurrent, setChangePwShowCurrent] = useState(false);
    const [changePwShowNew, setChangePwShowNew] = useState(false);

    const authHeaders = token ? { Authorization: `Bearer ${token}` } : undefined;

    useEffect(() => {
        const savedNotifications = localStorage.getItem(NOTIFICATION_PREFS_KEY);
        const savedDeploymentPreferences = localStorage.getItem(DEPLOYMENT_PREFS_KEY);

        if (savedNotifications) {
            try {
                const parsed = JSON.parse(savedNotifications) as Partial<NotificationPreferences>;
                setNotificationPreferences({
                    ...defaultNotificationPreferences,
                    ...parsed,
                });
            } catch {
                setNotificationPreferences(defaultNotificationPreferences);
            }
        }

        if (savedDeploymentPreferences) {
            try {
                const parsed = JSON.parse(savedDeploymentPreferences) as Partial<DeploymentPreferences>;
                setDeploymentPreferences({
                    ...defaultDeploymentPreferences,
                    ...parsed,
                });
            } catch {
                setDeploymentPreferences(defaultDeploymentPreferences);
            }
        }
    }, []);

    const updateNotificationPreferences = (patch: Partial<NotificationPreferences>) => {
        const next = { ...notificationPreferences, ...patch };
        setNotificationPreferences(next);
        localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(next));
    };

    const updateDeploymentPreferences = (patch: Partial<DeploymentPreferences>) => {
        const next = { ...deploymentPreferences, ...patch };
        setDeploymentPreferences(next);
        localStorage.setItem(DEPLOYMENT_PREFS_KEY, JSON.stringify(next));
    };

    const handleSendPasswordReset = async () => {
        if (!user?.email) {
            toast.error("No email found for this account");
            return;
        }

        setSendingPasswordReset(true);
        try {
            await axios.post(`${AUTH_URL}/auth/forgot-password`, {
                email: user.email,
            });
            toast.success("Password reset link sent to your email.");
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to send password reset email");
        } finally {
            setSendingPasswordReset(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!changePwNew || !changePwCurrent) {
            toast.error("All fields are required");
            return;
        }
        if (changePwNew.length < 8) {
            toast.error("New password must be at least 8 characters");
            return;
        }
        if (changePwNew !== changePwConfirm) {
            toast.error("New passwords do not match");
            return;
        }
        setChangePwLoading(true);
        try {
            await axios.put(`${AUTH_URL}/auth/change-password`, {
                currentPassword: changePwCurrent,
                newPassword: changePwNew,
            }, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("Password changed successfully.");
            setChangePwOpen(false);
            setChangePwCurrent("");
            setChangePwNew("");
            setChangePwConfirm("");
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to change password");
        } finally {
            setChangePwLoading(false);
        }
    };

    const handleExportSettings = () => {
        const data = {
            account: {
                id: user?.id,
                name: user?.name,
                email: user?.email,
                createdAt: user?.createdAt,
                lastLoginAt: user?.lastLoginAt,
                loginCount: user?.loginCount,
            },
            preferences: {
                theme,
                notifications: notificationPreferences,
                deploymentDefaults: deploymentPreferences,
            },
            exportedAt: new Date().toISOString(),
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `nexus-settings-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Settings export downloaded.");
    };

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

    const loadBilling = async () => {
        if (!token) return;

        setBillingLoading(true);
        try {
            const res = await axios.get(`${AUTH_URL}/auth/billing/me`, {
                headers: authHeaders,
            });
            setBilling(res.data);
        } catch (err: any) {
            if (err.response?.status !== 404) {
                toast.error(err.response?.data?.error || "Failed to load billing details");
            }
        } finally {
            setBillingLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            void loadBilling();
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

    const handleUpgrade = (plan: PaidPlan) => {
        navigate(`/upgrade?plan=${plan}`);
    };

    const handleSyncBilling = async () => {
        if (!token) return;

        setBillingAction("sync");
        try {
            await axios.post(`${AUTH_URL}/auth/billing/sync`, {}, { headers: authHeaders });
            await Promise.all([loadBilling(), refreshUser()]);
            toast.success("Billing status refreshed.");
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to refresh billing status");
        } finally {
            setBillingAction(null);
        }
    };

    const handleCancelSubscription = async () => {
        if (!token) return;

        setBillingAction("cancel");
        try {
            const res = await axios.post(`${AUTH_URL}/auth/billing/cancel`, {
                cancelAtCycleEnd: true,
            }, { headers: authHeaders });
            await Promise.all([loadBilling(), refreshUser()]);
            toast.success(res.data.message || "Subscription cancellation scheduled.");
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to cancel subscription");
        } finally {
            setBillingAction(null);
        }
    };

    const billingStatus = billing?.billing?.status || user?.billing?.status || "inactive";
    const isPaidPlan = user?.plan === "pro" || user?.plan === "enterprise";
    const hasBlockingSubscription = ["active", "authenticated", "pending"].includes(billingStatus);
    const canCancelSubscription = isPaidPlan && hasBlockingSubscription;

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
                            <h3 className="text-lg font-semibold text-white">Appearance</h3>
                            <p className="text-sm text-slate-400">Set how Nexus should look for your account on this device.</p>
                        </div>

                        <div className="w-full md:w-2/3 bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => setTheme("dark")}
                                    className={`flex-1 rounded-xl border px-4 py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${theme === "dark" ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-200" : "bg-[#05050f] border-white/10 text-slate-300 hover:bg-white/5"}`}
                                >
                                    <Moon className="w-4 h-4" />
                                    Dark mode
                                </button>
                                <button
                                    onClick={() => setTheme("light")}
                                    className={`flex-1 rounded-xl border px-4 py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${theme === "light" ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-200" : "bg-[#05050f] border-white/10 text-slate-300 hover:bg-white/5"}`}
                                >
                                    <Sun className="w-4 h-4" />
                                    Light mode
                                </button>
                            </div>
                            <p className="text-xs text-slate-500">Theme preference is saved automatically and remembered on your next visit.</p>
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

                    {/* Security */}
                    <div className="p-8 flex flex-col md:flex-row gap-8 items-start">
                        <div className="w-full md:w-1/3 space-y-2">
                            <h3 className="text-lg font-semibold text-white">Billing & Plans</h3>
                            <p className="text-sm text-slate-400">Upgrade securely with server-verified billing. Access changes only after backend confirmation.</p>
                        </div>

                        <div className="w-full md:w-2/3 bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
                            <div className="bg-[#05050f] border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${isPaidPlan ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/20" : "bg-white/5 text-slate-300 border-white/10"}`}>
                                            {user?.plan || "free"}
                                        </span>
                                        <span className="text-xs text-slate-500">
                                            Status: {billingStatus}
                                        </span>
                                    </div>
                                    <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                                        <CircleDollarSign className="w-5 h-5 text-indigo-300" />
                                        Current workspace plan
                                    </h4>
                                    <p className="text-sm text-slate-400">
                                        {isPaidPlan
                                            ? `Your paid plan is active${billing?.billing?.currentEnd ? ` until ${new Date(billing.billing.currentEnd).toLocaleDateString()}` : ""}.`
                                            : "You are on the free plan. Upgrade when you are ready for premium features and future Next.js runtime access."}
                                    </p>
                                    {billing?.billing?.subscriptionId && (
                                        <p className="text-xs font-mono text-slate-500">
                                            Subscription: {billing.billing.subscriptionId}
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={handleSyncBilling}
                                        disabled={billingAction !== null}
                                        className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all inline-flex items-center gap-2 disabled:opacity-60"
                                    >
                                        {billingAction === "sync" || billingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
                                        Refresh
                                    </button>
                                    {canCancelSubscription && (
                                        <button
                                            onClick={handleCancelSubscription}
                                            disabled={billingAction !== null}
                                            className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all inline-flex items-center gap-2 disabled:opacity-60"
                                        >
                                            {billingAction === "cancel" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                                            Cancel At Cycle End
                                        </button>
                                    )}
                                </div>
                            </div>

                            {!billing?.configured && (
                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-sm text-amber-200">
                                    Billing is not fully configured yet. Add your Razorpay key, secret, and paid plan IDs on the auth service before taking live payments.
                                </div>
                            )}

                            {billing?.configured && billing.webhookConfigured === false && (
                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-sm text-amber-200">
                                    Checkout is available, but webhook confirmation is not configured yet. Add `RAZORPAY_WEBHOOK_SECRET` before relying on automated billing state changes.
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {(["pro", "enterprise"] as PaidPlan[]).map((plan) => {
                                    const planMeta = billing?.plans?.[plan];
                                    const isCurrentPlan = user?.plan === plan;
                                    return (
                                        <div key={plan} className={`rounded-2xl border p-5 ${isCurrentPlan ? "bg-indigo-500/10 border-indigo-500/30" : "bg-[#05050f] border-white/10"}`}>
                                            <div className="flex items-start justify-between gap-4 mb-3">
                                                <div>
                                                    <h5 className="text-base font-semibold text-white flex items-center gap-2">
                                                        <Crown className={`w-4 h-4 ${plan === "enterprise" ? "text-amber-300" : "text-indigo-300"}`} />
                                                        {planMeta?.label || plan}
                                                    </h5>
                                                    <p className="text-xs text-slate-400 mt-1">
                                                        {planMeta?.description || "Recurring subscription managed via Razorpay."}
                                                    </p>
                                                </div>
                                                {isCurrentPlan && (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                                        Current
                                                    </span>
                                                )}
                                            </div>

                                            <button
                                                onClick={() => handleUpgrade(plan)}
                                                disabled={billingAction !== null || !planMeta?.enabled || (hasBlockingSubscription && !isCurrentPlan)}
                                                className="w-full bg-white text-black hover:bg-slate-200 disabled:bg-slate-300/20 disabled:text-slate-500 px-4 py-2.5 rounded-xl text-sm font-bold transition-all inline-flex items-center justify-center gap-2"
                                            >
                                                <CreditCard className="w-4 h-4" />
                                                {isCurrentPlan ? "Current Plan" : hasBlockingSubscription ? "Another Subscription Active" : `Upgrade to ${planMeta?.label || plan}`}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            <p className="text-xs text-slate-500">
                                Checkout is started from the backend and plan access is updated only after a server-side sync or Razorpay webhook confirmation.
                            </p>
                        </div>
                    </div>

                    {/* Security */}
                    <div className="p-8 flex flex-col md:flex-row gap-8 items-start">
                        <div className="w-full md:w-1/3 space-y-2">
                            <h3 className="text-lg font-semibold text-white">Security</h3>
                            <p className="text-sm text-slate-400">Protect account access and monitor sign-in activity.</p>
                        </div>

                        <div className="w-full md:w-2/3 bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <button
                                    onClick={handleSendPasswordReset}
                                    disabled={sendingPasswordReset}
                                    className="bg-[#05050f] hover:bg-white/5 border border-white/10 rounded-xl p-4 text-left transition-colors disabled:opacity-60"
                                >
                                    <p className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                                        {sendingPasswordReset ? <Loader2 className="w-4 h-4 animate-spin text-indigo-300" /> : <Mail className="w-4 h-4 text-indigo-300" />}
                                        Send password reset email
                                    </p>
                                    <p className="text-xs text-slate-400">Send a secure reset link to {user?.email}.</p>
                                </button>

                                <button
                                    onClick={() => setChangePwOpen((prev) => !prev)}
                                    className={`bg-[#05050f] hover:bg-white/5 border rounded-xl p-4 text-left transition-colors ${changePwOpen ? "border-indigo-500/40" : "border-white/10"}`}
                                >
                                    <p className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                                        <KeyRound className="w-4 h-4 text-indigo-300" />
                                        Change password
                                    </p>
                                    <p className="text-xs text-slate-400">Update your password while signed in — no email required.</p>
                                </button>

                                <a
                                    href="https://github.com/settings/security"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="bg-[#05050f] hover:bg-white/5 border border-white/10 rounded-xl p-4 text-left transition-colors block"
                                >
                                    <p className="text-sm font-semibold text-white mb-1 flex items-center gap-2"><LockKeyhole className="w-4 h-4 text-indigo-300" /> Review GitHub 2FA</p>
                                    <p className="text-xs text-slate-400">Recommended for linked source-control accounts.</p>
                                </a>
                            </div>

                            {/* Change password inline form */}
                            {changePwOpen && (
                                <form onSubmit={handleChangePassword} className="bg-[#05050f] border border-indigo-500/20 rounded-xl p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <p className="text-sm font-semibold text-white flex items-center gap-2">
                                        <KeyRound className="w-4 h-4 text-indigo-300" />
                                        Change your password
                                    </p>

                                    <div className="space-y-3">
                                        <div className="relative">
                                            <label className="text-xs text-slate-400 mb-1.5 block">Current password</label>
                                            <input
                                                type={changePwShowCurrent ? "text" : "password"}
                                                value={changePwCurrent}
                                                onChange={(e) => setChangePwCurrent(e.target.value)}
                                                required
                                                autoComplete="current-password"
                                                placeholder="Enter your current password"
                                                className="w-full bg-black/30 border border-white/10 text-white rounded-lg px-4 pr-10 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all placeholder:text-slate-600"
                                            />
                                            <button type="button" onClick={() => setChangePwShowCurrent(p => !p)} className="absolute right-3 top-[34px] text-slate-500 hover:text-slate-300 transition-colors">
                                                {changePwShowCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>

                                        <div className="relative">
                                            <label className="text-xs text-slate-400 mb-1.5 block">New password <span className="text-slate-600">(min 8 characters)</span></label>
                                            <input
                                                type={changePwShowNew ? "text" : "password"}
                                                value={changePwNew}
                                                onChange={(e) => setChangePwNew(e.target.value)}
                                                required
                                                autoComplete="new-password"
                                                placeholder="Enter new password"
                                                className="w-full bg-black/30 border border-white/10 text-white rounded-lg px-4 pr-10 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all placeholder:text-slate-600"
                                            />
                                            <button type="button" onClick={() => setChangePwShowNew(p => !p)} className="absolute right-3 top-[34px] text-slate-500 hover:text-slate-300 transition-colors">
                                                {changePwShowNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>

                                        <div>
                                            <label className="text-xs text-slate-400 mb-1.5 block">Confirm new password</label>
                                            <input
                                                type="password"
                                                value={changePwConfirm}
                                                onChange={(e) => setChangePwConfirm(e.target.value)}
                                                required
                                                autoComplete="new-password"
                                                placeholder="Re-enter new password"
                                                className={`w-full bg-black/30 border text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none transition-all placeholder:text-slate-600 ${
                                                    changePwConfirm && changePwNew !== changePwConfirm
                                                        ? "border-red-500/50 focus:ring-1 focus:ring-red-500/30"
                                                        : "border-white/10 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
                                                }`}
                                            />
                                            {changePwConfirm && changePwNew !== changePwConfirm && (
                                                <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 pt-1">
                                        <button
                                            type="submit"
                                            disabled={changePwLoading || (!!changePwConfirm && changePwNew !== changePwConfirm)}
                                            className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all inline-flex items-center gap-2"
                                        >
                                            {changePwLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                                            Update Password
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setChangePwOpen(false); setChangePwCurrent(""); setChangePwNew(""); setChangePwConfirm(""); }}
                                            className="text-sm text-slate-400 hover:text-white transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}

                            <div className="bg-[#05050f] border border-white/10 rounded-xl p-4 space-y-2">
                                <p className="text-sm font-semibold text-white">Session Summary</p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                                        <p className="text-slate-500 mb-1">Member Since</p>
                                        <p className="text-slate-200">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Not available"}</p>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                                        <p className="text-slate-500 mb-1">Last Login</p>
                                        <p className="text-slate-200">{user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Not available"}</p>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                                        <p className="text-slate-500 mb-1">Total Sign-ins</p>
                                        <p className="text-slate-200">{typeof user?.loginCount === "number" ? user.loginCount : "Not available"}</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    logout();
                                    navigate("/login");
                                }}
                                className="text-sm text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 inline-flex items-center gap-2 transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                Sign out on this device
                            </button>
                        </div>
                    </div>

                    {/* Notifications */}
                    <div className="p-8 flex flex-col md:flex-row gap-8 items-start">
                        <div className="w-full md:w-1/3 space-y-2">
                            <h3 className="text-lg font-semibold text-white">Notifications</h3>
                            <p className="text-sm text-slate-400">Choose which operational events should surface in your account workflow.</p>
                        </div>

                        <div className="w-full md:w-2/3 bg-white/5 border border-white/10 rounded-xl p-6 space-y-3">
                            {[
                                { key: "deploymentSuccess", label: "Deployment success", note: "Show when a build reaches production." },
                                { key: "deploymentFailure", label: "Deployment failure", note: "Show when clone/build/deploy fails." },
                                { key: "securityAlerts", label: "Security alerts", note: "Show when integration or auth issues are detected." },
                                { key: "weeklyDigest", label: "Weekly digest", note: "Show weekly performance and deployment summary." },
                            ].map((item) => (
                                <label key={item.key} className="flex items-start justify-between gap-4 bg-[#05050f] border border-white/10 rounded-xl px-4 py-3 cursor-pointer">
                                    <div>
                                        <p className="text-sm font-medium text-white flex items-center gap-2"><Bell className="w-4 h-4 text-indigo-300" /> {item.label}</p>
                                        <p className="text-xs text-slate-400 mt-1">{item.note}</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={notificationPreferences[item.key as keyof NotificationPreferences]}
                                        onChange={(e) => updateNotificationPreferences({ [item.key]: e.target.checked })}
                                        className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent accent-indigo-500"
                                    />
                                </label>
                            ))}
                            <p className="text-xs text-slate-500">Preferences are saved locally for this browser session profile.</p>
                        </div>
                    </div>

                    {/* Deployment Defaults */}
                    <div className="p-8 flex flex-col md:flex-row gap-8 items-start">
                        <div className="w-full md:w-1/3 space-y-2">
                            <h3 className="text-lg font-semibold text-white">Deployment Defaults</h3>
                            <p className="text-sm text-slate-400">Set preferred behavior for new projects and deployment workflows.</p>
                        </div>

                        <div className="w-full md:w-2/3 bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
                            <div>
                                <label htmlFor="defaultBranch" className="text-sm text-slate-300 mb-2 block">Default branch name</label>
                                <div className="relative">
                                    <GitBranch className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        id="defaultBranch"
                                        value={deploymentPreferences.defaultBranch}
                                        onChange={(e) => updateDeploymentPreferences({ defaultBranch: e.target.value })}
                                        placeholder="main"
                                        className="w-full bg-[#05050f] border border-white/10 text-white rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <label className="flex items-center justify-between bg-[#05050f] border border-white/10 rounded-xl px-4 py-3 cursor-pointer">
                                    <div>
                                        <p className="text-sm text-white font-medium">Auto-deploy on push</p>
                                        <p className="text-xs text-slate-400 mt-1">Trigger deployment after repository updates.</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={deploymentPreferences.autoDeployOnPush}
                                        onChange={(e) => updateDeploymentPreferences({ autoDeployOnPush: e.target.checked })}
                                        className="h-4 w-4 rounded border-white/20 bg-transparent accent-indigo-500"
                                    />
                                </label>

                                <label className="flex items-center justify-between bg-[#05050f] border border-white/10 rounded-xl px-4 py-3 cursor-pointer">
                                    <div>
                                        <p className="text-sm text-white font-medium">Auto-open live logs</p>
                                        <p className="text-xs text-slate-400 mt-1">Open logs panel when build starts.</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={deploymentPreferences.autoOpenLogs}
                                        onChange={(e) => updateDeploymentPreferences({ autoOpenLogs: e.target.checked })}
                                        className="h-4 w-4 rounded border-white/20 bg-transparent accent-indigo-500"
                                    />
                                </label>

                                <label className="flex items-center justify-between bg-[#05050f] border border-white/10 rounded-xl px-4 py-3 cursor-pointer sm:col-span-2">
                                    <div>
                                        <p className="text-sm text-white font-medium">Auto-refresh screenshot after successful deploy</p>
                                        <p className="text-xs text-slate-400 mt-1">Capture latest production preview automatically.</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={deploymentPreferences.autoRefreshScreenshot}
                                        onChange={(e) => updateDeploymentPreferences({ autoRefreshScreenshot: e.target.checked })}
                                        className="h-4 w-4 rounded border-white/20 bg-transparent accent-indigo-500"
                                    />
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Data & Privacy */}
                    <div className="p-8 flex flex-col md:flex-row gap-8 items-start">
                        <div className="w-full md:w-1/3 space-y-2">
                            <h3 className="text-lg font-semibold text-white">Data & Privacy</h3>
                            <p className="text-sm text-slate-400">Review and export your local account preferences and profile metadata.</p>
                        </div>

                        <div className="w-full md:w-2/3 bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
                            <div className="bg-[#05050f] border border-white/10 rounded-xl p-4">
                                <p className="text-sm font-semibold text-white mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4 text-indigo-300" /> Account Data Export</p>
                                <p className="text-xs text-slate-400">Downloads a JSON snapshot with account profile, session metadata, and local preference flags.</p>
                            </div>

                            <button
                                onClick={handleExportSettings}
                                className="bg-white text-black hover:bg-slate-200 px-5 py-2.5 rounded-xl text-sm font-bold transition-all inline-flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Export Settings Snapshot
                            </button>
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
