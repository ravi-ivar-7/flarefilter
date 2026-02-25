import { useState } from "react";
import { useFetcher } from "react-router";
import { subtleIndigoCls, subtleNeutralCls, glassCls, sectionLabelCls } from "../ui/shared";

export function Profile({ user, activeOrg, orgs }: { user: any; activeOrg: any; orgs: any[] }) {
    const fetcher = useFetcher();
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState(user.name || "");
    const [editingOrgId, setEditingOrgId] = useState<string | null>(null);
    const [orgNameInput, setOrgNameInput] = useState("");

    const formatDate = (date: string | number | Date) => {
        if (!date) return "N/A";
        return new Date(date).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const handleDeleteOrg = (orgId: string, name: string) => {
        if (!confirm(`Are you sure you want to delete organization "${name}"? This action cannot be undone.`)) return;
        const fd = new FormData();
        fd.append("intent", "delete_organization");
        fd.append("organizationId", orgId);
        fetcher.submit(fd, { method: "post" });
    };

    const handleLeaveOrg = (orgId: string, name: string) => {
        if (!confirm(`Are you sure you want to leave organization "${name}"? You will lose access to all its resources.`)) return;
        const fd = new FormData();
        fd.append("intent", "leave_organization");
        fd.append("organizationId", orgId);
        fetcher.submit(fd, { method: "post" });
    };

    const handleUpdateOrg = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingOrgId) return;
        const fd = new FormData();
        fd.append("intent", "update_organization");
        fd.append("organizationId", editingOrgId);
        fd.append("name", orgNameInput);
        fetcher.submit(fd, { method: "post" });
        setEditingOrgId(null);
        setOrgNameInput("");
    };

    const handleUpdateName = () => {
        const fd = new FormData();
        fd.append("intent", "update_profile");
        fd.append("name", newName);
        fetcher.submit(fd, { method: "post" });
        setIsEditingName(false);
    };

    return (
        <div className="flex flex-col gap-6 mt-10">


            <div className="px-4 flex flex-col gap-8 w-full pb-12">
                {/* ─── Card 1: User Profile Row ─── */}
                <section className={`${glassCls} overflow-hidden shadow-sm`}>
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-1 h-3 bg-indigo-500 rounded-full" />
                            <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Profile</h2>
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
                                <p className={sectionLabelCls}>Name</p>
                                {isEditingName ? (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            className="text-sm font-bold border border-slate-200 rounded px-2 py-1 focus:ring-1 focus:ring-indigo-500 outline-none"
                                        />
                                        <button onClick={handleUpdateName} className="text-[10px] font-black text-emerald-600 uppercase">Save</button>
                                        <button onClick={() => setIsEditingName(false)} className="text-[10px] font-black text-slate-400 uppercase">Cancel</button>
                                    </div>
                                ) : (
                                    <p className="text-sm font-black text-slate-900 truncate">{user.name}</p>
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className={sectionLabelCls}>Email</p>
                                <p className="text-xs font-bold text-slate-600 truncate">{user.email}</p>
                            </div>
                            <div className="hidden lg:block">
                                <p className={sectionLabelCls}>Created On</p>
                                <p className="text-[11px] font-bold text-slate-700">{formatDate(user.createdAt)}</p>
                            </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-3">
                            <button
                                onClick={() => setIsEditingName(!isEditingName)}
                                className="bg-white hover:bg-slate-50 text-slate-900 text-[10px] font-black px-4 py-2.5 rounded-md border border-slate-200 transition-all shadow-sm uppercase tracking-widest"
                            >
                                {isEditingName ? "Discard Changes" : "Edit"}
                            </button>
                        </div>
                    </div>
                </section>

                {/* ─── Card 2: Organization List (Single Row High-Density) ─── */}
                <section className={`${glassCls} overflow-hidden shadow-sm`}>
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-1 h-3 bg-indigo-500 rounded-full" />
                            <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Organizations</h2>
                        </div>
                        <span className="text-[9px] font-black text-indigo-600 bg-indigo-50/50 border border-indigo-100 px-2.5 py-1 rounded-full">{orgs.length} Organizations</span>
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
                                                <h3 className="text-xs font-black text-slate-900 truncate leading-none">{org.name}</h3>
                                                {isActive && (
                                                    <span className="flex items-center gap-1 text-[8px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded uppercase tracking-widest">
                                                        <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                                        Active
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[10px] font-bold text-indigo-500 tracking-widest leading-none">/{org.slug || 'root'}</p>
                                        </div>
                                    </div>

                                    {/* Component 2: Middle Technical Pipeline */}
                                    <div className="flex-1 flex flex-wrap items-center gap-x-8 gap-y-4">

                                        <div className="hidden sm:block">
                                            <p className={sectionLabelCls.replace('mb-3', 'mb-1')}>Created On</p>
                                            <p className="text-[10px] font-bold text-slate-600 whitespace-nowrap">{formatDate(org.createdAt)}</p>
                                        </div>

                                        <div>
                                            <p className={sectionLabelCls.replace('mb-3', 'mb-1')}>Access Level</p>
                                            <span className={`px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-widest ${org.role === 'owner'
                                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                : org.role === 'admin'
                                                    ? 'bg-violet-50 text-violet-700 border-violet-200'
                                                    : 'bg-slate-50 text-slate-600 border-slate-200'
                                                }`}>
                                                {org.role || 'member'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Component 3: Actions */}
                                    <div className="shrink-0 flex items-center gap-2 self-end md:self-center">

                                        {/* OWNER: can rename + delete (but cannot leave — would orphan org) */}
                                        {org.role === 'owner' && (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        setEditingOrgId(org.id);
                                                        setOrgNameInput(org.name);
                                                    }}
                                                    className="flex items-center gap-1.5 text-[9px] font-black text-slate-600 uppercase tracking-widest hover:bg-white hover:border-slate-300 bg-slate-50 px-4 py-2 rounded-md border border-slate-200 transition-all shadow-sm"
                                                >
                                                    Rename
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteOrg(org.id, org.name)}
                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all"
                                                    title="Delete Organization"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6l-1 14H6L5 6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                                </button>
                                            </>
                                        )}

                                        {/* ADMIN: can rename + leave (cannot delete, but can update) */}
                                        {org.role === 'admin' && (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        setEditingOrgId(org.id);
                                                        setOrgNameInput(org.name);
                                                    }}
                                                    className="flex items-center gap-1.5 text-[9px] font-black text-slate-600 uppercase tracking-widest hover:bg-white hover:border-slate-300 bg-slate-50 px-4 py-2 rounded-md border border-slate-200 transition-all shadow-sm"
                                                >
                                                    Rename
                                                </button>
                                                <button
                                                    onClick={() => handleLeaveOrg(org.id, org.name)}
                                                    className="flex items-center gap-1.5 text-[9px] font-black text-amber-600 uppercase tracking-widest hover:bg-amber-50 bg-white px-4 py-2 rounded-md border border-amber-100 transition-all shadow-sm"
                                                >
                                                    Leave
                                                </button>
                                            </>
                                        )}

                                        {/* MEMBER: can only leave */}
                                        {org.role !== 'owner' && org.role !== 'admin' && (
                                            <button
                                                onClick={() => handleLeaveOrg(org.id, org.name)}
                                                className="flex items-center gap-1.5 text-[9px] font-black text-rose-600 uppercase tracking-widest hover:bg-rose-50 bg-white px-4 py-2 rounded-md border border-rose-100 transition-all shadow-sm"
                                            >
                                                Leave
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </div>

            {/* Rename Modal */}
            {editingOrgId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">
                                Rename Organization
                            </h3>
                            <button onClick={() => setEditingOrgId(null)} className="text-slate-400 hover:text-slate-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleUpdateOrg} className="p-6 flex flex-col gap-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Organization Name</label>
                                <input
                                    autoFocus
                                    type="text"
                                    required
                                    value={orgNameInput}
                                    onChange={(e) => setOrgNameInput(e.target.value)}
                                    placeholder="e.g. Acme Corp"
                                    className="w-full text-sm font-bold border border-slate-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingOrgId(null)}
                                    className="px-4 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-50 rounded-md transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest rounded-md hover:bg-black transition-all shadow-md active:scale-95"
                                >
                                    Update Organization
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

