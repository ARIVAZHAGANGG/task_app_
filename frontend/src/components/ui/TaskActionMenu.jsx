import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2,
    Pin,
    PinOff,
    FileText,
    Volume2,
    Share2,
    Edit3,
    Copy,
    Trash2,
    X
} from 'lucide-react';
import { cn } from '../../utils/cn';

const TaskActionMenu = ({
    isOpen,
    onClose,
    task,
    onAction,
    anchorRect
}) => {
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    const menuItems = [
        { id: 'toggleComplete', label: task.completed ? 'Mark Pending' : 'Mark Done', icon: CheckCircle2, color: 'emerald' },
        { id: 'togglePin', label: task.pinned ? 'Unpin Task' : 'Pin Task', icon: task.pinned ? PinOff : Pin, color: 'blue' },
        { id: 'details', label: 'View Details', icon: FileText, color: 'slate' },
        { id: 'readAloud', label: 'Read Aloud', icon: Volume2, color: 'orange' },
        { id: 'share', label: 'Share Task', icon: Share2, color: 'indigo' },
        { id: 'edit', label: 'Edit Objective', icon: Edit3, color: 'violet' },
        { id: 'duplicate', label: 'Duplicate', icon: Copy, color: 'slate' },
        { id: 'delete', label: 'Delete Task', icon: Trash2, color: 'red', danger: true },
    ];

    const colors = {
        emerald: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10',
        blue: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10',
        slate: 'text-slate-600 bg-slate-50 dark:bg-slate-500/10',
        orange: 'text-orange-600 bg-orange-50 dark:bg-orange-500/10',
        indigo: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10',
        violet: 'text-violet-600 bg-violet-50 dark:bg-violet-500/10',
        red: 'text-red-600 bg-red-50 dark:bg-red-500/10',
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay for mobile */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-950/20 backdrop-blur-sm z-[100] md:hidden"
                        onClick={onClose}
                    />

                    <motion.div
                        ref={menuRef}
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className={cn(
                            "fixed md:absolute z-[110] bg-white dark:bg-slate-900 rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)] border border-slate-100 dark:border-slate-800 overflow-hidden w-full max-w-[280px]",
                            "bottom-4 left-4 right-4 md:bottom-auto md:left-auto md:right-0 md:top-full mt-2 mx-auto md:mx-0"
                        )}
                    >
                        <div className="p-2">
                            <div className="flex items-center justify-between px-4 py-3 md:hidden border-b border-slate-50 dark:border-slate-800 mb-2">
                                <span className="font-bold text-slate-800 dark:text-slate-200">Task Actions</span>
                                <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                                    <X size={18} className="text-slate-400" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 gap-1">
                                {menuItems.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onAction(item.id, task);
                                                onClose();
                                            }}
                                            className={cn(
                                                "flex items-center gap-3 w-full px-4 py-3 rounded-2xl transition-all duration-200 group text-left",
                                                item.danger
                                                    ? "hover:bg-red-50 dark:hover:bg-red-900/20"
                                                    : "hover:bg-slate-50 dark:hover:bg-slate-800"
                                            )}
                                        >
                                            <div className={cn(
                                                "p-2 rounded-xl group-hover:scale-110 transition-transform",
                                                colors[item.color]
                                            )}>
                                                <Icon size={18} />
                                            </div>
                                            <span className={cn(
                                                "text-sm font-bold",
                                                item.danger ? "text-red-600" : "text-slate-700 dark:text-slate-300"
                                            )}>
                                                {item.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default TaskActionMenu;
