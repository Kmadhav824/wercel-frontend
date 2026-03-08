import { Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { Rocket, ArrowRight, Server, Globe2, Shield, HardDrive, Cpu, Network } from "lucide-react"

export default function Infrastructure() {
    const { user } = useAuth();

    return (
        <div className="relative min-h-screen bg-[#06060c] text-white font-sans selection:bg-indigo-500/30 overflow-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[100vh] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.1)_0%,transparent_50%)]" />
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
                            <Link to="/features" className="text-sm font-medium text-slate-400 hover:text-white transition-all hover:scale-105 block">Features</Link>
                            <Link to="/infrastructure" className="text-sm font-bold text-white transition-all hover:scale-105 block">Infrastructure</Link>
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
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-semibold shadow-[0_0_20px_rgba(59,130,246,0.15)] mx-auto">
                        <Server className="w-4 h-4" />
                        <span>Enterprise-Grade Foundation</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1]">
                        Global <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Resilience.</span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
                        Discover the high-performance orchestration layer powering Nexus. Distributed storage, isolated Docker builders, and edge computing guarantees.
                    </p>
                </div>
            </main>

            {/* Architecture Visual */}
            <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="bg-[#0a0a16]/80 backdrop-blur-xl border border-white/10 rounded-[3rem] p-8 md:p-16 shadow-2xl relative overflow-hidden group">
                    {/* Background Grid */}
                    <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(59,130,246,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                    <div className="grid md:grid-cols-3 gap-8 relative z-10 text-center">

                        {/* Compute Node */}
                        <div className="bg-[#06060c] border border-white/10 rounded-3xl p-8 flex flex-col items-center gap-4 hover:border-blue-500/50 transition-colors shadow-xl z-20">
                            <div className="w-16 h-16 bg-blue-500/10 text-blue-400 flex items-center justify-center rounded-2xl border border-blue-500/20 mb-2">
                                <Cpu className="w-8 h-8" />
                            </div>
                            <h3 className="font-bold text-lg">Wercel-Fetch Build Node</h3>
                            <p className="text-sm text-slate-400">Isolated Redis-queued worker nodes clone, install, and optimize static repositories inside secure environments.</p>
                        </div>

                        {/* Arrow Connectors (Hidden on mobile) */}
                        <div className="hidden md:flex flex-col justify-center items-center text-blue-500/50">
                            <ArrowRight className="w-10 h-10 animate-pulse" />
                        </div>

                        {/* Storage Node */}
                        <div className="bg-[#06060c] border border-white/10 rounded-3xl p-8 flex flex-col items-center gap-4 hover:border-indigo-500/50 transition-colors shadow-xl z-20">
                            <div className="w-16 h-16 bg-indigo-500/10 text-indigo-400 flex items-center justify-center rounded-2xl border border-indigo-500/20 mb-2">
                                <HardDrive className="w-8 h-8" />
                            </div>
                            <h3 className="font-bold text-lg">Cloudflare R2 Storage</h3>
                            <p className="text-sm text-slate-400">Build artifacts are persisted securely to AWS S3-compatible R2 storage, allowing infinite scale and zero egress fees.</p>
                        </div>
                    </div>

                    <div className="mt-8 grid md:grid-cols-1 relative z-10 mx-auto max-w-xl text-center">
                        <div className="hidden md:flex flex-col justify-center items-center text-blue-500/50 my-4">
                            <div className="w-1 h-12 bg-gradient-to-b from-blue-500/50 to-emerald-500/50 rounded-full" />
                        </div>

                        {/* Edge Node */}
                        <div className="bg-[#06060c] border border-emerald-500/20 rounded-3xl p-8 flex flex-col items-center gap-4 shadow-[0_0_40px_rgba(16,185,129,0.1)] hover:shadow-[0_0_50px_rgba(16,185,129,0.2)] transition-shadow z-20 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
                            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 flex items-center justify-center rounded-2xl border border-emerald-500/30 mb-2">
                                <Network className="w-8 h-8" />
                            </div>
                            <h3 className="font-bold text-xl text-emerald-400">Global Request Handler</h3>
                            <p className="text-slate-300">The Edge proxy sits between the user and R2. It dynamically resolves `.nexus.app` domains, streams chunks directly from Cloudflare, and applies appropriate content-type headers instantly.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Grid Features */}
            <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 pb-32">
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="bg-[#0a0a16] border border-white/10 rounded-3xl p-10 hover:border-white/20 transition-colors">
                        <Shield className="w-12 h-12 text-slate-300 mb-6" />
                        <h3 className="text-2xl font-bold mb-4">Complete Isolation</h3>
                        <p className="text-slate-400 leading-relaxed text-lg mb-6">
                            Unlike primitive deployment tools, Nexus uses microservice orchestration. The proxy server is completely detached from the builder nodes, meaning heavy compilation loads never affect your live production traffic.
                        </p>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-3 text-slate-300"><span className="text-blue-400">✓</span> Separate worker processes</li>
                            <li className="flex items-center gap-3 text-slate-300"><span className="text-blue-400">✓</span> Read-only static artifact hosting</li>
                            <li className="flex items-center gap-3 text-slate-300"><span className="text-blue-400">✓</span> No local state vulnerabilities</li>
                        </ul>
                    </div>

                    <div className="bg-[#0a0a16] border border-white/10 rounded-3xl p-10 hover:border-white/20 transition-colors">
                        <Globe2 className="w-12 h-12 text-slate-300 mb-6" />
                        <h3 className="text-2xl font-bold mb-4">Edge Replication</h3>
                        <p className="text-slate-400 leading-relaxed text-lg mb-6">
                            Because Nexus utilizes Cloudflare R2 bucket infrastructure, your compiled chunks are inherently cached and distributed across hundreds of global points-of-presence (PoPs).
                        </p>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-3 text-slate-300"><span className="text-indigo-400">✓</span> Automatic CDN caching</li>
                            <li className="flex items-center gap-3 text-slate-300"><span className="text-indigo-400">✓</span> Sub-50ms Time-To-First-Byte</li>
                            <li className="flex items-center gap-3 text-slate-300"><span className="text-indigo-400">✓</span> DDoS protection by default</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 border-t border-white/5 pt-16 pb-8 text-center text-slate-500">
                <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Rocket className="w-5 h-5 text-blue-400" />
                        <span className="font-bold text-white">Nexus Engine</span>
                    </div>
                    <p className="text-sm">© {new Date().getFullYear()} Nexus. All rights reserved.</p>
                </div>
            </footer>
        </div>
    )
}
