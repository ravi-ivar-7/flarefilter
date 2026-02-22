import { Link, useLocation } from "react-router";
import { useState, useEffect } from "react";
import { Logo } from "~/components/Logo";

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (v: boolean) => void;
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem("sidebar-collapsed");
        if (saved === "true") setIsCollapsed(true);
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem("sidebar-collapsed", isCollapsed.toString());
        }
    }, [isCollapsed, isLoaded]);

    const isDashboard = location.pathname === "/dashboard";
    const isSettings = location.pathname === "/settings";

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 top-[64px] bg-black/40 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside
                className={[
                    "transition-all duration-300 ease-in-out flex flex-col",
                    isCollapsed ? "md:w-20" : "md:w-64",
                    "md:static md:flex md:h-full md:translate-x-0 md:shadow-none md:z-auto md:flex-shrink-0",
                    "fixed top-[64px] bottom-0 left-0 z-50 w-64",
                    "bg-gradient-to-br from-white to-slate-50 border-r border-slate-200/60",
                    isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0",
                ].join(" ")}
            >
                <div className={`flex items-center justify-between px-5 h-[64px] border-b border-slate-200/50 flex-shrink-0 overflow-hidden ${isCollapsed ? "justify-center" : ""}`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                        <Logo variant="icon" size={36} animate={false} className="flex-shrink-0" />
                        {!isCollapsed && (
                            <span className="text-2xl font-bold truncate">
                                FlareFilter
                            </span>
                        )}
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-black hover:bg-slate-100 transition-colors"
                        aria-label="Close navigation"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    <Link
                        to="/dashboard"
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${isCollapsed ? "justify-center px-0 w-12 mx-auto" : ""} ${isDashboard
                            ? "bg-white text-black shadow-lg shadow-indigo-100/50 border border-indigo-100"
                            : "text-slate-600 hover:text-black hover:bg-white hover:shadow-sm transition-all"
                            }`}
                        title={isCollapsed ? "Overview" : ""}
                    >
                        <svg className="flex-shrink-0" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="7" height="9" x="3" y="3" rx="1" />
                            <rect width="7" height="5" x="14" y="3" rx="1" />
                            <rect width="7" height="9" x="14" y="12" rx="1" />
                            <rect width="7" height="5" x="3" y="16" rx="1" />
                        </svg>
                        {!isCollapsed && <span className="truncate transition-all duration-300">Overview</span>}
                    </Link>

                    <Link
                        to="#"
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${isCollapsed ? "justify-center px-0 w-12 mx-auto" : ""} ${isSettings
                            ? "bg-white text-black shadow-lg shadow-indigo-100/50 border border-indigo-100"
                            : "text-slate-600 hover:text-black hover:bg-white hover:shadow-sm transition-all"
                            }`}
                        title={isCollapsed ? "Settings" : ""}
                    >
                        <svg className="flex-shrink-0" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                            <circle cx="12" cy="12" r="3" />
                        </svg>
                        {!isCollapsed && <span className="truncate transition-all duration-300">Settings</span>}
                    </Link>
                </nav>

                <div className="hidden md:flex flex-col border-t border-slate-200/50 p-3">
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all text-slate-400 hover:text-black hover:bg-white hover:shadow-sm ${isCollapsed ? "justify-center px-0 w-12 mx-auto" : ""}`}
                        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={`transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`}
                        >
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                        {!isCollapsed && <span>Collapse</span>}
                    </button>
                </div>
            </aside>
        </>
    );
}
