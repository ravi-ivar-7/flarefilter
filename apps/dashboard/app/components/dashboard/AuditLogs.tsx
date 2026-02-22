import { LogsTable } from "./LogsTable";
import { DateRangePicker, type DateRange } from "~/components/shared/DateRangePicker";

interface AuditLogsProps {
    orgName: string;
    dateRange: DateRange;
    onDateRangeChange: (v: DateRange) => void;
    isLoading?: boolean;
    recentAttacks: any[];
}

export function AuditLogs({
    orgName,
    dateRange,
    onDateRangeChange,
    isLoading,
    recentAttacks
}: AuditLogsProps) {
    return (
        <div className="space-y-6">
            <header className="sticky top-0 z-30 flex items-center justify-between bg-white/95 backdrop-blur-md border-b border-slate-200/60 -mx-6 px-6 py-4 mb-8">
                <div className="flex-1" />

                <div className="flex items-center gap-3">
                    <DateRangePicker
                        value={dateRange}
                        onChange={onDateRangeChange}
                        isLoading={isLoading}
                        liveLabel="Live Logs"
                    />
                </div>
            </header>

            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight uppercase">Security Events</h2>
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-tight opacity-70">Viewing latest 100 actions across all zones</p>
                </div>
            </div>

            <LogsTable logs={recentAttacks} />
        </div>
    );
}
