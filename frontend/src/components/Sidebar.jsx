import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    Sun,
    Star,
    CheckCircle2,
    Settings,
    ChevronLeft,
    ChevronRight,
    LogOut,
    User,
    Target,
    BarChart3,
    Gamepad2,
    Columns,
    Calendar as CalendarIcon,
    CircleHelp,
    Clock,
    FileText
} from "lucide-react";
import { cn } from "../utils/cn";
import Logo from "./Logo";
import InstallPrompt from "./ui/InstallPrompt";
import { useAuth } from "../context/AuthContext";

const Sidebar = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { logout, user } = useAuth();
    const location = useLocation();

    const menuItems = [
        { name: "Dashboard", icon: LayoutDashboard, path: "/" },
        { name: "My Day", icon: Sun, path: "/my-day" },
        { name: "Focus Mode", icon: Target, path: "/focus" },
        { name: "Kanban Board", icon: Columns, path: "/board" },
        { name: "Calendar", icon: CalendarIcon, path: "/calendar" },
        { name: "Time Tracking", icon: Clock, path: "/time-tracking" },
        { name: "Invoices", icon: FileText, path: "/invoices" },
        { name: "Productivity", icon: BarChart3, path: "/report" },
        { name: "Zen Arcade", icon: Gamepad2, path: "/arcade" },
        { name: "Important", icon: Star, path: "/important" },
        { name: "Completed", icon: CheckCircle2, path: "/completed" },
    ];

    return (
        <div
            style={{ width: isCollapsed ? '72px' : '260px', backgroundColor: 'var(--sidebar-bg)' }}
            className="h-screen border-r border-slate-200/80 dark:border-slate-800/80 shadow-[1px_0_10px_rgba(0,0,0,0.02)] flex flex-col transition-all duration-300 ease-in-out z-50 sticky top-0 overflow-hidden"
        >
            {/* Header / Logo (Fixed) */}
            <div className="p-4 flex items-center justify-between h-20 shrink-0 border-b border-slate-50 dark:border-slate-800/20">
                {!isCollapsed && (
                    <div className="flex items-center gap-3 px-2 transition-opacity duration-200">
                        <Logo className="w-8 h-8 rounded-lg shadow-sm" />
                        <span className="font-bold text-slate-900 dark:text-white tracking-tight text-lg">ZenTask</span>
                    </div>
                )}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={cn(
                        "p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors",
                        isCollapsed && "mx-auto"
                    )}
                >
                    {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
            </div>

            {/* Scrollable Navigation Area */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
                {!isCollapsed && (
                    <div className="px-3 mb-4">
                        <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-[0.2em]">Menu</p>
                    </div>
                )}
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative text-sm font-semibold",
                            isActive
                                ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/10 shadow-sm ring-1 ring-indigo-500/10"
                                : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
                        )}
                    >
                        <item.icon size={18} className={cn("shrink-0 transition-transform group-hover:scale-110", location.pathname === item.path && "text-indigo-600 dark:text-indigo-400")} />
                        {!isCollapsed && <span>{item.name}</span>}

                        {isCollapsed && (
                            <div className="absolute left-full ml-4 px-2.5 py-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-xl z-50">
                                {item.name}
                            </div>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Bottom Actions Section (Fixed) */}
            <div className="shrink-0 p-3 bg-white/50 dark:bg-slate-900/50 border-t border-slate-50 dark:border-slate-800/20">
                {/* Account Section with Background */}
                <div className={cn(
                    "rounded-2xl p-1.5 transition-all duration-300 bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/50",
                    isCollapsed ? "flex flex-col gap-1 items-center" : "space-y-0.5"
                )}>
                    {/* Help Center Link */}
                    <NavLink
                        to="/help"
                        className={({ isActive }) => cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative text-sm font-semibold w-full",
                            isActive
                                ? "text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 shadow-sm ring-1 ring-indigo-500/10"
                                : "text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                        )}
                    >
                        <CircleHelp size={18} className="shrink-0 transition-transform group-hover:scale-110" />
                        {!isCollapsed && <span>Help & FAQ</span>}

                        {isCollapsed && (
                            <div className="absolute left-full ml-4 px-2.5 py-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-xl z-50">
                                Help & FAQ
                            </div>
                        )}
                    </NavLink>

                    {/* Settings Link */}
                    <NavLink
                        to="/settings"
                        className={({ isActive }) => cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative text-sm font-semibold w-full",
                            isActive
                                ? "text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 shadow-sm ring-1 ring-indigo-500/10"
                                : "text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                        )}
                    >
                        <Settings size={18} className="shrink-0 transition-transform group-hover:rotate-45" />
                        {!isCollapsed && <span>Settings</span>}

                        {isCollapsed && (
                            <div className="absolute left-full ml-4 px-2.5 py-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-xl z-50">
                                Settings
                            </div>
                        )}
                    </NavLink>

                    {/* Logout Button */}
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative text-sm font-semibold w-full text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 dark:hover:text-red-400"
                    >
                        <LogOut size={18} className="shrink-0 transition-transform group-hover:-translate-x-1" />
                        {!isCollapsed && <span>Logout</span>}

                        {isCollapsed && (
                            <div className="absolute left-full ml-4 px-2.5 py-1 bg-red-600 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-xl z-50">
                                Logout
                            </div>
                        )}
                    </button>

                    {/* Profile Summary (Only if not collapsed) */}
                    {!isCollapsed && (
                        <div className="px-3 py-3 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg saas-gradient text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-md">
                                {user?.name?.charAt(0).toUpperCase() || "U"}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{user?.name}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Actual Footer (Fixed at the bottom) */}
            {!isCollapsed && (
                <div className="px-6 py-4 shrink-0 bg-slate-50/30 dark:bg-slate-800/10 border-t border-slate-50 dark:border-slate-800/20">
                    <div className="flex flex-col gap-0.5">
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">ZenTask v1.0.4</p>
                        <p className="text-[10px] text-slate-400/80 dark:text-slate-500/80 font-medium">Ready for your next mission.</p>
                    </div>
                </div>
            )}

            <InstallPrompt />
        </div>
    );
};

export default Sidebar;
