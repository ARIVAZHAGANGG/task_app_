import { useState, useRef, useEffect } from "react";
import { Search, Bell, CheckCircle2, AlertCircle, Clock, LogOut, Plus, Trash2, Check, Flame, BarChart3, ListTodo, MoreVertical, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { cn } from "../utils/cn";
import { getNotifications, markAllAsRead as apiMarkAllRead, markAsRead, deleteNotification, clearAllNotifications } from "../services/notificationService";
import { useSearch } from "../context/SearchContext";
import ThemeSwitcher from "./ui/ThemeSwitcher";
import Logo from "./Logo";
import { toast } from "sonner";

const getPageTitle = (pathname) => {
    if (pathname === "/") return "Dashboard";
    if (pathname === "/tasks") return "Master List";
    if (pathname === "/my-day") return "My Day";
    if (pathname === "/important") return "Important";
    if (pathname === "/planned") return "Planned";
    if (pathname === "/completed") return "Completed";
    const segment = pathname.split("/").pop();
    return segment ? segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ") : "ZenTask";
};

const Navbar = ({ onNewTask }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const notificationRef = useRef(null);
    const profileRef = useRef(null);

    const pageTitle = getPageTitle(location.pathname);
    const unreadCount = notifications.filter(n => !n.isRead).length;

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setShowProfile(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (user) {
            fetchNotifications();
        }
    }, [user]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await getNotifications();
            setNotifications(response.data);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await apiMarkAllRead();
            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
            toast.success("All notifications marked as read");
        } catch (error) {
            toast.error("Failed to mark all as read");
        }
    };

    const handleClearAll = async () => {
        try {
            await clearAllNotifications();
            setNotifications([]);
            toast.success("Notification history cleared");
        } catch (error) {
            toast.error("Failed to clear notifications");
        }
    };

    const handleNotificationClick = async (n) => {
        try {
            if (!n.isRead) {
                await markAsRead(n.id);
                setNotifications(notifications.map(item => item.id === n.id ? { ...item, isRead: true } : item));
            }
            setShowNotifications(false);
            if (n.taskId) {
                navigate(`/tasks?highlight=${n.taskId}`);
            } else if (n.link) {
                navigate(n.link);
            }
        } catch (error) {
            console.error("Action failed:", error);
        }
    };

    const handleDeleteNotification = async (e, id) => {
        e.stopPropagation();
        try {
            await deleteNotification(id);
            setNotifications(notifications.filter(n => n.id !== id));
            toast.success("Notification deleted");
        } catch (error) {
            toast.error("Failed to delete notification");
        }
    };

    const getInitials = (name) => {
        if (!name) return "??";
        const names = name.trim().split(/\s+/);
        if (names.length >= 2) {
            return (names[0][0] + names[1][0]).toUpperCase();
        }
        return name[0].toUpperCase();
    };

    const { searchTerm, setSearchTerm } = useSearch();

    return (
        <header className="h-20 lg:h-24 px-4 sm:px-8 bg-[var(--bg-secondary)] dark:bg-[var(--bg-secondary)]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 z-40 transition-all duration-300">
            {/* LEFT: Logo & Title */}
            <div className="flex items-center gap-4 shrink-0">
                <div className="hidden sm:block">
                    <Logo className="w-8 h-8 lg:w-10 lg:h-10" />
                </div>
                <div>
                    <h1 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none">
                        {pageTitle}
                    </h1>
                </div>
            </div>

            {/* CENTER: Search Bar (Flex Grow) */}
            <div className="flex-1 max-w-2xl mx-4 sm:mx-8 hidden md:block">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search tasks, objectives..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-100/50 dark:bg-slate-800/50 border border-transparent rounded-[1.25rem] focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-300 text-sm font-medium"
                    />
                </div>
            </div>

            {/* RIGHT: Tools & Action */}
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                <div className="flex items-center gap-1 sm:gap-2 pr-2 border-r border-slate-200 dark:border-slate-800">
                    <ThemeSwitcher />

                    <div className="relative" ref={notificationRef}>
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className={cn(
                                "p-2.5 rounded-xl transition-all relative",
                                showNotifications ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                            )}
                        >
                            <Bell size={20} />
                            {unreadCount > 0 && (
                                <span className="absolute top-2.5 right-2.5 bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full border-2 border-white dark:border-slate-900 -translate-y-1/2 translate-x-1/2">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        <AnimatePresence>
                            {showNotifications && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-50 flex flex-col"
                                >
                                    <div className="p-4 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                                        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Notifications</h3>
                                        <div className="flex gap-2">
                                            {notifications.length > 0 && (
                                                <>
                                                    <button
                                                        onClick={handleMarkAllRead}
                                                        className="text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-700 transition-colors"
                                                    >
                                                        Read All
                                                    </button>
                                                    <button
                                                        onClick={handleClearAll}
                                                        className="text-[10px] font-black uppercase text-red-500 hover:text-red-600 transition-colors"
                                                    >
                                                        Clear
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="max-h-96 overflow-y-auto custom-scrollbar">
                                        {notifications.length > 0 ? (
                                            notifications.map((n) => (
                                                <div
                                                    key={n.id}
                                                    onClick={() => handleNotificationClick(n)}
                                                    className={cn(
                                                        "p-4 border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex gap-3 cursor-pointer relative group",
                                                        !n.isRead && "bg-indigo-50/20 dark:bg-indigo-900/10 border-l-4 border-l-indigo-500"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                                        n.type === "task" || n.type === "task_assigned" ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30" :
                                                            n.type === "success" || n.type === "task_completed" ? "bg-green-100 text-green-600 dark:bg-green-900/30" : "bg-red-100 text-red-600 dark:bg-red-900/30"
                                                    )}>
                                                        {n.type === "task" || n.type === "task_assigned" ? <Clock size={16} /> :
                                                            n.type === "success" || n.type === "task_completed" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                                                    </div>
                                                    <div className="flex-1 min-w-0 pr-6">
                                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{n.title}</p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">{n.message}</p>
                                                    </div>
                                                    <button
                                                        onClick={(e) => handleDeleteNotification(e, n.id)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
                                                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                                    <span className="text-2xl">🎉</span>
                                                </div>
                                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No Notifications</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">You're all caught up for today!</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Profile Avatar Dropdown */}
                <div className="relative" ref={profileRef}>
                    <button
                        onClick={() => setShowProfile(!showProfile)}
                        className="flex items-center p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shrink-0 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                    >
                        <div className="w-10 h-10 rounded-xl saas-gradient text-white flex items-center justify-center font-black text-xs shadow-lg shadow-indigo-500/20">
                            {getInitials(user?.name)}
                        </div>
                    </button>

                    <AnimatePresence>
                        {showProfile && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute right-0 mt-3 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-50 py-3"
                            >
                                <div className="px-5 py-3 border-b border-slate-50 dark:border-slate-800 mb-2">
                                    <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-1">{user?.name}</p>
                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{user?.email}</p>
                                </div>

                                {/* Stats in Dropdown */}
                                <div className="px-3 py-2 grid grid-cols-2 gap-2 mb-2">
                                    <div className="bg-orange-50 dark:bg-orange-950/20 p-2.5 rounded-xl border border-orange-100 dark:border-orange-900/30 text-center">
                                        <div className="flex items-center justify-center gap-1.5 mb-1">
                                            <Flame size={14} className="text-orange-500" strokeWidth={3} />
                                            <span className="text-[10px] font-black uppercase text-orange-600 tracking-tighter">Streak</span>
                                        </div>
                                        <p className="text-lg font-black text-orange-700 dark:text-orange-400 leading-none">{user?.stats?.streak || 0}d</p>
                                    </div>
                                    <div className="bg-indigo-50 dark:bg-indigo-950/20 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900/30 text-center">
                                        <div className="flex items-center justify-center gap-1.5 mb-1">
                                            <BarChart3 size={14} className="text-indigo-500" strokeWidth={3} />
                                            <span className="text-[10px] font-black uppercase text-indigo-600 tracking-tighter">Score</span>
                                        </div>
                                        <p className="text-lg font-black text-indigo-700 dark:text-indigo-400 leading-none">{user?.stats?.productivityScore || 0}%</p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                                        <div className="flex items-center justify-center gap-1.5 mb-1">
                                            <ListTodo size={14} className="text-slate-500" strokeWidth={3} />
                                            <span className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-400 tracking-tighter">Tasks</span>
                                        </div>
                                        <p className="text-lg font-black text-slate-800 dark:text-slate-200 leading-none">{user?.stats?.totalTasks || 0}</p>
                                    </div>
                                    <div className="bg-green-50 dark:bg-green-950/20 p-2.5 rounded-xl border border-green-100 dark:border-green-900/30 text-center">
                                        <div className="flex items-center justify-center gap-1.5 mb-1">
                                            <Check size={14} className="text-green-500" strokeWidth={3} />
                                            <span className="text-[10px] font-black uppercase text-green-600 tracking-tighter">Done</span>
                                        </div>
                                        <p className="text-lg font-black text-green-700 dark:text-green-400 leading-none">{user?.stats?.completedTasks || 0}</p>
                                    </div>
                                </div>

                                <div className="px-2">
                                    <button
                                        onClick={() => { setShowProfile(false); navigate("/settings"); }}
                                        className="w-full px-3 py-2.5 text-left text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl flex items-center justify-between group transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 transition-colors">
                                                <User size={16} />
                                            </div>
                                            Profile
                                        </div>
                                        <CheckCircle2 size={14} className="opacity-0 group-hover:opacity-100 text-indigo-500" />
                                    </button>

                                    <button
                                        onClick={logout}
                                        className="w-full px-3 py-2.5 text-left text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl flex items-center gap-3 transition-colors mt-1"
                                    >
                                        <div className="p-1.5 bg-red-100/50 dark:bg-red-900/20 rounded-lg text-red-600">
                                            <LogOut size={16} />
                                        </div>
                                        Logout
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* New Objective Button (Responsive) */}
                <button
                    onClick={onNewTask}
                    className="flex items-center gap-2.5 px-6 py-3.5 btn-primary shrink-0"
                >
                    <Plus size={20} strokeWidth={4} />
                    <span className="hidden sm:inline">New Objective</span>
                </button>
            </div>
        </header>
    );
};

export default Navbar;

