import { Plus, ListTodo, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import { toast } from "sonner";
import TaskCard from "../components/ui/TaskCard";
import TaskModal from "../components/ui/TaskModal";
import { useState, useEffect, useCallback, useMemo } from "react";
import useReminder from "../hooks/useReminder";
import { useSearch } from "../context/SearchContext";
import CategoryBar from "../components/tasks/CategoryBar";
import SelectionToolbar from "../components/ui/SelectionToolbar";
import VoiceTaskTrigger from "../components/tasks/VoiceTaskTrigger";

const Tasks = ({ filter = "all" }) => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTaskIds, setSelectedTaskIds] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [activeCategory, setActiveCategory] = useState("All");
    const [categoryCounts, setCategoryCounts] = useState({});

    // AI/Reminder Hooks
    useReminder(tasks);

    const fetchTasks = useCallback(async () => {
        setLoading(true);
        try {
            let url = "/tasks";
            const params = new URLSearchParams();

            if (filter !== "all") params.append("filter", filter);
            // We fetch all categories to handle filtering on the frontend and get accurate counts

            const queryString = params.toString();
            if (queryString) url += `?${queryString}`;

            const res = await api.get(url);

            // Handle both old and new response formats (backward compatible)
            const tasksData = res.data.data || res.data;
            const finalTasks = Array.isArray(tasksData) ? tasksData : [];
            setTasks(finalTasks);

            // Update category counts based on full user list
            const counts = finalTasks.reduce((acc, t) => {
                const cat = t.category || 'Other';
                acc[cat] = (acc[cat] || 0) + 1;
                return acc;
            }, { All: finalTasks.length });
            setCategoryCounts(counts);

        } catch (error) {
            toast.error("Failed to fetch tasks");
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [filter, activeCategory]);

    useEffect(() => {
        setSelectedTaskIds([]);
        fetchTasks();
    }, [fetchTasks]);

    useEffect(() => {
        const handleRefresh = () => fetchTasks();
        window.addEventListener("refresh-tasks", handleRefresh);
        return () => window.removeEventListener("refresh-tasks", handleRefresh);
    }, [fetchTasks]);

    const handleCreateOrUpdate = async (formData) => {
        try {
            const id = selectedTask?.id || selectedTask?._id;
            if (id) {
                await api.put(`/tasks/${id}`, formData);
                toast.success("Task updated successfully");
            } else {
                await api.post("/tasks", formData);
                toast.success("New task created");
            }
            setIsModalOpen(false);
            fetchTasks();
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    const handleToggleSelect = (id) => {
        setSelectedTaskIds(prev =>
            prev.includes(id) ? prev.filter(taskId => taskId !== id) : [...prev, id]
        );
    };

    const handleFinishSelected = async () => {
        if (selectedTaskIds.length === 0) return;

        const currentSelectedIds = [...selectedTaskIds];
        setSelectedTaskIds([]);

        try {
            await api.put(`/tasks/batch-update`, {
                ids: currentSelectedIds,
                updates: { completed: true }
            });
            toast.success(`${currentSelectedIds.length} tasks completed!`);
            fetchTasks();
        } catch (error) {
            toast.error("Failed to complete tasks");
            fetchTasks();
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedTaskIds.length === 0) return;
        if (!window.confirm(`Delete ${selectedTaskIds.length} selected tasks?`)) return;

        const currentSelectedIds = [...selectedTaskIds];
        setSelectedTaskIds([]);

        try {
            // Check if backend supports batch delete, otherwise loop (safer to assume batch-update for now if that's what we have)
            // But let's check if there is a batch delete endpoint. Assuming batch-update can handle 'status: deleted' or similar if implemented.
            // For now, let's use batch-update to set a flag or just loop if needed.
            // If the backend has BatchUpdate, we should probably add BatchDelete.

            // For now, I'll use a loop to ensure compatibility unless I'm sure about batch-delete.
            await Promise.all(currentSelectedIds.map(id => api.delete(`/tasks/${id}`)));

            toast.success(`${currentSelectedIds.length} tasks removed`);
            fetchTasks();
        } catch (error) {
            toast.error("Bulk delete failed");
            fetchTasks();
        }
    };

    const handleToggle = async (task) => {
        const taskId = task.id || task._id;
        if (!taskId) {
            console.error("Task ID missing in handleToggle", task);
            return;
        }

        try {
            // Optimistic update
            const updatedStatus = !task.completed;

            // Update local state immediately
            setTasks(prev => prev.map(t => {
                const tId = t.id || t._id;
                return tId === taskId ? { ...t, completed: updatedStatus } : t;
            }));

            // Send to backend
            await api.put(`/tasks/${taskId}`, { completed: updatedStatus });

            toast.success(updatedStatus ? "Objective completed! 🎉" : "Marked as pending");
        } catch (error) {
            console.error("Toggle failed:", error);
            toast.error("Update failed");
            fetchTasks(); // Revert on error
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this task?")) {
            try {
                const task = tasks.find(t => (t.id || t._id) === id);
                const taskId = task?.id || task?._id || id;
                await api.delete(`/tasks/${taskId}`);
                setTasks(tasks.filter(t => (t.id || t._id) !== id));
                toast.success("Task deleted");
            } catch (error) {
                toast.error("Delete failed");
            }
        }
    };

    const handleAction = async (actionId, task) => {
        const taskId = task.id || task._id;

        switch (actionId) {
            case 'toggleComplete':
                handleToggle(task);
                break;
            case 'togglePin':
                try {
                    const res = await api.put(`/tasks/${taskId}/pin`);
                    setTasks(prev => prev.map(t =>
                        (t.id || t._id) === taskId ? { ...t, pinned: res.data.pinned } : t
                    ));
                    toast.success(res.data.pinned ? "Task pinned" : "Task unpinned");
                } catch (error) {
                    toast.error("Failed to pin task");
                }
                break;
            case 'duplicate':
                try {
                    const res = await api.post(`/tasks/${taskId}/duplicate`);
                    toast.success("Task duplicated");
                    fetchTasks();
                } catch (error) {
                    toast.error("Failed to duplicate task");
                }
                break;
            case 'edit':
            case 'details':
                setSelectedTask(task);
                setIsModalOpen(true);
                break;
            case 'readAloud':
                if ('speechSynthesis' in window) {
                    const text = `${task.title}. ${task.description || ''}`;
                    const utterance = new SpeechSynthesisUtterance(text);
                    window.speechSynthesis.speak(utterance);
                    toast.info("Reading task aloud...");
                } else {
                    toast.error("Speech synthesis not supported");
                }
                break;
            case 'share':
                if (navigator.share) {
                    navigator.share({
                        title: task.title,
                        text: task.description,
                        url: window.location.href,
                    }).catch(() => { });
                } else {
                    navigator.clipboard.writeText(`${task.title}: ${task.description}`);
                    toast.success("Link copied to clipboard");
                }
                break;
            case 'delete':
                handleDelete(taskId);
                break;
            default:
                break;
        }
    };

    const SkeletonLoader = () => (
        <div className="space-y-4">
            {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-slate-200 animate-pulse rounded-2xl" />
            ))}
        </div>
    );

    const EmptyState = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-32 text-center"
        >
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-primary-500/10 blur-[60px] rounded-full" />
                <div className="relative w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center text-primary-500 border border-slate-100">
                    <ListTodo size={48} strokeWidth={1.5} />
                </div>
                <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                    className="absolute -top-4 -right-4 w-10 h-10 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shadow-lg border border-amber-200"
                >
                    <Plus size={20} strokeWidth={3} />
                </motion.div>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Focus on what matters</h3>
            <p className="text-slate-500 mt-3 max-w-sm mx-auto text-lg leading-relaxed">
                Your workspace is currently clear. Ready to launch a new objective and stay in the flow?
            </p>
            <button
                onClick={() => { setSelectedTask(null); setIsModalOpen(true); }}
                className="mt-10 px-10 py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl shadow-slate-900/10 hover:shadow-2xl hover:bg-black transition-all transform hover:-translate-y-1"
            >
                Launch First Task
            </button>
        </motion.div>
    );

    const { searchTerm } = useSearch();

    const filteredTasks = useMemo(() => {
        let result = tasks;

        // 1. Category Filter (Frontend driven)
        if (activeCategory !== "All") {
            result = result.filter(task => task.category === activeCategory);
        }

        // 2. Search Filter
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            result = result.filter(task =>
                task.title?.toLowerCase().includes(lowerSearch) ||
                task.description?.toLowerCase().includes(lowerSearch)
            );
        }

        // 3. Sort: Pinned first, then by createdAt (newest first)
        return [...result].sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
    }, [tasks, searchTerm, activeCategory]);

    return (
        <div className="max-w-6xl mx-auto px-2 sm:px-4 pb-20 overflow-x-hidden">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-black uppercase tracking-wider">
                        {filteredTasks.filter(t => !t.completed).length} Pending
                    </span>
                    <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                        {filteredTasks.length} Total Objectives
                    </span>
                </div>
            </div>

            <CategoryBar
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
                counts={categoryCounts}
            />

            <SelectionToolbar
                selectedCount={selectedTaskIds.length}
                onComplete={handleFinishSelected}
                onDelete={handleDeleteSelected}
                onCancel={() => setSelectedTaskIds([])}
            />


            {loading ? (
                <SkeletonLoader />
            ) : filteredTasks.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                    <AnimatePresence>
                        {filteredTasks.map((task) => (
                            <TaskCard
                                key={task.id || task._id}
                                task={task}
                                isSelected={selectedTaskIds.includes(task.id || task._id)}
                                onSelect={() => handleToggleSelect(task.id || task._id)}
                                onToggle={handleToggle}
                                onDelete={handleDelete}
                                onEdit={(task) => { setSelectedTask(task); setIsModalOpen(true); }}
                                onAction={handleAction}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                <EmptyState />
            )}

            <TaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleCreateOrUpdate}
                task={selectedTask}
            />

            <VoiceTaskTrigger />
        </div>
    );
};

export default Tasks;
