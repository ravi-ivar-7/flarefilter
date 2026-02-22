import { Link, useLocation, useNavigate } from "react-router";
import { authClient } from "~/lib/auth-client";
import { useState, useRef, useEffect } from "react";
import { Logo } from "~/components/Logo";

interface HeaderProps {
    onToggleSidebar?: () => void;
}

export function Header({ }: HeaderProps) {
    const { data: session, isPending } = authClient.useSession();
    const { data: activeOrg } = authClient.useActiveOrganization();
    const { data: orgs } = authClient.useListOrganizations();
    const [isUserOpen, setIsUserOpen] = useState(false);
    const [isOrgOpen, setIsOrgOpen] = useState(false);
    const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const userRef = useRef<HTMLDivElement>(null);
    const orgRef = useRef<HTMLDivElement>(null);

    const isHome = location.pathname === "/";
    const isDashboard = location.pathname === "/dashboard";

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
            <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-6">

                    {/* Logo + Brand */}
                    <Link
                        to="/"
                        className="flex items-center gap-2.5 flex-shrink-0"
                    >
                        <Logo variant="icon" size={30} animate={false} />
                        <span className="text-base font-black tracking-tight text-slate-900 hidden sm:block">
                            FlareFilter
                        </span>
                    </Link>

                    {/* Divider */}
                    <div className="hidden md:block h-5 w-px bg-slate-200 flex-shrink-0" />

                    {/* Desktop nav links */}
                    <nav className="hidden md:flex items-center gap-1">
                        <NavLink to="/" active={isHome}>Home</NavLink>
                        {session?.user && <NavLink to="/dashboard" active={isDashboard}>Dashboard</NavLink>}
                    </nav>

                    {/* Push right */}
                    <div className="flex-1" />

                    {/* Desktop right side */}
                    <div className="hidden md:flex items-center gap-3">

                        {/* Org switcher */}
                        {session?.user && (
                            <div className="relative" ref={orgRef}>
                                <button
                                    onClick={() => setIsOrgOpen(v => !v)}
                                    className="flex items-center gap-2 h-9 px-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 transition-all text-sm font-semibold text-slate-700 max-w-[160px]"
                                >
                                    <OrgAvatar name={activeOrg?.name || "W"} size="sm" />
                                    <span className="truncate">{activeOrg?.name || "Workspace"}</span>
                                    <Chevron open={isOrgOpen} />
                                </button>

                                {isOrgOpen && (
                                    <Dropdown className="right-0 w-52">
                                        <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                                            Switch Workspace
                                        </div>
                                        <div className="py-1 max-h-44 overflow-y-auto">
                                            {(orgs || []).map((org: any) => (
                                                <button
                                                    key={org.id}
                                                    onClick={async () => {
                                                        await authClient.organization.setActive({ organizationId: org.id });
                                                        setIsOrgOpen(false);
                                                        window.location.reload();
                                                    }}
                                                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors hover:bg-slate-50 ${activeOrg?.id === org.id ? "font-semibold text-slate-900" : "text-slate-600"}`}
                                                >
                                                    <OrgAvatar name={org.name} size="sm" active={activeOrg?.id === org.id} />
                                                    <span className="truncate flex-1">{org.name}</span>
                                                    {activeOrg?.id === org.id && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="border-t border-slate-100 p-1.5">
                                            <button
                                                onClick={() => { setIsOrgOpen(false); setIsCreateOrgOpen(true); }}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                                New Workspace
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

                    {/* Mobile hamburger */}
                    <button
                        onClick={() => setIsMobileOpen(v => !v)}
                        className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors flex-shrink-0"
                        aria-label="Toggle menu"
                    >
                        {isMobileOpen
                            ? <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            : <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
                        }
                    </button>
                </div>

                {/* Mobile dropdown */}
                {isMobileOpen && (
                    <div className="md:hidden border-t border-slate-100 bg-white">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 space-y-1">
                            <MobileNavLink to="/" active={isHome}>Home</MobileNavLink>
                            {session?.user && <MobileNavLink to="/dashboard" active={isDashboard}>Dashboard</MobileNavLink>}

                            <div className="pt-3 mt-1 border-t border-slate-100">
                                {session?.user ? (
                                    <div className="space-y-2">
                                        {/* User info */}
                                        <div className="flex items-center gap-3 px-3 py-2">
                                            <UserAvatar name={session.user.name} />
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-slate-900 truncate">{session.user.name}</p>
                                                <p className="text-xs text-slate-400 truncate">{session.user.email}</p>
                                            </div>
                                        </div>
                                        {/* Org */}
                                        {activeOrg && (
                                            <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600">
                                                <OrgAvatar name={activeOrg.name} size="sm" active />
                                                <span className="truncate font-medium">{activeOrg.name}</span>
                                            </div>
                                        )}
                                        <button
                                            onClick={handleSignOut}
                                            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                                            Sign Out
                                        </button>
                                    </div>
                                ) : (
                                    <Link
                                        to="/auth?mode=login"
                                        className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-black transition-all"
                                    >
                                        Get Started
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {isCreateOrgOpen && <CreateOrgModal onClose={() => setIsCreateOrgOpen(false)} />}
        </>
    );
}

// ── Small reusable pieces ───────────────────────────────────────────────────

function NavLink({ to, active, children }: { to: string; active: boolean; children: React.ReactNode }) {
    return (
        <Link
            to={to}
            className={`text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors ${active ? "text-slate-900 bg-slate-100" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                }`}
        >
            {children}
        </Link>
    );
}

function MobileNavLink({ to, active, children }: { to: string; active: boolean; children: React.ReactNode }) {
    return (
        <Link
            to={to}
            className={`block text-sm font-semibold px-3 py-2.5 rounded-lg transition-colors ${active ? "text-slate-900 bg-slate-100" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
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
                <h2 className="text-lg font-bold text-slate-900 mb-5">New Workspace</h2>
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
