export function RecentActions({ actions }: { actions: any[] }) {
    return (
        <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden flex flex-col h-full w-full">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
                <h2 className="text-sm font-bold text-black uppercase tracking-wider text-slate-900">Recent Actions</h2>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-200/50 text-indigo-600 text-[10px] font-black uppercase tracking-widest animate-pulse shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    Live Activity
                </div>
            </div>

            <div className="p-5 space-y-4 flex-1 overflow-y-auto min-h-0 custom-scrollbar">
                {actions.length === 0 ? (
                    <div className="py-12 text-center text-slate-400">
                        <p className="text-sm font-medium italic">No recent actions logged.</p>
                    </div>
                ) : (
                    actions.map((action) => (
                        <div key={action.id} className="p-4 rounded-md border border-slate-100 bg-gradient-to-br from-white to-slate-50/30">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-mono text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md font-black shadow-sm tracking-tight">{action.targetValue}</span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-80 italic">Action Logged</span>
                            </div>
                            <div className="bg-white/60 p-2.5 rounded-md border border-slate-100 shadow-sm">
                                <span className="text-xs text-slate-700 font-medium tracking-tight">
                                    Processed <span className="text-indigo-600 font-black">{action.requestCount?.toLocaleString()}</span> requests
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {actions.length > 0 && (
                <div className="px-6 py-3 border-t border-slate-50 bg-slate-50/30 flex justify-center">
                    <a
                        href="/dashboard/logs"
                        className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest flex items-center gap-1.5 transition-colors group"
                    >
                        View Full History
                        <svg className="w-3 h-3 transition-transform group-hover:translate-x-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                    </a>
                </div>
            )}
        </div>
    );
}
