
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { RedirectType, redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar as CalendarIcon, MapPin, Clock, BarChart3, CheckCircle, XCircle } from "lucide-react"
import { format } from "date-fns"
import { CalendarView } from "@/components/shared/calendar-view"
import { getMilestones } from "@/lib/milestone-actions"

export default async function SchedulePage() {
    const session = await auth()
    if (!session || !session.user) {
        redirect('/', RedirectType.replace)
    }

    const user = session.user as { id: string; role?: string | null }

    if (user.role !== 'student') {
        redirect('/', RedirectType.replace)
    }

    const studentId = parseInt(user.id)

    // Find student's group
    const studentWithGroup = await prisma.student.findUnique({
        where: { student_id: studentId },
        include: {
            project_group_member: {
                include: {
                    project_group: true
                }
            }
        }
    })

    const group = studentWithGroup?.project_group_member[0]?.project_group

    if (!group) {
        return (
            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Schedule & Calendar</h1>
                    <p className="text-muted-foreground">View your upcoming project meetings and reviews.</p>
                </div>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center py-8 text-muted-foreground">
                            You need to be in a project group to view the schedule.
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Fetch meetings
    const meetings = await prisma.project_meeting.findMany({
        where: { project_group_id: group.project_group_id },
        orderBy: { meeting_datetime: 'desc' },
        include: {
            staff: true,
            project_meeting_attendance: {
                where: { student_id: studentId }
            }
        }
    })

    // Fetch milestones for calendar
    const milestones = await getMilestones(group.project_group_id)

    // Build calendar events
    type CalendarEvent = { id: string; date: Date; title: string; type: "meeting" | "milestone" | "report"; meta?: string }
    const calendarEvents: CalendarEvent[] = []

    for (const m of meetings) {
        calendarEvents.push({
            id: `meeting-${m.project_meeting_id}`,
            date: new Date(m.meeting_datetime),
            title: m.meeting_purpose || "Meeting",
            type: "meeting",
            meta: m.staff.staff_name,
        })
    }

    for (const ms of milestones) {
        calendarEvents.push({
            id: `ms-start-${ms.milestone_id}`,
            date: new Date(ms.start_date),
            title: `▸ ${ms.title}`,
            type: "milestone",
        })
        calendarEvents.push({
            id: `ms-end-${ms.milestone_id}`,
            date: new Date(ms.end_date),
            title: `◂ ${ms.title}`,
            type: "milestone",
        })
    }

    // Attendance Analytics
    const completedMeetings = meetings.filter(
        (m) => m.project_meeting_attendance.length > 0
    )
    const presentCount = completedMeetings.filter(
        (m) => m.project_meeting_attendance[0]?.is_present
    ).length
    const absentCount = completedMeetings.length - presentCount
    const attendanceRate = completedMeetings.length > 0
        ? Math.round((presentCount / completedMeetings.length) * 100)
        : 0

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Schedule & Calendar</h1>
                <p className="text-muted-foreground">Upcoming meetings and reviews for {group.project_group_name}.</p>
            </div>

            {/* ── Calendar View ── */}
            <Card>
                <CardHeader>
                    <CardTitle>Calendar</CardTitle>
                    <CardDescription>Meetings, milestones, and deadlines at a glance.</CardDescription>
                </CardHeader>
                <CardContent>
                    <CalendarView events={calendarEvents} />
                </CardContent>
            </Card>

            {/* ── Attendance Analytics ── */}
            <div className="grid gap-4 sm:grid-cols-3">
                <Card>
                    <CardContent className="pt-6 flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
                            <BarChart3 className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{meetings.length}</p>
                            <p className="text-xs text-muted-foreground">Total Meetings</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10 text-green-500">
                            <CheckCircle className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{attendanceRate}%</p>
                            <p className="text-xs text-muted-foreground">Attendance Rate ({presentCount}/{completedMeetings.length})</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                            <XCircle className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{absentCount}</p>
                            <p className="text-xs text-muted-foreground">Absences</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
            {completedMeetings.length > 0 && (
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                        className="h-full rounded-full bg-green-500 transition-all"
                        style={{ width: `${attendanceRate}%` }}
                    />
                </div>
            )}

            <div className="space-y-4">
                {meetings.length === 0 ? (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center py-8 text-muted-foreground">
                                No upcoming meetings scheduled.
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    meetings.map((meeting) => {
                        const attendance = meeting.project_meeting_attendance[0];
                        const isPast = new Date(meeting.meeting_datetime) < new Date();

                        return (
                            <Card key={meeting.project_meeting_id}>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <CardTitle className="text-base flex items-center gap-2">
                                                {meeting.meeting_purpose || "Project Meeting"}
                                                {isPast && (
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${attendance?.is_present
                                                        ? "bg-green-100 text-green-700"
                                                        : attendance
                                                            ? "bg-red-100 text-red-700"
                                                            : "bg-gray-100 text-gray-700"
                                                        }`}>
                                                        {attendance?.is_present ? "Present" : attendance ? "Absent" : "Pending"}
                                                    </span>
                                                )}
                                            </CardTitle>
                                            <CardDescription>{meeting.description}</CardDescription>
                                        </div>
                                        <div className="flex items-center text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {format(new Date(meeting.meeting_datetime), "PPP")}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center text-muted-foreground">
                                                <Clock className="mr-2 h-4 w-4" />
                                                {format(new Date(meeting.meeting_datetime), "p")}
                                            </div>
                                            {meeting.meeting_location && (
                                                <div className="flex items-center text-muted-foreground">
                                                    <MapPin className="mr-2 h-4 w-4" />
                                                    {meeting.meeting_location}
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-muted-foreground">
                                            Guide: <span className="font-medium text-foreground">{meeting.staff.staff_name}</span>
                                        </div>
                                    </div>
                                    {attendance?.attendance_remarks && (
                                        <div className="mt-4 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                                            Remark: {attendance.attendance_remarks}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )
                    })
                )}
            </div>
        </div>
    )
}
