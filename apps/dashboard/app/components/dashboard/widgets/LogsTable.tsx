export function LogsTable({ logs, zones = [] }: { logs: any[], zones?: any[] }) {
    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).format(date);
    };

    const formatDateFull = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(date);
    };

    if (logs.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center py-32 px-12 text-center group">
                <div className="w-24 h-24 rounded-[2rem] bg-slate-50 border border-slate-100 flex items-center justify-center mb-8 transition-all group-hover:scale-110 duration-500 shadow-sm relative">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight italic">No logs found</h3>
                <p className="text-sm text-slate-500 mt-3 max-w-[320px] font-medium leading-relaxed">
                    No logs found for this configuration. Adjust your filters or time range and hit <span className="text-indigo-600 font-bold underline decoration-indigo-200 underline-offset-4 tracking-tighter uppercase">Fetch</span> again.
                </p>
            </div>
        );
    }

    return (
        <div className="relative overflow-x-auto custom-scrollbar bg-white border border-slate-200 shadow-sm ">
            <table className="w-full min-w-max text-left border-collapse">
                <thead className="bg-slate-50/95 backdrop-blur-sm border-b border-slate-100 sticky top-0 z-20">
                    <tr>
                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Timestamp</th>
                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Target</th>
                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Zone</th>
                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Action</th>
                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Activity</th>
                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Details</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {logs.map((log) => {
                        const metadata = log.metadata ? JSON.parse(log.metadata) : {};
                        const date = new Date(log.timestamp);
                        const zoneName = zones.find(z => z.id === log.zoneConfigId)?.name || "Unknown Zone";
                        return (
                            <tr key={log.id} className="transition-all group cursor-pointer hover:bg-slate-50/80">
                                <td className="px-6 py-5">
                                    <div className="text-xs font-bold text-slate-700">{formatDate(date)}</div>
                                    <div className="text-[10px] text-slate-400 font-medium">{formatDateFull(date)}</div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex flex-col gap-1">
                                        <span className="font-mono text-xs font-bold text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-md shadow-sm group-hover:border-indigo-400 transition-colors whitespace-nowrap inline-block w-max">
                                            {log.targetValue}
                                        </span>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{log.targetType}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">{zoneName}</span>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                                            {log.actionTaken.replace('_', ' ')}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex flex-col items-start gap-0.5">
                                        <span className="text-[13px] font-black tabular-nums tracking-tight bg-gradient-to-br from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                            {log.requestCount.toLocaleString()}
                                        </span>
                                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Hits</span>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex flex-col gap-1.5 max-w-[250px]">
                                        {Object.entries(metadata).map(([key, value]) => (
                                            <div key={key} className="flex items-center gap-2 overflow-hidden bg-white border border-slate-100 px-2 py-1 rounded-md">
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter flex-shrink-0 border-r border-slate-100 pr-2">
                                                    {key.replace('cf', '').replace(/([A-Z])/g, ' $1').trim()}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-600 truncate">{String(value)}</span>
                                            </div>
                                        ))}
                                        <div className="text-[9px] text-slate-400 font-mono truncate px-1 mt-0.5">
                                            ID: {log.ruleId.slice(0, 8)}...
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
