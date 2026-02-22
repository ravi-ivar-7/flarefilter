import { Link } from "react-router";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col selection:bg-indigo-500/30">
      <div className="fixed top-[-10%] inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-200/50 via-gray-50 to-gray-50 -z-10 animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute top-[20%] right-[10%] w-[30rem] h-[30rem] bg-indigo-600/10 blur-[120px] rounded-full -z-10" />
      <div className="absolute top-[40%] left-[10%] w-[25rem] h-[25rem] bg-violet-600/10 blur-[100px] rounded-full -z-10" />


      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto relative z-10 pt-20 pb-32">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-sm text-indigo-600 mb-8 self-center">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          Next-Generation Edge Protection
        </div>

        <h1 className="text-6xl md:text-7xl font-bold tracking-tighter mb-8 bg-gradient-to-b from-gray-900 to-gray-600 bg-clip-text text-transparent">
          Secure your applications at the absolute edge.
        </h1>

        <p className="text-xl text-gray-600 mb-12 max-w-2xl leading-relaxed">
          FlareFilter provides real-time, AI-driven traffic filtering and rate limiting directly on Cloudflare's global network. Stop attacks before they even reach your servers.
        </p>

        <div className="flex sm:flex-row flex-col gap-4">
          <Link to="/login" className="bg-gray-900 text-white text-lg font-semibold px-8 py-4 rounded-xl hover:bg-gray-800 transition-all duration-300 active:scale-95 shadow-xl flex items-center justify-center gap-2">
            Get Started
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
          </Link>
          <a href="#features" className="bg-white border border-gray-200 text-gray-900 text-lg font-medium px-8 py-4 rounded-xl hover:border-gray-300 transition-all duration-300 shadow-sm">
            View Features
          </a>
        </div>
      </main>

      <section id="features" className="px-8 py-24 bg-white border-t border-gray-200 relative z-10">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
          <div className="p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center mb-6 border border-rose-200">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900">Instant Threat Blocking</h3>
            <p className="text-gray-600 leading-relaxed">Automatically detects and drops malicious traffic using advanced heuristic patterns at the CDN layer.</p>
          </div>

          <div className="p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-6 border border-indigo-200">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900">Smart Rate Limiting</h3>
            <p className="text-gray-600 leading-relaxed">Dynamic rate limits that adapt to your traffic spikes while aggressively penalizing known bad actors.</p>
          </div>

          <div className="p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-6 border border-emerald-200">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6" /><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M3 22v-6h6" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /></svg>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900">Real-time Analytics</h3>
            <p className="text-gray-600 leading-relaxed">Watch attacks get mitigated live. Our dashboard streams D1 log events instantly so you're always in control.</p>
          </div>
        </div>
      </section>

      <footer className="px-8 py-8 border-t border-gray-200 text-center text-sm text-gray-500 bg-gray-50 relative z-10">
        © {new Date().getFullYear()} FlareFilter Edge Protection. All rights reserved.
      </footer>
    </div>
  );
}
