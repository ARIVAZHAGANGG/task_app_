import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Bell, Sparkles, BrainCircuit, Loader2 } from "lucide-react";
import { cn } from "../../utils/cn";
import Input from "./Input";
import AttachmentZone from "../tasks/AttachmentZone";
import { useState, useEffect } from "react";
import api from "../../services/api";
import { toast } from "sonner";

const TaskModal = ({ isOpen, onClose, onSave, task = null }) => {
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        priority: "medium",
        dueDate: "",
        reminderEnabled: false,
        reminderDate: "",
        subtasks: [],
        recurrence: "none",
        smsEnabled: false,
        phoneNumber: "",
        category: "Personal",
        status: "todo"
    });
    const [isGeneratingBreakdown, setIsGeneratingBreakdown] = useState(false);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [isSuggestingReminder, setIsSuggestingReminder] = useState(false);

    useEffect(() => {
        if (task) {
            setFormData({
                title: task.title,
                description: task.description || "",
                priority: task.priority || "medium",
                dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : "",
                reminderEnabled: task.reminderEnabled || false,
                reminderDate: task.reminderDate ? new Date(task.reminderDate).toISOString().slice(0, 16) : "",
                subtasks: task.subtasks || [],
                recurrence: task.recurrence || "none",
                smsEnabled: task.smsEnabled || false,
                phoneNumber: task.phoneNumber || "",
                category: task.category || "Personal",
                status: task.status || "todo"
            });
        } else {
            setFormData({
                title: "",
                description: "",
                priority: "medium",
                dueDate: "",
                reminderEnabled: false,
                reminderDate: "",
                subtasks: [],
                recurrence: "none",
                smsEnabled: false,
                phoneNumber: "",
                category: "Personal",
                status: "todo"
            });
        }
    }, [task, isOpen]);

    const handleAIBreakdown = async () => {
        if (!formData.title) return;
        setIsGeneratingBreakdown(true);
        try {
            const res = await api.post("/tasks/breakdown", {
                title: formData.title,
                description: formData.description
            });
            const newSubtasks = res.data.breakdown.map(title => ({ title, completed: false }));
            setFormData(prev => ({
                ...prev,
                subtasks: [...prev.subtasks, ...newSubtasks]
            }));
            toast.success("AI breakdown successful!");
        } catch (error) {
            toast.error("AI breakdown failed");
        } finally {
            setIsGeneratingBreakdown(false);
        }
    };

    const handleAISuggestReminder = async () => {
        if (!formData.title) return;
        setIsSuggestingReminder(true);
        try {
            const res = await api.post("/ai/suggest-reminder", {
                title: formData.title,
                priority: formData.priority,
                dueDate: formData.dueDate
            });
            if (res.data.reminderDate) {
                setFormData(prev => ({
                    ...prev,
                    reminderEnabled: true,
                    reminderDate: new Date(res.data.reminderDate).toISOString().slice(0, 16)
                }));
                toast.success("AI suggested an optimal reminder!");
            }
        } catch (error) {
            toast.error("AI failed to suggest reminder");
        } finally {
            setIsSuggestingReminder(false);
        }
    };

    useEffect(() => {
        const getSuggestion = async () => {
            if (!formData.dueDate || task) return; // Only suggest for new tasks with due date

            setIsSuggesting(true);
            try {
                const res = await api.get(`/tasks/priority-suggestion?dueDate=${formData.dueDate}`);
                if (res.data.suggestedPriority) {
                    setFormData(prev => ({ ...prev, priority: res.data.suggestedPriority }));
                }
            } catch (err) {
                console.error("Failed to get priority suggestion:", err);
            } finally {
                setIsSuggesting(false);
            }
        };

        const timeoutId = setTimeout(getSuggestion, 500); // Debounce
        return () => clearTimeout(timeoutId);
    }, [formData.dueDate, task]);

    if (!isOpen) return null;

    const priorities = [
        { id: "low", label: "Low", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
        { id: "medium", label: "Medium", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
        { id: "high", label: "High", color: "text-red-600", bg: "bg-red-50", border: "border-red-100" },
    ];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-950/40 backdrop-blur-[6px]"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 30 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_32px_64px_-15px_rgba(0,0,0,0.15)] overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh]"
                >
                    <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 flex items-center justify-center">
                                <Plus size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                                {task ? "Update Task" : "New Task"}
                            </h2>
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={(e) => {
                        e.preventDefault();
                        onSave(formData);
                    }} className="flex flex-col overflow-hidden">
                        <div className="p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                            <div className="space-y-6">
                                <Input
                                    label="Task Name"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                    className="bg-slate-50 dark:bg-slate-800 border-none text-slate-800 dark:text-slate-100"
                                />

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between ml-1">
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Priority Level</label>
                                        {isSuggesting && (
                                            <span className="text-[10px] text-primary-600 font-bold uppercase animate-pulse">
                                                AI is suggesting...
                                            </span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        {priorities.map((p) => (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, priority: p.id })}
                                                className={cn(
                                                    "py-2.5 rounded-2xl border-2 transition-all duration-300 text-sm font-bold",
                                                    formData.priority === p.id
                                                        ? `${p.bg} ${p.color} border-current ring-4 ring-current/10 dark:bg-opacity-20`
                                                        : "bg-white dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                                                )}
                                            >
                                                {p.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Category</label>
                                    <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2">
                                        {["Coding", "Work", "Home", "Health", "Study", "Personal", "Other"].map((cat) => (
                                            <button
                                                key={cat}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, category: cat })}
                                                className={cn(
                                                    "px-5 py-2.5 rounded-2xl border-2 transition-all whitespace-nowrap text-sm font-bold shrink-0",
                                                    formData.category === cat
                                                        ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white shadow-lg"
                                                        : "bg-white text-slate-500 border-slate-100 hover:border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:border-slate-600"
                                                )}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Deadline (Optional)</label>
                                    <Input
                                        type="datetime-local"
                                        value={formData.dueDate}
                                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                        className="border-none bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                                    />
                                </div>

                                {/* Reminder Section */}
                                <div className="p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold">
                                            <Bell size={16} />
                                            <span>Set Reminder</span>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={formData.reminderEnabled}
                                                onChange={(e) => setFormData({ ...formData, reminderEnabled: e.target.checked })}
                                            />
                                            <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900 dark:peer-checked:bg-primary-600"></div>
                                        </label>
                                    </div>

                                    {formData.reminderEnabled && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden space-y-3"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="datetime-local"
                                                    value={formData.reminderDate}
                                                    onChange={(e) => setFormData({ ...formData, reminderDate: e.target.value })}
                                                    className="border-none bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 flex-1"
                                                    placeholder="Reminder Time"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleAISuggestReminder}
                                                    disabled={isSuggestingReminder}
                                                    className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 transition-all shadow-sm flex items-center justify-center shrink-0"
                                                    title="AI Suggest Optimal Time"
                                                >
                                                    {isSuggestingReminder ? <Loader2 className="animate-spin" size={16} /> : <BrainCircuit size={16} />}
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>

                                {task && (
                                    <div className="p-6 bg-slate-50/50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700">
                                        <AttachmentZone
                                            taskId={task.id || task._id}
                                            attachments={task.attachments || []}
                                            onUpdate={(updatedTask) => {
                                                // We don't necessarily update parent form data here 
                                                // because onSave will refetch from parent Tasks.jsx
                                                // but we can refresh the view if needed.
                                            }}
                                        />
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Description</label>
                                    <textarea
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none transition-all duration-300 focus:ring-4 focus:ring-primary-100 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 min-h-[120px]"
                                        placeholder="Briefly describe the objective..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={handleAIBreakdown}
                                            disabled={isGeneratingBreakdown || !formData.title}
                                            className="flex items-center gap-2 text-xs font-bold text-purple-600 hover:text-purple-700 disabled:opacity-50 transition-colors"
                                        >
                                            <Sparkles size={14} className={isGeneratingBreakdown ? "animate-spin" : ""} />
                                            {isGeneratingBreakdown ? "Generating..." : "AI Auto-Breakdown"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-8 pt-4 border-t border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-900">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-4 px-6 rounded-2xl text-slate-500 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-[2] py-4 px-6 rounded-2xl bg-slate-900 dark:bg-primary-600 text-white font-bold shadow-xl shadow-slate-900/10 hover:shadow-2xl hover:bg-black dark:hover:bg-primary-700 transition-all"
                            >
                                {task ? "Update Objective" : "Launch Task"}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default TaskModal;
