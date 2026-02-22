export function LogsTable({ logs }: { logs: any[] }) {
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
            <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center shadow-sm">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4 border border-slate-100">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
                    </svg>
                </div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">No logs available</h3>
                <p className="text-xs text-slate-500 mt-1">Audit logs will appear here as soon as rules start mitigating threats.</p>
            </div>
        );
    }

    return (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                    <tr>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Timestamp</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">IP Address</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Action</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Mitigated</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Details</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {logs.map((log) => {
                        const metadata = log.metadata ? JSON.parse(log.metadata) : {};
                        const date = new Date(log.blockedAt);
                        return (
                            <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="text-xs font-bold text-slate-700">{formatDate(date)}</div>
                                    <div className="text-[10px] text-slate-400 font-medium">{formatDateFull(date)}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="font-mono text-xs font-black text-slate-900 bg-white border border-slate-200 px-2 py-1 rounded shadow-sm group-hover:border-indigo-200 transition-colors">
                                        {log.ip}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                        <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                                            {log.actionTaken.replace('_', ' ')}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-sm font-black text-slate-900">{log.requestCount.toLocaleString()}</span>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Hits</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1.5 max-w-[200px]">
                                        {Object.entries(metadata).map(([key, value]) => (
                                            <div key={key} className="flex items-center gap-2 overflow-hidden">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter flex-shrink-0 min-w-[40px] border-r border-slate-100 pr-2">
                                                    {key.replace('cf', '').replace(/([A-Z])/g, ' $1').trim()}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-600 truncate">{String(value)}</span>
                                            </div>
                                        ))}
                                        <div className="text-[9px] text-slate-300 font-mono truncate pt-1 border-t border-slate-50">
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
