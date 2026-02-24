import { Link } from "react-router";
import { authClient } from "~/lib/auth-client";
import type { Route } from "./+types/home";
import { glassCls, subtleIndigoCls, sectionLabelCls } from "../components/dashboard/shared";

export const meta: Route.MetaFunction = () => [
  { title: "FlareFilter | Automated Cloudflare Edge Security" },
  { name: "description", content: "Stop DDoS attacks at the edge. FlareFilter automates your Cloudflare firewall rules, providing dynamic rate limiting and intelligent bot detection." },
];

export default function LandingPage() {
  const { data: session } = authClient.useSession();

  return (
    <div className="w-full relative isolate">
      {/* Minimal Background Decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] bg-indigo-50/40 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] bg-blue-50/40 rounded-full blur-[100px]" />
      </div>

      <div className="flex flex-col items-center">
        <div className="w-full max-w-[1400px] px-6">
          {/* ─── Hero Section: Mirroring Dashboard Aesthetics ─── */}
          <section className="py-10 lg:py-16 grid lg:grid-cols-[1fr_1.1fr] gap-16 items-center">
            <div className="space-y-10">
              <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-md bg-indigo-50 border border-indigo-100/50">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600" />
                </span>
                <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Protocol Engine v2.0 Live</span>
              </div>

              <h1 className="text-6xl md:text-8xl font-black text-slate-950 tracking-tight leading-[0.9] max-w-xl">
                Edge security <br />
                <span className="text-indigo-600 italic">automated.</span>
              </h1>

              <p className="text-xl text-slate-500 font-semibold leading-relaxed max-w-lg">
                Stop Volumetric DDoS and Scrapers directly at the Cloudflare network layer. Connect your account and deploy sub-second protection.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link
                  to={session?.user ? "/dashboard" : "/auth?mode=register"}
                  className="bg-indigo-600 text-white text-xs font-black px-10 h-14 rounded-md flex items-center justify-center hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95 uppercase tracking-widest"
                >
                  Start Filtering
                </Link>
                <button className="bg-white text-slate-900 text-xs font-black px-10 h-14 rounded-md border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-all shadow-sm active:scale-95 uppercase tracking-widest">
                  Documentation
                </button>
              </div>

              <div className="flex items-center gap-8 pt-6">
                <div className="flex -space-x-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-50 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse" />
                    </div>
                  ))}
                </div>
                <div className="flex flex-col">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deployed on</p>
                  <p className="text-xs font-black text-slate-900 uppercase">Cloudflare Global Network</p>
                </div>
              </div>
            </div>

            {/* ─── Technical Simulation: Mirrors Dashboard Overview ─── */}
            <div className={`${glassCls} p-1.5 relative group h-[540px] shadow-2xl overflow-hidden`}>
              <div className="h-full flex flex-col bg-slate-50/50 rounded-[inherit] border border-slate-100/50 overflow-hidden">
                {/* Simulated Dashboard Header */}
                <div className="h-14 border-b border-slate-200/60 bg-white/80 flex items-center px-6 justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                    </div>
                    <div className="h-4 w-32 bg-slate-100 rounded-sm" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Mitigation Stream</span>
                  </div>
                </div>

                <div className="flex-1 p-6 space-y-6 overflow-hidden">
                  {/* Real-time Metrics Card */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm space-y-3">
                      <p className={sectionLabelCls.replace('mb-3', 'mb-0')}>Protection Power</p>
                      <div className="flex items-end justify-between">
                        <p className="text-3xl font-black text-slate-950">99.8%</p>
                        <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase">+2.1%</span>
                      </div>
                      <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 w-[95%] animate-pulse" />
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm space-y-3">
                      <p className={sectionLabelCls.replace('mb-3', 'mb-0')}>Action Latency</p>
                      <div className="flex items-end justify-between">
                        <p className="text-3xl font-black text-slate-950">180<span className="text-sm">ms</span></p>
                        <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase">Optimized</span>
                      </div>
                      <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 w-[85%]" />
                      </div>
                    </div>
                  </div>

                  {/* Single Row Event Stream (Mirroring Organizations UI) */}
                  <div className="space-y-3">
                    <p className={sectionLabelCls}>Live Edge Mitigation</p>
                    <div className="space-y-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white/90 p-3.5 rounded-md border border-slate-100 flex items-center justify-between gap-4 group/item hover:border-indigo-200 transition-all shadow-sm">
                          <div className="flex items-center gap-4 min-w-0">
                            <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 border ${i === 1 ? 'bg-red-50 text-red-600 border-red-100 shadow-sm' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /></svg>
                            </div>
                            <div className="min-w-0">
                              <code className="text-[10px] font-bold text-slate-950 font-mono block truncate">IP::{142 + i}.92.{84 + i * 2}.10</code>
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Origin::{i === 1 ? 'United States' : 'Germany'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 shrink-0">
                            <span className={`text-[8px] font-black px-2 py-0.5 rounded border ${i === 1 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 text-slate-500 border-slate-200'} uppercase tracking-widest`}>
                              {i === 1 ? 'Blocked' : 'Verified'}
                            </span>
                            <span className="text-slate-200">•</span>
                            <span className="text-[9px] font-bold text-slate-400 font-mono">2ms ago</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sub-Technical Section */}
                  <div className="p-4 bg-slate-900 rounded-md border border-slate-800 relative z-10">
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em]">Internal Spectrum Pipeline</p>
                      <p className="text-[8px] font-bold text-indigo-400 animate-pulse">SYSTEM NOMINAL</p>
                    </div>
                    <div className="flex gap-2 h-12 items-end">
                      {Array.from({ length: 40 }).map((_, i) => (
                        <div key={i} className="flex-1 bg-indigo-500/30 rounded-full" style={{ height: `${Math.random() * 100}%` }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section> 
        </div>
      </div>
    </div>
  );
}
