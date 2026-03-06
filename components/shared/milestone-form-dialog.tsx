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
import { createMilestone, updateMilestone } from "@/lib/milestone-actions"
import { Plus, Pencil, Loader2 } from "lucide-react"

const COLOR_PALETTE = [
    "#3b82f6", // blue
    "#10b981", // emerald
    "#f59e0b", // amber
    "#ef4444", // red
    "#8b5cf6", // violet
    "#ec4899", // pink
    "#06b6d4", // cyan
    "#f97316", // orange
]

type Milestone = {
    milestone_id: number
    title: string
    start_date: Date
    end_date: Date
    progress: number
    color: string | null
}

interface MilestoneFormDialogProps {
    projectGroupId: number
    milestone?: Milestone | null
    trigger?: React.ReactNode
}

function formatDateForInput(date: Date): string {
    const d = new Date(date)
    return d.toISOString().split("T")[0]
}

export function MilestoneFormDialog({
    projectGroupId,
    milestone,
    trigger,
}: MilestoneFormDialogProps) {
    const isEditing = !!milestone
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    const [title, setTitle] = useState(milestone?.title || "")
    const [startDate, setStartDate] = useState(
        milestone ? formatDateForInput(milestone.start_date) : ""
    )
    const [endDate, setEndDate] = useState(
        milestone ? formatDateForInput(milestone.end_date) : ""
    )
    const [progress, setProgress] = useState(milestone?.progress ?? 0)
    const [color, setColor] = useState(milestone?.color || COLOR_PALETTE[0])

    const resetForm = () => {
        if (!isEditing) {
            setTitle("")
            setStartDate("")
            setEndDate("")
            setProgress(0)
            setColor(COLOR_PALETTE[0])
        }
        setError(null)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        const formData = new FormData()
        if (isEditing) {
            formData.set("milestoneId", String(milestone!.milestone_id))
        } else {
            formData.set("projectGroupId", String(projectGroupId))
        }
        formData.set("title", title)
        formData.set("startDate", startDate)
        formData.set("endDate", endDate)
        formData.set("progress", String(progress))
        formData.set("color", color)

        startTransition(async () => {
            try {
                const action = isEditing ? updateMilestone : createMilestone
                const result = await action(formData)
                if (result && "error" in result && result.error) {
                    setError(result.error)
                } else {
                    setOpen(false)
                    resetForm()
                }
            } catch (err) {
                setError("Something went wrong. Please try again.")
            }
        })
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                setOpen(v)
                if (v && isEditing && milestone) {
                    setTitle(milestone.title)
                    setStartDate(formatDateForInput(milestone.start_date))
                    setEndDate(formatDateForInput(milestone.end_date))
                    setProgress(milestone.progress)
                    setColor(milestone.color || COLOR_PALETTE[0])
                }
                if (!v) setError(null)
            }}
        >
            <DialogTrigger asChild>
                {trigger || (
                    <Button size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Milestone
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? "Edit Milestone" : "Add Milestone"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Update the milestone details."
                            : "Define a project phase or milestone with dates and progress."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="milestone-title">Title</Label>
                        <Input
                            id="milestone-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Requirements Gathering"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="milestone-start">Start Date</Label>
                            <Input
                                id="milestone-start"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="milestone-end">End Date</Label>
                            <Input
                                id="milestone-end"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                min={startDate}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="milestone-progress">
                            Progress: {progress}%
                        </Label>
                        <input
                            id="milestone-progress"
                            type="range"
                            min={0}
                            max={100}
                            step={5}
                            value={progress}
                            onChange={(e) =>
                                setProgress(parseInt(e.target.value))
                            }
                            className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                            <span>0%</span>
                            <span>50%</span>
                            <span>100%</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Color</Label>
                        <div className="flex gap-2 flex-wrap">
                            {COLOR_PALETTE.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setColor(c)}
                                    className={`w-7 h-7 rounded-full border-2 transition-all ${color === c
                                            ? "border-foreground scale-110"
                                            : "border-transparent"
                                        }`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={isPending}>
                            {isPending && (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            )}
                            {isEditing ? "Save Changes" : "Add Milestone"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
