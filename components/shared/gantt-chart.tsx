"use client"

import { useState, useTransition, useMemo } from "react"
import { MilestoneFormDialog } from "./milestone-form-dialog"
import { deleteMilestone } from "@/lib/milestone-actions"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2, Loader2, BarChart3 } from "lucide-react"

type Milestone = {
    milestone_id: number
    project_group_id: number
    title: string
    start_date: Date
    end_date: Date
    progress: number
    color: string | null
    sort_order: number
}

interface GanttChartProps {
    milestones: Milestone[]
    projectGroupId: number
    editable?: boolean
}

export function GanttChart({
    milestones,
    projectGroupId,
    editable = false,
}: GanttChartProps) {
    const [deletingId, setDeletingId] = useState<number | null>(null)
    const [isPending, startTransition] = useTransition()

    // Compute time range from milestones
    const { minDate, maxDate, totalDays } = useMemo(() => {
        if (milestones.length === 0) {
            const now = new Date()
            const start = new Date(now.getFullYear(), now.getMonth(), 1)
            const end = new Date(now.getFullYear(), now.getMonth() + 3, 0)
            return {
                minDate: start,
                maxDate: end,
                totalDays: Math.ceil(
                    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
                ),
            }
        }

        const starts = milestones.map((m) => new Date(m.start_date).getTime())
        const ends = milestones.map((m) => new Date(m.end_date).getTime())

        // Add 5% padding on each side
        const rangeMs = Math.max(...ends) - Math.min(...starts)
        const padding = Math.max(rangeMs * 0.05, 7 * 24 * 60 * 60 * 1000) // at least 7 days

        const min = new Date(Math.min(...starts) - padding)
        const max = new Date(Math.max(...ends) + padding)

        return {
            minDate: min,
            maxDate: max,
            totalDays: Math.ceil(
                (max.getTime() - min.getTime()) / (1000 * 60 * 60 * 24)
            ),
        }
    }, [milestones])

    // Generate month labels for the header
    const monthLabels = useMemo(() => {
        const labels: { label: string; leftPercent: number; widthPercent: number }[] = []
        const current = new Date(minDate.getFullYear(), minDate.getMonth(), 1)

        while (current <= maxDate) {
            const monthStart = new Date(
                Math.max(current.getTime(), minDate.getTime())
            )
            const nextMonth = new Date(current.getFullYear(), current.getMonth() + 1, 1)
            const monthEnd = new Date(
                Math.min(nextMonth.getTime(), maxDate.getTime())
            )

            const startDay = (monthStart.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
            const endDay = (monthEnd.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)

            labels.push({
                label: current.toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                }),
                leftPercent: (startDay / totalDays) * 100,
                widthPercent: ((endDay - startDay) / totalDays) * 100,
            })

            current.setMonth(current.getMonth() + 1)
        }

        return labels
    }, [minDate, maxDate, totalDays])

    // Today marker
    const todayPercent = useMemo(() => {
        const today = new Date()
        if (today < minDate || today > maxDate) return null
        const daysSinceStart =
            (today.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
        return (daysSinceStart / totalDays) * 100
    }, [minDate, maxDate, totalDays])

    const getBarPosition = (m: Milestone) => {
        const start = new Date(m.start_date)
        const end = new Date(m.end_date)
        const startDay =
            (start.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
        const endDay =
            (end.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
        return {
            leftPercent: (startDay / totalDays) * 100,
            widthPercent: Math.max(((endDay - startDay) / totalDays) * 100, 1),
        }
    }

    const formatDate = (d: Date) =>
        new Date(d).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
        })

    const handleDelete = (milestoneId: number) => {
        setDeletingId(milestoneId)
        const formData = new FormData()
        formData.set("milestoneId", String(milestoneId))
        startTransition(async () => {
            await deleteMilestone(formData)
            setDeletingId(null)
        })
    }

    if (milestones.length === 0 && !editable) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <BarChart3 className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm">No milestones defined yet.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Header with add button */}
            {editable && (
                <div className="flex justify-end">
                    <MilestoneFormDialog projectGroupId={projectGroupId} />
                </div>
            )}

            {milestones.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <BarChart3 className="h-10 w-10 mb-2 opacity-30" />
                    <p className="text-sm">
                        No milestones yet. Add your first milestone to see the
                        progress chart!
                    </p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <div className="min-w-[600px]">
                        {/* Month header */}
                        <div className="relative h-8 border-b mb-2">
                            {monthLabels.map((m, i) => (
                                <div
                                    key={i}
                                    className="absolute top-0 h-full flex items-center border-l border-border/50 px-2"
                                    style={{
                                        left: `${m.leftPercent}%`,
                                        width: `${m.widthPercent}%`,
                                    }}
                                >
                                    <span className="text-[11px] font-medium text-muted-foreground truncate">
                                        {m.label}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Bars */}
                        <div className="relative space-y-2">
                            {/* Today line */}
                            {todayPercent !== null && (
                                <div
                                    className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-10 pointer-events-none"
                                    style={{ left: `${todayPercent}%` }}
                                >
                                    <div className="absolute -top-5 -translate-x-1/2 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded font-medium">
                                        Today
                                    </div>
                                </div>
                            )}

                            {milestones.map((m) => {
                                const { leftPercent, widthPercent } =
                                    getBarPosition(m)
                                const barColor = m.color || "#3b82f6"

                                return (
                                    <div
                                        key={m.milestone_id}
                                        className="group relative flex items-center gap-3"
                                    >
                                        {/* Label column */}
                                        <div className="w-[160px] shrink-0 flex items-center gap-2 min-w-0">
                                            <span className="text-sm font-medium truncate flex-1">
                                                {m.title}
                                            </span>
                                            <Badge
                                                variant="secondary"
                                                className="text-[10px] px-1.5 py-0 shrink-0"
                                            >
                                                {m.progress}%
                                            </Badge>
                                        </div>

                                        {/* Bar area */}
                                        <div className="flex-1 relative h-9">
                                            {/* Background track */}
                                            <div className="absolute inset-0 bg-muted/30 rounded" />

                                            {/* Bar */}
                                            <div
                                                className="absolute top-1 bottom-1 rounded-md transition-all duration-300 overflow-hidden"
                                                style={{
                                                    left: `${leftPercent}%`,
                                                    width: `${widthPercent}%`,
                                                    backgroundColor: `${barColor}20`,
                                                    border: `1.5px solid ${barColor}60`,
                                                }}
                                            >
                                                {/* Progress fill */}
                                                <div
                                                    className="absolute inset-0 rounded-md transition-all duration-500"
                                                    style={{
                                                        width: `${m.progress}%`,
                                                        backgroundColor: `${barColor}cc`,
                                                    }}
                                                />

                                                {/* Hover tooltip */}
                                                <div className="absolute inset-0 flex items-center px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="text-[10px] font-medium text-foreground truncate drop-shadow-sm">
                                                        {formatDate(m.start_date)} →{" "}
                                                        {formatDate(m.end_date)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        {editable && (
                                            <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <MilestoneFormDialog
                                                    projectGroupId={projectGroupId}
                                                    milestone={m}
                                                    trigger={
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7"
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                    }
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                                    onClick={() =>
                                                        handleDelete(m.milestone_id)
                                                    }
                                                    disabled={
                                                        isPending &&
                                                        deletingId === m.milestone_id
                                                    }
                                                >
                                                    {isPending &&
                                                        deletingId === m.milestone_id ? (
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    )}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>

                        {/* Legend */}
                        <div className="flex items-center gap-4 mt-4 pt-3 border-t text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-sm bg-red-500" />
                                <span>Today</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-6 h-3 rounded-sm bg-primary/30 border border-primary/40" />
                                <span>Remaining</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-6 h-3 rounded-sm bg-primary/80" />
                                <span>Completed</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
