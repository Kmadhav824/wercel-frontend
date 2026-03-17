import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import EnvVarsModal from "../components/EnvVarsModal";
import BuildSettingsModal from "../components/BuildSettingsModal";
import DeployRepoModal from "../components/DeployRepoModal";
import { Rocket, Github, Server, CheckCircle2, Loader2, ArrowRight, Settings as SettingsIcon, LogOut, Clock, RotateCcw, Trash2, Search, Sliders, Wrench, Terminal, X, Camera, LifeBuoy, BookOpen, MessageSquare, ShieldCheck, Activity, BadgeCheck, GaugeCircle, RefreshCcw } from "lucide-react";

const BACKEND_UPLOAD_URL = import.meta.env.VITE_BACKEND_UPLOAD_URL || "http://localhost:3000";
const AUTH_URL = import.meta.env.VITE_AUTH_URL || "http://localhost:4000";
const REQUEST_HANDLER_DOMAIN = import.meta.env.VITE_REQUEST_HANDLER_DOMAIN;
const REQUEST_HANDLER_PROTOCOL = import.meta.env.VITE_REQUEST_HANDLER_PROTOCOL;

let requestHandlerHostname = "localhost";
let requestHandlerPort = ":3001";
let requestHandlerProtocol = "http";
try {
    if (REQUEST_HANDLER_DOMAIN) {
        if (REQUEST_HANDLER_DOMAIN.startsWith("http://") || REQUEST_HANDLER_DOMAIN.startsWith("https://")) {
            const url = new URL(REQUEST_HANDLER_DOMAIN);
            requestHandlerHostname = url.hostname;
            requestHandlerPort = url.port ? `:${url.port}` : "";
            requestHandlerProtocol = url.protocol.replace(":", "");
        } else {
        // If it includes a port (e.g. localhost:3001), split it
            if (REQUEST_HANDLER_DOMAIN.includes(":")) {
                const parts = REQUEST_HANDLER_DOMAIN.split(":");
                requestHandlerHostname = parts[0];
                requestHandlerPort = `:${parts[1]}`;
            } else {
                requestHandlerHostname = REQUEST_HANDLER_DOMAIN;
                requestHandlerPort = "";
            }
        }
    } else {
        const url = new URL(BACKEND_UPLOAD_URL);
        requestHandlerHostname = url.hostname;
        if (requestHandlerHostname !== "localhost") {
            requestHandlerPort = ""; // use default HTTP/HTTPS ports in production
            requestHandlerProtocol = "https";
        }
    }
} catch (e) {
    // Ignore
}

if (REQUEST_HANDLER_PROTOCOL) {
    requestHandlerProtocol = REQUEST_HANDLER_PROTOCOL.replace(":", "");
} else if (requestHandlerHostname !== "localhost" && requestHandlerProtocol === "http" && requestHandlerPort !== ":3001") {
    requestHandlerProtocol = "https";
}

const getDeploymentUrl = (deploymentId: string) => `${requestHandlerProtocol}://${deploymentId}.${requestHandlerHostname}${requestHandlerPort}`;
const STATUS_REFRESH_MS = 5000;

type ActivityItem = {
    id: string;
    title: string;
    detail: string;
    tone: "success" | "warning" | "info";
};

