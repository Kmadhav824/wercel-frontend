import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { X, Plus, Trash2, Loader2, Save } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const AUTH_URL = import.meta.env.VITE_AUTH_URL || "http://localhost:4000";

interface EnvVar {
    key: string;
    value: string;
}

interface EnvVarsModalProps {
    project: any;
    onClose: () => void;
}

export default function EnvVarsModal({ project, onClose }: EnvVarsModalProps) {
    const { token } = useAuth();
    const [envVars, setEnvVars] = useState<EnvVar[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchEnvVars = async () => {
            try {
                const res = await axios.get(`${AUTH_URL}/auth/projects/${project._id}/env`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setEnvVars(res.data.envVars || []);
            } catch (err) {
                toast.error("Failed to fetch environment variables");
            } finally {
                setLoading(false);
            }
        };
        fetchEnvVars();
    }, [project._id, token]);

    const handleAdd = () => {
        setEnvVars([...envVars, { key: "", value: "" }]);
    };

    const handleRemove = (index: number) => {
        setEnvVars(envVars.filter((_, i) => i !== index));
    };

    const handleChange = (index: number, field: "key" | "value", val: string) => {
        const newVars = [...envVars];
        newVars[index][field] = val;
        setEnvVars(newVars);
    };

    const handleSave = async () => {
        // Filter out empty keys
        const validVars = envVars.filter(v => v.key.trim() !== "");

        setSaving(true);
        try {
            await axios.put(`${AUTH_URL}/auth/projects/${project._id}/env`, {
                envVars: validVars
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Environment variables saved successfully");
            onClose();
        } catch (err) {
            toast.error("Failed to save environment variables");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-[#0a0a16] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white">Environment Variables</h2>
                        <p className="text-sm text-slate-400 mt-1">Configure environment variables for <span className="text-indigo-400 font-mono">{project.name}</span></p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-32">
                            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {envVars.length === 0 ? (
                                <div className="text-center py-8 bg-white/5 rounded-xl border border-white/5 border-dashed">
                                    <p className="text-slate-400 text-sm">No environment variables defined yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {envVars.map((env, index) => (
                                        <div key={index} className="flex gap-3 items-start">
                                            <div className="flex-1 space-y-1">
                                                <input
                                                    type="text"
                                                    placeholder="KEY (e.g. DATABASE_URL)"
                                                    value={env.key}
                                                    onChange={(e) => handleChange(index, "key", e.target.value)}
                                                    className="w-full bg-[#05050f] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono transition-colors"
                                                />
                                            </div>
                                            <div className="flex-[2] space-y-1">
                                                <input
                                                    type="text"
                                                    placeholder="Value"
                                                    value={env.value}
                                                    onChange={(e) => handleChange(index, "value", e.target.value)}
                                                    className="w-full bg-[#05050f] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono transition-colors"
                                                />
                                            </div>
                                            <button
                                                onClick={() => handleRemove(index)}
                                                className="p-2.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <button
                                onClick={handleAdd}
                                className="flex items-center gap-2 text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors py-2"
                            >
                                <Plus className="w-4 h-4" /> Add Variable
                            </button>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-white/5 flex items-center justify-between bg-black/20">
                    <p className="text-xs text-slate-500 max-w-sm">Changes will take effect on the next deployment of this project.</p>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
