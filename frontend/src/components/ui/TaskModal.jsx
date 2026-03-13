import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Bell, Sparkles, BrainCircuit, Loader2, ListPlus, Mic, MicOff } from "lucide-react";
import { cn } from "../../utils/cn";
import Input from "./Input";
import AttachmentZone from "../tasks/AttachmentZone";
import { useState, useEffect } from "react";
import api from "../../services/api";
import { toast } from "sonner";

const TaskModal = ({ isOpen, onClose, onSave, task = null }) => {
    const cleanData = (data) => {
        const cleaned = { ...data };
        ['dueDate', 'reminderDate', 'phoneNumber'].forEach(key => {
            if (cleaned[key] === "") delete cleaned[key];
        });
        return cleaned;
    };

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
        status: "todo",
        estimatedTime: 60
    });
    const [isGeneratingBreakdown, setIsGeneratingBreakdown] = useState(false);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [isSuggestingReminder, setIsSuggestingReminder] = useState(false);
    const [isBulkMode, setIsBulkMode] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isProcessingVoice, setIsProcessingVoice] = useState(false);
    const [recognition, setRecognition] = useState(null);

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
                status: task.status || "todo",
                estimatedTime: task.estimatedTime || 60,
                createdAt: task.createdAt
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
                status: "todo",
                estimatedTime: 60
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
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recog = new SpeechRecognition();
            recog.continuous = false;
            recog.interimResults = false;
            recog.lang = 'en-US';

            recog.onstart = () => setIsListening(true);
            recog.onend = () => setIsListening(false);

            recog.onresult = async (event) => {
                const transcript = event.results[0][0].transcript;
                await handleVoiceProcess(transcript);
            };

            recog.onerror = (event) => {
                console.error("Speech recognition error", event.error);
                setIsListening(false);
                toast.error("Voice recognition failed.");
            };

            setRecognition(recog);
        }
    }, []);

    const handleVoiceProcess = async (transcript) => {
        setIsProcessingVoice(true);
        try {
            const res = await api.post('/ai/voice-command', { transcript });
            if (res.data.success && res.data.task) {
                const taskData = res.data.task;
                setFormData(prev => ({
                    ...prev,
                    title: taskData.title || prev.title,
                    description: taskData.description || prev.description,
                    priority: taskData.priority?.toLowerCase() || prev.priority,
                    category: taskData.category || prev.category,
                    dueDate: taskData.dueDate ? new Date(taskData.dueDate).toISOString().slice(0, 16) : prev.dueDate
                }));
                toast.success("AI Assessment complete!", {
                    icon: <Sparkles className="text-amber-500" size={16} />
                });
            }
        } catch (err) {
            toast.error("AI failed to assess voice command");
        } finally {
            setIsProcessingVoice(false);
        }
    };

    const toggleListening = () => {
        if (!recognition) {
            toast.error("Speech recognition not supported");
            return;
        }
        if (isListening) {
            recognition.stop();
        } else {
            recognition.start();
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
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setIsBulkMode(!isBulkMode)}
                                className={cn(
                                    "p-2 rounded-xl transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-wider",
                                    isBulkMode
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                                        : "bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-blue-500"
                                )}
                                title="Bulk Mode - Add multiple tasks list-wise"
                            >
                                <ListPlus size={18} />
                                {!isBulkMode ? "" : "Bulk Mode"}
                            </button>
                            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all">
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                     <form onSubmit={async (e) => {
                        e.preventDefault();
                        if (isBulkMode && !task) {
                            const titles = formData.title.split('\n').filter(t => t.trim() !== '');
                            if (titles.length === 0) return;

                            const bulkData = titles.map(title => cleanData({
                                ...formData,
                                title: title.trim()
                            }));
                            onSave(bulkData);
                        } else {
                            onSave(cleanData(formData));
                        }
                    }} className="flex flex-col overflow-hidden">
                        <div className="p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                            {formData.createdAt && (
                                <div className="mb-4 flex items-center justify-between px-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Registered</span>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full uppercase tracking-widest">
                                        {new Date(formData.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                    </span>
                                </div>
                            )}
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between ml-1">
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                            {isBulkMode ? "Task List (one per line)" : "Task Name"}
                                        </label>
                                        {!isBulkMode && (
                                            <button
                                                type="button"
                                                onClick={toggleListening}
                                                className={cn(
                                                    "flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                                                    isListening 
                                                        ? "bg-rose-500 text-white animate-pulse" 
                                                        : isProcessingVoice 
                                                            ? "bg-amber-500 text-white" 
                                                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary-600"
                                                )}
                                            >
                                                {isProcessingVoice ? (
                                                    <Loader2 size={12} className="animate-spin" />
                                                ) : isListening ? (
                                                    <MicOff size={12} />
                                                ) : (
                                                    <Mic size={12} />
                                                )}
                                                {isProcessingVoice ? "AI Assessing..." : isListening ? "Listening..." : "Voice Assessment"}
                                            </button>
                                        )}
                                    </div>
                                    {isBulkMode ? (
                                        <textarea
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            required
                                            placeholder="Task 1&#10;Task 2&#10;Task 3"
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none transition-all duration-300 focus:ring-4 focus:ring-primary-100 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 min-h-[120px] font-medium"
                                        />
                                    ) : (
                                        <Input
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            required
                                            className="bg-slate-50 dark:bg-slate-800 border-none text-slate-800 dark:text-slate-100"
                                        />
                                    )}
                                </div>

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
                                    <Input
                                        type="datetime-local"
                                        value={formData.dueDate}
                                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                        className="border-none bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Est. Duration</label>
                                        <div className="flex gap-2">
                                            {[
                                                { label: '30m', value: 30 },
                                                { label: '1h', value: 60 },
                                                { label: '2h', value: 120 },
                                                { label: '3h', value: 180 }
                                            ].map(d => (
                                                <button
                                                    key={d.value}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, estimatedTime: d.value })}
                                                    className={cn(
                                                        "flex-1 py-3 px-1 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all",
                                                        formData.estimatedTime === d.value
                                                            ? "bg-primary-600 text-white border-primary-600 shadow-md"
                                                            : "bg-white dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-800"
                                                    )}
                                                >
                                                    {d.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Expected Finish</label>
                                        <div className="px-5 py-3.5 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 rounded-2xl flex items-center justify-between">
                                            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest italic">Target</span>
                                            <span className="text-sm font-black text-emerald-700 dark:text-emerald-300 font-mono">
                                                {formData.dueDate ? (
                                                    new Date(new Date(formData.dueDate).getTime() + formData.estimatedTime * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                ) : "--:--"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Recurrence</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {[
                                            { id: "none", label: "None" },
                                            { id: "daily", label: "Daily" },
                                            { id: "weekly", label: "Weekly" },
                                            { id: "monthly", label: "Monthly" }
                                        ].map((r) => (
                                            <button
                                                key={r.id}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, recurrence: r.id })}
                                                className={cn(
                                                    "py-2 rounded-xl border-2 text-xs font-bold transition-all",
                                                    formData.recurrence === r.id
                                                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200"
                                                        : "bg-white dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-700"
                                                )}
                                            >
                                                {r.label}
                                            </button>
                                        ))}
                                    </div>
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
                                                    className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 transition-all shadow-sm flex items-center justify-center shrink-0"
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
                                            className="flex items-center gap-2 text-xs font-bold text-sky-600 hover:text-sky-700 disabled:opacity-50 transition-colors"
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
                                {isBulkMode ? "Launch Tasks" : task ? "Update Objective" : "Launch Task"}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default TaskModal;
