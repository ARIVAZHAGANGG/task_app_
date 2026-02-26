import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { motion } from "framer-motion";
import SupportAssistant from "./support/SupportAssistant";
import { useState } from "react";
import TaskModal from "./ui/TaskModal";
import api from "../services/api";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import MagicSearch from "./ui/MagicSearch";
import { useEffect } from "react";

const MainLayout = () => {
    const { user, loading } = useAuth();
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isMagicSearchOpen, setIsMagicSearchOpen] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsMagicSearchOpen(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-[var(--bg-primary)]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const handleCreateTask = async (formData) => {
        try {
            await api.post("/tasks", formData);
            toast.success("New task created");
            setIsTaskModalOpen(false);
            // Dispatch event to refresh tasks in Tasks.jsx
            window.dispatchEvent(new CustomEvent("refresh-tasks"));
        } catch (error) {
            toast.error("Failed to create task");
        }
    };

    return (
        <div className="flex h-screen bg-[var(--bg-primary)] transition-colors duration-300 overflow-hidden relative">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Navbar onNewTask={() => setIsTaskModalOpen(true)} />
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 custom-scrollbar">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="max-w-7xl mx-auto"
                    >
                        <Outlet />
                    </motion.div>
                </main>
            </div>

            <SupportAssistant />

            {/* Mobile FAB */}
            <button
                onClick={() => setIsTaskModalOpen(true)}
                className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-2xl shadow-2xl flex items-center justify-center z-50 active:scale-90 transition-all border-4 border-white dark:border-slate-900"
            >
                <Plus size={24} strokeWidth={3} />
            </button>

            <TaskModal
                isOpen={isTaskModalOpen}
                onClose={() => setIsTaskModalOpen(false)}
                onSave={handleCreateTask}
            />

            <MagicSearch
                isOpen={isMagicSearchOpen}
                onClose={() => setIsMagicSearchOpen(false)}
            />
        </div>
    );
};

export default MainLayout;
