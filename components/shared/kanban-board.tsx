"use client"

import { useTransition, useState } from "react"
import { updateTaskStatus, deleteTask } from "@/lib/task-actions"
import { TaskCardDialog } from "./task-card-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    ChevronRight,
    ChevronLeft,
    Trash2,
    Pencil,
    Loader2,
    Calendar,
    User,
    Plus,
} from "lucide-react"

type Task = {
    task_id: number
    project_group_id: number
    title: string
    description: string | null
    status: string
    priority: string
    assigned_to: number | null
    due_date: Date | null
    sort_order: number
    student: { student_id: number; student_name: string } | null
}

type Member = {
    student_id: number
    student_name: string
}

interface KanbanBoardProps {
    tasks: Task[]
    projectGroupId: number
    members: Member[]
    editable?: boolean
}

const COLUMNS = [
    { key: "todo", label: "To Do", color: "bg-slate-500" },
    { key: "in_progress", label: "In Progress", color: "bg-blue-500" },
    { key: "review", label: "Review", color: "bg-amber-500" },
    { key: "done", label: "Done", color: "bg-emerald-500" },
]

const PRIORITY_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
    high: { label: "High", variant: "destructive" },
    medium: { label: "Medium", variant: "secondary" },
    low: { label: "Low", variant: "default" },
}

const COLUMN_ORDER = COLUMNS.map(c => c.key)

export function KanbanBoard({ tasks, projectGroupId, members, editable = false }: KanbanBoardProps) {
    const [pendingTaskId, setPendingTaskId] = useState<number | null>(null)
    const [deletingTaskId, setDeletingTaskId] = useState<number | null>(null)
    const [isPending, startTransition] = useTransition()

    const moveTask = (taskId: number, newStatus: string) => {
        setPendingTaskId(taskId)
        const formData = new FormData()
        formData.set("taskId", String(taskId))
        formData.set("status", newStatus)
        startTransition(async () => {
            await updateTaskStatus(formData)
            setPendingTaskId(null)
        })
    }

    const handleDelete = (taskId: number) => {
        setDeletingTaskId(taskId)
        const formData = new FormData()
        formData.set("taskId", String(taskId))
        startTransition(async () => {
            await deleteTask(formData)
            setDeletingTaskId(null)
        })
    }

    const getPrevStatus = (status: string) => {
        const idx = COLUMN_ORDER.indexOf(status)
        return idx > 0 ? COLUMN_ORDER[idx - 1] : null
    }

    const getNextStatus = (status: string) => {
        const idx = COLUMN_ORDER.indexOf(status)
        return idx < COLUMN_ORDER.length - 1 ? COLUMN_ORDER[idx + 1] : null
    }

    const isOverdue = (dueDate: Date | null) => {
        if (!dueDate) return false
        return new Date(dueDate) < new Date(new Date().toDateString())
    }

    return (
        <div className="space-y-4">
            {editable && (
                <div className="flex justify-end">
                    <TaskCardDialog projectGroupId={projectGroupId} members={members} />
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {COLUMNS.map((col) => {
                    const colTasks = tasks.filter((t) => t.status === col.key)

                    return (
                        <div key={col.key} className="flex flex-col">
                            {/* Column header */}
                            <div className="flex items-center gap-2 mb-3">
                                <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                                <h3 className="text-sm font-semibold">{col.label}</h3>
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-auto">
                                    {colTasks.length}
                                </Badge>
                            </div>

                            {/* Task cards */}
                            <div className="space-y-2 min-h-[100px] bg-muted/20 rounded-lg p-2">
                                {colTasks.length === 0 && (
                                    <p className="text-xs text-muted-foreground text-center py-6">
                                        No tasks
                                    </p>
                                )}

                                {colTasks.map((task) => {
                                    const priorityCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium
                                    const taskPending = isPending && pendingTaskId === task.task_id
                                    const taskDeleting = isPending && deletingTaskId === task.task_id

                                    return (
                                        <div
                                            key={task.task_id}
                                            className="group bg-card border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
                                        >
                                            {/* Title + priority */}
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <p className="text-sm font-medium leading-tight flex-1">
                                                    {task.title}
                                                </p>
                                                <Badge variant={priorityCfg.variant} className="text-[9px] px-1.5 py-0 shrink-0">
                                                    {priorityCfg.label}
                                                </Badge>
                                            </div>

                                            {/* Description preview */}
                                            {task.description && (
                                                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                                    {task.description}
                                                </p>
                                            )}

                                            {/* Meta: assignee + due date */}
                                            <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-2">
                                                {task.student && (
                                                    <span className="flex items-center gap-1">
                                                        <User className="h-3 w-3" />
                                                        {task.student.student_name}
                                                    </span>
                                                )}
                                                {task.due_date && (
                                                    <span className={`flex items-center gap-1 ${isOverdue(task.due_date) && task.status !== 'done' ? 'text-destructive font-medium' : ''}`}>
                                                        <Calendar className="h-3 w-3" />
                                                        {new Date(task.due_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Actions: move / edit / delete */}
                                            {editable && (
                                                <div className="flex items-center justify-between border-t pt-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <div className="flex gap-1">
                                                        {getPrevStatus(task.status) && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6"
                                                                onClick={() => moveTask(task.task_id, getPrevStatus(task.status)!)}
                                                                disabled={taskPending}
                                                                title={`Move to ${COLUMNS.find(c => c.key === getPrevStatus(task.status))?.label}`}
                                                            >
                                                                {taskPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <ChevronLeft className="h-3 w-3" />}
                                                            </Button>
                                                        )}
                                                        {getNextStatus(task.status) && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6"
                                                                onClick={() => moveTask(task.task_id, getNextStatus(task.status)!)}
                                                                disabled={taskPending}
                                                                title={`Move to ${COLUMNS.find(c => c.key === getNextStatus(task.status))?.label}`}
                                                            >
                                                                {taskPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <ChevronRight className="h-3 w-3" />}
                                                            </Button>
                                                        )}
                                                    </div>

                                                    <div className="flex gap-1">
                                                        <TaskCardDialog
                                                            projectGroupId={projectGroupId}
                                                            members={members}
                                                            task={task}
                                                            trigger={
                                                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                                                    <Pencil className="h-3 w-3" />
                                                                </Button>
                                                            }
                                                        />
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 text-destructive hover:text-destructive"
                                                            onClick={() => handleDelete(task.task_id)}
                                                            disabled={taskDeleting}
                                                        >
                                                            {taskDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
