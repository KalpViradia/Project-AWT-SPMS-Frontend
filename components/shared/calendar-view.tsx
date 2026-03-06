"use client"

import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

type CalendarEvent = {
    id: string
    date: Date
    title: string
    type: "meeting" | "milestone" | "report"
    meta?: string
}

interface CalendarViewProps {
    events: CalendarEvent[]
}

const EVENT_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
    meeting: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300", dot: "bg-blue-500" },
    milestone: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500" },
    report: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300", dot: "bg-amber-500" },
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
]

export function CalendarView({ events }: CalendarViewProps) {
    const today = new Date()
    const [year, setYear] = useState(today.getFullYear())
    const [month, setMonth] = useState(today.getMonth())

    const prevMonth = () => {
        if (month === 0) { setMonth(11); setYear(y => y - 1) }
        else setMonth(m => m - 1)
    }
    const nextMonth = () => {
        if (month === 11) { setMonth(0); setYear(y => y + 1) }
        else setMonth(m => m + 1)
    }
    const goToday = () => { setYear(today.getFullYear()); setMonth(today.getMonth()) }

    // Build calendar grid
    const calendarDays = useMemo(() => {
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        const startOffset = firstDay.getDay() // 0=Sun

        const days: { date: Date; isCurrentMonth: boolean }[] = []

        // Previous month fill
        for (let i = startOffset - 1; i >= 0; i--) {
            const d = new Date(year, month, -i)
            days.push({ date: d, isCurrentMonth: false })
        }

        // Current month
        for (let d = 1; d <= lastDay.getDate(); d++) {
            days.push({ date: new Date(year, month, d), isCurrentMonth: true })
        }

        // Next month fill to complete 6 rows
        const remaining = 42 - days.length
        for (let d = 1; d <= remaining; d++) {
            days.push({ date: new Date(year, month + 1, d), isCurrentMonth: false })
        }

        return days
    }, [year, month])

    // Index events by date key
    const eventsByDate = useMemo(() => {
        const map = new Map<string, CalendarEvent[]>()
        for (const ev of events) {
            const d = new Date(ev.date)
            const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
            if (!map.has(key)) map.set(key, [])
            map.get(key)!.push(ev)
        }
        return map
    }, [events])

    const isToday = (d: Date) =>
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate()

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevMonth}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <h3 className="text-base font-semibold min-w-[160px] text-center">
                        {MONTHS[month]} {year}
                    </h3>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextMonth}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-xs" onClick={goToday}>
                        Today
                    </Button>
                </div>

                {/* Legend */}
                <div className="hidden sm:flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Meeting</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Milestone</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Report</span>
                </div>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-px">
                {DAYS.map((d) => (
                    <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">
                        {d}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
                {calendarDays.map((day, i) => {
                    const key = `${day.date.getFullYear()}-${day.date.getMonth()}-${day.date.getDate()}`
                    const dayEvents = eventsByDate.get(key) || []

                    return (
                        <div
                            key={i}
                            className={`min-h-[80px] p-1.5 bg-card ${!day.isCurrentMonth ? "opacity-40" : ""
                                } ${isToday(day.date) ? "ring-2 ring-primary ring-inset" : ""}`}
                        >
                            <span className={`text-xs font-medium ${isToday(day.date) ? "text-primary" : "text-muted-foreground"
                                }`}>
                                {day.date.getDate()}
                            </span>

                            <div className="mt-0.5 space-y-0.5">
                                {dayEvents.slice(0, 3).map((ev, j) => {
                                    const col = EVENT_COLORS[ev.type] || EVENT_COLORS.meeting
                                    return (
                                        <div
                                            key={j}
                                            className={`${col.bg} ${col.text} text-[9px] leading-tight px-1 py-0.5 rounded truncate`}
                                            title={`${ev.title}${ev.meta ? ` — ${ev.meta}` : ""}`}
                                        >
                                            {ev.title}
                                        </div>
                                    )
                                })}
                                {dayEvents.length > 3 && (
                                    <span className="text-[9px] text-muted-foreground px-1">
                                        +{dayEvents.length - 3} more
                                    </span>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
