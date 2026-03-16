import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { X, Loader2, Save, Rocket } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const AUTH_URL = import.meta.env.VITE_AUTH_URL || "http://localhost:4000";

const STATIC_SITE_BUILD_COMMAND = "rm -rf dist && mkdir -p dist && find . -mindepth 1 -maxdepth 1 ! -name dist ! -name build ! -name node_modules ! -name .git ! -name .nexus-static-dist -exec cp -R {} dist/ \\;";

function getPresetDefaults(frameworkPreset: "auto" | "vite" | "cra" | "vue" | "static" | "nextjs-static" | "custom") {
    switch (frameworkPreset) {
        case "vite":
            return { installCommand: "npm install --legacy-peer-deps", buildCommand: "npm run build", outputDirectory: "dist" };
        case "cra":
            return { installCommand: "npm install --legacy-peer-deps", buildCommand: "npm run build", outputDirectory: "build" };
        case "vue":
            return { installCommand: "npm install --legacy-peer-deps", buildCommand: "npm run build", outputDirectory: "dist" };
        case "static":
            return { installCommand: "true", buildCommand: STATIC_SITE_BUILD_COMMAND, outputDirectory: "dist" };
        case "nextjs-static":
            return { installCommand: "npm install --legacy-peer-deps", buildCommand: "npm run build", outputDirectory: "out" };
        default:
            return null;
    }
}

interface BuildSettingsModalProps {
    project: any;
    onClose: () => void;
    onSaved: () => void;
    onRedeployed: (projectId: string) => void;
}

export default function BuildSettingsModal({ project, onClose, onSaved, onRedeployed }: BuildSettingsModalProps) {
    const { token } = useAuth();

    const [frameworkPreset, setFrameworkPreset] = useState<"auto" | "vite" | "cra" | "vue" | "static" | "nextjs-static" | "custom">(project.frameworkPreset || "auto");
    const [branch, setBranch] = useState(project.branch || "");
    const [rootDirectory, setRootDirectory] = useState(project.rootDirectory || ".");
    const [installCommand, setInstallCommand] = useState(project.installCommand || "npm install --legacy-peer-deps");
    const [buildCommand, setBuildCommand] = useState(project.buildCommand || "npm run build");
    const [outputDirectory, setOutputDirectory] = useState(project.outputDirectory || "dist");
    const [saving, setSaving] = useState<"idle" | "saving" | "redeploying">("idle");
    const [branches, setBranches] = useState<string[]>([]);
    const [branchesLoading, setBranchesLoading] = useState(false);
    const [detecting, setDetecting] = useState(false);
    const [detectedWarning, setDetectedWarning] = useState<string | null>(null);
    const [detectedFramework, setDetectedFramework] = useState<string>(project.framework || "unknown");

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

    const detectBuildSettings = async (
        frameworkPresetOverride = frameworkPreset,
        branchOverride = branch,
        rootDirectoryOverride = rootDirectory
    ) => {
        if (!token || !project.repoUrl) {
            return;
        }

        setDetecting(true);
        try {
            const res = await axios.post(`${AUTH_URL}/auth/projects/detect-build-settings`, {
                repoUrl: project.repoUrl,
                frameworkPreset: frameworkPresetOverride,
                branch: branchOverride.trim(),
                rootDirectory: rootDirectoryOverride.trim(),
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setDetectedFramework(res.data.buildSettings?.framework || "unknown");
            setDetectedWarning(res.data.buildSettings?.warning || null);

            if (frameworkPresetOverride === "auto") {
                setInstallCommand(res.data.buildSettings?.installCommand || installCommand);
                setBuildCommand(res.data.buildSettings?.buildCommand || buildCommand);
                setOutputDirectory(res.data.buildSettings?.outputDirectory || outputDirectory);
            }
        } catch (err: any) {
            const message = err?.response?.data?.error;
            if (message) {
                setDetectedFramework(project.framework || "unknown");
                setDetectedWarning(message);
            }
        } finally {
            setDetecting(false);
        }
    };

    useEffect(() => {
        void detectBuildSettings(project.frameworkPreset || frameworkPreset, project.branch || branch, project.rootDirectory || rootDirectory);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [project.repoUrl, token]);

    const persistSettings = async () => {
        await axios.put(`${AUTH_URL}/auth/projects/${project._id}/build-settings`, {
            frameworkPreset,
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
                        <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Framework Preset</label>
                        <select
                            value={frameworkPreset}
                            onChange={(e) => {
                                const nextPreset = e.target.value as typeof frameworkPreset;
                                setFrameworkPreset(nextPreset);
                                const defaults = getPresetDefaults(nextPreset);
                                if (!defaults) {
                                    void detectBuildSettings(nextPreset, branch, rootDirectory);
                                    return;
                                }
                                setInstallCommand(defaults.installCommand);
                                setBuildCommand(defaults.buildCommand);
                                setOutputDirectory(defaults.outputDirectory);
                                void detectBuildSettings(nextPreset, branch, rootDirectory);
                            }}
                            className="w-full bg-[#05050f] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                        >
                            <option value="auto">Auto Detect</option>
                            <option value="vite">Vite</option>
                            <option value="cra">Create React App</option>
                            <option value="vue">Vue</option>
                            <option value="static">Static HTML/CSS/JS</option>
                            <option value="nextjs-static">Next.js Static Export</option>
                            <option value="custom">Custom</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Detected Framework</label>
                        <div className="px-3 py-2.5 rounded-lg border border-white/10 bg-[#05050f] text-slate-300 text-sm capitalize">
                            {detectedFramework || "unknown"}
                        </div>
                    </div>

                    {frameworkPreset === "nextjs-static" && (
                        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
                            This preset only supports fully static Next.js exports. Your <span className="font-mono">next.config.*</span> must include <span className="font-mono">output: 'export'</span>.
                        </div>
                    )}

                    {detectedWarning && (
                        <div className="rounded-lg border border-sky-500/20 bg-sky-500/10 px-3 py-2 text-sm text-sky-200">
                            {detectedWarning}
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Branch</label>
                        <div className="space-y-2">
                            <select
                                value={branch}
                                onChange={(e) => {
                                    setBranch(e.target.value);
                                    void detectBuildSettings(frameworkPreset, e.target.value, rootDirectory);
                                }}
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
                                onChange={(e) => {
                                    setBranch(e.target.value);
                                    void detectBuildSettings(frameworkPreset, e.target.value, rootDirectory);
                                }}
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
                            onChange={(e) => {
                                setRootDirectory(e.target.value);
                                void detectBuildSettings(frameworkPreset, branch, e.target.value);
                            }}
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
                        disabled={saving !== "idle" || detecting}
                        className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving === "saving" || detecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Changes
                    </button>
                    <button
                        onClick={() => handleSave(true)}
                        disabled={saving !== "idle" || detecting}
                        className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-all shadow-[0_0_15px_rgba(16,185,129,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving === "redeploying" || detecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                        Save & Redeploy
                    </button>
                </div>
            </div>
        </div>
    );
}
