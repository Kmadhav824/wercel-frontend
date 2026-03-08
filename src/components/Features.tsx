import { Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { Rocket, ArrowRight, Github, CloudLightning, Box, Globe2, Activity, Zap } from "lucide-react"

export default function Features() {
    const { user } = useAuth();

    return (
        <div className="relative min-h-screen bg-[#06060c] text-white font-sans selection:bg-indigo-500/30 overflow-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-700/20 blur-[140px] rounded-full mix-blend-screen" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-fuchsia-700/10 blur-[150px] rounded-full mix-blend-screen" />
                <div className="absolute inset-0 z-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
            </div>

            {/* Navigation Layer */}
            <nav className="relative z-50 border-b border-white/5 bg-[#06060c]/60 backdrop-blur-2xl sticky top-0">
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <Link to="/" className="flex items-center gap-3 group cursor-pointer transition-transform hover:scale-105">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-[1px] shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all duration-500">
                                <div className="w-full h-full rounded-[11px] bg-[#06060c] flex items-center justify-center group-hover:bg-transparent transition-colors duration-500">
                                    <Rocket className="w-5 h-5 text-white" strokeWidth={2.5} />
                                </div>
                            </div>
                            <span className="text-2xl font-bold tracking-tight text-white">Nexus</span>
                        </Link>

                        <div className="hidden md:flex items-center gap-8 absolute left-1/2 transform -translate-x-1/2">
                            <Link to="/features" className="text-sm font-bold text-white transition-all hover:scale-105 block">Features</Link>
                            <Link to="/infrastructure" className="text-sm font-medium text-slate-400 hover:text-white transition-all hover:scale-105 block">Infrastructure</Link>
                            <a href="#" className="text-sm font-medium text-slate-400 hover:text-white transition-all hover:scale-105 block">Pricing</a>
                        </div>

                        <div className="flex items-center gap-4">
                            {user ? (
                                <Link to="/dashboard" className="flex items-center gap-2 text-sm font-bold bg-white text-[#06060c] hover:bg-slate-200 px-6 py-2.5 rounded-full backdrop-blur-md transition-all shadow-lg active:scale-95">
                                    Dashboard
                                    <ArrowRight className="w-4 h-4 ml-1" />
                                </Link>
                            ) : (
                                <Link to="/signup" className="flex items-center gap-2 text-sm font-bold bg-white text-[#06060c] hover:bg-slate-200 px-6 py-2.5 rounded-full backdrop-blur-md transition-all shadow-lg active:scale-95">
                                    Sign Up
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <main className="relative z-10 w-full pt-20 pb-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1]">
                        Feature <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Packed.</span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
                        Everything your team needs to develop, preview, and deploy applications faster than ever before. No configuration required.
                    </p>
                </div>
            </main>

            {/* Feature Sections */}
            <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-32">

                {/* Feature 1: GitHub Flow */}
                <div className="flex flex-col md:flex-row items-center gap-16">
                    <div className="md:w-1/2 space-y-6 animate-in slide-in-from-left-8 duration-1000 delay-100">
                        <div className="w-16 h-16 bg-fuchsia-500/10 rounded-2xl flex items-center justify-center text-fuchsia-400 border border-fuchsia-500/20 shadow-[0_0_30px_rgba(217,70,239,0.2)]">
                            <Github className="w-8 h-8" />
                        </div>
                        <h2 className="text-4xl font-bold tracking-tight">Zero-Config GitHub Deployments</h2>
                        <p className="text-lg text-slate-400 leading-relaxed">
                            Connect your repository and we'll handle the rest. Nexus detects your framework, installs dependencies, and automatically compiles your code into highly optimized static assets in a fully isolated build environment. Every push automatically triggers an immutable deployment.
                        </p>
                        <ul className="space-y-4 pt-4">
                            <li className="flex items-center gap-3 text-slate-300"><Zap className="w-5 h-5 text-fuchsia-400" /> Auto-detection of popular front-end frameworks.</li>
                            <li className="flex items-center gap-3 text-slate-300"><Zap className="w-5 h-5 text-fuchsia-400" /> Deep GitHub integration.</li>
                            <li className="flex items-center gap-3 text-slate-300"><Zap className="w-5 h-5 text-fuchsia-400" /> Live terminal build output.</li>
                        </ul>
                    </div>
                    <div className="md:w-1/2 w-full animate-in slide-in-from-right-8 duration-1000 delay-100">
                        <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/10 bg-[#0a0a16]/80 p-6 flex flex-col justify-center gap-4 shadow-2xl group">
                            <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/10 to-transparent pointer-events-none" />
                            <div className="flex items-center justify-between border-b border-white/5 pb-4 px-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center"><Github className="w-5 h-5 text-white" /></div>
                                    <div>
                                        <p className="font-bold text-white text-sm">Update landing page design</p>
                                        <p className="text-xs text-slate-500">Pushed to main just now</p>
                                    </div>
                                </div>
                                <div className="text-fuchsia-400 font-bold text-xs bg-fuchsia-500/10 px-3 py-1 rounded-full border border-fuchsia-500/20">Building...</div>
                            </div>
                            <div className="bg-[#05050f] rounded-xl border border-white/5 p-4 font-mono text-xs text-slate-400 space-y-2 relative overflow-hidden group-hover:border-fuchsia-500/30 transition-colors">
                                <p><span className="text-emerald-400">✓</span> Repository cloned securely</p>
                                <p><span className="text-emerald-400">✓</span> Installing precise dependencies</p>
                                <p className="text-slate-300">➜ Compiling optimized production build <span className="animate-pulse">_</span></p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Feature 2: Instant Rollbacks */}
                <div className="flex flex-col md:flex-row-reverse items-center gap-16">
                    <div className="md:w-1/2 space-y-6">
                        <div className="w-16 h-16 bg-pink-500/10 rounded-2xl flex items-center justify-center text-pink-400 border border-pink-500/20 shadow-[0_0_30px_rgba(236,72,153,0.2)]">
                            <CloudLightning className="w-8 h-8" />
                        </div>
                        <h2 className="text-4xl font-bold tracking-tight">Instant Rollbacks</h2>
                        <p className="text-lg text-slate-400 leading-relaxed">
                            Pushed a critical bug to production? With Nexus, your deployment history is fully immutable. You can instantly revert your live production domain to any previous successful commit in under 1 second. No waiting for re-builds. No downtime.
                        </p>
                        <div className="pt-4 flex gap-4">
                            <div className="bg-[#0a0a16] border border-white/10 rounded-xl p-4 flex-1">
                                <p className="text-sm text-slate-500 mb-1">Time to revert</p>
                                <p className="text-2xl font-bold text-pink-400">&lt; 1 sec</p>
                            </div>
                            <div className="bg-[#0a0a16] border border-white/10 rounded-xl p-4 flex-1">
                                <p className="text-sm text-slate-500 mb-1">Downtime</p>
                                <p className="text-2xl font-bold text-pink-400">Zero</p>
                            </div>
                        </div>
                    </div>
                    <div className="md:w-1/2 w-full">
                        <div className="bg-[#0a0a16]/80 rounded-3xl border border-white/10 shadow-2xl p-6 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/10 to-transparent opacity-50 pointer-events-none" />
                            <div className="space-y-4 relative z-10">
                                {[
                                    { id: "dep-bd7a2", msg: "Fix critical checkout bug", status: "Active", time: "2 min ago", color: "emerald", active: true },
                                    { id: "dep-92c1f", msg: "Update dependencies", status: "Rolled back", time: "1 hr ago", color: "pink", active: false },
                                    { id: "dep-4x8fa", msg: "Initial stable release", status: "Ready", time: "5 hrs ago", color: "emerald", active: false }
                                ].map((d, i) => (
                                    <div key={i} className={`flex items-center justify-between p-4 rounded-xl border ${d.active ? 'bg-white/5 border-white/20 shadow-lg' : 'bg-transparent border-white/5'}`}>
                                        <div className="space-y-1">
                                            <p className="text-white font-medium text-sm">{d.msg}</p>
                                            <p className="text-slate-500 font-mono text-xs">{d.id} • {d.time}</p>
                                        </div>
                                        {d.active ? (
                                            <span className="text-emerald-400 text-xs font-bold px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">Production</span>
                                        ) : (
                                            <button className="text-pink-400 hover:bg-pink-500/10 px-4 py-1.5 rounded-lg font-bold text-xs transition-colors border border-pink-500/20">Rollback to this</button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Feature Grid Bottom */}
                <div className="grid md:grid-cols-3 gap-8 pb-32">
                    <div className="bg-[#0a0a16] border border-white/10 rounded-3xl p-8 hover:border-indigo-500/50 transition-colors shadow-2xl">
                        <Box className="w-10 h-10 text-indigo-400 mb-6" />
                        <h3 className="text-xl font-bold mb-3 text-white">Preview Environments</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">Share live previews of your progress automatically before merging to production. Every deployment gets a unique hash domain.</p>
                    </div>
                    <div className="bg-[#0a0a16] border border-white/10 rounded-3xl p-8 hover:border-emerald-500/50 transition-colors shadow-2xl">
                        <Globe2 className="w-10 h-10 text-emerald-400 mb-6" />
                        <h3 className="text-xl font-bold mb-3 text-white">Custom Domains</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">Map your project to any custom domain in seconds. We handle the SSL certificate generation and DNS edge-routing transparently.</p>
                    </div>
                    <div className="bg-[#0a0a16] border border-white/10 rounded-3xl p-8 hover:border-blue-500/50 transition-colors shadow-2xl">
                        <Activity className="w-10 h-10 text-blue-400 mb-6" />
                        <h3 className="text-xl font-bold mb-3 text-white">Full Audit Logging</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">A robust logging framework saves every deployment, rollback, and login. Monitor who changed what from your dashboard settings.</p>
                    </div>
                </div>

            </section>

            {/* Footer */}
            <footer className="relative z-10 border-t border-white/5 pt-16 pb-8 text-center text-slate-500">
                <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Rocket className="w-5 h-5 text-indigo-400" />
                        <span className="font-bold text-white">Nexus Engine</span>
                    </div>
                    <p className="text-sm">© {new Date().getFullYear()} Nexus. All rights reserved.</p>
                </div>
            </footer>
        </div>
    )
}
