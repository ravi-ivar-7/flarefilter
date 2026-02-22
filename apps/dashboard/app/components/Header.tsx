import { Link, useLocation, useNavigate } from "react-router";
import { authClient } from "~/lib/auth-client";
import { useState, useRef, useEffect } from "react";
import { Logo } from "~/components/Logo";

interface HeaderProps {
    onToggleSidebar?: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
    const { data: session, isPending } = authClient.useSession();
    const { data: activeOrg } = authClient.useActiveOrganization();
    const { data: orgs } = authClient.useListOrganizations();
    const [isUserOpen, setIsUserOpen] = useState(false);
    const [isOrgOpen, setIsOrgOpen] = useState(false);
    const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false);
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const userRef = useRef<HTMLDivElement>(null);
    const orgRef = useRef<HTMLDivElement>(null);

    const isHome = location.pathname === "/";
    const isDashboard = location.pathname === "/dashboard";
    const isDashboardPath = location.pathname.startsWith("/dashboard") || location.pathname.startsWith("/settings");

    const searchParams = new URLSearchParams(location.search);
    const activeTab = searchParams.get("tab") || "overview";

    let pageTitle = "";
    let pageSubtext = "";

    if (isDashboard) {
        if (activeTab === "overview") {
            pageTitle = "Overview";
            pageSubtext = "Monitor and manage your edge defenses in real-time.";
        } else if (activeTab === "ips") {
            pageTitle = "IPs Analyzer";
            pageSubtext = "Analyze traffic patterns by IP, country, ASN and more. Take action on selected results.";
        } else if (activeTab === "logs") {
            pageTitle = "Audit Logs";
            pageSubtext = "Complete history of all mitigations and security actions.";
        }
    } else if (location.pathname.startsWith("/settings")) {
        pageTitle = "Settings";
        pageSubtext = "Manage your organization and account preferences.";
    }

    const handleSignOut = async () => {
        await authClient.signOut({ fetchOptions: { onSuccess: () => navigate("/") } });
        setIsUserOpen(false);
    };

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (userRef.current && !userRef.current.contains(e.target as Node)) setIsUserOpen(false);
            if (orgRef.current && !orgRef.current.contains(e.target as Node)) setIsOrgOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => setIsMobileOpen(false), [location.pathname]);

    return (
        <>
            {/* ── Header bar ─────────────────────────────────────────── */}
            <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 flex-shrink-0">
                <div className={`${isDashboardPath ? "px-4 md:px-6" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"} h-16 flex items-center text-slate-900`}>

                    {/* 📱 MOBILE NAVIGATION (Order: Toggle, Logo+Name, Dashboard Link, Spacer, Org, User) */}
                    <div className="flex md:hidden items-center gap-2 w-full">
                        {onToggleSidebar && (
                            <button
                                onClick={onToggleSidebar}
                                className="p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-50 active:bg-slate-100 transition-colors"
                                aria-label="Toggle Sidebar"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" /></svg>
                            </button>
                        )}

                        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
                            <Logo variant="icon" size={26} animate={false} />
                            <span className="text-sm font-black tracking-tight text-slate-900">FlareFilter</span>
                        </Link>

                        {!isDashboardPath && session?.user && (
                            <>
                                <div className="ml-3 h-5 w-px bg-slate-200 flex-shrink-0" />
                                <Link
                                    to="/dashboard"
                                    className="ml-1 h-9 px-4 flex items-center font-semibold bg-slate-50/50 hover:bg-slate-100 active:scale-95 rounded-lg transition-all flex-shrink-0"
                                >
                                    Dashboard
                                </Link>
                            </>
                        )}

                        <div className="flex-1" />

                        {session?.user && (
                            <div className="flex items-center min-w-0" ref={orgRef}>
                                <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 overflow-hidden min-w-0">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsOrgOpen(!isOrgOpen);
                                        }}
                                        className="flex-1 flex items-center gap-1.5 h-9 px-2 text-[11px] font-bold text-slate-700 min-w-0 hover:bg-white transition-colors"
                                    >
                                        <span className="truncate">{activeOrg?.name || "Organization"}</span>
                                        <Chevron open={isOrgOpen} />
                                    </button>

                                    <div className="w-px h-4 bg-slate-200 flex-shrink-0" />

                                    <button
                                        onClick={() => setIsCreateOrgOpen(true)}
                                        className="w-8 h-9 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-white transition-colors flex-shrink-0"
                                        aria-label="New Organization"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                    </button>
                                </div>

                                {isOrgOpen && (
                                    <Dropdown className="right-0 w-60 mt-2">
                                        <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Switch Organization</div>
                                        <div className="py-1 max-h-60 overflow-y-auto">
                                            {(orgs || []).map((org: any) => (
                                                <div key={org.id} className="group/item flex items-center px-4 py-1.5 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                                                    <button
                                                        onClick={async () => {
                                                            await authClient.organization.setActive({ organizationId: org.id });
                                                            setIsOrgOpen(false);
                                                            window.location.reload();
                                                        }}
                                                        className="flex-1 flex items-center gap-3 py-1.5 text-sm min-w-0"
                                                    >
                                                        <OrgAvatar name={org.name} size="sm" active={activeOrg?.id === org.id} />
                                                        <span className={`truncate text-left font-medium ${activeOrg?.id === org.id ? "text-slate-900" : "text-slate-600"}`}>{org.name}</span>
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setIsInviteOpen(true); setIsOrgOpen(false); }}
                                                        className="ml-2 w-8 h-8 flex items-center justify-center rounded-lg bg-violet-50 text-violet-600 border border-violet-100 hover:bg-violet-100 hover:text-violet-700 transition-all shrink-0 shadow-sm"
                                                        title="Invite Members"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                                            <circle cx="9" cy="7" r="4" />
                                                            <line x1="19" y1="8" x2="19" y2="14" />
                                                            <line x1="22" y1="11" x2="16" y2="11" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </Dropdown>
                                )}
                            </div>
                        )}

                        <div ref={userRef} className="relative">
                            <button onClick={(e) => { e.stopPropagation(); setIsUserOpen(!isUserOpen); }} className="block focus:outline-none">
                                <UserAvatar name={session?.user?.name || "U"} />
                            </button>
                            {isUserOpen && (
                                <Dropdown className="right-0 w-56 mt-2">
                                    <div className="px-4 py-3 border-b border-slate-100">
                                        <p className="text-sm font-semibold text-slate-900 truncate">{session?.user?.name}</p>
                                        <p className="text-xs text-slate-400 truncate mt-0.5">{session?.user?.email}</p>
                                    </div>
                                    <div className="p-1.5 space-y-0.5">
                                        <DropdownItem icon={<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg>} onClick={() => navigate("/dashboard")}>Dashboard</DropdownItem>
                                        <DropdownItem icon={<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>} onClick={handleSignOut} danger>Sign Out</DropdownItem>
                                    </div>
                                </Dropdown>
                            )}
                        </div>
                    </div>

                    {/* 🖥️ DESKTOP NAVIGATION (Restored Original Layout) */}
                    <div className="hidden md:flex items-center justify-between w-full">
                        <div className="flex items-center gap-4">
                            {onToggleSidebar && (
                                <button
                                    onClick={onToggleSidebar}
                                    className="md:hidden p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-50"
                                    aria-label="Toggle Sidebar"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" /></svg>
                                </button>
                            )}

                            {!isDashboardPath && (
                                <Link
                                    to="/"
                                    className="flex items-center gap-2.5 flex-shrink-0"
                                >
                                    <Logo variant="icon" size={30} animate={false} />
                                    <span className="text-base font-black tracking-tight text-slate-900 hidden sm:block">
                                        FlareFilter
                                    </span>
                                </Link>
                            )}

                            {isDashboardPath && pageTitle && (
                                <div className="flex items-center gap-3 flex-shrink-0">
                                    <h1 className="text-xl font-black tracking-tighter text-slate-950">
                                        {pageTitle}
                                    </h1>
                                    <div className="group relative hidden sm:block">
                                        <button className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-950 hover:bg-slate-200 transition-all border border-slate-200/50">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
                                            </svg>
                                        </button>
                                        <div className="absolute left-0 top-full mt-3 w-72 p-4 bg-slate-950 text-white text-[12px] font-medium rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 leading-relaxed border border-white/10 pointer-events-none">
                                            <div className="absolute -top-1 left-4 w-2.5 h-2.5 bg-slate-950 rotate-45" />
                                            <p className="opacity-90">{pageSubtext}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Divider */}
                        {!isDashboardPath && <div className="hidden md:block h-5 w-px bg-slate-200 flex-shrink-0 mx-2" />}

                        {/* Desktop nav links */}
                        {!isDashboardPath && (
                            <nav className="hidden md:flex items-center gap-1">
                                <NavLink to="/" active={isHome}>Home</NavLink>
                                {session?.user && <NavLink to="/dashboard" active={isDashboard}>Dashboard</NavLink>}
                            </nav>
                        )}

                        {/* Push right */}
                        <div className="flex-1" />

                        {/* Desktop right side */}
                        <div className="hidden md:flex items-center gap-3">

                            {/* Org switcher */}
                            {session?.user && (
                                <div className="relative" ref={orgRef}>
                                    <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
                                        <button
                                            onClick={() => setIsOrgOpen(v => !v)}
                                            className="flex items-center gap-2 h-9 px-3 text-sm font-semibold text-slate-700 hover:bg-white transition-all min-w-0 max-w-[170px]"
                                        >
                                            <OrgAvatar name={activeOrg?.name || "W"} size="sm" />
                                            <span className="truncate">{activeOrg?.name || "Organization"}</span>
                                            <Chevron open={isOrgOpen} />
                                        </button>

                                        <div className="w-px h-4 bg-slate-200 flex-shrink-0" />

                                        <button
                                            onClick={() => setIsCreateOrgOpen(true)}
                                            className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-white transition-all flex-shrink-0"
                                            aria-label="New Organization"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                        </button>
                                    </div>

                                    {isOrgOpen && (
                                        <Dropdown className="right-0 w-52">
                                            <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                                                Switch Organization
                                            </div>
                                            <div className="py-1 max-h-44 overflow-y-auto">
                                                {(orgs || []).map((org: any) => (
                                                    <div key={org.id} className="group/item flex items-center px-1 hover:bg-slate-50 transition-colors">
                                                        <button
                                                            onClick={async () => {
                                                                await authClient.organization.setActive({ organizationId: org.id });
                                                                setIsOrgOpen(false);
                                                                window.location.reload();
                                                            }}
                                                            className={`flex-1 flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors min-w-0 ${activeOrg?.id === org.id ? "font-semibold text-slate-900" : "text-slate-600"}`}
                                                        >
                                                            <OrgAvatar name={org.name} size="sm" active={activeOrg?.id === org.id} />
                                                            <span className="truncate flex-1">{org.name}</span>
                                                            {activeOrg?.id === org.id && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />}
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setIsInviteOpen(true); setIsOrgOpen(false); }}
                                                            className="mr-1.5 w-7 h-7 flex items-center justify-center rounded-lg bg-violet-50 text-violet-600 border border-violet-100 hover:bg-violet-100 hover:text-violet-700 transition-all shrink-0 shadow-sm"
                                                            title="Invite Members"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                                                <circle cx="9" cy="7" r="4" />
                                                                <line x1="19" y1="8" x2="19" y2="14" />
                                                                <line x1="22" y1="11" x2="16" y2="11" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="border-t border-slate-100 p-1.5">
                                                <button
                                                    onClick={() => { setIsOrgOpen(false); setIsCreateOrgOpen(true); }}
                                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                                    New Organization
                                                </button>
                                            </div>
                                        </Dropdown>
                                    )}
                                </div>
                            )}

                            {/* User / Get Started */}
                            {isPending ? (
                                <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse" />
                            ) : session?.user ? (
                                <div className="relative" ref={userRef}>
                                    <button
                                        onClick={() => setIsUserOpen(v => !v)}
                                        className="flex items-center gap-2 h-9 pl-1 pr-2.5 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all"
                                    >
                                        <UserAvatar name={session.user.name} />
                                        <span className="text-sm font-semibold text-slate-700 max-w-[100px] truncate hidden lg:block">
                                            {session.user.name}
                                        </span>
                                        <Chevron open={isUserOpen} />
                                    </button>

                                    {isUserOpen && (
                                        <Dropdown className="right-0 w-56">
                                            <div className="px-4 py-3 border-b border-slate-100">
                                                <p className="text-sm font-semibold text-slate-900 truncate">{session.user.name}</p>
                                                <p className="text-xs text-slate-400 truncate mt-0.5">{session.user.email}</p>
                                            </div>
                                            <div className="p-1.5 space-y-0.5">
                                                <DropdownItem
                                                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg>}
                                                    onClick={() => { navigate("/dashboard"); setIsUserOpen(false); }}
                                                >Dashboard</DropdownItem>
                                                <DropdownItem
                                                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>}
                                                    onClick={handleSignOut}
                                                    danger
                                                >Sign Out</DropdownItem>
                                            </div>
                                        </Dropdown>
                                    )}
                                </div>
                            ) : (
                                <Link
                                    to="/auth?mode=login"
                                    className="inline-flex items-center gap-1.5 h-9 px-4 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-black transition-all active:scale-95"
                                >
                                    Get Started
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {isCreateOrgOpen && <CreateOrgModal onClose={() => setIsCreateOrgOpen(false)} />}
            {isInviteOpen && <InviteMemberModal onClose={() => setIsInviteOpen(false)} />}
        </>
    );
}

