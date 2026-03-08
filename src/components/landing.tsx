import { Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { Github, Globe, Loader2, Rocket, Zap, Sparkles, ArrowRight, Server, CloudLightning, Shield, Code2, FileText, Share2 } from "lucide-react"

export function Landing() {
  const { user } = useAuth();

  return (
    <div className="relative min-h-screen bg-[#06060c] text-white font-sans selection:bg-indigo-500/30 overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-700/20 blur-[140px] rounded-full mix-blend-screen" />
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[60%] bg-fuchsia-700/10 blur-[140px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] bg-blue-700/10 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute inset-0 z-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        <div className="absolute inset-x-0 bottom-0 h-[300px] bg-gradient-to-t from-[#06060c] to-transparent"></div>
      </div>

      {/* Navigation */}
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
              <a href="#features" className="text-sm font-medium text-slate-400 hover:text-white transition-all hover:scale-105 block">Features</a>
              <a href="#infrastructure" className="text-sm font-medium text-slate-400 hover:text-white transition-all hover:scale-105 block">Infrastructure</a>
              <a href="#" className="text-sm font-medium text-slate-400 hover:text-white transition-all hover:scale-105 block">Pricing</a>
            </div>

            <div className="flex items-center gap-4">
              {user ? (
                <Link to="/dashboard" className="flex items-center gap-2 text-sm font-bold bg-white text-[#06060c] hover:bg-slate-200 px-6 py-2.5 rounded-full backdrop-blur-md transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] active:scale-95">
                  Dashboard
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              ) : (
                <>
                  <Link to="/login" className="hidden sm:block text-sm font-bold text-slate-300 hover:text-white px-4 py-2 transition-all hover:scale-105">
                    Log in
                  </Link>
                  <Link to="/signup" className="flex items-center gap-2 text-sm font-bold bg-white text-[#06060c] hover:bg-slate-200 px-6 py-2.5 rounded-full backdrop-blur-md transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] active:scale-95">
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 w-full pt-32 pb-20 lg:pt-48 lg:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-10">

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-semibold shadow-[0_0_20px_rgba(99,102,241,0.15)] animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Introducing Nexus Deployment Engine 2.0</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-[1.05] animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-150 relative">
            Develop. Preview. <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Deploy globally.</span>

            {/* Glowing orb behind text */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-indigo-500/20 blur-[120px] rounded-full -z-10 pointer-events-none" />
          </h1>

          <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            Nexus is the platform for frontend developers, providing the speed and reliability innovators need to create at the moment of inspiration.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
            <Link to={user ? "/dashboard" : "/signup"} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-[#06060c] hover:bg-slate-200 px-8 py-4 rounded-full text-lg font-bold transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)] hover:scale-105 active:scale-95">
              <Zap className="w-5 h-5 fill-current" />
              Start Deploying
            </Link>
            <a href="#features" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white px-8 py-4 rounded-full text-lg font-bold transition-all hover:scale-105 active:scale-95">
              Explore Platform
              <ArrowRight className="w-5 h-5 opacity-70" />
            </a>
          </div>

        </div>
      </main>

      {/* Hero Visual Map / Mockup */}
      <section className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 mb-40 animate-in fade-in zoom-in-95 duration-1000 delay-700">
        <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-[#0a0a16]/80 backdrop-blur-xl shadow-2xl p-2">
          <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/10 to-transparent opacity-50 pointer-events-none" />
          <div className="rounded-2xl border border-white/5 bg-[#06060c] p-6 relative h-[400px] flex items-center justify-center overflow-hidden group">
            {/* Decorative grid */}
            <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px', backgroundPosition: 'center center' }} />

            <div className="relative z-10 flex flex-col md:flex-row sm:items-center gap-6 sm:gap-20">
              <div className="w-20 h-20 rounded-2xl bg-[#0a0a16] border border-white/10 flex items-center justify-center shadow-2xl z-20 shadow-indigo-500/20 transform group-hover:-translate-y-2 transition-transform duration-500">
                <Github className="w-10 h-10 text-slate-300" />
              </div>

              {/* Animated line */}
              <div className="hidden sm:block absolute left-[80px] right-[80px] h-1 top-1/2 -mt-0.5 overflow-hidden rounded-full bg-white/5 z-0">
                <div className="w-full h-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent animate-[pulse_2s_ease-in-out_infinite]" />
              </div>

              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-[1px] flex items-center justify-center shadow-[0_0_50px_rgba(99,102,241,0.5)] z-20 group-hover:scale-110 transition-transform duration-500">
                <div className="w-full h-full bg-[#0a0a16] rounded-[15px] flex items-center justify-center">
                  <Rocket className="w-12 h-12 text-white" fill="currentColor" fillOpacity={0.2} />
                </div>
              </div>

              <div className="w-20 h-20 rounded-2xl bg-[#0a0a16] border border-white/10 flex items-center justify-center shadow-2xl z-20 shadow-purple-500/20 transform group-hover:-translate-y-2 transition-transform duration-500 delay-100">
                <Globe className="w-10 h-10 text-slate-300" />
              </div>
            </div>

            <div className="absolute bottom-6 mx-auto bg-white/5 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 z-10 font-mono text-sm text-indigo-300 flex items-center gap-2 shadow-xl hover:bg-white/10 transition-colors">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Deploying to global edge network...
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 border-y border-white/5 bg-[#0a0a16]/40 backdrop-blur-sm py-20 mb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-white/5">
            <div className="space-y-2">
              <div className="text-4xl sm:text-5xl font-black text-white">99.99%</div>
              <div className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Uptime SLA</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl sm:text-5xl font-black text-white">40ms</div>
              <div className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Global Latency</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl sm:text-5xl font-black text-white">Unlimited</div>
              <div className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Bandwidth</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl sm:text-5xl font-black text-white">Instant</div>
              <div className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Rollbacks</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 mb-32">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Everything you need to ship faster.</h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">Nexus removes the operational burden, letting you focus on the code.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-[#0a0a16] border border-white/10 rounded-3xl p-8 hover:border-indigo-500/50 hover:bg-white/[0.02] transition-all group shadow-xl">
            <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all text-indigo-400 border border-indigo-500/20">
              <Server className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold mb-3">Edge Architecture</h3>
            <p className="text-slate-400 leading-relaxed">Applications are instantly deployed across a globally distributed edge network, ensuring sub-50ms load times worldwide.</p>
          </div>

          <div className="bg-[#0a0a16] border border-white/10 rounded-3xl p-8 hover:border-fuchsia-500/50 hover:bg-white/[0.02] transition-all group shadow-xl gap-6">
            <div className="w-14 h-14 bg-fuchsia-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-fuchsia-500/20 transition-all text-fuchsia-400 border border-fuchsia-500/20">
              <Code2 className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold mb-3">GitHub Integration</h3>
            <p className="text-slate-400 leading-relaxed">Connect your repositories to automatically trigger isolated builds and deployments the moment you push new code.</p>
          </div>

          <div className="bg-[#0a0a16] border border-white/10 rounded-3xl p-8 hover:border-pink-500/50 hover:bg-white/[0.02] transition-all group shadow-xl gap-6">
            <div className="w-14 h-14 bg-pink-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-pink-500/20 transition-all text-pink-400 border border-pink-500/20">
              <CloudLightning className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold mb-3">Instant Rollbacks</h3>
            <p className="text-slate-400 leading-relaxed">Pushed a critical bug? One click in the Dashboard instantly rewires your production domain to the previous stable release.</p>
          </div>

          <div className="bg-[#0a0a16] border border-white/10 rounded-3xl p-8 hover:border-blue-500/50 hover:bg-white/[0.02] transition-all group shadow-xl gap-6 md:col-span-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-10 blur-xl">
              <Globe className="w-96 h-96 text-blue-500" />
            </div>
            <div className="relative z-10 w-full md:w-2/3">
              <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all text-blue-400 border border-blue-500/20">
                <Shield className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Enterprise Grade Security</h3>
              <p className="text-slate-400 leading-relaxed">Built on top of Cloudflare R2 infrastructure with automated SSL certificate provisioning, isolated Docker build environments, and full JWT-based request handling protection.</p>
            </div>
          </div>

          <div className="bg-[#0a0a16] border border-white/10 rounded-3xl p-8 hover:border-emerald-500/50 hover:bg-white/[0.02] transition-all group shadow-xl gap-6">
            <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all text-emerald-400 border border-emerald-500/20">
              <FileText className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold mb-3">Comprehensive Logs</h3>
            <p className="text-slate-400 leading-relaxed">Detailed audit logging tracks every user interaction, github commit link, and orchestration status automatically.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-32 text-center">
        <div className="absolute inset-0 bg-indigo-500/10 blur-[100px] rounded-full z-0" />
        <div className="relative z-10 bg-gradient-to-b from-[#0a0a16]/80 to-[#06060c] border border-white/10 rounded-[3rem] p-12 md:p-20 shadow-2xl">
          <h2 className="text-4xl md:text-6xl font-black mb-6">Ready to deploy?</h2>
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">Join the creators shipping blazing fast web applications across the global edge network.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/signup" className="bg-white text-[#06060c] hover:bg-slate-200 px-10 py-4 rounded-full text-xl font-bold transition-all shadow-xl hover:scale-105 active:scale-95">
              Start Deploying for Free
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 pt-16 pb-8 text-center text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-indigo-400" />
            <span className="font-bold text-white">Nexus Engine</span>
          </div>
          <p className="text-sm">© {new Date().getFullYear()} Nexus. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-colors"><Github className="w-5 h-5" /></a>
            <a href="#" className="hover:text-white transition-colors"><Share2 className="w-5 h-5" /></a>
          </div>
        </div>
      </footer>
    </div>
  )
}
