import { Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { Rocket, ArrowRight, Zap, Check } from "lucide-react"

export default function Pricing() {
    const { user } = useAuth();

    return (
        <div className="relative min-h-screen bg-[#06060c] text-white font-sans selection:bg-indigo-500/30 overflow-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-indigo-700/10 blur-[150px] rounded-full mix-blend-screen" />
                <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-pink-700/10 blur-[150px] rounded-full mix-blend-screen" />
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
                            <Link to="/infrastructure" className="text-sm font-medium text-slate-400 hover:text-white transition-all hover:scale-105 block">Infrastructure</Link>
                            <Link to="/pricing" className="text-sm font-bold text-white transition-all hover:scale-105 block">Pricing</Link>
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
                        Scale Without <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Limits.</span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
                        Start for free, scale to billions. Our transparent tiering means you only pay for what you actually use.
                    </p>
                </div>
            </main>

            {/* Pricing Cards */}
            <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pb-32">
                <div className="grid md:grid-cols-3 gap-8 items-start">

                    {/* Hobby Tier */}
                    <div className="bg-[#0a0a16] border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-xl hover:border-slate-500/50 transition-colors group relative overflow-hidden">
                        <div className="space-y-6 relative z-10">
                            <h3 className="text-2xl font-bold text-white">Hobby</h3>
                            <p className="text-slate-400 text-sm h-10">Perfect for personal projects, portfolios, and experiments.</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-black">$0</span>
                                <span className="text-slate-500 font-medium">/ month</span>
                            </div>
                            <Link to={user ? "/dashboard" : "/signup"} className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white px-6 py-4 rounded-full text-base font-bold transition-all hover:scale-105 active:scale-95 group-hover:bg-white group-hover:text-[#0a0a16] group-hover:border-transparent">
                                Start Deploying
                            </Link>
                            <div className="pt-8 space-y-4">
                                <p className="text-sm font-bold text-white uppercase tracking-wider">Included</p>
                                <ul className="space-y-3">
                                    <li className="flex gap-3 text-slate-300 text-sm"><Check className="w-5 h-5 text-indigo-400 shrink-0" /> Automatic Github Deployments</li>
                                    <li className="flex gap-3 text-slate-300 text-sm"><Check className="w-5 h-5 text-indigo-400 shrink-0" /> Unlimited Preview Domains</li>
                                    <li className="flex gap-3 text-slate-300 text-sm"><Check className="w-5 h-5 text-indigo-400 shrink-0" /> Global Edge Network caching</li>
                                    <li className="flex gap-3 text-slate-300 text-sm"><Check className="w-5 h-5 text-indigo-400 shrink-0" /> Automatic HTTPS/SSL</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Pro Tier (Popular) */}
                    <div className="bg-[#0a0a16]/80 backdrop-blur-xl border border-indigo-500/50 rounded-[2.5rem] p-8 md:p-10 shadow-[0_0_50px_rgba(99,102,241,0.15)] relative overflow-hidden transform md:-translate-y-4">
                        <div className="absolute top-0 right-0 p-8">
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300 bg-indigo-500/20 px-3 py-1.5 rounded-full border border-indigo-500/30">Most Popular</span>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />

                        <div className="space-y-6 relative z-10">
                            <h3 className="text-2xl font-bold text-white flex items-center gap-2">Pro <Zap className="w-5 h-5 text-indigo-400 fill-indigo-400" /></h3>
                            <p className="pricing-pro-subtitle text-indigo-200/60 text-sm h-10">Advanced capabilities for high-performance scale and demanding teams.</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-black">$20</span>
                                <span className="text-slate-500 font-medium">/ user / month</span>
                            </div>
                            <button disabled className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-4 rounded-full text-base font-bold transition-all opacity-80 cursor-not-allowed border border-white/10">
                                Payment Integration Coming Soon
                            </button>
                            <div className="pt-8 space-y-4">
                                <p className="text-sm font-bold text-white uppercase tracking-wider">Everything in Hobby, plus</p>
                                <ul className="space-y-3">
                                    <li className="pricing-pro-feature flex gap-3 text-slate-300 text-sm"><Check className="w-5 h-5 text-indigo-400 shrink-0" /> Custom Domain Support</li>
                                    <li className="pricing-pro-feature flex gap-3 text-slate-300 text-sm"><Check className="w-5 h-5 text-indigo-400 shrink-0" /> Instant Production Rollbacks</li>
                                    <li className="pricing-pro-feature flex gap-3 text-slate-300 text-sm"><Check className="w-5 h-5 text-indigo-400 shrink-0" /> Team Collaboration Roles</li>
                                    <li className="pricing-pro-feature flex gap-3 text-slate-300 text-sm"><Check className="w-5 h-5 text-indigo-400 shrink-0" /> Extended Build Logs</li>
                                    <li className="pricing-pro-feature flex gap-3 text-slate-300 text-sm"><Check className="w-5 h-5 text-indigo-400 shrink-0" /> 1TB Edge Bandwidth</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Enterprise Tier */}
                    <div className="bg-[#0a0a16] border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-xl hover:border-slate-500/50 transition-colors group relative overflow-hidden">
                        <div className="space-y-6 relative z-10">
                            <h3 className="text-2xl font-bold text-white">Enterprise</h3>
                            <p className="text-slate-400 text-sm h-10">Dedicated infrastructure, whiteglove support, and maximum security.</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black py-1">Custom</span>
                            </div>
                            <button className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white px-6 py-4 rounded-full text-base font-bold transition-all hover:scale-105 active:scale-95">
                                Contact Sales
                            </button>
                            <div className="pt-8 space-y-4">
                                <p className="text-sm font-bold text-white uppercase tracking-wider">Everything in Pro, plus</p>
                                <ul className="space-y-3">
                                    <li className="flex gap-3 text-slate-300 text-sm"><Check className="w-5 h-5 text-slate-500 shrink-0" /> Private Docker Build Workers</li>
                                    <li className="flex gap-3 text-slate-300 text-sm"><Check className="w-5 h-5 text-slate-500 shrink-0" /> 99.99% Guaranteed Uptime SLA</li>
                                    <li className="flex gap-3 text-slate-300 text-sm"><Check className="w-5 h-5 text-slate-500 shrink-0" /> SAML Single Sign-On (SSO)</li>
                                    <li className="flex gap-3 text-slate-300 text-sm"><Check className="w-5 h-5 text-slate-500 shrink-0" /> Customized Edge Routing</li>
                                </ul>
                            </div>
                        </div>
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
