import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { RedirectType, redirect } from "next/navigation";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, GraduationCap, UserCheck, FileText, CalendarDays, ListTodo } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { assignGuideAsAdmin } from "@/lib/admin-actions";
import { DonutChart, BarChart, StatCard, StackedBar } from "@/components/admin/analytics-charts";

export default async function AdminDashboardPage() {
    const session = await auth();

    if (!session || !session.user) {
        redirect("/", RedirectType.replace);
    }

    const userRole = (session.user as { role?: string }).role;
    if (userRole !== "admin") {
        redirect("/", RedirectType.replace);
    }

    // ─── Core counts ───
    const [
        totalStudents,
        totalFaculty,
        totalProjects,
        groupsWithoutMeetings,
        unassignedGroups,
        facultyList,
    ] = await Promise.all([
        prisma.student.count(),
        prisma.staff.count({ where: { role: "faculty" } }),
        prisma.project_group.count(),
        prisma.project_group.count({
            where: { project_meeting: { none: {} } },
        }),
        prisma.project_group.findMany({
            where: { guide_staff_id: null },
            include: { project_type: true },
            orderBy: { created_at: "desc" },
            take: 5,
        }),
        prisma.staff.findMany({
            where: { role: "faculty" },
            orderBy: { staff_name: "asc" },
        }),
    ]);

    // ─── Analytics data ───
    const [
        projectsByStatus,
        totalReports,
        reviewedReports,
        totalMeetings,
        totalTasks,
        groupsByType,
        recentReports,
        facultyLoad,
    ] = await Promise.all([
        // Project status distribution
        prisma.project_group.groupBy({
            by: ["status"],
            _count: true,
        }),
        // Total weekly reports
        prisma.weekly_report.count(),
        // Reviewed reports
        prisma.weekly_report.count({ where: { status: "reviewed" } }),
        // Total meetings
        prisma.project_meeting.count(),
        // Total tasks
        prisma.project_task.count(),
        // Groups by project type
        prisma.project_group.groupBy({
            by: ["project_type_id"],
            _count: true,
        }),
        // Recent 8 weeks of report submissions
        prisma.weekly_report.groupBy({
            by: ["week_number"],
            _count: true,
            orderBy: { week_number: "asc" },
            take: 8,
        }),
        // Faculty guide load (how many groups per faculty)
        prisma.project_group.groupBy({
            by: ["guide_staff_id"],
            _count: true,
            where: { guide_staff_id: { not: null } },
            orderBy: { _count: { guide_staff_id: "desc" } },
            take: 10,
        }),
    ]);

    // Process data for charts
    const statusColors: Record<string, string> = {
        pending: "#f59e0b",
        approved: "#10b981",
        rejected: "#ef4444",
    };

    const statusData = projectsByStatus.map((s) => ({
        label: s.status.charAt(0).toUpperCase() + s.status.slice(1),
        value: s._count,
        color: statusColors[s.status] || "#6b7280",
    }));

    // Get project type names for chart
    const typeIds = groupsByType.map((g) => g.project_type_id);
    const projectTypes = await prisma.project_type.findMany({
        where: { project_type_id: { in: typeIds } },
    });
    const typeMap = Object.fromEntries(
        projectTypes.map((t) => [t.project_type_id, t.project_type_name])
    );

    const typeData = groupsByType.map((g) => ({
        label: typeMap[g.project_type_id] || `Type ${g.project_type_id}`,
        value: g._count,
        color: "#3b82f6",
    }));

    // Reports per week as bar chart
    const reportsPerWeek = recentReports.map((r) => ({
        label: `Week ${r.week_number}`,
        value: r._count,
        color: "#8b5cf6",
    }));

    // Faculty load
    const staffMap = Object.fromEntries(
        facultyList.map((f) => [f.staff_id, f.staff_name])
    );

    const facultyLoadData = facultyLoad.map((f) => ({
        label: f.guide_staff_id ? (staffMap[f.guide_staff_id] || "Unknown") : "Unassigned",
        value: f._count,
        color: "#06b6d4",
    }));

    // Report review stacked bar
    const reportReviewData = [
        { label: "Reviewed", value: reviewedReports, color: "#10b981" },
        { label: "Pending", value: totalReports - reviewedReports, color: "#f59e0b" },
    ];

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>

            {/* ─── Stat Cards ─── */}
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                <StatCard
                    label="Total Students"
                    value={totalStudents}
                    icon={<Users className="h-5 w-5" />}
                />
                <StatCard
                    label="Total Faculty"
                    value={totalFaculty}
                    icon={<GraduationCap className="h-5 w-5" />}
                />
                <StatCard
                    label="Project Groups"
                    value={totalProjects}
                    sublabel={`${groupsWithoutMeetings} without meetings`}
                    icon={<BookOpen className="h-5 w-5" />}
                />
                <StatCard
                    label="Weekly Reports"
                    value={totalReports}
                    sublabel={`${reviewedReports} reviewed`}
                    icon={<FileText className="h-5 w-5" />}
                />
                <StatCard
                    label="Meetings"
                    value={totalMeetings}
                    icon={<CalendarDays className="h-5 w-5" />}
                />
                <StatCard
                    label="Tasks"
                    value={totalTasks}
                    icon={<ListTodo className="h-5 w-5" />}
                />
            </div>

            {/* ─── Charts Row ─── */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Project Status</CardTitle>
                        <CardDescription>Distribution of group proposal statuses</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DonutChart data={statusData} title="Groups" />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Groups by Project Type</CardTitle>
                        <CardDescription>How groups are distributed across types</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <BarChart data={typeData} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Reports per Week</CardTitle>
                        <CardDescription>Weekly report submission trend</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <BarChart data={reportsPerWeek} />
                    </CardContent>
                </Card>
            </div>

            {/* ─── Second Charts Row ─── */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Report Review Status</CardTitle>
                        <CardDescription>Reviewed vs pending weekly reports</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <StackedBar segments={reportReviewData} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Faculty Guide Load</CardTitle>
                        <CardDescription>Number of groups assigned per faculty</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <BarChart data={facultyLoadData} />
                    </CardContent>
                </Card>
            </div>

            {/* ─── Guide Assignment Table ─── */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-muted-foreground" />
                            Assign Project Guides
                        </CardTitle>
                        <CardDescription>
                            Assign faculty mentors to project groups that do not yet have a guide.
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    {unassignedGroups.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            All project groups currently have an assigned guide.
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Group</TableHead>
                                    <TableHead>Project Title</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-right">Assign Mentor</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {unassignedGroups.map((group) => (
                                    <TableRow key={group.project_group_id}>
                                        <TableCell className="font-medium">
                                            {group.project_group_name}
                                        </TableCell>
                                        <TableCell>{group.project_title}</TableCell>
                                        <TableCell>
                                            {group.project_type?.project_type_name ?? "-"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <form
                                                action={assignGuideAsAdmin}
                                                className="flex items-center justify-end gap-2"
                                            >
                                                <input
                                                    type="hidden"
                                                    name="groupId"
                                                    value={group.project_group_id}
                                                />
                                                <select
                                                    name="guideId"
                                                    className="border border-input bg-background text-sm rounded-md px-2 py-1"
                                                    defaultValue=""
                                                    required
                                                >
                                                    <option value="" disabled>
                                                        Select faculty
                                                    </option>
                                                    {facultyList.map((faculty) => (
                                                        <option
                                                            key={faculty.staff_id}
                                                            value={faculty.staff_id}
                                                        >
                                                            {faculty.staff_name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <Button type="submit" variant="outline" size="sm">
                                                    Assign
                                                </Button>
                                            </form>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
