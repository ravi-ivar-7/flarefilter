export function RecentBlocks({ attacks }: { attacks: any[] }) {
    return (
        <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden flex flex-col h-full w-full">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
                <h2 className="text-sm font-bold text-black uppercase tracking-wider text-slate-900">Recent Blocks</h2>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-200/50 text-rose-600 text-[10px] font-black uppercase tracking-widest animate-pulse shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Live Feed
                </div>
            </div>

            <div className="p-5 space-y-4 flex-1 overflow-y-auto min-h-0 custom-scrollbar">
                {attacks.length === 0 ? (
                    <div className="py-12 text-center text-slate-400">
                        <p className="text-sm font-medium italic">No recent threats detected.</p>
                    </div>
                ) : (
                    attacks.map((attack) => (
                        <div key={attack.id} className="p-4 rounded-md border border-rose-100 bg-gradient-to-br from-white to-rose-50/30">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-mono text-xs text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md font-black shadow-sm tracking-tight">{attack.ip}</span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-80 italic">Mitigated</span>
                            </div>
                            <div className="bg-white/60 p-2.5 rounded-md border border-slate-100 shadow-sm">
                                <span className="text-xs text-slate-700 font-medium tracking-tight">
                                    Mitigated <span className="text-rose-600 font-black">{attack.requestCount?.toLocaleString()}</span> malicious requests
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
