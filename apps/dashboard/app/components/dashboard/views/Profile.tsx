import { subtleIndigoCls, subtleNeutralCls, glassCls, sectionLabelCls } from "../ui/shared";

export function Profile({ user, activeOrg, orgs }: { user: any; activeOrg: any; orgs: any[] }) {
    const formatDate = (date: string | number | Date) => {
        if (!date) return "N/A";
        return new Date(date).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Minimalist Header */}
            <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/60 px-4 py-3 flex flex-wrap items-center justify-between w-full gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm transition-colors hover:border-indigo-200 hover:text-indigo-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-sm font-black text-slate-900 tracking-tight leading-none">Settings</h1>
                        <p className="text-[10px] font-bold text-slate-400 tracking-widest mt-1.5 uppercase leading-none">Management & Control</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button className="flex items-center justify-center gap-1.5 bg-slate-950 text-white text-[10px] font-black px-4 h-[36px] rounded-md hover:bg-black transition-all shadow-sm active:scale-95 uppercase tracking-widest">
                        New Organization
                    </button>
                </div>
            </header>

            <div className="px-4 flex flex-col gap-8 w-full pb-12">
                {/* ─── Card 1: User Profile Row ─── */}
                <section className={`${glassCls} overflow-hidden shadow-sm`}>
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-1 h-3 bg-indigo-500 rounded-full" />
                            <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Identity Profile</h2>
                        </div>
                    </div>

                    <div className="p-4 flex flex-col md:flex-row items-center gap-6 md:gap-10">
                        <div className="relative shrink-0">
                            {user.image ? (
                                <img src={user.image} className="w-14 h-14 rounded-md border-2 border-white shadow-md object-cover" alt="" />
                            ) : (
                                <div className="w-14 h-14 rounded-md bg-slate-100 flex items-center justify-center text-slate-800 text-xl font-black border-2 border-white shadow-md">
                                    {user.name?.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>

                        <div className="flex-1 flex flex-wrap items-center gap-x-10 gap-y-4 w-full">
                            <div className="min-w-0">
                                <p className={sectionLabelCls}>Full Identity</p>
                                <p className="text-base font-black text-slate-900 truncate">{user.name}</p>
                            </div>
                            <div className="min-w-0">
                                <p className={sectionLabelCls}>Email System</p>
                                <p className="text-xs font-bold text-slate-600 truncate">{user.email}</p>
                            </div>
                            <div>
                                <p className={sectionLabelCls}>Internal Reference</p>
                                <code className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100 font-mono block w-fit truncate max-w-[120px]">
                                    {user.id}
                                </code>
                            </div>
                            <div className="hidden lg:block">
                                <p className={sectionLabelCls}>Registry Date</p>
                                <p className="text-[11px] font-bold text-slate-700">{formatDate(user.createdAt)}</p>
                            </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-3">
                            <button className="bg-white hover:bg-slate-50 text-slate-900 text-[10px] font-black px-4 py-2.5 rounded-md border border-slate-200 transition-all shadow-sm uppercase tracking-widest">
                                Edit Identity
                            </button>
                        </div>
                    </div>
                </section>

                {/* ─── Card 2: Organization List (Single Row High-Density) ─── */}
                <section className={`${glassCls} overflow-hidden shadow-sm`}>
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-1 h-3 bg-indigo-500 rounded-full" />
                            <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Internal Organizations</h2>
                        </div>
                        <span className="text-[9px] font-black text-indigo-600 bg-indigo-50/50 border border-indigo-100 px-2.5 py-1 rounded-full">{orgs.length} Units</span>
                    </div>

                    <div className="divide-y divide-gray-100">
                        {orgs.map((org) => {
                            const isActive = activeOrg?.id === org.id;

                            return (
                                <div key={org.id} className={`p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-5 transition-colors group ${isActive ? 'bg-indigo-50/10' : 'bg-white hover:bg-slate-50/50'}`}>

                                    {/* Component 1: Branding */}
                                    <div className="flex items-center gap-4 shrink-0 min-w-0 md:w-[25%] lg:w-[20%]">
                                        <div className={`w-10 h-10 rounded-md flex items-center justify-center font-black text-base border shrink-0 transition-all ${isActive ? 'bg-indigo-50 text-indigo-600 border-indigo-200 shadow-sm' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                            {org.logo ? (
                                                <img src={org.logo} alt="" className="w-7 h-7 object-contain" />
                                            ) : (
                                                org.name?.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div className="min-w-0 flex flex-col gap-0.5">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm font-black text-slate-900 truncate leading-none">{org.name}</h3>
                                                {isActive && (
                                                    <span className="flex items-center gap-1 text-[8px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded uppercase tracking-widest">
                                                        <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                                        Active
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[10px] font-bold text-indigo-500 tracking-widest leading-none uppercase">/{org.slug || 'root'}</p>
                                        </div>
                                    </div>

                                    {/* Component 2: Middle Technical Pipeline (Using Shared Tokens) */}
                                    <div className="flex-1 flex flex-wrap items-center gap-x-8 gap-y-4">
                                        <div className="min-w-0">
                                            <p className={sectionLabelCls.replace('mb-3', 'mb-1')}>Internal UUID</p>
                                            <code className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 font-mono block w-fit truncate max-w-[100px] hover:max-w-none transition-all">
                                                {org.id}
                                            </code>
                                        </div>

                                        <div className="hidden sm:block">
                                            <p className={sectionLabelCls.replace('mb-3', 'mb-1')}>Registry Date</p>
                                            <p className="text-[11px] font-bold text-slate-600 whitespace-nowrap">{formatDate(org.createdAt)}</p>
                                        </div>

                                        <div>
                                            <p className={sectionLabelCls.replace('mb-3', 'mb-1')}>Access Level</p>
                                            <span className="bg-indigo-50/50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100/50 text-[9px] font-black uppercase tracking-widest">
                                                {org.role || 'Owner'}
                                            </span>
                                        </div>

                                        {org.metadata && JSON.parse(org.metadata) && Object.keys(JSON.parse(org.metadata)).length > 0 && (
                                            <div>
                                                <p className={sectionLabelCls.replace('mb-3', 'mb-1')}>Registry Metadata</p>
                                                <div className="flex items-center gap-1 cursor-help group/meta relative">
                                                    <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 text-[8px] font-black uppercase tracking-widest">JSON DATA</span>
                                                    <div className="absolute bottom-full left-0 mb-2 hidden group-hover/meta:block z-50">
                                                        <div className="bg-slate-900 text-indigo-100 text-[9px] font-mono p-3 rounded-md border border-slate-800 shadow-2xl whitespace-pre max-w-xs overflow-hidden leading-relaxed">
                                                            {JSON.stringify(JSON.parse(org.metadata), null, 4)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Component 3: Action Actions */}
                                    <div className="shrink-0 flex items-center md:gap-4 self-end md:self-center">
                                        <button className="flex items-center gap-1.5 text-[9px] font-black text-slate-600 uppercase tracking-widest hover:text-indigo-600 hover:bg-white hover:border-indigo-200 bg-slate-50 px-4 py-2 rounded-md border border-slate-200 transition-all shadow-sm">
                                            Configure Unit
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </div>
        </div>
    );
}