// ── Small reusable pieces ───────────────────────────────────────────────────

function NavLink({ to, active, children }: { to: string; active: boolean; children: React.ReactNode }) {
    return (
        <Link
            to={to}
            className={`h-9 px-4 flex items-center font-semibold rounded-lg transition-all active:scale-95 ${active ? "text-slate-900 bg-slate-100" : "text-slate-500 bg-slate-50/50 hover:bg-slate-100 hover:text-slate-900"
                }`}
        >
            {children}
        </Link>
    );
}

function Dropdown({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`absolute top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-900/10 z-50 overflow-hidden ${className}`}>
            {children}
        </div>
    );
}

function DropdownItem({ icon, onClick, danger, children }: { icon: React.ReactNode; onClick: () => void; danger?: boolean; children: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${danger ? "text-rose-600 hover:bg-rose-50" : "text-slate-700 hover:bg-slate-50"
                }`}
        >
            {icon}
            {children}
        </button>
    );
}

function Chevron({ open }: { open: boolean }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`text-slate-400 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
            <polyline points="6 9 12 15 18 9" />
        </svg>
    );
}

function UserAvatar({ name }: { name: string }) {
    return (
        <div className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {name.charAt(0).toUpperCase()}
        </div>
    );
}

function OrgAvatar({ name, size = "md", active = false }: { name: string; size?: "sm" | "md"; active?: boolean }) {
    const sz = size === "sm" ? "w-5 h-5 text-[9px]" : "w-7 h-7 text-[11px]";
    return (
        <div className={`${sz} rounded-md flex items-center justify-center font-bold flex-shrink-0 ${active ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-600"}`}>
            {name.charAt(0).toUpperCase()}
        </div>
    );
}

