import React, { useState, useEffect } from 'react';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    addDays,
    eachDayOfInterval,
    isToday,
    parseISO
} from 'date-fns';
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Calendar as CalendarIcon,
    Clock,
    Sparkles,
    AlertCircle
} from 'lucide-react';
import TaskModal from '../components/ui/TaskModal';
import api from '../services/api';
import { cn } from '../utils/cn';
import { toast } from 'sonner';

const CalendarView = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);

    useEffect(() => {
        fetchTasks();
        window.addEventListener('refresh-tasks', fetchTasks);
        return () => window.removeEventListener('refresh-tasks', fetchTasks);
    }, []);

    const fetchTasks = async () => {
        try {
            const res = await api.get('/tasks');
            const taskData = Array.isArray(res.data) ? res.data : (res.data.data || []);
            setTasks(taskData);
        } catch (err) {
            console.error("Failed to load tasks for calendar");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTask = async (formData) => {
        try {
            await api.post("/tasks", formData);
            toast.success("New mission scheduled");
            setIsTaskModalOpen(false);
            fetchTasks();
            window.dispatchEvent(new CustomEvent("refresh-tasks"));
        } catch (error) {
            toast.error("Failed to schedule mission");
        }
    };

    const openCreateModal = (date = null) => {
        if (date) {
            // Set selected date for the modal
            setSelectedDate(date);
        } else {
            setSelectedDate(null);
        }
        setIsTaskModalOpen(true);
    };

    const renderHeader = () => {
        return (
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary-600 text-white rounded-2xl shadow-lg shadow-primary-500/20">
                        <CalendarIcon size={24} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                            {format(currentMonth, 'MMMM yyyy')}
                        </h1>
                        <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">
                            {tasks.filter(t => t.dueDate && isSameMonth(parseISO(t.dueDate), currentMonth)).length} Scheduled Events
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <button
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                        className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-all text-slate-600 dark:text-slate-400"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={() => setCurrentMonth(new Date())}
                        className="px-4 py-2 text-xs font-black uppercase text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all"
                    >
                        Today
                    </button>
                    <button
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                        className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-all text-slate-600 dark:text-slate-400"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        );
    };

    const renderDays = () => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return (
            <div className="grid grid-cols-7 mb-2">
                {days.map(day => (
                    <div key={day} className="text-center py-2 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                        {day}
                    </div>
                ))}
            </div>
        );
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const days = eachDayOfInterval({
            start: startDate,
            end: endDate,
        });

        return (
            <div className="grid grid-cols-7 border-t border-l border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl shadow-indigo-500/5 bg-white dark:bg-slate-900/40">
                {days.map((day, i) => {
                    const dayTasks = tasks.filter(task =>
                        task.dueDate && isSameDay(parseISO(task.dueDate), day)
                    );

                    return (
                        <div
                            key={i}
                            onClick={() => openCreateModal(day)}
                            className={cn(
                                "min-h-[140px] p-3 border-r border-b border-slate-100 dark:border-slate-800 transition-all cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30",
                                !isSameMonth(day, monthStart) ? "bg-slate-50/30 dark:bg-slate-900/20 text-slate-300 dark:text-slate-700" : "text-slate-700 dark:text-slate-200",
                                isToday(day) && "bg-primary-50/30 dark:bg-primary-900/5 shadow-inner"
                            )}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className={cn(
                                    "text-sm font-black w-7 h-7 flex items-center justify-center rounded-lg",
                                    isToday(day) ? "bg-primary-600 text-white shadow-lg shadow-primary-500/30" : ""
                                )}>
                                    {format(day, 'd')}
                                </span>
                                {isToday(day) && <Sparkles size={12} className="text-primary-500 animate-pulse" />}
                            </div>

                            <div className="space-y-1.5 overflow-y-auto max-h-[100px] custom-scrollbar-hide">
                                {dayTasks.map(task => (
                                    <div
                                        key={task.id}
                                        className={cn(
                                            "px-2 py-1 rounded-lg text-[10px] font-bold border truncate flex items-center gap-1.5",
                                            task.completed
                                                ? "bg-slate-100 text-slate-400 border-slate-200 line-through"
                                                : task.priority === 'high'
                                                    ? "bg-rose-50 text-rose-600 border-rose-100"
                                                    : "bg-indigo-50 text-indigo-600 border-indigo-100"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-1 h-1 rounded-full shrink-0",
                                            task.priority === 'high' ? "bg-rose-500" : "bg-indigo-500"
                                        )} />
                                        {task.title}
                                    </div>
                                ))}
                            </div>

                            {!isSameMonth(day, monthStart) && dayTasks.length > 0 && (
                                <div className="mt-1">
                                    <div className="w-full h-0.5 bg-slate-200 dark:bg-slate-800 rounded-full" />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto animate-slide-up">
            <div className="saas-card p-10 bg-white dark:bg-slate-900/50 border-slate-100 dark:border-slate-800/50">
                {renderHeader()}
                {renderDays()}
                {renderCells()}
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="saas-card p-6 flex items-center gap-4 bg-primary-600 text-white border-none">
                    <div className="p-3 bg-white/20 rounded-2xl">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Next Deadline</p>
                        <h4 className="text-lg font-black truncate">
                            {tasks.find(t => t.dueDate && !t.completed)?.title || "No pending tasks"}
                        </h4>
                    </div>
                </div>

                <div className="saas-card p-6 flex items-center gap-4">
                    <div className="p-3 bg-rose-500/10 text-rose-600 rounded-2xl">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Overdue Tasks</p>
                        <h4 className="text-lg font-black text-slate-800 dark:text-white">
                            {tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && !t.completed).length}
                        </h4>
                    </div>
                </div>

                <button
                    onClick={() => openCreateModal()}
                    className="saas-card p-6 flex items-center justify-center gap-3 border-dashed border-2 hover:border-primary-500 hover:text-primary-600 transition-all text-slate-400 group"
                >
                    <Plus size={24} className="group-hover:rotate-90 transition-transform" />
                    <span className="font-black uppercase tracking-widest text-sm">Schedule New Mission</span>
                </button>
            </div>

            <TaskModal
                isOpen={isTaskModalOpen}
                onClose={() => setIsTaskModalOpen(false)}
                onSave={handleCreateTask}
                task={selectedDate ? { dueDate: selectedDate } : null}
            />
        </div>
    );
};

export default CalendarView;
