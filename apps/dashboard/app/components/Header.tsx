import { Link, useNavigate } from "react-router";
import { authClient } from "~/lib/auth-client";
import { useState, useRef, useEffect } from "react";

interface HeaderProps {
    onToggleSidebar?: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
    const { data: session, isPending } = authClient.useSession();
    const { data: activeOrg } = authClient.useActiveOrganization();
    const { data: orgs } = authClient.useListOrganizations();
    const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
    const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false);
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
    const navigate = useNavigate();
    const userDropdownRef = useRef<HTMLDivElement>(null);

    const handleSignOut = async () => {
        await authClient.signOut({
            fetchOptions: { onSuccess: () => navigate("/") }
        });
    };

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
                setIsUserDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <>
            <header className="w-full border-b border-indigo-100/60 bg-gradient-to-br from-white to-indigo-50/40 backdrop-blur-xl sticky top-0 z-40 flex-shrink-0 h-[64px]">
                <div className="h-full px-4 sm:px-8 lg:px-12 flex items-center justify-between">

                    <div className="flex items-center md:hidden w-10">
                        {onToggleSidebar && (
                            <button
                                onClick={onToggleSidebar}
                                className="p-2 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-emerald-600 transition-all"
                                aria-label="Toggle navigation"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                        )}
                    </div>

                    <div className="flex-1 flex justify-center md:justify-start">
                        {session?.user && (
                            <OrgSwitcher
                                activeOrg={activeOrg}
                                orgs={orgs || []}
                                isDropdownOpen={isOrgDropdownOpen}
                                setIsDropdownOpen={setIsOrgDropdownOpen}
                                onCreateOrg={() => setIsCreateOrgOpen(true)}
                            />
                        )}
                    </div>

                    <div className="flex items-center justify-end w-10 md:w-auto ml-3" ref={userDropdownRef}>
                        {isPending ? (
                            <div className="w-8 h-8 bg-slate-50 animate-pulse rounded-full border border-slate-100" />
                        ) : session?.user ? (
                            <div className="relative">
                                <button
                                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                                    className="flex items-center gap-2 p-1 lg:pl-1.5 lg:pr-3 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group"
                                >
                                    <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white font-black text-xs shadow-lg shadow-emerald-100 group-hover:scale-105 transition-transform">
                                        {session.user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="hidden lg:flex flex-col items-start leading-tight">
                                        <span className="text-sm font-bold text-black">{session.user.name}</span>
                                        <span className="text-[10px] font-medium text-black/60">{session.user.email}</span>
                                    </div>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" className={`text-black/30 transition-transform hidden md:block ${isUserDropdownOpen ? 'rotate-180' : ''}`}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                    </svg>
                                </button>

                                {isUserDropdownOpen && (
                                    <div className="absolute right-0 mt-3 w-64 bg-gradient-to-br from-white to-blue-50 border border-blue-100 shadow-[0_20px_50px_rgba(0,0,0,0.12)] rounded-2xl overflow-hidden z-50 py-2.5 animate-in fade-in zoom-in-95 duration-200">
                                        <div className="px-6 py-4 border-b border-blue-50/50 mb-2">
                                            <p className="text-[11px] font-bold text-blue-400 mb-1.5">Active Session</p>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-950 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                                    {session.user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <p className="text-sm font-bold text-slate-900 truncate">{session.user.name}</p>
                                                    <p className="text-xs font-medium text-slate-400 truncate">{session.user.email}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="px-3 space-y-1">
                                            <Link
                                                to="/profile"
                                                onClick={() => setIsUserDropdownOpen(false)}
                                                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 hover:text-blue-600 hover:bg-blue-50/50 transition-all rounded-xl border border-transparent hover:border-blue-100"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                                                </svg>
                                                View Profile
                                            </Link>

                                            <button
                                                onClick={handleSignOut}
                                                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-white bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-100 transition-all rounded-xl active:scale-95 mt-2"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                                                </svg>
                                                Sign Out
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Link to="/auth?mode=login" className="text-sm font-bold text-black hover:text-blue-600 transition-colors px-2">Log In</Link>
                                <Link to="/auth?mode=register" className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-bold px-5 py-2.5 rounded-2xl hover:brightness-110 transition-all shadow-lg shadow-blue-100">Sign Up</Link>
                            </div>
                        )}
                    </div>
                </div>
            </header>
            {isCreateOrgOpen && (
                <CreateOrgModal onClose={() => setIsCreateOrgOpen(false)} />
            )}
        </>
    );
}

function OrgSwitcher({ activeOrg, orgs, isDropdownOpen, setIsDropdownOpen, onCreateOrg }: {
    activeOrg: any;
    orgs: any[];
    isDropdownOpen: boolean;
    setIsDropdownOpen: (v: boolean) => void;
    onCreateOrg: () => void;
}) {
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [setIsDropdownOpen]);

    return (
        <div className="relative flex items-center" ref={dropdownRef}>
            <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 bg-slate-50/80 border border-slate-200 border-r-0 pl-3 pr-2.5 h-[42px] rounded-l-2xl text-[10px] font-bold hover:bg-white hover:border-indigo-200 transition-all max-w-[210px] group shadow-sm bg-gradient-to-r from-slate-50/50 to-white"
            >
                <div className="w-6 h-6 rounded-lg bg-black flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="4" y="4" width="16" height="16" rx="2" />
                        <rect x="9" y="9" width="6" height="6" />
                        <path d="M15 4v16" /><path d="M4 15h16" />
                    </svg>
                </div>
                <div className="flex flex-col items-start min-w-0">
                    <span className="truncate text-black leading-none mb-0.5 text-sm font-bold">{activeOrg?.name || "Workspace"}</span>
                    <span className="text-[10px] text-black/60 font-medium leading-none">Organization</span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" className={`text-black/30 transition-transform ml-1 ${isDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </button>

            <button
                onClick={onCreateOrg}
                className="flex items-center justify-center w-11 h-[42px] bg-white border border-slate-200 rounded-r-2xl text-slate-400 hover:bg-black hover:text-white hover:border-black transition-all active:scale-95 flex-shrink-0 shadow-sm"
                title="Create new organization"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
            </button>

            {isDropdownOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0 mt-3 w-64 bg-gradient-to-br from-white to-indigo-50 border border-indigo-100 shadow-[0_20px_50px_rgba(0,0,0,0.12)] rounded-2xl overflow-hidden z-50 py-1.5 animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-5 py-3 text-[11px] font-bold text-indigo-400 border-b border-indigo-50/50">
                        Switch Workspace
                    </div>
                    {orgs.length === 0 && (
                        <p className="px-5 py-5 text-[10px] font-bold text-slate-400 text-center uppercase">No Active Workspaces</p>
                    )}
                    <div className="max-h-[320px] overflow-y-auto py-1">
                        {orgs.map((org) => (
                            <button
                                key={org.id}
                                onClick={async () => {
                                    await authClient.organization.setActive({ organizationId: org.id });
                                    setIsDropdownOpen(false);
                                    window.location.reload();
                                }}
                                className={`w-full px-5 py-2.5 text-sm text-left flex items-center gap-3.5 hover:bg-slate-50 transition-colors ${activeOrg?.id === org.id ? "text-slate-950 bg-slate-50/50 font-bold" : "text-slate-500 font-medium"}`}
                            >
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-bold flex-shrink-0 shadow-sm ${activeOrg?.id === org.id ? "bg-slate-950 text-white" : "bg-white border border-slate-200 text-slate-400"}`}>
                                    {org.name.charAt(0)}
                                </div>
                                <span className="truncate flex-1">{org.name}</span>
                                {activeOrg?.id === org.id && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function CreateOrgModal({ onClose }: { onClose: () => void }) {
    const [name, setName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const slugify = (str: string) =>
        str.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) return;

        setIsLoading(true);
        setError(null);

        const result = await authClient.organization.create({
            name: trimmed,
            slug: slugify(trimmed),
        });

        if (result.error) {
            setError(result.error.message ?? "Failed to create organization.");
            setIsLoading(false);
            return;
        }

        if (result.data?.id) {
            await authClient.organization.setActive({ organizationId: result.data.id });
        }
        window.location.reload();
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-10 relative border border-white/20 animate-in fade-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-8 right-8 p-2 rounded-2xl text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="flex items-center gap-5 mb-10">
                    <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center flex-shrink-0 shadow-xl shadow-slate-100">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">New Workspace</h2>
                        <p className="text-xs font-semibold text-slate-400">Initialize a professional organization.</p>
                    </div>
                </div>

                <form onSubmit={handleCreate} className="space-y-8">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-3 px-1">Workspace Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => { setName(e.target.value); setError(null); }}
                            placeholder="e.g. FlareFilter Core"
                            className="w-full h-14 px-6 rounded-3xl border border-slate-200 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-slate-950/5 focus:border-slate-950 transition-all bg-slate-50 placeholder:text-slate-300"
                            autoFocus
                            disabled={isLoading}
                        />
                        {name.trim() && (
                            <p className="mt-3 text-[11px] font-bold text-slate-400 px-1 leading-none">
                                Identifier: <span className="text-slate-700">{slugify(name)}</span>
                            </p>
                        )}
                    </div>

                    {error && (
                        <div className="flex items-center gap-3 p-5 bg-rose-50 border border-rose-100 rounded-3xl text-[10px] font-bold text-rose-600">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <div className="flex items-center gap-4 pt-2">
                        <button type="button" onClick={onClose} disabled={isLoading} className="flex-1 h-14 rounded-3xl text-sm font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 transition-colors disabled:opacity-50">
                            Cancel
                        </button>
                        <button type="submit" disabled={isLoading || !name.trim()} className="flex-1 h-14 rounded-3xl text-sm font-bold text-white bg-slate-950 hover:bg-black shadow-xl shadow-slate-100 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center">
                            {isLoading ? "Checking…" : "Create Workspace"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
