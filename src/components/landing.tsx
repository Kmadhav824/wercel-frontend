import { useState } from "react"
import axios from "axios"
import { Github, Globe, Loader2, CheckCircle2, Rocket, Terminal, Zap, Sparkles, ArrowRight, Server, CloudLightning, LogOut, User as UserIcon } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
const BACKEND_UPLOAD_URL = import.meta.env.VITE_BACKEND_UPLOAD_URL || "http://localhost:3000";

export function Landing() {
  const { user, logout } = useAuth();


  const [repoUrl, setRepoUrl] = useState("");
  const [uploadId, setUploadId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deployed, setDeployed] = useState(false);

  const navigate = useNavigate();

  const handleDeploy = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!repoUrl) return;
    setUploading(true);
    try {
      const res = await axios.post(`${BACKEND_UPLOAD_URL}/store`, {
        repoUrl: repoUrl
      });
      setUploadId(res.data.id);

      const interval = setInterval(async () => {
        const response = await axios.get(`${BACKEND_UPLOAD_URL}/status?id=${res.data.id}`);

        if (response.data.status === "deployed") {
          clearInterval(interval);
          setDeployed(true);
          setUploading(false); // Make sure to stop uploading progress here
        }
      }, 3000);
    } catch (error) {
      setUploading(false);
      alert("Error deploying repository");
    }
  }

  return (
    <div className="relative min-h-screen bg-[#06060c] text-slate-100 font-sans overflow-hidden selection:bg-indigo-500/30">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-700/20 blur-[140px] rounded-full mix-blend-screen" />
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[60%] bg-fuchsia-700/10 blur-[140px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] bg-blue-700/10 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute inset-0 z-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        <div className="absolute inset-x-0 bottom-0 h-[500px] bg-gradient-to-t from-[#06060c] to-transparent"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-50 border-b border-white/5 bg-[#06060c]/40 backdrop-blur-2xl">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-[1px] shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all duration-500">
                <div className="w-full h-full rounded-[11px] bg-[#06060c] flex items-center justify-center group-hover:bg-transparent transition-colors duration-500">
                  <Rocket className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
              </div>
              <span className="text-2xl font-bold tracking-tight text-white">Nexus</span>
            </div>
            <div className="flex items-center gap-8">
              <a href="#" className="hidden sm:block text-sm font-medium text-slate-400 hover:text-white transition-all">Features</a>
              <a href="#" className="hidden sm:block text-sm font-medium text-slate-400 hover:text-white transition-all">Pricing</a>
              <div className="hidden sm:block h-5 w-[1px] bg-white/10"></div>
              {user ? (
                <div className="relative group/profile z-50">
                  <button className="flex items-center gap-2 sm:gap-3 text-sm font-medium bg-white/5 hover:bg-white/10 px-4 py-2 sm:py-2.5 rounded-full border border-white/10 backdrop-blur-md transition-all text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                    {user.avatar ? (
                      <img src={user.avatar} alt="Avatar" className="w-6 h-6 rounded-full border border-indigo-500/30 object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center border border-indigo-500/30 text-white font-bold text-xs ring-2 ring-transparent group-hover/profile:ring-indigo-500/50 transition-all">
                        {user.name?.charAt(0).toUpperCase() || "U"}
                      </div>
                    )}
                    <span className="hidden sm:inline-block max-w-[100px] truncate">{user.name}</span>
                  </button>

                  <div className="absolute right-0 top-full mt-2 w-56 bg-[#0a0a16]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden opacity-0 translate-y-2 group-hover/profile:opacity-100 group-hover/profile:translate-y-0 transition-all duration-300 pointer-events-none group-hover/profile:pointer-events-auto z-50">
                    <div className="p-4 border-b border-white/5 bg-gradient-to-b from-white/[0.04] to-transparent">
                      <p className="text-sm font-bold text-white truncate">{user.name}</p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{user.email}</p>
                    </div>
                    <div className="p-2 space-y-1 bg-white/[0.01]">
                      <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-default">
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        Profile Settings
                      </button>
                      <div className="h-px bg-white/5 my-1" />
                      <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-all font-medium">
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <a href="https://github.com" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-medium bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-full border border-white/10 backdrop-blur-md transition-all text-white hover:scale-105 active:scale-95">
                  <Github className="w-4 h-4" />
                  <span className="hidden sm:inline">Connect</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-5xl mx-auto px-4 py-20 sm:px-6 lg:px-8 flex flex-col justify-center min-h-[calc(100vh-80px)]">
        {!uploadId && (
          <div className="w-full space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-1000 zoom-in-95">
            <div className="text-center space-y-6 max-w-4xl mx-auto pt-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-semibold mb-2 shadow-[0_0_20px_rgba(99,102,241,0.15)]">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>The Future of Deployment is Here</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1]">
                Launch faster with <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">zero configuration.</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                Connect your repository, configure once, and let Nexus handle global edge distribution, automated builds, and serverless scaling.
              </p>
            </div>

            <div className="relative max-w-3xl mx-auto group z-20">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>
              <div className="relative bg-[#0a0a16]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 sm:p-12 shadow-2xl">
                <div className="flex flex-col md:flex-row gap-8 items-center border-b border-white/5 pb-8">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 shadow-[0_0_30px_rgba(99,102,241,0.1)]">
                    <Github className="w-10 h-10 text-indigo-400" />
                  </div>
                  <div className="flex-1 text-center md:text-left space-y-2">
                    <h2 className="text-3xl font-bold text-white tracking-tight">Import Git Project</h2>
                    <p className="text-slate-400 text-base">Paste your GitHub repository link and deploy your application instantly across our global CDN.</p>
                  </div>
                </div>

                <div className="pt-8 space-y-4">
                  <label htmlFor="repo-url" className="block text-sm font-semibold text-slate-300 ml-1">
                    Repository URL
                  </label>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1 group/input">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Globe className="h-5 w-5 text-slate-500 group-focus-within/input:text-indigo-400 transition-colors" />
                      </div>
                      <input
                        id="repo-url"
                        type="url"
                        disabled={uploading}
                        className="block w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10 transition-all disabled:opacity-50 shadow-inner"
                        placeholder="https://github.com/username/project"
                        value={repoUrl}
                        onChange={(e) => setRepoUrl(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleDeploy();
                        }}
                      />
                    </div>
                    <button
                      onClick={handleDeploy}
                      disabled={(user && !repoUrl) || uploading}
                      className="relative sm:w-auto w-full group/btn overflow-hidden bg-white text-[#050510] px-8 py-4 rounded-2xl text-lg font-bold transition-all disabled:opacity-50 shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)] disabled:hover:shadow-none active:scale-95 flex items-center justify-center gap-3 shrink-0"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-100 to-white opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                      <span className="relative z-10 flex items-center gap-2">
                        {uploading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Connecting...</span>
                          </>
                        ) : (
                          <>
                            <span>{user ? "Deploy Now" : "Get Started"}</span>
                            <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                          </>
                        )}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden md:flex justify-center gap-8 text-sm font-medium text-slate-400 opacity-80 pt-8">
              <div className="flex items-center gap-2"><Server className="w-4 h-4 text-pink-400" /> Global Edge Servers</div>
              <div className="w-1.5 h-1.5 rounded-full bg-slate-700 my-auto" />
              <div className="flex items-center gap-2"><CloudLightning className="w-4 h-4 text-amber-400" /> Instant Rollbacks</div>
              <div className="w-1.5 h-1.5 rounded-full bg-slate-700 my-auto" />
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Free SSL Certificates</div>
            </div>
          </div>
        )}

        {uploadId && !deployed && (
          <div className="max-w-2xl mx-auto w-full transition-all animate-in fade-in zoom-in-95 duration-700 pt-10">
            <div className="bg-[#0a0a16]/80 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
              <div className="p-8 sm:p-10 space-y-10">
                <div className="flex items-center gap-6">
                  <div className="relative flex h-16 w-16 items-center justify-center">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-500 opacity-20"></span>
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
                    <Rocket className="w-6 h-6 text-indigo-400 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Building Project</h2>
                    <p className="text-slate-400">Nexus engine is compiling and optimizing your code.</p>
                  </div>
                </div>

                <div className="space-y-6 pt-4">
                  <div className="relative pl-3">
                    <div className="absolute left-7 top-6 bottom-6 w-[2px] bg-indigo-900/40 rounded-full" />
                    <div className="space-y-8 relative">
                      {[
                        { text: "Fetching source from GitHub", state: "done" },
                        { text: "Resolving dependencies", state: "done" },
                        { text: "Compiling assets and optimizing", state: "active" },
                        { text: "Propagating to global edge network", state: "pending" }
                      ].map((step, i) => (
                        <div key={i} className="flex gap-5 items-center">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center z-10 shrink-0 ${step.state === 'done' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' :
                            step.state === 'active' ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30 shadow-[0_0_15px_rgba(236,72,153,0.3)]' :
                              'bg-white/5 text-slate-600 border border-white/10'
                            }`}>
                            {step.state === 'done' ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : step.state === 'active' ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                            )}
                          </div>
                          <span className={`text-base font-semibold ${step.state === 'active' ? 'text-white' :
                            step.state === 'done' ? 'text-indigo-200/80' :
                              'text-slate-600'
                            }`}>
                            {step.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-10 bg-[#05050f]/80 border border-white/5 rounded-2xl p-6 font-mono text-sm text-slate-400 flex flex-col gap-2 overflow-hidden relative shadow-inner">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Terminal className="w-24 h-24" />
                    </div>
                    <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4 relative z-10">
                      <div className="flex items-center gap-2 text-indigo-300">
                        <Terminal className="w-4 h-4" />
                        <span className="uppercase tracking-widest text-xs font-bold">Live Output Log</span>
                      </div>
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-700 animate-pulse"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-700 animate-pulse delay-75"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-700 animate-pulse delay-150"></div>
                      </div>
                    </div>
                    <div className="space-y-1.5 z-10 font-medium">
                      <span className="text-emerald-400 flex gap-2"><span className="text-slate-600">00:01</span>➜ ~ nexus build --target=edge --id={uploadId.substring(0, 8)}</span>
                      <span className="text-slate-300 flex gap-2"><span className="text-slate-600">00:02</span>[nexus] Analyzing project structure...</span>
                      <span className="text-slate-300 flex gap-2"><span className="text-slate-600">00:04</span>[nexus] Detected static bundle, initializing bundler...</span>
                      <span className="text-slate-300 flex gap-2"><span className="text-slate-600">00:07</span>[nexus] Generating optimal chunks and minimizing chunks.</span>
                      <span className="text-pink-400 animate-pulse mt-2 block">◼</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {deployed && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-1000 pt-6">
            <div className="flex flex-col items-center text-center space-y-6 mb-16 relative">
              <div className="absolute inset-0 bg-green-500/20 blur-[100px] rounded-full w-full max-w-sm mx-auto -z-10"></div>
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-green-600 rounded-2xl flex items-center justify-center mb-2 shadow-[0_0_50px_rgba(16,185,129,0.4)] border border-green-400/30 transform rotate-3 hover:rotate-6 transition-transform">
                <CheckCircle2 className="w-12 h-12 text-white" strokeWidth={2.5} />
              </div>
              <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight">Deploy Successful!</h1>
              <p className="text-slate-400 text-xl max-w-2xl font-medium">Your application is live and distributed across the Nexus global edge network.</p>
            </div>

            <div className="bg-[#0a0a16]/80 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative p-8 md:p-12">
              <div className="grid md:grid-cols-[1fr,1.2fr] gap-12 items-center">
                <div className="space-y-10">
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold uppercase tracking-wider mb-2">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      Status: Online
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-400 mb-2">Production Domain</h3>
                      <div className="flex items-center justify-between bg-[#06060c] border border-white/10 rounded-xl p-4 shadow-inner group cursor-text relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                        <a
                          href={`http://${uploadId}.localhost:3001`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-400 hover:text-indigo-300 font-bold truncate pr-4 text-lg transition-colors relative z-10"
                        >
                          {uploadId}.nexus.app
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <a
                      href={`http://${uploadId}.localhost:3001`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white px-6 py-4 rounded-xl text-lg font-bold transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] active:scale-95 flex items-center justify-center gap-3"
                    >
                      <Zap className="w-5 h-5 fill-current" />
                      Visit Application
                    </a>
                    <button
                      onClick={() => {
                        setRepoUrl("");
                        setUploadId("");
                        setDeployed(false);
                      }}
                      className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 px-6 py-4 rounded-xl text-base font-semibold transition-all active:scale-95 flex items-center justify-center"
                    >
                      Deploy another project
                    </button>
                  </div>
                </div>

                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 bg-[#06060c] group shadow-2xl">
                  {/* Glowing background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-transparent to-pink-500/20 z-0"></div>

                  {/* Browser toolbar mock */}
                  <div className="absolute top-0 inset-x-0 h-12 bg-white/5 border-b border-white/10 flex items-center px-4 gap-2 z-20 backdrop-blur-md">
                    <div className="w-3 h-3 rounded-full bg-slate-700" />
                    <div className="w-3 h-3 rounded-full bg-slate-700" />
                    <div className="w-3 h-3 rounded-full bg-slate-700" />
                    <div className="mx-auto bg-[#000] border border-white/10 rounded-md py-1 px-20 flex items-center justify-center opacity-70">
                      <Globe className="w-3 h-3 text-slate-500 mr-2" />
                      <span className="text-xs text-slate-400 font-mono">{uploadId.substring(0, 8)}.nexus.app</span>
                    </div>
                  </div>

                  {/* Body mockup */}
                  <div className="absolute top-12 bottom-0 inset-x-0 bg-[#06060c] z-10 p-6 flex flex-col gap-4 opacity-50">
                    <div className="w-full h-32 bg-white/5 border border-white/5 rounded-xl"></div>
                    <div className="flex gap-4">
                      <div className="w-1/3 h-48 bg-white/5 border border-white/5 rounded-xl"></div>
                      <div className="w-2/3 h-48 bg-white/5 border border-white/5 rounded-xl"></div>
                    </div>
                  </div>

                  {/* Overlay branding */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-30 bg-black/60 backdrop-blur-sm">
                    <Rocket className="w-16 h-16 text-indigo-400 mb-4 transform group-hover:-translate-y-2 transition-transform duration-700" />
                    <div className="px-6 py-2 rounded-full border border-indigo-500/30 bg-indigo-500/20 text-indigo-300 font-semibold backdrop-blur-md shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                      Nexus Edge Network
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
