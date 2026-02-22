export function MetricsGrid({ zonesCount, totalBlocks, activeRulesCount }: { zonesCount: number; totalBlocks: number; activeRulesCount: number }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-white to-indigo-50/50 border border-indigo-100 p-5 rounded-md shadow-sm relative overflow-hidden group hover:border-indigo-300 transition-colors">
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Total Zones Protected</p>
                <p className="text-3xl font-black mt-2 text-indigo-600 tracking-tight">{zonesCount}</p>
            </div>

            <div className="bg-gradient-to-br from-white to-rose-50/50 border border-rose-100 p-5 rounded-md shadow-sm relative overflow-hidden group hover:border-rose-300 transition-colors">
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Malicious IPs Blocked</p>
                <p className="text-3xl font-black mt-2 text-rose-600 tracking-tight">{totalBlocks?.toLocaleString() || 0}</p>
            </div>

            <div className="bg-gradient-to-br from-white to-emerald-50/50 border border-emerald-100 p-5 rounded-md shadow-sm relative overflow-hidden group hover:border-emerald-300 transition-colors">
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Active Protection Rules</p>
                <div className="flex items-center mt-2 gap-3">
                    <p className="text-3xl font-black text-emerald-600 tracking-tight">{activeRulesCount}</p>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest whitespace-nowrap">Live Edge</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
