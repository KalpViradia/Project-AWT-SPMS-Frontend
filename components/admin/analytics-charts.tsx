"use client"

// ─── Pure CSS/SVG chart components for Admin Analytics ───

interface DonutChartProps {
    data: { label: string; value: number; color: string }[]
    title: string
}

export function DonutChart({ data, title }: DonutChartProps) {
    const total = data.reduce((sum, d) => sum + d.value, 0)
    if (total === 0) {
        return (
            <div className="text-center text-sm text-muted-foreground py-8">
                No data available
            </div>
        )
    }

    const size = 160
    const strokeWidth = 32
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius

    let cumulativePercent = 0

    return (
        <div className="flex flex-col items-center gap-4">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {data.map((d, i) => {
                    const percent = d.value / total
                    const strokeDasharray = `${circumference * percent} ${circumference * (1 - percent)}`
                    const strokeDashoffset = -circumference * cumulativePercent
                    cumulativePercent += percent

                    return (
                        <circle
                            key={i}
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            fill="none"
                            stroke={d.color}
                            strokeWidth={strokeWidth}
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                            transform={`rotate(-90 ${size / 2} ${size / 2})`}
                            className="transition-all duration-500"
                        />
                    )
                })}
                <text
                    x={size / 2}
                    y={size / 2 - 6}
                    textAnchor="middle"
                    className="fill-foreground text-2xl font-bold"
                    fontSize="24"
                >
                    {total}
                </text>
                <text
                    x={size / 2}
                    y={size / 2 + 14}
                    textAnchor="middle"
                    className="fill-muted-foreground text-xs"
                    fontSize="11"
                >
                    {title}
                </text>
            </svg>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 justify-center">
                {data.map((d, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs">
                        <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: d.color }}
                        />
                        <span className="text-muted-foreground">{d.label}</span>
                        <span className="font-medium">{d.value}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ─── Bar Chart ───

interface BarChartProps {
    data: { label: string; value: number; color?: string }[]
    maxValue?: number
}

export function BarChart({ data, maxValue }: BarChartProps) {
    const max = maxValue || Math.max(...data.map((d) => d.value), 1)

    if (data.length === 0) {
        return (
            <div className="text-center text-sm text-muted-foreground py-8">
                No data available
            </div>
        )
    }

    return (
        <div className="space-y-2.5">
            {data.map((d, i) => (
                <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-24 truncate text-right shrink-0">
                        {d.label}
                    </span>
                    <div className="flex-1 h-7 bg-muted/30 rounded-md overflow-hidden relative">
                        <div
                            className="absolute inset-y-0 left-0 rounded-md transition-all duration-700"
                            style={{
                                width: `${(d.value / max) * 100}%`,
                                backgroundColor: d.color || "hsl(var(--primary))",
                                minWidth: d.value > 0 ? "2px" : "0",
                            }}
                        />
                        <span className="absolute inset-0 flex items-center px-2 text-[11px] font-medium">
                            {d.value}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    )
}

// ─── Stat Card ───

interface StatCardProps {
    label: string
    value: string | number
    sublabel?: string
    icon: React.ReactNode
}

export function StatCard({ label, value, sublabel, icon }: StatCardProps) {
    return (
        <div className="flex items-center gap-4 p-4 rounded-lg border bg-card">
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
                {icon}
            </div>
            <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
                {sublabel && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">{sublabel}</p>
                )}
            </div>
        </div>
    )
}

// ─── Horizontal Stacked Bar ───

interface StackedBarProps {
    segments: { label: string; value: number; color: string }[]
    height?: number
}

export function StackedBar({ segments, height = 28 }: StackedBarProps) {
    const total = segments.reduce((s, seg) => s + seg.value, 0)
    if (total === 0) {
        return (
            <div className="text-center text-sm text-muted-foreground py-4">
                No data
            </div>
        )
    }

    return (
        <div className="space-y-2">
            <div
                className="w-full rounded-full overflow-hidden flex"
                style={{ height }}
            >
                {segments.map((seg, i) => (
                    <div
                        key={i}
                        className="transition-all duration-500"
                        style={{
                            width: `${(seg.value / total) * 100}%`,
                            backgroundColor: seg.color,
                            minWidth: seg.value > 0 ? "4px" : "0",
                        }}
                        title={`${seg.label}: ${seg.value}`}
                    />
                ))}
            </div>
            <div className="flex flex-wrap gap-3">
                {segments.map((seg, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs">
                        <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: seg.color }}
                        />
                        <span className="text-muted-foreground">{seg.label}</span>
                        <span className="font-medium">
                            {seg.value} ({total > 0 ? Math.round((seg.value / total) * 100) : 0}%)
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}
