import React, { useState } from "react";
import {
    CheckCircle2,
    Check,
    AlertCircle,
    ListTodo,
    Calendar,
    Trash2,
    Edit3,
    Clock,
    Bell,
    AlertTriangle,
    MoreVertical,
    Pin,
    Tag
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../utils/cn";
import TaskActionMenu from "./TaskActionMenu";

const TaskCard = ({
    task,
    isSelected = false,
    onSelect,
    onToggle,
    onDelete,
    onEdit,
    onPin,
    onDuplicate,
    onAction
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Destructure task for easier access in the JSX
    const { title, description, priority, completed, category, dueDate, subtasks } = task;

    const formatDate = (date) => {
        if (!date) return "";
        return new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });
    };

    const priorityConfig = {
        high: { color: "text-red-600", bg: "bg-red-50", border: "border-red-600", gradient: "from-red-500/10 to-transparent", label: "High" },
        medium: { color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-500", gradient: "from-amber-500/10 to-transparent", label: "Medium" },
        low: { color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-600", gradient: "from-emerald-500/10 to-transparent", label: "Low" },
    };

    const config = priorityConfig[priority] || priorityConfig.medium;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            whileHover={{ y: -4 }}
            className={cn(
                "saas-card group cursor-pointer relative",
                completed && "opacity-75"
            )}
            onClick={() => onSelect?.(task)}
        >
            {/* Priority Indicator Stripe */}
            <div className={cn(
                "absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl",
                priority === 'high' ? "bg-red-500" :
                    priority === 'medium' ? "bg-amber-500" : "bg-green-500"
            )} />

            <div className="p-6 relative z-10">
                <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggle?.(task);
                        }}
                        className={cn(
                            "mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 shrink-0",
                            completed
                                ? "bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/20"
                                : "border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400"
                        )}
                    >
                        {completed && <Check size={14} strokeWidth={4} />}
                    </button>

                    <div className="flex-1 min-w-0">
                        {/* Title and Top Badges */}
                        <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2 min-w-0">
                                {task.pinned && <Pin size={14} className="text-primary-500 rotate-45 shrink-0" fill="currentColor" />}
                                <h3 className={cn(
                                    "text-lg font-black tracking-tight transition-all truncate",
                                    completed ? "text-slate-400 line-through" : "text-slate-900 dark:text-slate-100"
                                )}>
                                    {title}
                                </h3>
                            </div>
                            <div className={cn(
                                "badge shrink-0",
                                priority === 'high' ? "badge-danger" :
                                    priority === 'medium' ? "badge-warning" : "badge-success"
                            )}>
                                <AlertCircle size={10} strokeWidth={3} />
                                {priority}
                            </div>
                        </div>

                        {description && (
                            <p className={cn(
                                "text-sm line-clamp-2 mb-4 font-medium leading-relaxed",
                                completed ? "text-slate-400" : "text-slate-500 dark:text-slate-400"
                            )}>
                                {description}
                            </p>
                        )}

                        {/* Metadata Footer */}
                        <div className="flex flex-wrap items-center gap-4">
                            {dueDate && (
                                <div className={cn(
                                    "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider",
                                    !completed && new Date(dueDate) < new Date()
                                        ? "bg-red-50 text-red-600 border border-red-100"
                                        : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700"
                                )}>
                                    <Clock size={12} strokeWidth={3} />
                                    {new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </div>
                            )}

                            {category && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-wider border border-indigo-100 dark:border-indigo-900/30">
                                    <Tag size={12} strokeWidth={3} />
                                    {category}
                                </div>
                            )}

                            {subtasks?.length > 0 && (
                                <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-auto">
                                    <ListTodo size={12} strokeWidth={3} />
                                    {subtasks.filter(s => s.completed).length}/{subtasks.length}
                                </div>
                            )}

                            {/* Actions Menu */}
                            <div className="flex items-center gap-2 ml-auto">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsMenuOpen(!isMenuOpen);
                                    }}
                                    className={cn(
                                        "p-2 rounded-xl transition-all duration-300",
                                        isMenuOpen
                                            ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                                            : "text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                                    )}
                                >
                                    <MoreVertical size={16} />
                                </button>
                                <TaskActionMenu
                                    isOpen={isMenuOpen}
                                    onClose={() => setIsMenuOpen(false)}
                                    task={task}
                                    onAction={(actionId) => {
                                        setIsMenuOpen(false);
                                        onAction?.(actionId, task);
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// Memoize to prevent unnecessary re-renders
export default React.memo(TaskCard, (prevProps, nextProps) => {
    return (
        prevProps.task?.id === nextProps.task?.id &&
        prevProps.task?.completed === nextProps.task?.completed &&
        prevProps.task?.title === nextProps.task?.title &&
        prevProps.task?.priority === nextProps.task?.priority &&
        prevProps.isSelected === nextProps.isSelected
    );
});
