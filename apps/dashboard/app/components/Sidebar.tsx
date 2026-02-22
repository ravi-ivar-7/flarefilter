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
    const searchParams = new URLSearchParams(location.search);
    const currentTab = searchParams.get("tab") || "overview";

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside
                className={[
                    "transition-all duration-300 ease-in-out flex flex-col",
                    isCollapsed ? "md:w-20" : "md:w-72",
                    "md:sticky md:top-0 md:h-screen md:flex md:flex-shrink-0 md:translate-x-0 md:shadow-none md:z-20",
                    "fixed top-0 bottom-0 left-0 z-50 w-72",
                    "bg-white border-r border-slate-200",
                    isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0",
                ].join(" ")}
            >
                <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-200 flex-shrink-0">
                    <Logo variant="icon" size={32} animate={false} className="flex-shrink-0" />
                    {!isCollapsed && (
                        <span className="text-lg font-black truncate tracking-tight text-slate-900 uppercase">
                            FlareFilter
                        </span>
                    )}
                </div>

                <nav className="flex-1 px-2 py-6 space-y-6 overflow-y-auto custom-scrollbar">
                    {/* Home Link */}
                    <div className="space-y-1">
                        <Link
                            to="/"
                            className={`flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isCollapsed ? "justify-center px-0 w-12 mx-auto" : ""} text-slate-500 hover:text-slate-900 hover:bg-white hover:shadow-sm`}
                        >
                            <svg className="flex-shrink-0" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            </svg>
                            {!isCollapsed && <span className="truncate">Home</span>}
                        </Link>
                    </div>

                    {/* Dashboard Section */}
                    <div className="space-y-2">
                        {!isCollapsed && (
                            <div className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
                                Dashboard
                            </div>
                        )}
                        <div className="space-y-1">
                            <Link
                                to="/dashboard?tab=overview"
                                onClick={() => setIsOpen(false)}
                                className={`flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isCollapsed ? "justify-center px-0 w-12 mx-auto" : ""} ${isDashboard && currentTab === "overview"
                                    ? "bg-white text-indigo-600 shadow-lg shadow-indigo-100/50 border border-indigo-100"
                                    : "text-slate-500 hover:text-slate-900 hover:bg-white hover:shadow-sm"
                                    }`}
                                title={isCollapsed ? "Overview" : ""}
                            >
                                <svg className="flex-shrink-0" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                                </svg>
                                {!isCollapsed && <span className="truncate">Overview</span>}
                            </Link>

                            <Link
                                to="/dashboard?tab=ips"
                                onClick={() => setIsOpen(false)}
                                className={`flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isCollapsed ? "justify-center px-0 w-12 mx-auto" : ""} ${isDashboard && currentTab === "ips"
                                    ? "bg-white text-indigo-600 shadow-lg shadow-indigo-100/50 border border-indigo-100"
                                    : "text-slate-500 hover:text-slate-900 hover:bg-white hover:shadow-sm"
                                    }`}
                                title={isCollapsed ? "IPs Analyzer" : ""}
                            >
                                <svg className="flex-shrink-0" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                                </svg>
                                {!isCollapsed && <span className="truncate">IPs Analyzer</span>}
                            </Link>

                            <Link
                                to="/dashboard?tab=logs"
                                onClick={() => setIsOpen(false)}
                                className={`flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isCollapsed ? "justify-center px-0 w-12 mx-auto" : ""} ${isDashboard && currentTab === "logs"
                                    ? "bg-white text-indigo-600 shadow-lg shadow-indigo-100/50 border border-indigo-100"
                                    : "text-slate-500 hover:text-slate-900 hover:bg-white hover:shadow-sm"
                                    }`}
                                title={isCollapsed ? "Audit Logs" : ""}
                            >
                                <svg className="flex-shrink-0" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
                                </svg>
                                {!isCollapsed && <span className="truncate">Audit Logs</span>}
                            </Link>
                        </div>
                    </div>

                    {/* Settings Section */}
                    <Link
                        to="/settings"
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isCollapsed ? "justify-center px-0 w-12 mx-auto" : ""} ${isSettings
                            ? "bg-white text-indigo-600 shadow-lg shadow-indigo-100/50 border border-indigo-100"
                            : "text-slate-500 hover:text-slate-900 hover:bg-white hover:shadow-sm"
                            }`}
                        title={isCollapsed ? "Settings" : ""}
                    >
                        <svg className="flex-shrink-0" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                            <circle cx="12" cy="12" r="3" />
                        </svg>
                        {!isCollapsed && <span className="truncate">Settings</span>}
                    </Link>
                </nav>

                <div className="hidden md:flex flex-col border-t border-slate-200/50 p-4 bg-slate-50/30">
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-sm ${isCollapsed ? "justify-center px-0 w-12 mx-auto" : ""}`}
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
                        {!isCollapsed && <span>Collapse Menu</span>}
                    </button>
                </div>
            </aside>
        </>
    );
}
