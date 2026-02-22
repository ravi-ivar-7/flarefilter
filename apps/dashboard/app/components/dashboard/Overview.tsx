import { ConnectedAccounts } from "./ConnectedAccounts";
import { MetricsGrid } from "./MetricsGrid";
import { ZonesList } from "./ZonesList";
import { DateRangePicker, type DateRange } from "~/components/shared/DateRangePicker";
import { RecentBlocks } from "./RecentBlocks";

interface OverviewProps {
    orgName: string;
    dateRange: any;
    onDateRangeChange: (v: any) => void;
    isLoading?: boolean;
    accounts: any[];
    zones: any[];
    rules: any[];
    recentAttacks: any[];
    totalBlocks: number;
    onAddAccount: () => void;
    onAddZone: () => void;
    onAddRule: (zoneId: string) => void;
    error?: string;
}

export function Overview({
    orgName,
    dateRange,
    onDateRangeChange,
    isLoading,
    accounts,
    zones,
    rules,
    recentAttacks,
    totalBlocks,
    onAddAccount,
    onAddZone,
    onAddRule,
    error
}: OverviewProps) {
    return (
        <>
            <header className="sticky top-0 z-30 flex items-center justify-end bg-white/95 backdrop-blur-md border-b border-slate-200/60 -mx-6 px-4 sm:px-6 py-3 sm:py-4 mb-8">
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                    <div className="w-full sm:w-auto min-w-[220px]">
                        <DateRangePicker
                            value={dateRange}
                            onChange={onDateRangeChange}
                            isLoading={isLoading}
                            liveLabel="Live Logs"
                        />
                    </div>
                    <div className="hidden sm:block w-px h-6 bg-slate-200 flex-shrink-0" />
                    <button
                        onClick={onAddZone}
                        disabled={accounts.length === 0}
                        className="flex items-center justify-center gap-2 bg-slate-950 text-white text-[11px] font-bold px-4 h-[38px] rounded-xl hover:bg-black transition-all shadow-sm active:scale-95 disabled:opacity-30 whitespace-nowrap"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Add Zone
                    </button>
                </div>
            </header>

            <ConnectedAccounts
                accounts={accounts}
                onAdd={onAddAccount}
                error={error}
            />

            <MetricsGrid
                zonesCount={zones.length}
                totalBlocks={totalBlocks}
                activeRulesCount={rules.filter((r: any) => r.isActive).length}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <ZonesList
                    zones={zones}
                    accounts={accounts}
                    rules={rules}
                    onAddZone={onAddZone}
                    onAddRule={onAddRule}
                />
                <RecentBlocks attacks={recentAttacks} />
            </div>
        </>
    );
}
