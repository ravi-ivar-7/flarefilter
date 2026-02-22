import { Link } from "react-router";
import { authClient } from "~/lib/auth-client";
import type { Route } from "./+types/home";

export const meta: Route.MetaFunction = () => [
  { title: "FlareFilter | Automated Cloudflare Security" },
  { name: "description", content: "Stop DDoS attacks at the edge. FlareFilter automates your Cloudflare firewall rules, providing dynamic rate limiting and intelligent bot detection." },
];

export default function LandingPage() {
  const { data: session } = authClient.useSession();

  return (
    <div className="bg-white text-slate-800 font-sans selection:bg-orange-100 selection:text-orange-900 w-full min-h-screen">

      {/* Hero Section */}
      <section className="bg-slate-50 border-b border-slate-200 w-full">
        <div className="max-w-[1280px] mx-auto px-6 pt-24 pb-32 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 max-w-2xl">
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
              Stop DDoS attacks before they hit your infrastructure.
            </h1>
            <p className="text-xl text-slate-600 font-normal leading-relaxed">
              FlareFilter connects directly to your Cloudflare account to provide automated IP blocking and dynamic rate limiting. Keep malicious traffic off your origin servers without manual intervention.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                to={session?.user ? "/dashboard" : "/auth?mode=register"}
                className="inline-flex items-center justify-center px-6 py-3.5 text-[15px] font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded shadow-sm transition-colors text-center w-full sm:w-auto"
              >
                {session?.user ? "Go to dashboard" : "Start filtering traffic"}
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center px-6 py-3.5 text-[15px] font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 rounded shadow-sm transition-colors text-center w-full sm:w-auto"
              >
                How it works
              </a>
            </div>
            <div className="pt-2">
              <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-green-600">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                Installs in minutes. Built on Cloudflare Workers.
              </p>
            </div>
          </div>

          <div className="hidden lg:block relative justify-self-end w-full max-w-[500px]">
            {/* Minimalist technical illustration / abstract dashboard mockup */}
            <div className="bg-white border border-slate-200 shadow-xl rounded-md overflow-hidden flex flex-col h-[400px]">
              <div className="h-10 bg-slate-100 border-b border-slate-200 flex items-center px-4 gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                  <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                  <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                </div>
                <div className="mx-auto w-48 h-5 bg-white border border-slate-200 rounded"></div>
              </div>
              <div className="p-6 flex-1 flex flex-col gap-4">
                <div className="flex justify-between items-end pb-4 border-b border-slate-100">
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Threats Mitigated</div>
                    <div className="text-3xl font-bold text-slate-900">142,509</div>
                  </div>
                  <div className="px-2.5 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-sm">LIVE</div>
                </div>
                <div className="flex-1 rounded border border-slate-100 bg-slate-50 flex items-center justify-center p-4">
                  <div className="w-full space-y-3">
                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden flex">
                      <div className="h-full bg-blue-500 w-[70%]"></div>
                      <div className="h-full bg-orange-500 w-[15%]"></div>
                      <div className="h-full bg-red-500 w-[5%]"></div>
                    </div>
                    <div className="flex justify-between text-xs font-medium text-slate-500">
                      <span>Clean traffic</span>
                      <span>Rate limited</span>
                      <span>Blocked</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-8 rounded bg-slate-100 border border-slate-200 w-full flex items-center px-3">
                    <span className="text-xs font-mono text-slate-600">BLOCK IP 192.168.1.x [Threat Score  40]</span>
                  </div>
                  <div className="h-8 rounded bg-slate-100 border border-slate-200 w-full flex items-center px-3">
                    <span className="text-xs font-mono text-slate-600">CHALLENGE ASN 13335 [Rate  100/min]</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Outline */}
      <section id="how-it-works" className="py-24 w-full">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="max-w-3xl mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Designed for enterprise-scale reliability.</h2>
            <p className="text-lg text-slate-600">Our suite of tools ensures your web properties remain fast and available, dropping bad traffic at the Cloudflare network layer before it reaches your web servers.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-x-8 gap-y-12 border-t border-slate-200 pt-16">
            <div className="space-y-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              <h3 className="text-xl font-bold text-slate-900">Automated WAF Rules</h3>
              <p className="text-slate-600 leading-relaxed">
                Configure threshold-based rules that automatically deploy native Cloudflare firewall entries. We detect abusive patterns, update your WAF, and remove expired blocks dynamically.
              </p>
            </div>

            <div className="space-y-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              <h3 className="text-xl font-bold text-slate-900">Live Traffic Analytics</h3>
              <p className="text-slate-600 leading-relaxed">
                Access streamlined, actionable insights from your Cloudflare logs. Quickly pinpoint volumetric attacks, find the top attacking ASNs, and deploy countermeasures with one click.
              </p>
            </div>

            <div className="space-y-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
              <h3 className="text-xl font-bold text-slate-900">Custom Rate Limiting</h3>
              <p className="text-slate-600 leading-relaxed">
                Set granular request throttling specifically tailored to your API and web endpoints. Identify application-level scraping attempts without penalizing legitimate users.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-slate-900 text-white w-full py-20">
        <div className="max-w-[1280px] mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to secure your edge network?</h2>
          <p className="text-lg text-slate-400 mb-8 max-w-2xl mx-auto">Create an organization and link your Cloudflare account to deploy automated protection.</p>
          <Link
            to={session?.user ? "/dashboard" : "/auth?mode=register"}
            className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-slate-900 bg-white hover:bg-slate-100 rounded shadow-sm transition-colors"
          >
            {session?.user ? "Go to dashboard" : "Create your account"}
          </Link>
        </div>
      </section>

    </div>
  );
}
