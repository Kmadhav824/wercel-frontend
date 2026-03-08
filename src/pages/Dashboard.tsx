import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Rocket, Github, Server, CheckCircle2, Loader2, ArrowRight, Settings as SettingsIcon, LogOut, Clock, RotateCcw } from "lucide-react";

const BACKEND_UPLOAD_URL = import.meta.env.VITE_BACKEND_UPLOAD_URL || "http://localhost:3000";
const AUTH_URL = import.meta.env.VITE_AUTH_URL || "http://localhost:4000";
const REQUEST_HANDLER_DOMAIN = import.meta.env.VITE_REQUEST_HANDLER_DOMAIN;

let requestHandlerHostname = "localhost";
let requestHandlerPort = ":3001";
try {
    if (REQUEST_HANDLER_DOMAIN) {
        requestHandlerHostname = REQUEST_HANDLER_DOMAIN;
        requestHandlerPort = "";
    } else {
        const url = new URL(BACKEND_UPLOAD_URL);
        requestHandlerHostname = url.hostname;
        if (requestHandlerHostname !== "localhost") {
            requestHandlerPort = ""; // use default HTTP/HTTPS ports in production
        }
    }
} catch (e) {
    // Ignore
}

export default function Dashboard() {
    const { user, token, logout } = useAuth();

    const [projects, setProjects] = useState<any[]>([]);
    const [repos, setRepos] = useState<any[]>([]);
    const [githubLinked, setGithubLinked] = useState<boolean>(true);
    const [loading, setLoading] = useState(true);

    const [deployingRepo, setDeployingRepo] = useState<string | null>(null);
    const [rollingBack, setRollingBack] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"projects" | "deployments" | "github">("projects");
    const [deployments, setDeployments] = useState<any[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

    useEffect(() => {
        if (token) {
            loadProjects();
            checkGithub();
        }
    }, [token]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (activeTab === "deployments" && selectedProjectId) {
            const hasBuilding = deployments.some(d => d.status === "queued" || d.status === "building");
            if (hasBuilding) {
                interval = setInterval(() => {
                    loadDeployments(selectedProjectId, true); // silent refresh
                }, 3000);
            }
        }
        return () => clearInterval(interval);
    }, [activeTab, selectedProjectId, deployments]);

    const loadProjects = async () => {
        try {
            const res = await axios.get(`${AUTH_URL}/projects`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProjects(res.data.projects || []);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const checkGithub = async () => {
        try {
            const res = await axios.get(`${AUTH_URL}/user/github/repos`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRepos(res.data.repos || []);
            setGithubLinked(true);
        } catch (err: any) {
            if (err.response?.status === 400 || err.response?.status === 401) {
                setGithubLinked(false);
            }
        }
    };

    const loadDeployments = async (projectId: string, silent = false) => {
        try {
            if (!silent) {
                setSelectedProjectId(projectId);
                setActiveTab("deployments");
            }
            const res = await axios.get(`${AUTH_URL}/projects/${projectId}/deployments`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDeployments(res.data.deployments || []);
            if (!silent) loadProjects(); // refresh projects list status too just in case
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeployGithub = async (repo: any) => {
        setDeployingRepo(repo.id);
        try {
            const res = await axios.post(`${AUTH_URL}/projects`, {
                name: repo.name,
                repoUrl: repo.clone_url || repo.url
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Redirect to deployments tab instantly to see progress
            await loadProjects();
            loadDeployments(res.data.project._id);
        } catch (err) {
            alert("Error deploying repository");
        } finally {
            setDeployingRepo(null);
        }
    };

    const handleRollback = async (deploymentId: string, uploadId: string) => {
        if (!selectedProjectId) return;
        setRollingBack(deploymentId);
        try {
            await axios.post(`${AUTH_URL}/projects/${selectedProjectId}/rollback`, {
                uploadId: uploadId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert("Rollback successful! The selected deployment is now active.");
            loadProjects();
        } catch (err) {
            alert("Failed to rollback");
        } finally {
            setRollingBack(null);
        }
    };

    return (
        <div className="min-h-screen bg-[#06060c] text-slate-100 font-sans selection:bg-indigo-500/30">
            {/* Navigation */}
            <nav className="border-b border-white/5 bg-[#06060c]/80 backdrop-blur-2xl sticky top-0 z-50">
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link to="/" className="flex items-center gap-3 group cursor-pointer">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-[1px] shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all duration-500">
                                <div className="w-full h-full rounded-[7px] bg-[#06060c] flex items-center justify-center group-hover:bg-transparent transition-colors duration-500">
                                    <Rocket className="w-4 h-4 text-white" strokeWidth={2.5} />
                                </div>
                            </div>
                            <span className="text-xl font-bold tracking-tight text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-400 group-hover:to-pink-400 transition-all">Nexus <span className="text-slate-500 font-medium">Dashboard</span></span>
                        </Link>

                        <div className="flex items-center gap-4">
                            <Link to="/settings" className="text-sm font-medium text-slate-400 hover:text-white transition-all flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5">
                                <SettingsIcon className="w-4 h-4" />
                                Settings
                            </Link>
                            <div className="h-5 w-[1px] bg-white/10"></div>
                            <div className="flex items-center gap-3">
                                {user?.avatar ? (
                                    <img src={user.avatar} alt="Avatar" className="w-8 h-8 rounded-full border border-indigo-500/30 object-cover" />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center border border-indigo-500/30 text-white font-bold text-sm">
                                        {user?.name?.charAt(0).toUpperCase() || "U"}
                                    </div>
                                )}
                                <button onClick={logout} className="text-slate-400 hover:text-red-400 transition-colors p-1 rounded-md hover:bg-red-500/10">
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="flex flex-col md:flex-row gap-8">

                    {/* Sidebar */}
                    <div className="w-full md:w-64 shrink-0 space-y-2">
                        <button
                            onClick={() => setActiveTab("projects")}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === "projects" ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"}`}
                        >
                            <Server className="w-5 h-5" />
                            My Projects
                        </button>
                        <button
                            onClick={() => setActiveTab("github")}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === "github" ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"}`}
                        >
                            <Github className="w-5 h-5" />
                            Deploy Repository
                        </button>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1">
                        {loading ? (
                            <div className="flex items-center justify-center h-64">
                                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                            </div>
                        ) : (
                            <div className="space-y-6">

                                {/* Projects Tab */}
                                {activeTab === "projects" && (
                                    <>
                                        <div className="flex items-center justify-between mb-6">
                                            <h2 className="text-2xl font-bold text-white tracking-tight">Your Projects</h2>
                                            <button onClick={() => setActiveTab("github")} className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_20px_rgba(99,102,241,0.5)]">
                                                Add New
                                            </button>
                                        </div>

                                        {projects.length === 0 ? (
                                            <div className="bg-[#0a0a16] border border-white/10 rounded-2xl p-12 text-center shadow-xl">
                                                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                    <Rocket className="w-8 h-8 text-slate-500" />
                                                </div>
                                                <h3 className="text-lg font-bold text-white mb-2">No projects yet</h3>
                                                <p className="text-slate-400 mb-6 max-w-sm mx-auto">Import a repository from GitHub or deploy from a public Git URL to get started.</p>
                                                <button onClick={() => setActiveTab("github")} className="bg-white/10 hover:bg-white/20 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-all border border-white/10">
                                                    Deploy Project
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                {projects.map(p => (
                                                    <div key={p._id} className="bg-[#0a0a16]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-indigo-500/50 transition-all group shadow-lg">
                                                        <div className="flex justify-between items-start mb-4">
                                                            <h3 className="text-xl font-bold text-white truncate pr-4">{p.name}</h3>
                                                            {p.status === "deployed" ? (
                                                                <span className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wide">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                                                    Ready
                                                                </span>
                                                            ) : p.status === "failed" ? (
                                                                <span className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wide">
                                                                    Failed
                                                                </span>
                                                            ) : (
                                                                <span className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wide">
                                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                                    Building
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="space-y-3 mb-6">
                                                            {p.status === "deployed" ? (
                                                                <a
                                                                    href={`http://${p.activeDeploymentId}.${requestHandlerHostname}${requestHandlerPort}`}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="text-slate-300 hover:text-indigo-400 text-sm truncate block font-mono bg-white/5 px-3 py-2 rounded-lg"
                                                                >
                                                                    {p.activeDeploymentId}.{requestHandlerHostname}{requestHandlerPort}
                                                                </a>
                                                            ) : (
                                                                <div className="text-slate-500 text-sm truncate block font-mono bg-white/5 px-3 py-2 rounded-lg cursor-not-allowed">
                                                                    {p.activeDeploymentId}.{requestHandlerHostname}{requestHandlerPort}
                                                                </div>
                                                            )}
                                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                                <Github className="w-3.5 h-3.5" />
                                                                <span className="truncate">{p.repoUrl}</span>
                                                            </div>
                                                        </div>

                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => loadDeployments(p._id)}
                                                                className="flex-1 bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all border border-white/10 text-center"
                                                            >
                                                                Manage Deployments
                                                            </button>
                                                            {p.status === "deployed" ? (
                                                                <a
                                                                    href={`http://${p.activeDeploymentId}.${requestHandlerHostname}${requestHandlerPort}`}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-[0_0_15px_rgba(99,102,241,0.2)] transition-all flex items-center justify-center"
                                                                >
                                                                    Visit
                                                                </a>
                                                            ) : (
                                                                <button
                                                                    disabled
                                                                    className="bg-slate-800 text-slate-500 px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center justify-center cursor-not-allowed"
                                                                >
                                                                    Visit
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Deployments History Tab */}
                                {activeTab === "deployments" && (
                                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="flex items-center gap-4 mb-6">
                                            <button onClick={() => setActiveTab("projects")} className="text-slate-400 hover:text-white hover:bg-white/5 p-2 rounded-lg transition-all">
                                                <ArrowRight className="w-5 h-5 rotate-180" />
                                            </button>
                                            <h2 className="text-2xl font-bold text-white tracking-tight">Deployments History</h2>
                                        </div>

                                        <div className="bg-[#0a0a16]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden">
                                            {deployments.length === 0 ? (
                                                <div className="p-8 text-center text-slate-400">Loading deployments...</div>
                                            ) : (
                                                <div className="divide-y divide-white/5">
                                                    {deployments.map(d => {
                                                        const project = projects.find(p => p._id === d.projectId);
                                                        const isActive = project?.activeDeploymentId === d.uploadId;

                                                        return (
                                                            <div key={d._id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                                                                <div className="space-y-1">
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="font-mono text-sm text-indigo-300 font-bold">{d.uploadId.substring(0, 8)}</span>
                                                                        {isActive ? (
                                                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Current</span>
                                                                        ) : null}
                                                                    </div>
                                                                    <div className="text-xs text-slate-500 flex items-center gap-1.5">
                                                                        <Clock className="w-3.5 h-3.5" />
                                                                        {new Date(d.createdAt).toLocaleString()}
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-3">
                                                                    <div className="text-sm">
                                                                        {d.status === "deployed" ? (
                                                                            <span className="text-emerald-400 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Ready</span>
                                                                        ) : d.status === "failed" ? (
                                                                            <span className="text-red-400 flex items-center gap-1.5">Failed</span>
                                                                        ) : (
                                                                            <span className="text-amber-400 flex items-center gap-1.5"><Loader2 className="w-4 h-4 animate-spin" /> Building</span>
                                                                        )}
                                                                    </div>

                                                                    <div className="w-px h-8 bg-white/10 hidden md:block mx-2"></div>

                                                                    {!isActive && d.status === "deployed" && (
                                                                        <button
                                                                            onClick={() => handleRollback(d._id, d.uploadId)}
                                                                            disabled={rollingBack === d._id}
                                                                            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-slate-300 px-3 py-1.5 rounded-lg text-sm transition-all border border-white/10"
                                                                        >
                                                                            {rollingBack === d._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                                                                            Rollback
                                                                        </button>
                                                                    )}

                                                                    <a
                                                                        href={`http://${d.uploadId}.${requestHandlerHostname}${requestHandlerPort}`}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                                                                    >
                                                                        Preview
                                                                    </a>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* GitHub Integration Tab */}
                                {activeTab === "github" && (
                                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <h2 className="text-2xl font-bold text-white tracking-tight mb-6 flex items-center gap-3">
                                            <Github className="w-6 h-6" /> Deploy Repository
                                        </h2>

                                        {!githubLinked ? (
                                            <div className="bg-[#0a0a16]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 sm:p-12 text-center shadow-xl relative overflow-hidden">
                                                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(99,102,241,0.1)]">
                                                    <Github className="w-10 h-10 text-indigo-400" />
                                                </div>
                                                <h3 className="text-2xl font-bold text-white mb-3">Link GitHub Account</h3>
                                                <p className="text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">Connect your GitHub account to automatically list your repositories and deploy with a single click.</p>

                                                <Link to="/settings" className="inline-flex items-center gap-2 bg-white text-[#06060c] hover:bg-indigo-50 px-8 py-3.5 rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95">
                                                    Go to Settings to Link
                                                </Link>

                                                <div className="mt-8 pt-8 border-t border-white/5">
                                                    <p className="text-sm text-slate-500 mb-4">Or deploy manually via URL</p>
                                                    <Link to="/" className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors">
                                                        Use Homepage Link Importer &rarr;
                                                    </Link>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-end mb-4">
                                                    <p className="text-slate-400">Select a repository to deploy.</p>
                                                    <button onClick={checkGithub} className="text-xs text-indigo-400 hover:text-indigo-300 font-medium tracking-wide uppercase">Refresh list</button>
                                                </div>

                                                {repos.length === 0 ? (
                                                    <div className="bg-[#0a0a16] border border-white/10 rounded-xl p-8 text-center">
                                                        <p className="text-slate-400">No repositories found or token lacks permissions.</p>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                        {repos.map(repo => (
                                                            <div key={repo.id} className="bg-[#0a0a16] border border-white/10 rounded-xl p-5 hover:border-indigo-500/40 hover:bg-white/[0.02] transition-all group shadow-md hover:shadow-xl">
                                                                <div className="flex items-start justify-between mb-3">
                                                                    <div className="flex items-center gap-2 text-white font-semibold truncate pr-2">
                                                                        <Github className="w-4 h-4 text-slate-400" />
                                                                        <span className="truncate">{repo.name}</span>
                                                                    </div>
                                                                    {repo.private && (
                                                                        <span className="text-[10px] uppercase tracking-widest bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-bold border border-slate-700">Private</span>
                                                                    )}
                                                                </div>
                                                                <p className="text-xs text-slate-500 mb-5 font-mono truncate">{repo.full_name}</p>

                                                                <button
                                                                    onClick={() => handleDeployGithub(repo)}
                                                                    disabled={deployingRepo === repo.id}
                                                                    className="w-full bg-white/5 hover:bg-indigo-500/20 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all border border-white/10 hover:border-indigo-500/30 flex items-center justify-center gap-2 group-hover:bg-indigo-500 group-hover:border-indigo-500 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] disabled:opacity-50 disabled:pointer-events-none"
                                                                >
                                                                    {deployingRepo === repo.id ? (
                                                                        <><Loader2 className="w-4 h-4 animate-spin" /> Deploying...</>
                                                                    ) : (
                                                                        <>Deploy <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                                                                    )}
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
