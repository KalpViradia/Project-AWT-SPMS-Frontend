
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { RedirectType, redirect } from "next/navigation"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, FileText, Users, ArrowLeft, Mail, Phone } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { DocumentsList } from "@/components/shared/documents-list"
import { GanttChart } from "@/components/shared/gantt-chart"
import { getMilestones } from "@/lib/milestone-actions"
import { getTaskCounts } from "@/lib/task-actions"

export default async function GroupDetailsPage({ params }: { params: Promise<{ groupId: string }> }) {
    const session = await auth()
    if (!session || !session.user) {
        redirect('/', RedirectType.replace)
    }

    const user = session.user as { id: string; role?: string | null }

    if (user.role !== 'faculty') {
        redirect('/', RedirectType.replace)
    }

    const { groupId } = await params;

    // Validate groupId
    const id = parseInt(groupId);
    if (isNaN(id)) {
        return <div>Invalid Group ID</div>
    }

    const group = await prisma.project_group.findUnique({
        where: { project_group_id: id },
        include: {
            project_type: true,
            project_group_member: {
                include: {
                    student: true
                }
            },
            project_document: {
                orderBy: { uploaded_at: 'desc' }
            }
        }
    })

    if (!group) {
        return <div>Group not found</div>
    }

    // Fetch reports
    const reports = await prisma.weekly_report.findMany({
        where: { project_group_id: id },
        orderBy: { week_number: 'desc' }
    })

    // Fetch meetings with attendance for this group
    const meetings = await prisma.project_meeting.findMany({
        where: { project_group_id: id },
        orderBy: { meeting_datetime: 'desc' },
        include: {
            project_meeting_attendance: true,
        },
    })

    // Fetch milestones for progress chart
    const milestones = await getMilestones(id)

    // Fetch task counts for kanban summary
    const taskCounts = await getTaskCounts(id)

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/dashboard/faculty/groups">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{group.project_group_name}</h1>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <span>{group.project_title}</span>
                        <span>•</span>
                        <Badge variant="secondary">{group.project_type.project_type_name}</Badge>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Main Content Info */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Description</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {group.project_description || "No description provided."}
                            </p>
                        </CardContent>
                    </Card>

                    {(group.project_objectives || group.project_methodology || group.project_expected_outcomes) && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Proposal Details</CardTitle>
                                <CardDescription>Project objectives, methodology, and expected outcomes</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {group.project_objectives && (
                                    <div>
                                        <h3 className="text-sm font-semibold mb-2">Objectives</h3>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                            {group.project_objectives}
                                        </p>
                                    </div>
                                )}

                                {group.project_methodology && (
                                    <div>
                                        <h3 className="text-sm font-semibold mb-2">Methodology</h3>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                            {group.project_methodology}
                                        </p>
                                    </div>
                                )}

                                {group.project_expected_outcomes && (
                                    <div>
                                        <h3 className="text-sm font-semibold mb-2">Expected Outcomes</h3>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                            {group.project_expected_outcomes}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle>Project Progress</CardTitle>
                            <CardDescription>Milestone progress tracked by the team.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <GanttChart
                                milestones={milestones}
                                projectGroupId={id}
                                editable={false}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Task Board Summary</CardTitle>
                            <CardDescription>Current task distribution across columns.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-4 gap-3">
                                {[
                                    { key: 'todo', label: 'To Do', color: 'bg-slate-500' },
                                    { key: 'in_progress', label: 'In Progress', color: 'bg-blue-500' },
                                    { key: 'review', label: 'Review', color: 'bg-amber-500' },
                                    { key: 'done', label: 'Done', color: 'bg-emerald-500' },
                                ].map((col) => (
                                    <div key={col.key} className="text-center p-3 rounded-lg bg-muted/30">
                                        <div className={`w-2 h-2 rounded-full ${col.color} mx-auto mb-1.5`} />
                                        <p className="text-xl font-bold">{taskCounts[col.key] || 0}</p>
                                        <p className="text-[10px] text-muted-foreground">{col.label}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Reports</CardTitle>
                            <CardDescription>history of weekly submissions.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {reports.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No reports submitted.</p>
                            ) : (
                                <div className="space-y-4">
                                    {reports.map(report => (
                                        <div key={report.report_id} className="border p-4 rounded-lg">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <span className="font-semibold">Week {report.week_number}</span>
                                                    <span className="text-xs text-muted-foreground ml-2">
                                                        {format(new Date(report.submission_date), "MMM d, yyyy")}
                                                    </span>
                                                </div>
                                                <Badge variant={report.status === 'reviewed' ? 'default' : 'secondary'}>{report.status}</Badge>
                                            </div>
                                            <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-3">{report.report_content}</p>
                                            {report.feedback && (
                                                <div className="mt-2 text-sm bg-muted p-2 rounded">
                                                    <span className="font-semibold text-xs">Feedback: </span>
                                                    {report.feedback}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Documents</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <DocumentsList documents={group.project_document} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Meetings</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {meetings.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No meetings scheduled.</p>
                            ) : (
                                <div className="space-y-2">
                                    {meetings.map(meeting => (
                                        <div key={meeting.project_meeting_id} className="flex justify-between items-center p-3 border rounded">
                                            <div className="flex items-center gap-3">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm font-medium">{meeting.meeting_purpose || 'Project Meeting'}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {format(new Date(meeting.meeting_datetime), "PPP p")} • {meeting.meeting_status}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {(() => {
                                                    const total = group.project_group_member.length;
                                                    const present = meeting.project_meeting_attendance.filter(a => a.is_present).length;
                                                    return `${present}/${total} present`;
                                                })()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Team Members</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {group.project_group_member.map(member => (
                                    <div key={member.project_group_member_id} className="flex flex-col gap-1 pb-3 mb-3 border-b last:border-0 last:mb-0 last:pb-0">
                                        <div className="flex justify-between items-start">
                                            <span className="font-medium">{member.student.student_name}</span>
                                            {member.is_group_leader && <Badge variant="outline" className="text-xs">Leader</Badge>}
                                        </div>
                                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                                            <Mail className="h-3 w-3" /> {member.student.email}
                                        </div>
                                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                                            <Phone className="h-3 w-3" /> {member.student.phone || "N/A"}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button className="w-full" asChild>
                                <Link href="/dashboard/faculty/schedule">Schedule Meeting</Link>
                            </Button>
                            <Button variant="outline" className="w-full" asChild>
                                <Link href="/dashboard/faculty/reviews">Review Reports</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