export default function Dashboard() {
    const { user, token, logout } = useAuth();

    const [projects, setProjects] = useState<any[]>([]);
    const [repos, setRepos] = useState<any[]>([]);
    const [githubLinked, setGithubLinked] = useState<boolean>(true);
    const [loading, setLoading] = useState(true);

    const [deployingRepo, setDeployingRepo] = useState<string | null>(null);
    const [rollingBack, setRollingBack] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"projects" | "deployments" | "github" | "support" | "services">("projects");
    const [deployments, setDeployments] = useState<any[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [searchProject, setSearchProject] = useState("");
    const [searchRepo, setSearchRepo] = useState("");
    const [envVarsModalProject, setEnvVarsModalProject] = useState<any | null>(null);
    const [buildSettingsModalProject, setBuildSettingsModalProject] = useState<any | null>(null);
    const [deployRepoModalRepo, setDeployRepoModalRepo] = useState<any | null>(null);
    const [logsDeployment, setLogsDeployment] = useState<any | null>(null);
    const [liveLogs, setLiveLogs] = useState<string[]>([]);
    const [logsStatus, setLogsStatus] = useState<"idle" | "connecting" | "streaming" | "ended" | "error">("idle");
    const [streamedDeploymentStatus, setStreamedDeploymentStatus] = useState<string>("unknown");
    const [logsError, setLogsError] = useState<string | null>(null);
    const logStreamAbortRef = useRef<AbortController | null>(null);
    const logsViewportRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (token) {
            loadProjects();
            checkGithub();
        }
    }, [token]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (activeTab === "deployments" && selectedProjectId) {
            const hasBuilding = deployments.some(d => ["queued", "cloning", "building", "deploying"].includes(d.status));
            if (hasBuilding) {
                interval = setInterval(() => {
                    loadDeployments(selectedProjectId, true); // silent refresh
                }, STATUS_REFRESH_MS);
            }
        } else if (activeTab === "projects") {
            const hasBuildingProject = projects.some(p => ["queued", "cloning", "building", "deploying"].includes(p.status));
            if (hasBuildingProject) {
                interval = setInterval(() => {
                    loadProjects(true); // silent refresh
                }, STATUS_REFRESH_MS);
            }
        }
        return () => clearInterval(interval);
    }, [activeTab, selectedProjectId, deployments, projects]);

    const getQueuedStatusText = (item: any) => {
        if (item?.status !== "queued") {
            return null;
        }
        const queuePosition = Number(item?.queuePosition);
        const jobsAhead = Number(item?.jobsAhead);
        if (Number.isFinite(queuePosition) && queuePosition > 0) {
            if (Number.isFinite(jobsAhead) && jobsAhead >= 0) {
                return `Queued #${queuePosition} (${jobsAhead} ahead)`;
            }
            return `Queued #${queuePosition}`;
        }
        return "Queued";
    };

    useEffect(() => {
        return () => {
            logStreamAbortRef.current?.abort();
        };
    }, []);

    useEffect(() => {
        if (logsViewportRef.current) {
            logsViewportRef.current.scrollTop = logsViewportRef.current.scrollHeight;
        }
    }, [liveLogs]);

    const loadProjects = async (silent = false) => {
        try {
            const res = await axios.get(`${AUTH_URL}/auth/projects`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProjects(res.data.projects || []);
            if (!silent) setLoading(false);
        } catch (err) {
            console.error(err);
            if (!silent) setLoading(false);
        }
    };

    const handleDeleteProject = async (projectId: string) => {
        toast((t) => (
            <div className="flex flex-col gap-3">
                <p className="text-sm font-medium text-white">Are you sure you want to delete this project? This cannot be undone.</p>
                <div className="flex gap-2 justify-end">
                    <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors">Cancel</button>
                    <button onClick={async () => {
                        toast.dismiss(t.id);
                        try {
                            await axios.delete(`${AUTH_URL}/auth/projects/${projectId}`, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            setProjects(prev => prev.filter(p => p._id !== projectId));
                            if (selectedProjectId === projectId) {
                                setSelectedProjectId(null);
                                setActiveTab("projects");
                            }
                            toast.success("Project deleted successfully");
                        } catch (err) {
                            toast.error("Failed to delete project");
                        }
                    }} className="px-3 py-1.5 text-xs font-medium text-white bg-red-500/80 hover:bg-red-500 rounded-lg transition-colors">Delete Project</button>
                </div>
            </div>
        ), { duration: Infinity, style: { background: '#1a1a24', border: '1px solid rgba(239, 68, 68, 0.3)' } });
    };

    const checkGithub = async () => {
        try {
            const res = await axios.get(`${AUTH_URL}/auth/github/repos`, {
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
            const res = await axios.get(`${AUTH_URL}/auth/projects/${projectId}/deployments`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDeployments(res.data.deployments || []);
            if (!silent) loadProjects(); // refresh projects list status too just in case
        } catch (err) {
            console.error(err);
        }
    };

    const handleOpenDeployRepo = (repo: any) => {
        setDeployingRepo(String(repo.id));
        setDeployRepoModalRepo(repo);
    };

    const handleRepoDeployStarted = async (projectId: string) => {
        setDeployRepoModalRepo(null);
        setDeployingRepo(null);
        await loadProjects();
        loadDeployments(projectId);
    };

    const handleRedeployProject = async (projectId: string) => {
        await loadProjects();
        loadDeployments(projectId);
    };

    const handleRollback = async (deploymentId: string, uploadId: string) => {
        if (!selectedProjectId) return;
        setRollingBack(deploymentId);
        try {
            await axios.post(`${AUTH_URL}/auth/projects/${selectedProjectId}/rollback`, {
                uploadId: uploadId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success("Rollback successful!");
            loadProjects();
        } catch (err) {
            toast.error("Failed to rollback");
        } finally {
            setRollingBack(null);
        }
    };

    const handleRefreshScreenshot = async (uploadId: string) => {
        try {
            await fetch(`${BACKEND_UPLOAD_URL}/screenshot/trigger?id=${uploadId}`, { method: "POST" });
            toast.success("Screenshot refresh triggered — check back in ~15 seconds.");
        } catch {
            toast.error("Failed to trigger screenshot refresh");
        }
    };

    const closeLogsViewer = () => {
        logStreamAbortRef.current?.abort();
        logStreamAbortRef.current = null;
        setLogsDeployment(null);
        setLogsStatus("idle");
    };

    const streamDeploymentLogs = async (deployment: any) => {
        if (!selectedProjectId || !token) return;

        logStreamAbortRef.current?.abort();
        const controller = new AbortController();
        logStreamAbortRef.current = controller;

        setLogsDeployment(deployment);
        setLiveLogs([]);
        setLogsError(null);
        setLogsStatus("connecting");
        setStreamedDeploymentStatus(deployment.status || "unknown");

        try {
            const res = await fetch(`${AUTH_URL}/auth/projects/${selectedProjectId}/deployments/${deployment.uploadId}/logs/stream`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                signal: controller.signal,
            });

            if (!res.ok || !res.body) {
                throw new Error("Failed to connect to live logs stream");
            }

            const decoder = new TextDecoder();
            const reader = res.body.getReader();
            let buffer = "";

            const consumeEvent = (eventBlock: string) => {
                const lines = eventBlock.split("\n");
                let eventType = "message";
                const dataLines: string[] = [];

                for (const line of lines) {
                    if (line.startsWith("event:")) {
                        eventType = line.slice(6).trim();
                    }
                    if (line.startsWith("data:")) {
                        dataLines.push(line.slice(5).trim());
                    }
                }

                if (dataLines.length === 0) return;

                let payload: any;
                try {
                    payload = JSON.parse(dataLines.join("\n"));
                } catch {
                    return;
                }

                setLogsStatus("streaming");

                if (eventType === "log" && payload?.line) {
                    setLiveLogs(prev => [...prev, payload.line].slice(-1000));
                }

                if (eventType === "status" && payload?.status) {
                    setStreamedDeploymentStatus(payload.status);
                }

                if (eventType === "error") {
                    setLogsError(payload?.message || "Stream error");
                    setLogsStatus("error");
                }
            };

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                let boundaryIndex = buffer.indexOf("\n\n");
                while (boundaryIndex !== -1) {
                    const eventBlock = buffer.slice(0, boundaryIndex);
                    consumeEvent(eventBlock);
                    buffer = buffer.slice(boundaryIndex + 2);
                    boundaryIndex = buffer.indexOf("\n\n");
                }
            }

            if (!controller.signal.aborted) {
                setLogsStatus(prev => (prev === "error" ? prev : "ended"));
            }
        } catch (err: any) {
            if (!controller.signal.aborted) {
                setLogsError(err?.message || "Unable to stream deployment logs");
                setLogsStatus("error");
            }
        }
    };

    const activeProjects = projects.filter((p) => p.status === "deployed").length;
    const inProgressProjects = projects.filter((p) => ["queued", "cloning", "building", "deploying"].includes(p.status)).length;
    const failedProjects = projects.filter((p) => p.status === "failed").length;
    const totalDeployments = deployments.length;
    const successfulDeployments = deployments.filter((d) => d.status === "deployed").length;
    const deploymentSuccessRate = totalDeployments > 0 ? Math.round((successfulDeployments / totalDeployments) * 100) : 100;
    const githubStatus = githubLinked ? "Connected" : "Disconnected";
    const platformHealth = failedProjects === 0 ? "Healthy" : failedProjects <= 2 ? "Degraded" : "Attention Needed";
    const latestDeployments = [...deployments]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
    const starterChecklist = [
        {
            title: "Connect Source",
            description: "Link GitHub to list repositories and deploy with one click.",
            action: "Open GitHub tab",
            onClick: () => setActiveTab("github" as const),
            icon: Github,
        },
        {
            title: "Define Runtime",
            description: "Set build command, output directory, and install strategy once.",
            action: "Open Build Settings",
            onClick: () => setActiveTab("projects" as const),
            icon: Wrench,
        },
        {
            title: "Secure Variables",
            description: "Add API keys and tokens using encrypted environment variables.",
            action: "Open Support Hub",
            onClick: () => setActiveTab("support" as const),
            icon: ShieldCheck,
        },
    ];
    const recentActivity: ActivityItem[] = latestDeployments.length > 0
        ? latestDeployments.map((deployment) => ({
            id: deployment._id,
            title: `${deployment.status === "deployed" ? "Deployment completed" : deployment.status === "failed" ? "Deployment failed" : "Deployment in progress"}`,
            detail: `${deployment.uploadId.substring(0, 8)} • ${new Date(deployment.createdAt).toLocaleString()}`,
            tone: deployment.status === "deployed" ? "success" : deployment.status === "failed" ? "warning" : "info",
        }))
        : [
            {
                id: "seed-1",
                title: "Workspace initialized",
                detail: "Create your first deployment to start activity tracking.",
                tone: "info",
            },
            {
                id: "seed-2",
                title: "GitHub integration ready",
                detail: githubLinked ? "Repository sync is connected and ready." : "Connect GitHub from settings to enable repository sync.",
                tone: githubLinked ? "success" : "warning",
            },
            {
                id: "seed-3",
                title: "Platform monitoring enabled",
                detail: "Health, queue, and rollback metrics will appear after first build.",
                tone: "info",
            },
        ];

    const activeRatio = Math.max(8, Math.round((activeProjects / Math.max(projects.length, 1)) * 100));
    const queueRatio = Math.min(100, Math.max(5, Math.round((inProgressProjects / Math.max(projects.length, 1)) * 100)));
    const failureRatio = Math.min(100, Math.max(3, Math.round((failedProjects / Math.max(projects.length, 1)) * 100)));

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
                        <button
                            onClick={() => setActiveTab("services")}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === "services" ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"}`}
                        >
                            <Activity className="w-5 h-5" />
                            Services Status
                        </button>
                        <button
                            onClick={() => setActiveTab("support")}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === "support" ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"}`}
                        >
                            <LifeBuoy className="w-5 h-5" />
                            Support Hub
                        </button>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1">
                        {loading ? (
                            <div className="space-y-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                    <div className="h-8 w-40 bg-white/5 rounded-lg animate-pulse"></div>
                                    <div className="flex w-full sm:w-auto items-center gap-4">
                                        <div className="h-10 w-full sm:w-64 bg-white/5 rounded-lg animate-pulse"></div>
                                        <div className="h-10 w-24 bg-white/5 rounded-lg animate-pulse"></div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="bg-[#0a0a16]/80 border border-white/5 rounded-2xl overflow-hidden">
                                            <div className="h-36 bg-white/5 animate-pulse" />
                                            <div className="px-5 pb-5 pt-4 space-y-3">
                                                <div className="h-8 w-full bg-white/5 rounded-lg animate-pulse"></div>
                                                <div className="h-4 w-2/3 bg-white/5 rounded-lg animate-pulse"></div>
                                                <div className="flex gap-2 pt-2">
                                                    <div className="h-10 flex-1 bg-white/5 rounded-xl animate-pulse"></div>
                                                    <div className="h-10 w-24 bg-white/5 rounded-xl animate-pulse"></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">

                                {/* Projects Tab */}
                                {activeTab === "projects" && (
                                    <>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                            <h2 className="text-2xl font-bold text-white tracking-tight shrink-0">Your Projects</h2>
                                            <div className="flex w-full sm:w-auto items-center gap-4">
                                                <div className="relative w-full sm:w-64">
                                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                                    <input
                                                        type="text"
                                                        placeholder="Search projects..."
                                                        value={searchProject}
                                                        onChange={(e) => setSearchProject(e.target.value)}
                                                        className="w-full bg-[#0a0a16] border border-white/10 text-white rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-slate-600"
                                                    />
                                                </div>
                                                <button onClick={() => setActiveTab("github")} className="shrink-0 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_20px_rgba(99,102,241,0.5)]">
                                                    Add New
                                                </button>
                                            </div>
                                        </div>

                                        {projects.length === 0 ? (
                                            <div className="space-y-4">
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

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    {starterChecklist.map((item) => {
                                                        const Icon = item.icon;
                                                        return (
                                                            <button
                                                                key={item.title}
                                                                onClick={item.onClick}
                                                                className="text-left bg-[#0a0a16]/70 border border-white/10 rounded-2xl p-5 hover:border-indigo-500/40 hover:bg-white/[0.02] transition-colors"
                                                            >
                                                                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                                                                    <Icon className="w-5 h-5 text-indigo-300" />
                                                                </div>
                                                                <p className="text-sm font-semibold text-white mb-2">{item.title}</p>
                                                                <p className="text-xs text-slate-400 mb-4 leading-relaxed">{item.description}</p>
                                                                <div className="text-xs text-indigo-300 font-medium inline-flex items-center gap-1">
                                                                    {item.action}
                                                                    <ArrowRight className="w-3.5 h-3.5" />
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                    {projects.filter(p => p.name.toLowerCase().includes(searchProject.toLowerCase())).map(p => (
                                                        <div key={p._id} className="bg-[#0a0a16]/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-all group shadow-lg">
                                                        {/* ── Screenshot / Preview Thumbnail ── */}
                                                        <div className="relative h-36 bg-gradient-to-br from-indigo-950/80 via-violet-950/60 to-slate-900">
                                                            {p.activeDeploymentId && p.status === "deployed" && (
                                                                <img
                                                                    src={`${BACKEND_UPLOAD_URL}/screenshot/serve?id=${p.activeDeploymentId}`}
                                                                    alt="Site preview"
                                                                    className="absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-700"
                                                                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                                                                />
                                                            )}
                                                            {/* Gradient vignette for text readability */}
                                                            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a16] via-[#0a0a16]/20 to-transparent" />
                                                            {/* Project name overlay */}
                                                            <div className="absolute bottom-3 left-4 right-24 truncate">
                                                                <h3 className="text-base font-bold text-white drop-shadow truncate">{p.name}</h3>
                                                            </div>
                                                            {/* Status badge + delete overlaid at top-right */}
                                                            <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                                                                {p.status === "deployed" ? (
                                                                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold uppercase tracking-wide backdrop-blur-sm">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                                                        Ready
                                                                    </span>
                                                                ) : p.status === "failed" ? (
                                                                    <span className="px-2 py-0.5 rounded-full bg-red-500/25 border border-red-500/30 text-red-300 text-[10px] font-bold uppercase tracking-wide backdrop-blur-sm">
                                                                        Failed
                                                                    </span>
                                                                ) : (
                                                                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[10px] font-bold uppercase tracking-wide backdrop-blur-sm">
                                                                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                                                        {p.status === "cloning" ? "Cloning" : p.status === "building" ? "Building" : p.status === "deploying" ? "Deploying" : getQueuedStatusText(p)}
                                                                    </span>
                                                                )}
                                                                <button
                                                                    onClick={() => handleDeleteProject(p._id)}
                                                                    className="text-slate-400 hover:text-red-400 transition-colors p-1 rounded-md bg-black/40 backdrop-blur-sm hover:bg-red-500/20"
                                                                    title="Delete Project"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <div className="px-5 pb-5 pt-4">
                                                        <div className="space-y-3 mb-5">
                                                            {p.status === "deployed" ? (
                                                                <a
                                                                    href={getDeploymentUrl(p.activeDeploymentId)}
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
                                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                                <Wrench className="w-3.5 h-3.5" />
                                                                <span className="capitalize">{p.framework || "unknown"}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                                <Github className="w-3.5 h-3.5" />
                                                                <span className="font-mono">Branch: {p.branch || "default"}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                                <Server className="w-3.5 h-3.5" />
                                                                <span className="font-mono">Root: {p.rootDirectory || "."}</span>
                                                            </div>
                                                        </div>

                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => setBuildSettingsModalProject(p)}
                                                                className="flex items-center justify-center p-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl transition-all border border-white/10"
                                                                title="Build Settings"
                                                            >
                                                                <Wrench className="w-5 h-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => setEnvVarsModalProject(p)}
                                                                className="flex items-center justify-center p-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl transition-all border border-white/10"
                                                                title="Environment Variables"
                                                            >
                                                                <Sliders className="w-5 h-5" />
                                                            </button>
                                                            {p.status === "deployed" && p.activeDeploymentId && (
                                                                <button
                                                                    onClick={() => handleRefreshScreenshot(p.activeDeploymentId)}
                                                                    className="flex items-center justify-center p-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl transition-all border border-white/10"
                                                                    title="Refresh Screenshot"
                                                                >
                                                                    <Camera className="w-5 h-5" />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => loadDeployments(p._id)}
                                                                className="flex-1 bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all border border-white/10 text-center"
                                                            >
                                                                Deployments
                                                            </button>
                                                            {p.status === "deployed" ? (
                                                                <a
                                                                    href={getDeploymentUrl(p.activeDeploymentId)}
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
                                                        </div>{/* ── content padding wrapper close ── */}
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="bg-[#0a0a16]/80 border border-white/10 rounded-2xl p-5">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h3 className="text-white font-semibold">Recent Project Activity</h3>
                                                        <button
                                                            onClick={() => selectedProjectId ? loadDeployments(selectedProjectId) : setActiveTab("deployments")}
                                                            className="text-xs text-indigo-300 hover:text-indigo-200"
                                                        >
                                                            View deployment history
                                                        </button>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {recentActivity.map((item) => (
                                                            <div key={item.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                                                                <div>
                                                                    <p className="text-sm text-white font-medium">{item.title}</p>
                                                                    <p className="text-xs text-slate-400 mt-0.5">{item.detail}</p>
                                                                </div>
                                                                <span className={`text-[11px] uppercase tracking-wide px-2 py-1 rounded-md border ${item.tone === "success" ? "text-emerald-300 border-emerald-500/30 bg-emerald-500/10" : item.tone === "warning" ? "text-amber-300 border-amber-500/30 bg-amber-500/10" : "text-sky-300 border-sky-500/30 bg-sky-500/10"}`}>
                                                                    {item.tone}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </>
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
                                                                            <span className="text-amber-400 flex items-center gap-1.5"><Loader2 className="w-4 h-4 animate-spin" /> {d.status === "queued" ? getQueuedStatusText(d) : d.status.charAt(0).toUpperCase() + d.status.slice(1)}</span>
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

                                                                    <button
                                                                        onClick={() => streamDeploymentLogs(d)}
                                                                        className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-slate-300 px-3 py-1.5 rounded-lg text-sm transition-all border border-white/10"
                                                                    >
                                                                        <Terminal className="w-4 h-4" />
                                                                        Logs
                                                                    </button>

                                                                    <a
                                                                        href={getDeploymentUrl(d.uploadId)}
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
                                                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
                                                    <p className="text-slate-400">Select a repository to deploy.</p>
                                                    <div className="flex items-center gap-4 w-full sm:w-auto">
                                                        <div className="relative flex-1 sm:w-64">
                                                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                                            <input
                                                                type="text"
                                                                placeholder="Search repositories..."
                                                                value={searchRepo}
                                                                onChange={(e) => setSearchRepo(e.target.value)}
                                                                className="w-full bg-[#0a0a16] border border-white/10 text-white rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-slate-600"
                                                            />
                                                        </div>
                                                        <button onClick={checkGithub} className="shrink-0 text-xs text-indigo-400 hover:text-indigo-300 font-medium tracking-wide uppercase">Refresh list</button>
                                                    </div>
                                                </div>

                                                {repos.length === 0 ? (
                                                    <div className="bg-[#0a0a16] border border-white/10 rounded-xl p-8 text-center">
                                                        <p className="text-slate-400">No repositories found or token lacks permissions.</p>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                        {repos.filter(r => r.name.toLowerCase().includes(searchRepo.toLowerCase())).map(repo => (
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
                                                                    onClick={() => handleOpenDeployRepo(repo)}
                                                                    disabled={deployingRepo === String(repo.id)}
                                                                    className="w-full bg-white/5 hover:bg-indigo-500/20 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all border border-white/10 hover:border-indigo-500/30 flex items-center justify-center gap-2 group-hover:bg-indigo-500 group-hover:border-indigo-500 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] disabled:opacity-50 disabled:pointer-events-none"
                                                                >
                                                                    {deployingRepo === String(repo.id) ? (
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

                                {/* Services Status Tab */}
                                {activeTab === "services" && (
                                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                                        <div>
                                            <h2 className="text-2xl font-bold text-white tracking-tight mb-2 flex items-center gap-3">
                                                <Activity className="w-6 h-6" /> Services Status
                                            </h2>
                                            <p className="text-slate-400">Live overview of your deployments and key platform integrations.</p>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                                            <div className="bg-[#0a0a16]/80 border border-white/10 rounded-2xl p-5">
                                                <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Active Projects</p>
                                                <p className="text-3xl font-bold text-white">{activeProjects}</p>
                                                <p className="text-xs text-slate-400 mt-2">Currently serving traffic</p>
                                            </div>
                                            <div className="bg-[#0a0a16]/80 border border-white/10 rounded-2xl p-5">
                                                <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Build Queue</p>
                                                <p className="text-3xl font-bold text-amber-300">{inProgressProjects}</p>
                                                <p className="text-xs text-slate-400 mt-2">Queued, cloning, building, deploying</p>
                                            </div>
                                            <div className="bg-[#0a0a16]/80 border border-white/10 rounded-2xl p-5">
                                                <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Deployment Success</p>
                                                <p className="text-3xl font-bold text-emerald-300">{deploymentSuccessRate}%</p>
                                                <p className="text-xs text-slate-400 mt-2">From selected project history</p>
                                            </div>
                                            <div className="bg-[#0a0a16]/80 border border-white/10 rounded-2xl p-5">
                                                <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">GitHub Link</p>
                                                <p className={`text-3xl font-bold ${githubLinked ? "text-emerald-300" : "text-rose-300"}`}>{githubStatus}</p>
                                                <p className="text-xs text-slate-400 mt-2">Repository sync availability</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                            <div className="bg-[#0a0a16]/80 border border-white/10 rounded-2xl p-5">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="text-white font-semibold flex items-center gap-2"><GaugeCircle className="w-4 h-4 text-indigo-300" /> Platform Health</h3>
                                                    <span className={`text-xs px-2.5 py-1 rounded-full border ${platformHealth === "Healthy" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : platformHealth === "Degraded" ? "border-amber-500/40 bg-amber-500/10 text-amber-300" : "border-rose-500/40 bg-rose-500/10 text-rose-300"}`}>{platformHealth}</span>
                                                </div>
                                                <div className="space-y-3 text-sm">
                                                    <div className="flex items-center justify-between text-slate-300">
                                                        <span>Running Deployments</span>
                                                        <span className="font-semibold text-white">{inProgressProjects}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-slate-300">
                                                        <span>Failed Projects</span>
                                                        <span className="font-semibold text-white">{failedProjects}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-slate-300">
                                                        <span>Deployment Records Loaded</span>
                                                        <span className="font-semibold text-white">{totalDeployments}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-[#0a0a16]/80 border border-white/10 rounded-2xl p-5">
                                                <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-indigo-300" /> Recommended Actions</h3>
                                                <div className="space-y-3">
                                                    <button
                                                        onClick={() => setActiveTab("projects")}
                                                        className="w-full flex items-center justify-between text-left bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 transition-colors"
                                                    >
                                                        Review project health and logs
                                                        <ArrowRight className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setActiveTab("github")}
                                                        className="w-full flex items-center justify-between text-left bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 transition-colors"
                                                    >
                                                        Add a new repository deployment
                                                        <ArrowRight className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (selectedProjectId) {
                                                                loadDeployments(selectedProjectId);
                                                            } else {
                                                                setActiveTab("projects");
                                                            }
                                                        }}
                                                        className="w-full flex items-center justify-between text-left bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 transition-colors"
                                                    >
                                                        Refresh deployment timeline
                                                        <RefreshCcw className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                            <div className="bg-[#0a0a16]/80 border border-white/10 rounded-2xl p-5 lg:col-span-2">
                                                <h3 className="text-white font-semibold mb-4">Recent Platform Activity</h3>
                                                <div className="space-y-2">
                                                    {recentActivity.map((item) => (
                                                        <div key={`services-${item.id}`} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                                                            <div>
                                                                <p className="text-sm text-white font-medium">{item.title}</p>
                                                                <p className="text-xs text-slate-400 mt-0.5">{item.detail}</p>
                                                            </div>
                                                            <span className={`text-[11px] uppercase tracking-wide px-2 py-1 rounded-md border ${item.tone === "success" ? "text-emerald-300 border-emerald-500/30 bg-emerald-500/10" : item.tone === "warning" ? "text-amber-300 border-amber-500/30 bg-amber-500/10" : "text-sky-300 border-sky-500/30 bg-sky-500/10"}`}>
                                                                {item.tone}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="bg-[#0a0a16]/80 border border-white/10 rounded-2xl p-5">
                                                <h3 className="text-white font-semibold mb-4">Capacity Snapshot</h3>
                                                <div className="space-y-4">
                                                    <div>
                                                        <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                                                            <span>Serving Traffic</span>
                                                            <span>{activeRatio}%</span>
                                                        </div>
                                                        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                                                            <div className="h-full bg-emerald-400/70" style={{ width: `${activeRatio}%` }} />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                                                            <span>Build Queue Pressure</span>
                                                            <span>{queueRatio}%</span>
                                                        </div>
                                                        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                                                            <div className="h-full bg-amber-400/70" style={{ width: `${queueRatio}%` }} />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                                                            <span>Failure Risk</span>
                                                            <span>{failureRatio}%</span>
                                                        </div>
                                                        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                                                            <div className="h-full bg-rose-400/70" style={{ width: `${failureRatio}%` }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Support Hub Tab */}
                                {activeTab === "support" && (
                                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                                        <div>
                                            <h2 className="text-2xl font-bold text-white tracking-tight mb-2 flex items-center gap-3">
                                                <LifeBuoy className="w-6 h-6" /> Support Hub
                                            </h2>
                                            <p className="text-slate-400">Resources and actions to help users troubleshoot, secure, and scale deployments faster.</p>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                            <div className="bg-[#0a0a16]/80 border border-white/10 rounded-2xl p-5 lg:col-span-2">
                                                <h3 className="text-white font-semibold mb-4">Quick Help Actions</h3>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <button
                                                        onClick={() => setActiveTab("projects")}
                                                        className="text-left bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 transition-colors"
                                                    >
                                                        <p className="text-sm font-semibold text-white mb-1 flex items-center gap-2"><Terminal className="w-4 h-4 text-indigo-300" /> Review Build Logs</p>
                                                        <p className="text-xs text-slate-400">Check the latest deployment output and failure points.</p>
                                                    </button>
                                                    <button
                                                        onClick={() => setActiveTab("services")}
                                                        className="text-left bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 transition-colors"
                                                    >
                                                        <p className="text-sm font-semibold text-white mb-1 flex items-center gap-2"><Activity className="w-4 h-4 text-indigo-300" /> Service Diagnostics</p>
                                                        <p className="text-xs text-slate-400">View current health signals and deployment reliability.</p>
                                                    </button>
                                                    <Link
                                                        to="/settings"
                                                        className="text-left bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 transition-colors block"
                                                    >
                                                        <p className="text-sm font-semibold text-white mb-1 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-indigo-300" /> Security & Access</p>
                                                        <p className="text-xs text-slate-400">Update account settings and connected provider access.</p>
                                                    </Link>
                                                    <Link
                                                        to="/"
                                                        className="text-left bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 transition-colors block"
                                                    >
                                                        <p className="text-sm font-semibold text-white mb-1 flex items-center gap-2"><BookOpen className="w-4 h-4 text-indigo-300" /> Deployment Guide</p>
                                                        <p className="text-xs text-slate-400">Review setup and deployment flow from the landing docs.</p>
                                                    </Link>
                                                </div>
                                            </div>

                                            <div className="bg-[#0a0a16]/80 border border-white/10 rounded-2xl p-5">
                                                <h3 className="text-white font-semibold mb-4">Current Account Snapshot</h3>
                                                <div className="space-y-3 text-sm">
                                                    <div className="flex items-center justify-between text-slate-300">
                                                        <span>Total Projects</span>
                                                        <span className="text-white font-semibold">{projects.length}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-slate-300">
                                                        <span>Connected Repositories</span>
                                                        <span className="text-white font-semibold">{repos.length}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-slate-300">
                                                        <span>Failed Deployments</span>
                                                        <span className="text-white font-semibold">{failedProjects}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-slate-300">
                                                        <span>Support Priority</span>
                                                        <span className={`text-xs px-2 py-1 rounded-md border ${failedProjects > 0 ? "text-amber-300 border-amber-500/30 bg-amber-500/10" : "text-emerald-300 border-emerald-500/30 bg-emerald-500/10"}`}>
                                                            {failedProjects > 0 ? "Medium" : "Low"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-[#0a0a16]/80 border border-white/10 rounded-2xl p-5">
                                            <h3 className="text-white font-semibold mb-4">Support Services</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                <div className="border border-white/10 bg-white/5 rounded-xl p-4">
                                                    <p className="text-sm font-semibold text-white flex items-center gap-2"><MessageSquare className="w-4 h-4 text-indigo-300" /> Incident Reporting</p>
                                                    <p className="text-xs text-slate-400 mt-2">Capture deployment issues and error contexts before escalation.</p>
                                                </div>
                                                <div className="border border-white/10 bg-white/5 rounded-xl p-4">
                                                    <p className="text-sm font-semibold text-white flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-indigo-300" /> Runtime Safeguards</p>
                                                    <p className="text-xs text-slate-400 mt-2">Use environment controls and build settings to prevent bad releases.</p>
                                                </div>
                                                <div className="border border-white/10 bg-white/5 rounded-xl p-4">
                                                    <p className="text-sm font-semibold text-white flex items-center gap-2"><BookOpen className="w-4 h-4 text-indigo-300" /> Knowledge Base</p>
                                                    <p className="text-xs text-slate-400 mt-2">Standard playbooks for common deployment, DNS, and rollback workflows.</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                            <div className="bg-[#0a0a16]/80 border border-white/10 rounded-2xl p-5">
                                                <h3 className="text-white font-semibold mb-4">Guided Runbooks</h3>
                                                <div className="space-y-2">
                                                    {[
                                                        "Fix failed build due to missing dependencies",
                                                        "Rollback production after regression",
                                                        "Add secure environment variables",
                                                        "Reconnect GitHub OAuth integration",
                                                    ].map((runbook) => (
                                                        <div key={runbook} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200">
                                                            {runbook}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="bg-[#0a0a16]/80 border border-white/10 rounded-2xl p-5">
                                                <h3 className="text-white font-semibold mb-4">Escalation Contacts</h3>
                                                <div className="space-y-3">
                                                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                                        <p className="text-sm text-white font-medium">Platform Operations</p>
                                                        <p className="text-xs text-slate-400 mt-1">Use for global outage, prolonged build queue, or CDN issues.</p>
                                                    </div>
                                                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                                        <p className="text-sm text-white font-medium">Security Response</p>
                                                        <p className="text-xs text-slate-400 mt-1">Use for credential leaks, unauthorized access, or token rotation support.</p>
                                                    </div>
                                                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                                        <p className="text-sm text-white font-medium">Developer Success</p>
                                                        <p className="text-xs text-slate-400 mt-1">Use for deployment migration, framework setup, and best-practice guidance.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                            </div>
                        )}
                    </div>
                </div>
            </main>

            {envVarsModalProject && (
                <EnvVarsModal project={envVarsModalProject} onClose={() => setEnvVarsModalProject(null)} />
            )}

            {buildSettingsModalProject && (
                <BuildSettingsModal
                    project={buildSettingsModalProject}
                    onClose={() => setBuildSettingsModalProject(null)}
                    onSaved={loadProjects}
                    onRedeployed={handleRedeployProject}
                />
            )}

            {deployRepoModalRepo && (
                <DeployRepoModal
                    repo={deployRepoModalRepo}
                    onClose={() => {
                        setDeployRepoModalRepo(null);
                        setDeployingRepo(null);
                    }}
                    onDeployed={handleRepoDeployStarted}
                />
            )}

            {logsDeployment && (
                <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-5xl bg-[#05070f] border border-emerald-500/20 rounded-2xl shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-gradient-to-r from-emerald-900/20 via-black/40 to-black/30">
                            <div className="flex items-center gap-3 min-w-0">
                                <Terminal className="w-4 h-4 text-emerald-400 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-sm text-white font-semibold truncate">Live Build Logs</p>
                                    <p className="text-xs text-slate-400 font-mono truncate">{logsDeployment.uploadId}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <span className="text-xs px-2.5 py-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 font-medium capitalize">
                                    {streamedDeploymentStatus}
                                </span>
                                <button
                                    onClick={closeLogsViewer}
                                    className="text-slate-400 hover:text-white p-1.5 rounded-md hover:bg-white/10 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div ref={logsViewportRef} className="h-[60vh] overflow-auto bg-[#03050a] px-4 py-3 font-mono text-xs leading-6 text-emerald-300">
                            {liveLogs.length === 0 ? (
                                <div className="text-slate-500">{logsStatus === "connecting" ? "Connecting to logs stream..." : "No logs yet."}</div>
                            ) : (
                                liveLogs.map((line, index) => (
                                    <div key={`${index}-${line.slice(0, 16)}`} className="whitespace-pre-wrap break-words">{line}</div>
                                ))
                            )}
                            {logsStatus === "streaming" && (
                                <div className="text-emerald-500/70 animate-pulse">█</div>
                            )}
                        </div>

                        <div className="px-5 py-3 border-t border-white/10 bg-black/30 flex items-center justify-between text-xs">
                            <span className="text-slate-400">
                                {logsStatus === "connecting" && "Connecting..."}
                                {logsStatus === "streaming" && "Streaming live logs"}
                                {logsStatus === "ended" && "Stream ended"}
                                {logsStatus === "error" && (logsError || "Stream failed")}
                            </span>
                            <button
                                onClick={() => streamDeploymentLogs(logsDeployment)}
                                className="text-emerald-400 hover:text-emerald-300 font-medium"
                            >
                                Reconnect
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
