import { useState, useEffect } from 'react';
import { DndContext, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getKanbanTasks, updateTaskStatus } from '../services/taskService';
import { formatDate, isOverdue } from '../utils/dateHelpers';
import { toast } from 'sonner';
import { ListTodo, Circle, Clock, CheckCircle2 } from 'lucide-react';
import EmptyState from '../components/ui/EmptyState';

const TaskCard = ({ task }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const priorityColors = {
        high: 'border-l-4 border-l-red-500',
        medium: 'border-l-4 border-l-yellow-500',
        low: 'border-l-4 border-l-green-500',
    };

    const dueDateOverdue = task.dueDate && isOverdue(task.dueDate);
    const subtaskProgress = task.subtasks?.length > 0
        ? Math.round((task.subtasks.filter(st => st.completed).length / task.subtasks.length) * 100)
        : null;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`task-card p-4 mb-3 ${priorityColors[task.priority]}`}
        >
            <h4 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                {task.title}
            </h4>

            {task.description && (
                <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                    {task.description.length > 100
                        ? `${task.description.substring(0, 100)}...`
                        : task.description}
                </p>
            )}

            <div className="flex flex-wrap gap-2 mb-3">
                {task.tags?.map((tag, idx) => (
                    <span key={idx} className="tag-chip text-xs px-2 py-1">
                        {tag}
                    </span>
                ))}
            </div>

            <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                    <span className={`priority-badge priority-${task.priority}`}>
                        {task.priority}
                    </span>

                    {task.dueDate && (
                        <span className={dueDateOverdue ? 'overdue-badge' : 'text-gray-500'}>
                            {formatDate(task.dueDate)}
                        </span>
                    )}
                </div>

                {subtaskProgress !== null && (
                    <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-gray-200">
                            <div
                                className="h-full rounded-full bg-primary-500 transition-all"
                                style={{ width: `${subtaskProgress}%` }}
                            />
                        </div>
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            {subtaskProgress}%
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

const KanbanColumn = ({ title, tasks, status, icon: Icon, color }) => {
    return (
        <div className="flex-1 min-w-[300px]">
            <div className={`flex items-center gap-2 mb-4 pb-3 border-b-2 ${color}`}>
                <Icon className="w-5 h-5" />
                <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                    {title}
                </h3>
                <span className="ml-auto px-2 py-1 rounded-full bg-gray-200 text-xs font-semibold">
                    {tasks.length}
                </span>
            </div>

            <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                <div className="min-h-[500px]">
                    {tasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 opacity-50">
                            <Icon className="w-12 h-12 mb-2" style={{ color: 'var(--text-tertiary)' }} />
                            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                                No tasks {status}
                            </p>
                        </div>
                    ) : (
                        tasks.map(task => <TaskCard key={task.id} task={task} />)
                    )}
                </div>
            </SortableContext>
        </div>
    );
};

const KanbanBoard = () => {
    const [tasks, setTasks] = useState({
        todo: [],
        in_progress: [],
        completed: []
    });
    const [loading, setLoading] = useState(true);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    useEffect(() => {
        fetchKanbanTasks();
    }, []);

    const fetchKanbanTasks = async () => {
        try {
            const response = await getKanbanTasks();
            setTasks(response.data);
        } catch (error) {
            toast.error('Failed to load Kanban board');
        } finally {
            setLoading(false);
        }
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;

        if (!over) return;

        const activeTask = findTask(active.id);
        const overColumn = findColumn(over.id);

        if (!activeTask || !overColumn) return;

        const newStatus = overColumn;
        const oldStatus = findTaskStatus(active.id);

        if (newStatus === oldStatus) return;

        // Optimistic update
        setTasks(prev => {
            const updated = { ...prev };
            updated[oldStatus] = updated[oldStatus].filter(t => t.id !== active.id);
            updated[newStatus] = [...updated[newStatus], { ...activeTask, status: newStatus }];
            return updated;
        });

        try {
            await updateTaskStatus(active.id, newStatus);
            toast.success(`Task moved to ${newStatus.replace('_', ' ')}`);
        } catch (error) {
            toast.error('Failed to update task status');
            // Revert on error
            fetchKanbanTasks();
        }
    };

    const findTask = (id) => {
        for (const column of Object.values(tasks)) {
            const task = column.find(t => t.id === id);
            if (task) return task;
        }
        return null;
    };

    const findTaskStatus = (id) => {
        for (const [status, column] of Object.entries(tasks)) {
            if (column.find(t => t.id === id)) return status;
        }
        return null;
    };

    const findColumn = (id) => {
        // If dropped on a task, find which column contains it
        const taskStatus = findTaskStatus(id);
        if (taskStatus) return taskStatus;

        // If dropped on column directly
        if (['todo', 'in_progress', 'completed'].includes(id)) {
            return id;
        }

        return null;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    const totalTasks = tasks.todo.length + tasks.in_progress.length + tasks.completed.length;

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                    Kanban Board
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Drag and drop tasks to update their status
                </p>
            </div>

            {totalTasks === 0 ? (
                <EmptyState
                    icon={ListTodo}
                    title="No Tasks Yet"
                    description="Create your first task and start organizing your work with the Kanban board."
                    actionText="Go to Tasks"
                    onAction={() => window.location.href = '/tasks'}
                />
            ) : (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragEnd={handleDragEnd}
                >
                    <div className="flex gap-6 overflow-x-auto pb-6">
                        <KanbanColumn
                            title="To Do"
                            tasks={tasks.todo}
                            status="todo"
                            icon={Circle}
                            color="border-blue-500"
                        />
                        <KanbanColumn
                            title="In Progress"
                            tasks={tasks.in_progress}
                            status="in_progress"
                            icon={Clock}
                            color="border-purple-500"
                        />
                        <KanbanColumn
                            title="Completed"
                            tasks={tasks.completed}
                            status="completed"
                            icon={CheckCircle2}
                            color="border-green-500"
                        />
                    </div>
                </DndContext>
            )}
        </div>
    );
};

export default KanbanBoard;
