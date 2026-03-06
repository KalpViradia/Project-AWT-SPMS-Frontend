"use client"

import { useState, useTransition } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createTask, updateTask } from "@/lib/task-actions"
import { Plus, Pencil, Loader2 } from "lucide-react"

type TaskData = {
    task_id: number
    title: string
    description: string | null
    priority: string
    assigned_to: number | null
    due_date: Date | null
    status: string
}

type Member = {
    student_id: number
    student_name: string
}

interface TaskCardDialogProps {
    projectGroupId: number
    members: Member[]
    task?: TaskData | null
    trigger?: React.ReactNode
}

function formatDateForInput(date: Date | null): string {
    if (!date) return ""
    return new Date(date).toISOString().split("T")[0]
}

export function TaskCardDialog({
    projectGroupId,
    members,
    task,
    trigger,
}: TaskCardDialogProps) {
    const isEditing = !!task
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    const [title, setTitle] = useState(task?.title || "")
    const [description, setDescription] = useState(task?.description || "")
    const [priority, setPriority] = useState(task?.priority || "medium")
    const [assignedTo, setAssignedTo] = useState<string>(
        task?.assigned_to ? String(task.assigned_to) : ""
    )
    const [dueDate, setDueDate] = useState(formatDateForInput(task?.due_date || null))

    const resetForm = () => {
        if (!isEditing) {
            setTitle("")
            setDescription("")
            setPriority("medium")
            setAssignedTo("")
            setDueDate("")
        }
        setError(null)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        const formData = new FormData()
        if (isEditing) {
            formData.set("taskId", String(task!.task_id))
        }
        formData.set("projectGroupId", String(projectGroupId))
        formData.set("title", title)
        formData.set("description", description)
        formData.set("priority", priority)
        if (assignedTo) formData.set("assignedTo", assignedTo)
        if (dueDate) formData.set("dueDate", dueDate)

        startTransition(async () => {
            try {
                const action = isEditing ? updateTask : createTask
                const result = await action(formData)
                if (result && "error" in result && result.error) {
                    setError(result.error)
                } else {
                    setOpen(false)
                    resetForm()
                }
            } catch {
                setError("Something went wrong.")
            }
        })
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                setOpen(v)
                if (v && isEditing && task) {
                    setTitle(task.title)
                    setDescription(task.description || "")
                    setPriority(task.priority)
                    setAssignedTo(task.assigned_to ? String(task.assigned_to) : "")
                    setDueDate(formatDateForInput(task.due_date))
                }
                if (!v) setError(null)
            }}
        >
            <DialogTrigger asChild>
                {trigger || (
                    <Button size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Task
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit Task" : "New Task"}</DialogTitle>
                    <DialogDescription>
                        {isEditing ? "Update task details." : "Add a new task to the board."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="task-title">Title</Label>
                        <Input
                            id="task-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Design login page"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="task-desc">Description (optional)</Label>
                        <Textarea
                            id="task-desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Details about this task..."
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="task-priority">Priority</Label>
                            <select
                                id="task-priority"
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                            >
                                <option value="low">🟢 Low</option>
                                <option value="medium">🟡 Medium</option>
                                <option value="high">🔴 High</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="task-due">Due Date</Label>
                            <Input
                                id="task-due"
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="task-assign">Assign To</Label>
                        <select
                            id="task-assign"
                            value={assignedTo}
                            onChange={(e) => setAssignedTo(e.target.value)}
                            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                        >
                            <option value="">Unassigned</option>
                            {members.map((m) => (
                                <option key={m.student_id} value={m.student_id}>
                                    {m.student_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                            {isEditing ? "Save" : "Create Task"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
