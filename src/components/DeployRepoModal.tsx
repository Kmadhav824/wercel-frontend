import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { X, Loader2, Rocket, RefreshCcw } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const AUTH_URL = import.meta.env.VITE_AUTH_URL || "http://localhost:4000";

interface RepoSummary {
    id: string | number;
    name: string;
    fullName?: string;
    cloneUrl?: string;
    url?: string;
    defaultBranch?: string;
}

interface BuildSettings {
    framework: string;
    branch: string;
    rootDirectory: string;
    installCommand: string;
    buildCommand: string;
    outputDirectory: string;
    hasBuildScript: boolean;
}

interface DeployRepoModalProps {
    repo: RepoSummary;
    onClose: () => void;
    onDeployed: (projectId: string) => void;
}

const DEFAULT_BUILD_SETTINGS: BuildSettings = {
    framework: "unknown",
    branch: "",
    rootDirectory: ".",
    installCommand: "npm install --legacy-peer-deps",
    buildCommand: "npm run build",
    outputDirectory: "dist",
    hasBuildScript: false,
};

export default function DeployRepoModal({ repo, onClose, onDeployed }: DeployRepoModalProps) {
    const { token } = useAuth();
    const [settings, setSettings] = useState<BuildSettings>({
        ...DEFAULT_BUILD_SETTINGS,
        branch: repo.defaultBranch || "",
    });
    const [loading, setLoading] = useState(true);
    const [deploying, setDeploying] = useState(false);
    const [detecting, setDetecting] = useState(false);
    const [branches, setBranches] = useState<string[]>([]);
    const [branchesLoading, setBranchesLoading] = useState(false);

    const repoUrl = repo.cloneUrl || repo.url || "";

    const loadBranches = async () => {
        if (!token || !repoUrl) {
            return;
        }

        setBranchesLoading(true);
        try {
            const res = await axios.get(`${AUTH_URL}/auth/github/branches`, {
                params: { repoUrl },
                headers: { Authorization: `Bearer ${token}` },
            });

            const fetchedBranches = Array.isArray(res.data.branches) ? res.data.branches : [];
            setBranches(fetchedBranches);
            if (!settings.branch && fetchedBranches.length > 0) {
                setSettings((prev) => ({
                    ...prev,
                    branch: prev.branch || repo.defaultBranch || fetchedBranches[0] || "",
                }));
            }
        } catch (err: any) {
            const message = err?.response?.data?.error;
            if (message) {
                toast.error(message);
            }
        } finally {
            setBranchesLoading(false);
        }
    };

    const detectBuildSettings = async (rootDirectoryOverride?: string) => {
        if (!token || !repoUrl) {
            return;
        }

        setDetecting(true);
        try {
            const res = await axios.post(`${AUTH_URL}/auth/projects/detect-build-settings`, {
                repoUrl,
                branch: settings.branch.trim(),
                rootDirectory: rootDirectoryOverride ?? settings.rootDirectory,
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setSettings((prev) => ({
                ...prev,
                ...res.data.buildSettings,
            }));
        } catch (err: any) {
            const message = err?.response?.data?.error || "Failed to detect build settings";
            toast.error(message);
        } finally {
            setDetecting(false);
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadBranches();
        void detectBuildSettings(".");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [repoUrl, token]);

    const handleDeploy = async () => {
        if (!settings.rootDirectory.trim() || !settings.installCommand.trim() || !settings.buildCommand.trim() || !settings.outputDirectory.trim()) {
            toast.error("All fields are required");
            return;
        }

        setDeploying(true);
        try {
            const res = await axios.post(`${AUTH_URL}/auth/projects`, {
                name: repo.name,
                repoUrl,
                branch: settings.branch.trim(),
                rootDirectory: settings.rootDirectory.trim(),
                installCommand: settings.installCommand.trim(),
                buildCommand: settings.buildCommand.trim(),
                outputDirectory: settings.outputDirectory.trim(),
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });

            toast.success("Deployment started");
            onDeployed(res.data.project._id);
            onClose();
        } catch (err: any) {
            const message = err?.response?.data?.error || "Error deploying repository";
            toast.error(message);
        } finally {
            setDeploying(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-[#0a0a16] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white">Deploy Repository</h2>
                        <p className="text-sm text-slate-400 mt-1">
                            Review build settings for <span className="text-indigo-400 font-mono">{repo.fullName || repo.name}</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {loading ? (
                        <div className="flex items-center justify-center h-48">
                            <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                        </div>
                    ) : (
                        <>
                            <div className="space-y-1">
                                <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Detected Framework</label>
                                <div className="px-3 py-2.5 rounded-lg border border-white/10 bg-[#05050f] text-slate-300 text-sm capitalize">
                                    {settings.framework || "unknown"}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Branch</label>
                                <div className="space-y-2">
                                    <select
                                        value={settings.branch}
                                        onChange={(e) => setSettings((prev) => ({ ...prev, branch: e.target.value }))}
                                        className="w-full bg-[#05050f] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono transition-colors"
                                        disabled={branchesLoading}
                                    >
                                        <option value="">{repo.defaultBranch ? `Default (${repo.defaultBranch})` : "Repository default"}</option>
                                        {branches.map((branchName) => (
                                            <option key={branchName} value={branchName}>
                                                {branchName}
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        value={settings.branch}
                                        onChange={(e) => setSettings((prev) => ({ ...prev, branch: e.target.value }))}
                                        placeholder={repo.defaultBranch || "main"}
                                        className="w-full bg-[#05050f] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono transition-colors"
                                    />
                                </div>
                                <p className="text-xs text-slate-500">
                                    {branchesLoading ? "Loading branches from GitHub..." : "Pick a detected branch or type a custom branch name."}
                                </p>
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center justify-between gap-3">
                                    <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Root Directory</label>
                                    <button
                                        onClick={() => detectBuildSettings(settings.rootDirectory.trim() || ".")}
                                        disabled={detecting}
                                        className="text-xs text-indigo-300 hover:text-indigo-200 inline-flex items-center gap-1 disabled:opacity-50"
                                    >
                                        {detecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />}
                                        Re-detect
                                    </button>
                                </div>
                                <input
                                    value={settings.rootDirectory}
                                    onChange={(e) => setSettings((prev) => ({ ...prev, rootDirectory: e.target.value }))}
                                    placeholder="apps/web"
                                    className="w-full bg-[#05050f] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono transition-colors"
                                />
                                <p className="text-xs text-slate-500">Use <span className="font-mono">.</span> for repo root. Change this before the first deploy if your app lives in a subfolder.</p>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Install Command</label>
                                <input
                                    value={settings.installCommand}
                                    onChange={(e) => setSettings((prev) => ({ ...prev, installCommand: e.target.value }))}
                                    placeholder="npm install"
                                    className="w-full bg-[#05050f] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono transition-colors"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Build Command</label>
                                <input
                                    value={settings.buildCommand}
                                    onChange={(e) => setSettings((prev) => ({ ...prev, buildCommand: e.target.value }))}
                                    placeholder="npm run build"
                                    className="w-full bg-[#05050f] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono transition-colors"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Output Directory</label>
                                <input
                                    value={settings.outputDirectory}
                                    onChange={(e) => setSettings((prev) => ({ ...prev, outputDirectory: e.target.value }))}
                                    placeholder="dist"
                                    className="w-full bg-[#05050f] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono transition-colors"
                                />
                            </div>
                        </>
                    )}
                </div>

                <div className="p-6 border-t border-white/5 flex items-center justify-end gap-3 bg-black/20">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={handleDeploy}
                        disabled={loading || detecting || deploying}
                        className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {deploying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                        Deploy
                    </button>
                </div>
            </div>
        </div>
    );
}
