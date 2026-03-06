import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, FileText, Users, CheckCircle2, Clock, AlertCircle } from "lucide-react"
import { GanttChart } from "@/components/shared/gantt-chart"
import { getMilestones } from "@/lib/milestone-actions"

export default async function TimelinePage() {
    const session = await auth()
    if (!session?.user) redirect("/login")

    const user = session.user as { id: string; role?: string | null }
    const studentId = parseInt(user.id)

    // Get student's group
    const membership = await prisma.project_group_member.findFirst({
        where: { student_id: studentId },
        include: {
            project_group: {
                include: {
                    project_meeting: {
                        orderBy: { meeting_datetime: "asc" },
                        include: { staff: true },
                    },
                    weekly_report: {
                        orderBy: { submission_date: "asc" },
                    },
                    project_group_member: {
                        include: { student: true },
                        orderBy: { created_at: "asc" },
                    },
                },
            },
        },
    })

    if (!membership) {
        return (
            <div className="flex flex-col gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Project Timeline</h1>
                <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                        <Clock className="mx-auto mb-4 h-12 w-12 opacity-40" />
                        <p>Join a project group to see the timeline.</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const group = membership.project_group

    // Fetch milestones for the progress chart
    const milestones = await getMilestones(group.project_group_id)

    // Build timeline events
    type TimelineEvent = {
        date: Date
        title: string
        description: string
        type: "group" | "meeting" | "report" | "member" | "proposal"
        status?: string
    }

    const events: TimelineEvent[] = []

    // Group creation
    events.push({
        date: group.created_at,
        title: "Group Created",
        description: `"${group.project_group_name}" was created with project "${group.project_title}".`,
        type: "group",
    })

    // Proposal submission
    if (group.proposal_submitted_at) {
        events.push({
            date: group.proposal_submitted_at,
            title: "Proposal Submitted",
            description: `Project proposal was submitted for review.`,
            type: "proposal",
            status: group.status,
        })
    }

    // Proposal review
    if (group.proposal_reviewed_at) {
        events.push({
            date: group.proposal_reviewed_at,
            title: `Proposal ${group.status === "approved" ? "Approved" : "Rejected"}`,
            description: group.rejection_reason || `Proposal status: ${group.status}`,
            type: "proposal",
            status: group.status,
        })
    }

    // Members joining
    for (const member of group.project_group_member) {
        if (!member.is_group_leader) {
            events.push({
                date: member.created_at,
                title: "Member Joined",
                description: `${member.student.student_name} joined the group.`,
                type: "member",
            })
        }
    }

    // Meetings
    for (const meeting of group.project_meeting) {
        events.push({
            date: meeting.meeting_datetime,
            title: "Meeting",
            description: `${meeting.meeting_purpose || "Scheduled meeting"}${meeting.meeting_location ? ` at ${meeting.meeting_location}` : ""} — Guide: ${meeting.staff.staff_name}`,
            type: "meeting",
            status: meeting.meeting_status || "scheduled",
        })
    }

    // Reports
    for (const report of group.weekly_report) {
        events.push({
            date: report.submission_date,
            title: `Week ${report.week_number} Report`,
            description: `Report submitted${report.marks !== null ? ` — Marks: ${report.marks}/100` : ""}${report.status === "reviewed" ? " ✓ Reviewed" : ""}`,
            type: "report",
            status: report.status,
        })
    }

    // Sort by date
    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    const iconMap: Record<string, React.ReactNode> = {
        group: <Users className="h-4 w-4" />,
        meeting: <CalendarDays className="h-4 w-4" />,
        report: <FileText className="h-4 w-4" />,
        member: <Users className="h-4 w-4" />,
        proposal: <CheckCircle2 className="h-4 w-4" />,
    }

    const colorMap: Record<string, string> = {
        group: "bg-blue-500",
        meeting: "bg-amber-500",
        report: "bg-green-500",
        member: "bg-purple-500",
        proposal: "bg-cyan-500",
    }

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Timeline & Progress</h1>
                <p className="text-muted-foreground">
                    Track project milestones and view activity history.
                </p>
            </div>

            {/* ── Gantt Progress Chart ── */}
            <Card>
                <CardHeader>
                    <CardTitle>Project Progress</CardTitle>
                    <CardDescription>
                        Define milestones and track completion across your project timeline.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <GanttChart
                        milestones={milestones}
                        projectGroupId={group.project_group_id}
                        editable={true}
                    />
                </CardContent>
            </Card>

            {/* ── Event Timeline ── */}
            <Card>
                <CardHeader>
                    <CardTitle>{group.project_title}</CardTitle>
                    <CardDescription>
                        Group: {group.project_group_name} · {events.length} event{events.length !== 1 ? "s" : ""}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {events.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No events yet.</p>
                    ) : (
                        <div className="relative ml-4">
                            {/* Vertical line */}
                            <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border" />

                            <div className="space-y-6">
                                {events.map((event, i) => (
                                    <div key={i} className="relative flex gap-4 items-start">
                                        {/* Dot */}
                                        <div className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-white ${colorMap[event.type] || "bg-gray-500"}`}>
                                            {iconMap[event.type]}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 space-y-1 pb-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-sm font-semibold leading-none">{event.title}</p>
                                                {event.status && (
                                                    <Badge variant={
                                                        event.status === "approved" || event.status === "completed" || event.status === "reviewed"
                                                            ? "default"
                                                            : event.status === "rejected"
                                                                ? "destructive"
                                                                : "secondary"
                                                    } className="text-[10px] px-1.5 py-0">
                                                        {event.status}
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground">{event.description}</p>
                                            <p className="text-[11px] text-muted-foreground/60">
                                                {new Date(event.date).toLocaleDateString("en-IN", {
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
