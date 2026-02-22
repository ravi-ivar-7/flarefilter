import { useState, useRef, useEffect, useMemo } from "react";
import { useFetcher } from "react-router";
import { LogsTable } from "./LogsTable";
import { DateRangePicker, type DateRange } from "~/components/shared/DateRangePicker";

const inputCls = "block w-full rounded-xl border-slate-200 text-sm focus:border-indigo-500 focus:ring-indigo-500 bg-slate-50 shadow-sm transition-colors text-slate-900";

interface AuditLogsProps {
    zones: any[];
    orgName: string;
    dateRange: DateRange;
    onDateRangeChange: (v: DateRange) => void;
    isLoading?: boolean;
    recentAttacks: any[];
}

export function AuditLogs({
    zones,
    orgName,
    dateRange,
    onDateRangeChange,
    isLoading,
    recentAttacks
}: AuditLogsProps) {
    const fetcher = useFetcher();
    const [selectedZoneId, setSelectedZoneId] = useState("");
    const [limit, setLimit] = useState(100);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [activeFilters, setActiveFilters] = useState<string[]>([]);
    const filterRef = useRef<HTMLDivElement>(null);
    const [results, setResults] = useState<any[]>(recentAttacks || []);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setIsFilterModalOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const windowSeconds = useMemo(() => {
        if (dateRange.type === "relative") {
            const val = dateRange.relativeValue || "30m";
            const num = parseInt(val);
            const unit = val.slice(-1);
            if (unit === "m") return num * 60;
            if (unit === "h") return num * 3600;
            if (unit === "d") return num * 86400;
            return 1800;
        } else if (dateRange.start && dateRange.end) {
            return Math.floor((dateRange.end.getTime() - dateRange.start.getTime()) / 1000);
        }
        return 3600;
    }, [dateRange]);

    const handleFetch = () => {
        const formData = new FormData();
        formData.append("type", "fetch-logs");
        if (selectedZoneId) formData.append("zoneId", selectedZoneId);
        if (activeFilters.length > 0) formData.append("actions", activeFilters.join(","));
        formData.append("windowSeconds", windowSeconds.toString());
        formData.append("limit", limit.toString());
        fetcher.submit(formData, { method: "post", action: "/api/logs" });
    };

    useEffect(() => {
        if (fetcher.data && Array.isArray(fetcher.data)) {
            setResults(fetcher.data);
        }
    }, [fetcher.data]);

    const isFetching = fetcher.state !== "idle" || isLoading;

    const displayedResults = useMemo(() => {
        if (!searchQuery.trim()) return results;
        const q = searchQuery.toLowerCase();
        return results.filter(log =>
            log.ip.toLowerCase().includes(q) ||
            log.actionTaken.toLowerCase().includes(q) ||
            log.ruleId.toLowerCase().includes(q) ||
            (log.metadata && log.metadata.toLowerCase().includes(q))
        );
    }, [results, searchQuery]);

    return (
        <div className="flex flex-col gap-4 sm:gap-6">
            <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/60 px-3 sm:px-4 py-3 flex flex-row flex-wrap gap-2 items-center w-full">

                {/* Filters */}
                <div className="relative shrink-0" ref={filterRef}>
                    <button
                        onClick={() => setIsFilterModalOpen(!isFilterModalOpen)}
                        className="flex items-center justify-center gap-2 px-3 h-[34px] text-[11px] font-bold bg-white border border-slate-200 rounded-xl shadow-sm text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
                    >
                        <svg className="w-3.5 h-3.5 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                        </svg>
                        <span>Action</span>
                        {activeFilters.length > 0 && (
                            <span className="bg-slate-100 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded-md text-[9px] font-black tabular-nums">{activeFilters.length}</span>
                        )}
                    </button>
                    {isFilterModalOpen && (
                        <div className="absolute top-full mt-2 left-0 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 flex flex-col p-2 gap-1 animate-in fade-in zoom-in-95 duration-100">
                            <div className="px-3 py-2 border-b border-slate-100 mb-1">
                                <div className="text-[10px] font-black uppercase tracking-widest">Filter Actions</div>
                                <div className="text-[9px] font-medium text-slate-800 leading-tight mt-0.5 italic">Filter by rule action taken</div>
                            </div>
                            {[
                                { id: "IP_BLOCKED", label: "Block", desc: "Requests that were blocked" },
                                { id: "MANAGED_CHALLENGE", label: "Managed Challenge", desc: "Interactive challenge" },
                                { id: "JS_CHALLENGE", label: "JS Challenge", desc: "Invisible challenge" },
                                { id: "LOG", label: "Log", desc: "Action logged only" }
                            ].map(opt => {
                                const isChecked = activeFilters.includes(opt.id);
                                return (
                                    <label key={opt.id} className={`flex items-start gap-3 px-3 py-2 border rounded-xl transition-all cursor-pointer ${isChecked ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'border-transparent hover:bg-slate-50'}`}>
                                        <div className="pt-0.5">
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={(e) => {
                                                    if (e.target.checked) setActiveFilters([...activeFilters, opt.id]);
                                                    else setActiveFilters(activeFilters.filter(f => f !== opt.id));
                                                }}
                                                className="w-4 h-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-600 transition-all cursor-pointer"
                                            />
                                        </div>
                                        <div className="flex flex-col text-left">
                                            <span className={`flex items-center text-[12px] font-bold ${isChecked ? 'text-indigo-900' : 'text-slate-700'}`}>
                                                {opt.label}
                                            </span>
                                            <span className={`text-[10px] font-medium leading-tight mt-0.5 ${isChecked ? 'text-indigo-600/70' : 'text-slate-400'}`}>{opt.desc}</span>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Zone select (Matches IPs analyzer exactly) */}
                <select
                    value={selectedZoneId}
                    onChange={(e) => setSelectedZoneId(e.target.value)}
                    className={`block w-auto max-w-[180px] h-[34px] px-2 text-[10px] font-bold bg-white border-slate-200 min-w-[100px] shadow-sm rounded-xl focus:ring-slate-950 shrink-0`}
                >
                    <option value="">All Zones</option>
                    {zones?.map(z => (
                        <option key={z.id} value={z.id}>{z.name}</option>
                    ))}
                </select>

                {/* Search */}
                <div className="relative shrink-0 w-full sm:w-[220px] rounded-xl border border-slate-200 ">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                        <svg className="w-3.5 h-3.5 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search IP, Rule ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`${inputCls} h-[34px] pl-8 pr-3 text-[11px] font-bold bg-white/50 border-slate-200 shadow-sm rounded-xl focus:ring-slate-950 placeholder:text-slate-400 placeholder:font-medium`}
                    />
                </div>

                <div className="w-px h-6 bg-slate-200 shrink-0 hidden sm:block" />

                {/* Date picker */}
                <div className="shrink-0">
                    <DateRangePicker
                        value={dateRange}
                        onChange={onDateRangeChange}
                        isLoading={isFetching}
                        liveLabel="Live Logs"
                    />
                </div>

                {/* Fetch + Limit — right side */}
                <div className="flex items-center rounded-xl overflow-hidden border border-slate-900 shadow-sm ml-auto shrink-0">
                    <button
                        onClick={handleFetch}
                        disabled={isFetching}
                        className="flex items-center justify-center gap-1.5 bg-slate-950 hover:bg-black disabled:opacity-30 disabled:cursor-not-allowed text-white text-[10px] font-bold px-3 h-[34px] transition-colors active:scale-95 whitespace-nowrap"
                    >
                        {isFetching ? (
                            <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                            </svg>
                        )}
                        Fetch
                    </button>
                    <div className="relative bg-slate-50 border-l border-slate-900/10 h-[34px] flex items-center">
                        <input
                            type="number"
                            min={1}
                            max={100}
                            value={limit}
                            onChange={(e) => setLimit(Number(e.target.value))}
                            className="h-full pl-2.5 pr-8 text-[11px] font-bold bg-transparent border-0 shadow-none [appearance:textfield] focus:ring-0 text-slate-900 focus:outline-none"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-black text-slate-400 uppercase pointer-events-none">
                            MAX
                        </span>
                    </div>
                </div>
            </header>

            <div className="w-full flex-1 flex flex-col">
                <div className="flex-1 min-h-[500px] w-full">
                    <LogsTable logs={displayedResults} zones={zones} />
                </div>
            </div>
        </div>
    );
}
