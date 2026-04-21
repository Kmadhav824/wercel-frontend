import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
    X,
    Zap,
    RefreshCw,
    Copy,
    Check,
    GitBranch,
    Clock,
    AlertTriangle,
    ExternalLink,
    Eye,
    EyeOff,
    Loader2,
    Webhook,
    Shield,
} from "lucide-react";

const AUTH_URL = import.meta.env.VITE_AUTH_URL || "http://localhost:4000";

interface WebhookInfo {
    autoDeploy: boolean;
    webhookUrl: string;
    hasSecret: boolean;
    lastAutoDeployAt: string | null;
}

interface AutoDeployModalProps {
    project: any;
    token: string;
    onClose: () => void;
}

export default function AutoDeployModal({ project, token, onClose }: AutoDeployModalProps) {
    const [info, setInfo] = useState<WebhookInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [regenerating, setRegenerating] = useState(false);

    // The newly-minted secret is only shown once (right after generation)
    const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
    const [showSecret, setShowSecret] = useState(false);

    const [copiedUrl, setCopiedUrl] = useState(false);
    const [copiedSecret, setCopiedSecret] = useState(false);

    const fetchInfo = useCallback(async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${AUTH_URL}/auth/projects/${project._id}/webhook`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setInfo(res.data);
        } catch (err: any) {
            toast.error(err?.response?.data?.error || "Failed to load webhook settings");
        } finally {
            setLoading(false);
        }
    }, [project._id, token]);

    useEffect(() => {
        fetchInfo();
    }, [fetchInfo]);

    const handleToggleAutoDeploy = async (newValue: boolean) => {
        setSaving(true);
        try {
            const res = await axios.patch(
                `${AUTH_URL}/auth/projects/${project._id}/webhook`,
                { autoDeploy: newValue },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setInfo((prev) => prev ? { ...prev, ...res.data } : res.data);

            // If the backend auto-generated a secret on first enable, reveal it
            if (res.data.webhookSecret) {
                setRevealedSecret(res.data.webhookSecret);
                setShowSecret(true);
            }

            toast.success(newValue ? "Auto-deploy enabled" : "Auto-deploy disabled");
        } catch (err: any) {
            toast.error(err?.response?.data?.error || "Failed to update auto-deploy setting");
        } finally {
            setSaving(false);
        }
    };

    const handleRegenerateSecret = async () => {
        if (!window.confirm("Regenerating the secret will invalidate your current GitHub webhook. You will need to update the secret in GitHub. Continue?")) {
            return;
        }
        setRegenerating(true);
        try {
            const res = await axios.patch(
                `${AUTH_URL}/auth/projects/${project._id}/webhook`,
                { regenerateSecret: true },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setInfo((prev) => prev ? { ...prev, ...res.data } : res.data);
            if (res.data.webhookSecret) {
                setRevealedSecret(res.data.webhookSecret);
                setShowSecret(true);
            }
            toast.success("Webhook secret regenerated — copy it now, it won't be shown again");
        } catch (err: any) {
            toast.error(err?.response?.data?.error || "Failed to regenerate secret");
        } finally {
            setRegenerating(false);
        }
    };

    const copyToClipboard = async (text: string, type: "url" | "secret") => {
        try {
            await navigator.clipboard.writeText(text);
            if (type === "url") {
                setCopiedUrl(true);
                setTimeout(() => setCopiedUrl(false), 2000);
            } else {
                setCopiedSecret(true);
                setTimeout(() => setCopiedSecret(false), 2000);
            }
            toast.success("Copied to clipboard");
        } catch {
            toast.error("Failed to copy");
        }
    };

    const formatDate = (iso: string | null) => {
        if (!iso) return "Never";
        return new Date(iso).toLocaleString();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="relative w-full max-w-2xl bg-[#0d0d1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-gradient-to-r from-indigo-950/40 to-violet-950/30">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                            <Webhook className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Auto-Deploy from GitHub</h2>
                            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{project.name}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-6 space-y-6 max-h-[75vh] overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                        </div>
                    ) : !info ? (
                        <p className="text-slate-400 text-center py-12">Failed to load webhook settings.</p>
                    ) : (
                        <>
                            {/* Toggle */}
                            <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-5 py-4">
                                <div className="flex items-start gap-3">
                                    <Zap className={`w-5 h-5 mt-0.5 flex-shrink-0 ${info.autoDeploy ? "text-indigo-400" : "text-slate-500"}`} />
                                    <div>
                                        <p className="text-sm font-semibold text-white">Enable Auto-Deploy</p>
                                        <p className="text-xs text-slate-400 mt-0.5 max-w-sm">
                                            Automatically redeploy this project whenever a push is made to the tracked branch
                                            {project.branch ? ` (${project.branch})` : " (default branch)"}.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleToggleAutoDeploy(!info.autoDeploy)}
                                    disabled={saving}
                                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 focus:outline-none ${
                                        info.autoDeploy
                                            ? "bg-indigo-500 border-indigo-500"
                                            : "bg-white/10 border-white/20"
                                    } ${saving ? "opacity-50 cursor-not-allowed" : ""}`}
                                >
                                    <span
                                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 mt-0.5 ${
                                            info.autoDeploy ? "translate-x-5" : "translate-x-0.5"
                                        }`}
                                    />
                                </button>
                            </div>

                            {/* Last auto-deploy */}
                            <div className="flex items-center gap-2.5 text-xs text-slate-500">
                                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                                <span>Last auto-deploy: <span className="text-slate-300 font-medium">{formatDate(info.lastAutoDeployAt)}</span></span>
                            </div>

                            {/* Branch context */}
                            <div className="flex items-center gap-2.5 text-xs text-slate-500">
                                <GitBranch className="w-3.5 h-3.5 flex-shrink-0" />
                                <span>
                                    Watching branch: <span className="text-slate-300 font-medium font-mono">{project.branch || "default"}</span>
                                    {!project.branch && <span className="ml-1 text-slate-500">(changes on any branch will match)</span>}
                                </span>
                            </div>

                            {info.autoDeploy && (
                                <>
                                    {/* Divider */}
                                    <div className="border-t border-white/5" />

                                    {/* Webhook URL */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-300 uppercase tracking-widest">
                                            Payload URL
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 bg-[#0a0a16] border border-white/10 rounded-xl px-4 py-2.5 font-mono text-xs text-slate-300 truncate select-all">
                                                {info.webhookUrl}
                                            </div>
                                            <button
                                                onClick={() => copyToClipboard(info.webhookUrl, "url")}
                                                className="flex-shrink-0 p-2.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl border border-white/10 transition-all"
                                                title="Copy URL"
                                            >
                                                {copiedUrl ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Secret */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-semibold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                                                <Shield className="w-3 h-3" />
                                                Webhook Secret
                                            </label>
                                            <button
                                                onClick={handleRegenerateSecret}
                                                disabled={regenerating}
                                                className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50"
                                            >
                                                {regenerating ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                    <RefreshCw className="w-3.5 h-3.5" />
                                                )}
                                                Regenerate
                                            </button>
                                        </div>

                                        {revealedSecret ? (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 bg-[#0a0a16] border border-amber-500/30 rounded-xl px-4 py-2.5 font-mono text-xs text-amber-200 truncate select-all">
                                                        {showSecret ? revealedSecret : "•".repeat(Math.min(revealedSecret.length, 48))}
                                                    </div>
                                                    <button
                                                        onClick={() => setShowSecret(v => !v)}
                                                        className="flex-shrink-0 p-2.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl border border-white/10 transition-all"
                                                        title={showSecret ? "Hide secret" : "Show secret"}
                                                    >
                                                        {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                    <button
                                                        onClick={() => copyToClipboard(revealedSecret, "secret")}
                                                        className="flex-shrink-0 p-2.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl border border-white/10 transition-all"
                                                        title="Copy secret"
                                                    >
                                                        {copiedSecret ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                                <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
                                                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                                                    <p className="text-xs text-amber-300 leading-relaxed">
                                                        Copy this secret now — it will <strong>not</strong> be shown again. Paste it into
                                                        the <strong>Secret</strong> field when adding the webhook in GitHub.
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-slate-400">
                                                {info.hasSecret
                                                    ? "A secret is configured. Use \"Regenerate\" to create a new one."
                                                    : "No secret configured. Enable auto-deploy to generate one automatically."}
                                            </div>
                                        )}
                                    </div>

                                    {/* Divider */}
                                    <div className="border-t border-white/5" />

                                    {/* Setup instructions */}
                                    <div className="space-y-3">
                                        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-widest">
                                            GitHub Setup Instructions
                                        </h3>
                                        <ol className="space-y-3">
                                            {[
                                                {
                                                    step: "1",
                                                    title: "Go to your GitHub repository",
                                                    body: (
                                                        <span>
                                                            Navigate to <strong>Settings → Webhooks → Add webhook</strong> in your repo.
                                                        </span>
                                                    ),
                                                },
                                                {
                                                    step: "2",
                                                    title: "Paste the Payload URL",
                                                    body: (
                                                        <span>
                                                            Set <strong>Payload URL</strong> to the URL shown above. Set{" "}
                                                            <strong>Content type</strong> to{" "}
                                                            <code className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] font-mono">
                                                                application/json
                                                            </code>.
                                                        </span>
                                                    ),
                                                },
                                                {
                                                    step: "3",
                                                    title: "Enter the Secret",
                                                    body: "Paste the webhook secret shown above into the Secret field.",
                                                },
                                                {
                                                    step: "4",
                                                    title: "Choose events",
                                                    body: (
                                                        <span>
                                                            Select <strong>Just the push event</strong>. Only push events to your tracked branch will trigger a deployment.
                                                        </span>
                                                    ),
                                                },
                                                {
                                                    step: "5",
                                                    title: "Save and test",
                                                    body: "Click Add webhook, then push a commit to the tracked branch to trigger your first auto-deploy.",
                                                },
                                            ].map((item) => (
                                                <li key={item.step} className="flex gap-3">
                                                    <span className="flex-shrink-0 w-6 h-6 bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-xs font-bold rounded-full flex items-center justify-center">
                                                        {item.step}
                                                    </span>
                                                    <div className="pt-0.5">
                                                        <p className="text-xs font-semibold text-white">{item.title}</p>
                                                        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{item.body}</p>
                                                    </div>
                                                </li>
                                            ))}
                                        </ol>

                                        <a
                                            href={project.repoUrl?.replace(/\.git$/, "") + "/settings/hooks/new"}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="mt-2 inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                            Open GitHub webhook settings for this repo
                                        </a>
                                    </div>
                                </>
                            )}

                            {!info.autoDeploy && (
                                <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-sm text-slate-400 leading-relaxed">
                                    Enable auto-deploy above to generate a webhook URL and secret for your GitHub repository. Once configured, every push to your tracked branch will automatically trigger a new deployment.
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end px-6 py-4 border-t border-white/10 bg-white/[0.02]">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 text-sm font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
