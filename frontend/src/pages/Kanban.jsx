import React, { useState, useEffect } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    Plus,
    MoreVertical,
    Calendar,
    AlertCircle,
    CheckCircle2,
    Circle,
    Clock,
    GripVertical
} from 'lucide-react';
import TaskModal from '../components/ui/TaskModal';
import api from '../services/api';
import { toast } from 'sonner';
import { cn } from '../utils/cn';

// --- Components ---

const KanbanCard = ({ task, isOverlay }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    };

    const priorityColors = {
        high: 'bg-rose-500/10 text-rose-600 border-rose-200/50',
        medium: 'bg-amber-500/10 text-amber-600 border-amber-200/50',
        low: 'bg-emerald-500/10 text-emerald-600 border-emerald-200/50'
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "group bg-white dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-grab active:cursor-grabbing relative",
                isOverlay && "shadow-2xl ring-2 ring-primary-500/20 rotate-2 cursor-grabbing"
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                        <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                            priorityColors[task.priority] || priorityColors.medium
                        )}>
                            {task.priority}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight truncate">
                            {task.category}
                        </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white leading-snug line-clamp-2">
                        {task.title}
                    </h4>
                </div>
                <div {...attributes} {...listeners} className="p-1 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-600">
                    <GripVertical size={16} />
                </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {task.dueDate && (
                        <div className="flex items-center gap-1.5 text-slate-400">
                            <Calendar size={12} />
                            <span className="text-[10px] font-bold">
                                {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                        </div>
                    )}
                    {task.subtasks?.length > 0 && (
                        <div className="flex items-center gap-1.5 text-slate-400">
                            <CheckCircle2 size={12} />
                            <span className="text-[10px] font-bold">
                                {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
                            </span>
                        </div>
                    )}
                </div>

                <div className="w-6 h-6 rounded-lg bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center text-slate-400">
                    <MoreVertical size={14} />
                </div>
            </div>
        </div>
    );
};

const KanbanColumn = ({ id, title, tasks, icon: Icon, color, onAddTask }) => {
    return (
        <div className="flex flex-col w-full min-w-[300px] h-[calc(100vh-180px)] bg-slate-50/50 dark:bg-slate-900/20 rounded-[32px] p-4 border border-slate-100 dark:border-slate-800/50">
            <header className="px-4 py-3 flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-xl border", color)}>
                        <Icon size={18} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">{title}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{tasks.length} Tasks</p>
                    </div>
                </div>
                <button
                    onClick={() => onAddTask(id)}
                    className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all"
                >
                    <Plus size={18} />
                </button>
            </header>

            <div className="flex-1 overflow-y-auto px-1 space-y-4 custom-scrollbar">
                <SortableContext id={id} items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {tasks.map(task => (
                        <KanbanCard key={task.id} task={task} />
                    ))}
                </SortableContext>

                {tasks.length === 0 && (
                    <div className="h-32 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center text-slate-400 gap-2">
                        <Icon size={24} className="opacity-20" />
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Empty Column</span>
                    </div>
                )}
            </div>
        </div>
    );
};

const Kanban = () => {
    const [tasks, setTasks] = useState([]);
    const [activeId, setActiveId] = useState(null);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState('todo');

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

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
            toast.error("Failed to load tasks");
        }
    };

    const handleCreateTask = async (formData) => {
        try {
            await api.post("/tasks", formData);
            toast.success("New task created on board");
            setIsTaskModalOpen(false);
            fetchTasks();
            window.dispatchEvent(new CustomEvent("refresh-tasks"));
        } catch (error) {
            toast.error("Failed to create task");
        }
    };

    const openAddTask = (status) => {
        setSelectedStatus(status);
        setIsTaskModalOpen(true);
    };

    const columns = {
        todo: tasks.filter(t => t.status === 'todo' || !t.status),
        in_progress: tasks.filter(t => t.status === 'in_progress'),
        completed: tasks.filter(t => t.status === 'completed' || t.completed)
    };

    const findContainer = (id) => {
        if (id in columns) return id;
        return Object.keys(columns).find(key => columns[key].find(t => t.id === id));
    };

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragOver = (event) => {
        const { active, over } = event;
        const overId = over?.id;

        if (!overId) return;

        const activeContainer = findContainer(active.id);
        const overContainer = findContainer(overId);

        if (!activeContainer || !overContainer || activeContainer === overContainer) return;

        setTasks(prev => {
            const activeItems = columns[activeContainer];
            const overItems = columns[overContainer];
            const activeIndex = activeItems.findIndex(i => i.id === active.id);
            const overIndex = overItems.findIndex(i => i.id === overId);

            let newIndex;
            if (overId in columns) {
                newIndex = overItems.length + 1;
            } else {
                newIndex = overIndex >= 0 ? overIndex : overItems.length + 1;
            }

            const activeTask = activeItems[activeIndex];
            const updatedTask = { ...activeTask, status: overContainer };

            const newTasks = [...prev];
            const taskIdx = newTasks.findIndex(t => t.id === active.id);
            newTasks[taskIdx] = updatedTask;

            return newTasks;
        });
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        const overId = over?.id;

        if (!overId) {
            setActiveId(null);
            return;
        }

        const activeContainer = findContainer(active.id);
        const overContainer = findContainer(overId);

        if (activeContainer && overContainer) {
            const activeIndex = columns[activeContainer].findIndex(i => i.id === active.id);
            const overIndex = columns[overContainer].findIndex(i => i.id === overId);

            if (activeIndex !== overIndex || activeContainer !== overContainer) {
                const targetStatus = overContainer;
                const taskId = active.id;

                try {
                    await api.put(`/tasks/${taskId}/status`, {
                        status: targetStatus
                    });
                    toast.success(`Task moved to ${targetStatus.replace('_', ' ')}`);
                } catch (err) {
                    toast.error("Failed to sync move");
                    fetchTasks();
                }
            }
        }

        setActiveId(null);
    };

    const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-slide-up">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">Focus <span className="text-primary-600">Board</span></h1>
                    <p className="text-slate-500 font-bold mt-1">Drag and drop to manage your workflow</p>
                </div>
            </header>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 overflow-x-auto pb-4 custom-scrollbar min-h-[600px]">
                    <KanbanColumn
                        id="todo"
                        title="To Do"
                        tasks={columns.todo}
                        icon={Circle}
                        color="bg-slate-100 dark:bg-slate-800/50 text-slate-500 border-slate-200 dark:border-slate-700"
                        onAddTask={openAddTask}
                    />
                    <KanbanColumn
                        id="in_progress"
                        title="In Progress"
                        tasks={columns.in_progress}
                        icon={Clock}
                        color="bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 border-indigo-100 dark:border-indigo-800/30"
                        onAddTask={openAddTask}
                    />
                    <KanbanColumn
                        id="completed"
                        title="Done"
                        tasks={columns.completed}
                        icon={CheckCircle2}
                        color="bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 border-emerald-100 dark:border-emerald-800/30"
                        onAddTask={openAddTask}
                    />
                </div>

                <DragOverlay dropAnimation={{
                    sideEffects: defaultDropAnimationSideEffects({
                        styles: { active: { opacity: '0.5' } },
                    }),
                }}>
                    {activeTask ? <KanbanCard task={activeTask} isOverlay /> : null}
                </DragOverlay>
            </DndContext>

            <TaskModal
                isOpen={isTaskModalOpen}
                onClose={() => setIsTaskModalOpen(false)}
                onSave={handleCreateTask}
                task={{ status: selectedStatus }}
            />
        </div>
    );
};

export default Kanban;
