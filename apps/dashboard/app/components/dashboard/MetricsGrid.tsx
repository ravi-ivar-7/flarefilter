export function MetricsGrid({ zonesCount, totalBlocks }: { zonesCount: number; totalBlocks: number }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
            <div className="bg-gradient-to-br from-white to-indigo-50/50 border border-indigo-100 p-6 rounded-2xl shadow-sm relative overflow-hidden group hover:border-indigo-300 transition-colors">
                <p className="text-sm font-bold text-black uppercase tracking-tight opacity-70">Total Zones Protected</p>
                <p className="text-4xl font-black mt-2 text-indigo-600 tracking-tight">{zonesCount}</p>
            </div>

            <div className="bg-gradient-to-br from-white to-rose-50/50 border border-rose-100 p-6 rounded-2xl shadow-sm relative overflow-hidden group hover:border-rose-300 transition-colors">
                <p className="text-sm font-bold text-slate-900 uppercase tracking-tight opacity-70">Malicious IPs Blocked</p>
                <p className="text-4xl font-black mt-2 text-rose-600 tracking-tight">{totalBlocks}</p>
            </div>

            <div className="bg-gradient-to-br from-white to-emerald-50/50 border border-emerald-100 p-6 rounded-2xl shadow-sm relative overflow-hidden group hover:border-emerald-300 transition-colors">
                <p className="text-sm font-bold text-slate-900 uppercase tracking-tight opacity-70">Worker Status</p>
                <div className="flex items-center mt-2.5 gap-2">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                    </span>
                    <span className="text-lg font-black text-emerald-600 tracking-tight">Active Edge</span>
                </div>
            </div>
        </div>
    );
}
