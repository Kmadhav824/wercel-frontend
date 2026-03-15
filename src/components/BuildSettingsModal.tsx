import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { X, Loader2, Save, Rocket } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const AUTH_URL = import.meta.env.VITE_AUTH_URL || "http://localhost:4000";

interface BuildSettingsModalProps {
    project: any;
    onClose: () => void;
    onSaved: () => void;
    onRedeployed: (projectId: string) => void;
}

export default function BuildSettingsModal({ project, onClose, onSaved, onRedeployed }: BuildSettingsModalProps) {
    const { token } = useAuth();

    const [branch, setBranch] = useState(project.branch || "");
    const [rootDirectory, setRootDirectory] = useState(project.rootDirectory || ".");
    const [installCommand, setInstallCommand] = useState(project.installCommand || "npm install --legacy-peer-deps");
    const [buildCommand, setBuildCommand] = useState(project.buildCommand || "npm run build");
    const [outputDirectory, setOutputDirectory] = useState(project.outputDirectory || "dist");
    const [saving, setSaving] = useState<"idle" | "saving" | "redeploying">("idle");
    const [branches, setBranches] = useState<string[]>([]);
    const [branchesLoading, setBranchesLoading] = useState(false);

    useEffect(() => {
        const loadBranches = async () => {
            if (!token || !project.repoUrl) {
                return;
            }

            setBranchesLoading(true);
            try {
                const res = await axios.get(`${AUTH_URL}/auth/github/branches`, {
                    params: { repoUrl: project.repoUrl },
                    headers: { Authorization: `Bearer ${token}` },
                });
                setBranches(Array.isArray(res.data.branches) ? res.data.branches : []);
            } catch (err: any) {
                const message = err?.response?.data?.error;
                if (message) {
                    toast.error(message);
                }
            } finally {
                setBranchesLoading(false);
            }
        };

        void loadBranches();
    }, [project.repoUrl, token]);

    const persistSettings = async () => {
        await axios.put(`${AUTH_URL}/auth/projects/${project._id}/build-settings`, {
            branch: branch.trim(),
            rootDirectory: rootDirectory.trim(),
            installCommand: installCommand.trim(),
            buildCommand: buildCommand.trim(),
            outputDirectory: outputDirectory.trim(),
        }, {
            headers: { Authorization: `Bearer ${token}` },
        });
    };

    const handleSave = async (redeploy = false) => {
        if (!rootDirectory.trim() || !installCommand.trim() || !buildCommand.trim() || !outputDirectory.trim()) {
            toast.error("All fields are required");
            return;
        }

        setSaving(redeploy ? "redeploying" : "saving");
        try {
            await persistSettings();

            if (redeploy) {
                await axios.post(`${AUTH_URL}/auth/projects/${project._id}/redeploy`, {}, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                toast.success("Settings saved and redeploy started");
                onSaved();
                onRedeployed(project._id);
            } else {
                toast.success("Build settings saved successfully");
                onSaved();
            }
            onClose();
        } catch (err: any) {
            const message = err?.response?.data?.error || (redeploy ? "Failed to save settings and redeploy" : "Failed to save build settings");
            toast.error(message);
        } finally {
            setSaving("idle");
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-[#0a0a16] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white">Build Settings</h2>
                        <p className="text-sm text-slate-400 mt-1">
                            Customize build commands for <span className="text-indigo-400 font-mono">{project.name}</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    <div className="space-y-1">
                        <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Detected Framework</label>
                        <div className="px-3 py-2.5 rounded-lg border border-white/10 bg-[#05050f] text-slate-300 text-sm capitalize">
                            {project.framework || "unknown"}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Branch</label>
                        <div className="space-y-2">
                            <select
                                value={branch}
                                onChange={(e) => setBranch(e.target.value)}
                                className="w-full bg-[#05050f] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono transition-colors"
                                disabled={branchesLoading}
                            >
                                <option value="">Repository default</option>
                                {branches.map((branchName) => (
                                    <option key={branchName} value={branchName}>
                                        {branchName}
                                    </option>
                                ))}
                            </select>
                            <input
                                value={branch}
                                onChange={(e) => setBranch(e.target.value)}
                                placeholder="main"
                                className="w-full bg-[#05050f] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono transition-colors"
                            />
                        </div>
                        <p className="text-xs text-slate-500">
                            {branchesLoading ? "Loading branches from GitHub..." : "Pick a detected branch or type a custom branch name."}
                        </p>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Root Directory</label>
                        <input
                            value={rootDirectory}
                            onChange={(e) => setRootDirectory(e.target.value)}
                            placeholder="apps/web"
                            className="w-full bg-[#05050f] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono transition-colors"
                        />
                        <p className="text-xs text-slate-500">Use <span className="font-mono">.</span> for repo root.</p>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Install Command</label>
                        <input
                            value={installCommand}
                            onChange={(e) => setInstallCommand(e.target.value)}
                            placeholder="yarn install"
                            className="w-full bg-[#05050f] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono transition-colors"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Build Command</label>
                        <input
                            value={buildCommand}
                            onChange={(e) => setBuildCommand(e.target.value)}
                            placeholder="npm run build"
                            className="w-full bg-[#05050f] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono transition-colors"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Output Directory</label>
                        <input
                            value={outputDirectory}
                            onChange={(e) => setOutputDirectory(e.target.value)}
                            placeholder="dist"
                            className="w-full bg-[#05050f] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono transition-colors"
                        />
                        <p className="text-xs text-slate-500">Changes apply to the next deployment.</p>
                    </div>
                </div>

                <div className="p-6 border-t border-white/5 flex items-center justify-end gap-3 bg-black/20">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={() => handleSave()}
                        disabled={saving !== "idle"}
                        className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving === "saving" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Changes
                    </button>
                    <button
                        onClick={() => handleSave(true)}
                        disabled={saving !== "idle"}
                        className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-all shadow-[0_0_15px_rgba(16,185,129,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving === "redeploying" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                        Save & Redeploy
                    </button>
                </div>
            </div>
        </div>
    );
}
