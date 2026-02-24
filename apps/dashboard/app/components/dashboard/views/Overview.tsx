import { ConnectedAccounts } from "../widgets/ConnectedAccounts";
import { MetricsGrid } from "../widgets/MetricsGrid";
import { ZonesList } from "../widgets/ZonesList";
import { DateRangePicker, type DateRange } from "~/components/shared/DateRangePicker";
import { RecentActions } from "../widgets/RecentActions";

interface OverviewProps {
    orgName: string;
    dateRange: any;
    onDateRangeChange: (v: any) => void;
    isLoading?: boolean;
    accounts: any[];
    zones: any[];
    rules: any[];
    recentActions: any[];
    totalBlocks: number;
    limit: number;
    onLimitChange: (v: number) => void;
    onRefresh: () => void;
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
    recentActions,
    totalBlocks,
    limit,
    onLimitChange,
    onRefresh,
    onAddAccount,
    onAddZone,
    onAddRule,
    error
}: OverviewProps) {
    return (
        <div className="flex flex-col gap-4 sm:gap-6">
            <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/60 px-3 sm:px-4 py-3 flex flex-row flex-wrap gap-2 items-center w-full">

                {/* Main controls (pushed left) */}
                <div className="shrink-0 flex items-center">
                    <DateRangePicker
                        value={dateRange}
                        onChange={onDateRangeChange}
                        isLoading={isLoading}
                        liveLabel="Live Logs"
                        align="left"
                    />
                </div>

                {/* Add Zone (Push to right) */}
                <button
                    onClick={onAddZone}
                    disabled={accounts.length === 0}
                    className="ml-auto flex items-center justify-center gap-1.5 bg-slate-950 text-white text-[10px] font-bold px-3 h-[34px] rounded-md hover:bg-black transition-all shadow-sm active:scale-95 disabled:opacity-30 whitespace-nowrap"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add Zone
                </button>
            </header>

            <div className="px-3 sm:px-4 flex flex-col gap-6 w-full pb-8">
                <ConnectedAccounts
                    accounts={accounts}
                    onAdd={onAddAccount}
                    error={error}
                />

                <MetricsGrid
                    zonesCount={zones.length}
                    totalBlocks={totalBlocks}
                    activeRulesCount={rules.filter((r: any) => r.isActive).length}
                    rangeLabel={dateRange.type === "relative" ? `Last ${dateRange.relativeValue}` : "Custom Range"}
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <ZonesList
                        zones={zones}
                        accounts={accounts}
                        rules={rules}
                        onAddZone={onAddZone}
                        onAddRule={onAddRule}
                    />
                    <div className="relative w-full h-full min-h-[400px]">
                        <div className="absolute inset-0">
                            <RecentActions actions={recentActions} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
