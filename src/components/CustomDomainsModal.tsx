import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { X, Loader2, Globe2, Crown, CheckCircle2, ShieldCheck, Trash2, Sparkles } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const AUTH_URL = import.meta.env.VITE_AUTH_URL || "http://localhost:4000";

interface CustomDomain {
    hostname: string;
    verified: boolean;
    verificationType: "txt";
    verificationName: string;
    verificationValue: string;
    sslStatus: "pending_verification" | "pending_ssl" | "active";
    isPrimary: boolean;
    createdAt: string;
    verifiedAt?: string;
    instructions?: {
        target: string;
        txtName: string;
        txtValue: string;
        recordType: string;
    };
}

interface CustomDomainsModalProps {
    project: { _id: string; name: string };
    onClose: () => void;
    onUpdated: () => void;
}

export default function CustomDomainsModal({ project, onClose, onUpdated }: CustomDomainsModalProps) {
    const { token, user } = useAuth();
    const [domains, setDomains] = useState<CustomDomain[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [newHostname, setNewHostname] = useState("");
    const [busyDomain, setBusyDomain] = useState<string | null>(null);
    const [target, setTarget] = useState("");
    const [sslProvider, setSslProvider] = useState<string | null>(null);

    const loadDomains = async () => {
        if (!token) {
            return;
        }

        try {
            const res = await axios.get(`${AUTH_URL}/auth/projects/${project._id}/domains`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setDomains(Array.isArray(res.data.domains) ? res.data.domains : []);
            setTarget(res.data.target || "");
            setSslProvider(res.data.sslProvider || null);
        } catch (err: any) {
            toast.error(err?.response?.data?.error || "Failed to load custom domains");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadDomains();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [project._id, token]);

    const handleAddDomain = async () => {
        if (!token) {
            return;
        }

        if (!newHostname.trim()) {
            toast.error("Enter a domain hostname first");
            return;
        }

        setCreating(true);
        try {
            const res = await axios.post(`${AUTH_URL}/auth/projects/${project._id}/domains`, {
                hostname: newHostname.trim(),
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setDomains((prev) => [...prev, res.data.domain]);
            setTarget(res.data.target || target);
            setSslProvider(res.data.sslProvider || sslProvider);
            setNewHostname("");
            onUpdated();
            toast.success("Custom domain added");
        } catch (err: any) {
            toast.error(err?.response?.data?.error || "Failed to add custom domain");
        } finally {
            setCreating(false);
        }
    };

    const handleVerify = async (hostname: string) => {
        if (!token) {
            return;
        }

        setBusyDomain(hostname);
        try {
            const res = await axios.post(`${AUTH_URL}/auth/projects/${project._id}/domains/${encodeURIComponent(hostname)}/verify`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setDomains((prev) => prev.map((domain) => domain.hostname === hostname ? res.data.domain : domain));
            onUpdated();
            toast.success(res.data.message || "Domain verified");
        } catch (err: any) {
            const issues = err?.response?.data?.issues;
            if (Array.isArray(issues) && issues.length > 0) {
                toast.error(issues[0]);
            } else {
                toast.error(err?.response?.data?.error || "Failed to verify domain");
            }
        } finally {
            setBusyDomain(null);
        }
    };

    const handleMakePrimary = async (hostname: string) => {
        if (!token) {
            return;
        }

        setBusyDomain(hostname);
        try {
            const res = await axios.post(`${AUTH_URL}/auth/projects/${project._id}/domains/${encodeURIComponent(hostname)}/make-primary`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setDomains(Array.isArray(res.data.domains) ? res.data.domains : []);
            onUpdated();
            toast.success("Primary domain updated");
        } catch (err: any) {
            toast.error(err?.response?.data?.error || "Failed to update primary domain");
        } finally {
            setBusyDomain(null);
        }
    };

    const handleDelete = async (hostname: string) => {
        if (!token) {
            return;
        }

        setBusyDomain(hostname);
        try {
            const res = await axios.delete(`${AUTH_URL}/auth/projects/${project._id}/domains/${encodeURIComponent(hostname)}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setDomains(Array.isArray(res.data.domains) ? res.data.domains : []);
            onUpdated();
            toast.success("Custom domain removed");
        } catch (err: any) {
            toast.error(err?.response?.data?.error || "Failed to remove domain");
        } finally {
            setBusyDomain(null);
        }
    };

    const isPro = user?.plan === "pro";

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-[#0a0a16] border border-white/10 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white">Custom Domains</h2>
                        <p className="text-sm text-slate-400 mt-1">
                            Manage domain routing and SSL readiness for <span className="text-indigo-400 font-mono">{project.name}</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 max-h-[72vh] overflow-y-auto space-y-5">
                    {loading ? (
                        <div className="flex items-center justify-center h-40">
                            <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                        </div>
                    ) : !isPro ? (
                        <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-[#0a0a16] to-[#0a0a16] p-6">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
                                <Crown className="w-6 h-6 text-amber-300" />
                            </div>
                            <h3 className="text-white text-lg font-semibold mb-2">Custom domains are a Pro feature</h3>
                            <p className="text-sm text-slate-300 leading-relaxed">
                                Upgrade this account to Pro to attach your own domains, complete DNS verification, and track SSL readiness from the dashboard.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
                                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                                    <p className="font-semibold text-white mb-1">Bring your domain</p>
                                    <p className="text-xs text-slate-400">Map `app.yourcompany.com` or your apex domain.</p>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                                    <p className="font-semibold text-white mb-1">DNS verification</p>
                                    <p className="text-xs text-slate-400">Lock ownership with TXT validation before activation.</p>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                                    <p className="font-semibold text-white mb-1">SSL readiness</p>
                                    <p className="text-xs text-slate-400">Track whether the domain is ready for HTTPS traffic.</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                        <Globe2 className="w-5 h-5 text-indigo-300" />
                                    </div>
                                    <div>
                                        <p className="text-white font-semibold">Add a custom domain</p>
                                        <p className="text-xs text-slate-400">Verify ownership with TXT, then point traffic to {target || "your edge proxy"}.</p>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3">
                                    <input
                                        type="text"
                                        placeholder="app.example.com"
                                        value={newHostname}
                                        onChange={(e) => setNewHostname(e.target.value)}
                                        className="flex-1 bg-[#05050f] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono transition-colors"
                                    />
                                    <button
                                        onClick={handleAddDomain}
                                        disabled={creating}
                                        className="px-4 py-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                                    >
                                        {creating ? "Adding..." : "Add Domain"}
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-xs">
                                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                                        <p className="text-slate-500 uppercase tracking-wide mb-1">Verification</p>
                                        <p className="text-slate-200">Create a TXT record after adding the domain.</p>
                                    </div>
                                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                                        <p className="text-slate-500 uppercase tracking-wide mb-1">SSL</p>
                                        <p className="text-slate-200">
                                            {sslProvider ? `Managed by ${sslProvider}` : "Marks as pending until your HTTPS proxy issues certificates."}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {domains.length === 0 ? (
                                <div className="text-center py-10 border border-white/10 bg-white/5 rounded-2xl">
                                    <Sparkles className="w-6 h-6 text-indigo-300 mx-auto mb-3" />
                                    <p className="text-sm text-slate-300">No custom domains attached yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {domains.map((domain) => {
                                        const isBusy = busyDomain === domain.hostname;
                                        return (
                                            <div key={domain.hostname} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                                                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                                    <div className="space-y-2 min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <p className="text-white font-semibold font-mono break-all">{domain.hostname}</p>
                                                            {domain.isPrimary && (
                                                                <span className="px-2 py-0.5 rounded-full text-[11px] border border-indigo-500/30 bg-indigo-500/10 text-indigo-300">Primary</span>
                                                            )}
                                                            {domain.verified ? (
                                                                <span className="px-2 py-0.5 rounded-full text-[11px] border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">Verified</span>
                                                            ) : (
                                                                <span className="px-2 py-0.5 rounded-full text-[11px] border border-amber-500/30 bg-amber-500/10 text-amber-300">Pending DNS</span>
                                                            )}
                                                            <span className={`px-2 py-0.5 rounded-full text-[11px] border ${domain.sslStatus === "active" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-sky-500/30 bg-sky-500/10 text-sky-300"}`}>
                                                                SSL {domain.sslStatus === "active" ? "Active" : domain.sslStatus === "pending_ssl" ? "Pending" : "Waiting"}
                                                            </span>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                                                            <div className="rounded-xl border border-white/10 bg-[#05050f] p-3">
                                                                <p className="text-slate-500 uppercase tracking-wide mb-1">TXT Name</p>
                                                                <p className="text-slate-200 font-mono break-all">{domain.instructions?.txtName || domain.verificationName}</p>
                                                            </div>
                                                            <div className="rounded-xl border border-white/10 bg-[#05050f] p-3">
                                                                <p className="text-slate-500 uppercase tracking-wide mb-1">TXT Value</p>
                                                                <p className="text-slate-200 font-mono break-all">{domain.instructions?.txtValue || domain.verificationValue}</p>
                                                            </div>
                                                            <div className="rounded-xl border border-white/10 bg-[#05050f] p-3">
                                                                <p className="text-slate-500 uppercase tracking-wide mb-1">Traffic Record</p>
                                                                <p className="text-slate-200 font-mono break-all">{domain.instructions?.recordType || "CNAME"} {"->"} {domain.instructions?.target || target}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <button
                                                            onClick={() => handleVerify(domain.hostname)}
                                                            disabled={isBusy}
                                                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 text-sm font-medium disabled:opacity-50"
                                                        >
                                                            {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                                            Verify
                                                        </button>
                                                        {!domain.isPrimary && domain.verified && (
                                                            <button
                                                                onClick={() => handleMakePrimary(domain.hostname)}
                                                                disabled={isBusy}
                                                                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-slate-200 text-sm font-medium disabled:opacity-50"
                                                            >
                                                                <ShieldCheck className="w-4 h-4" />
                                                                Make Primary
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleDelete(domain.hostname)}
                                                            disabled={isBusy}
                                                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-300 text-sm font-medium disabled:opacity-50"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