// ── Create Org Modal ────────────────────────────────────────────────────────

function CreateOrgModal({ onClose }: { onClose: () => void }) {
    const [name, setName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) return;
        setIsLoading(true); setError(null);
        const result = await authClient.organization.create({ name: trimmed, slug: slugify(trimmed) });
        if (result.error) { setError(result.error.message ?? "Failed to create."); setIsLoading(false); return; }
        if (result.data?.id) await authClient.organization.setActive({ organizationId: result.data.id });
        window.location.reload();
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <h2 className="text-lg font-bold text-slate-900 mb-5">New Organization</h2>
                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5">Name</label>
                        <input
                            type="text" value={name}
                            onChange={e => { setName(e.target.value); setError(null); }}
                            placeholder="e.g. Acme Corp"
                            className="w-full h-10 px-3.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 bg-slate-50 placeholder:text-slate-300"
                            autoFocus disabled={isLoading}
                        />
                        {name.trim() && <p className="mt-1 text-[11px] text-slate-400">Slug: <span className="text-slate-600">{slugify(name)}</span></p>}
                    </div>
                    {error && <p className="text-xs text-rose-600 bg-rose-50 px-3 py-2 rounded-lg">{error}</p>}
                    <div className="flex gap-2.5 pt-1">
                        <button type="button" onClick={onClose} disabled={isLoading} className="flex-1 h-10 rounded-lg text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50">Cancel</button>
                        <button type="submit" disabled={isLoading || !name.trim()} className="flex-1 h-10 rounded-lg text-sm font-semibold text-white bg-slate-900 hover:bg-black transition-all disabled:opacity-50">
                            {isLoading ? "Creating…" : "Create"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Invite Member Modal ───────────────────────────────────────────────────

function InviteMemberModal({ onClose }: { onClose: () => void }) {
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("member");
    const [submitted, setSubmitted] = useState(false);

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-violet-600">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 leading-tight">Invite Member</h2>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">Add to Team</p>
                    </div>
                </div>

                {submitted ? (
                    <div className="py-4 text-center">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600"><polyline points="20 6 9 17 4 12" /></svg>
                        </div>
                        <p className="font-bold text-slate-900">Success!</p>
                        <p className="text-sm text-slate-500 mt-1 mb-6">Invite sent to {email}</p>
                        <button onClick={onClose} className="w-full h-11 rounded-lg text-sm font-bold text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors">Done</button>
                    </div>
                ) : (
                    <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Email address</label>
                            <input
                                type="email" value={email} onChange={e => setEmail(e.target.value)}
                                placeholder="name@company.com" required autoFocus
                                className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-slate-950/5 focus:border-slate-950 bg-slate-50 placeholder:text-slate-300"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Assign Role</label>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { value: "member", label: "Member" },
                                    { value: "admin", label: "Admin" }
                                ].map((r) => (
                                    <button
                                        key={r.value} type="button" onClick={() => setRole(r.value)}
                                        className={`h-11 px-3 rounded-lg border text-sm font-bold transition-all ${role === r.value ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"}`}
                                    >
                                        {r.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-2.5 pt-2">
                            <button type="button" onClick={onClose} className="flex-1 h-11 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Cancel</button>
                            <button type="submit" disabled={!email} className="flex-1 h-11 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-black transition-all shadow-lg shadow-slate-900/10 disabled:opacity-50">Send Invite</button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
