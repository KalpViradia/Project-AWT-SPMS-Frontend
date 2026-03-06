"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSidebar } from "@/components/sidebar-provider"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    LayoutDashboard,
    Users,
    Calendar,
    Settings,
    BookOpen,
    FileText,
    ChevronLeft,
    ChevronRight,
    GraduationCap,
    Search,
    FolderKanban,
    CalendarDays,
    Clock,
    MessageSquare,
    ListTodo,
} from "lucide-react"

interface AppSidebarProps {
    role: string | null | undefined
}

export function AppSidebar({ role = 'student' }: AppSidebarProps) {
    const { isCollapsed, toggleSidebar } = useSidebar()
    const pathname = usePathname()

    const actualRole = role || 'student';

    const studentLinks = [
        { href: "/dashboard/student", label: "Overview", icon: LayoutDashboard },
        { href: "/dashboard/student/my-group", label: "My Group", icon: Users },
        { href: "/dashboard/student/project-details", label: "Project Details", icon: BookOpen },
        { href: "/dashboard/student/schedule", label: "Schedule & Calendar", icon: Calendar },
        { href: "/dashboard/student/reports", label: "Reports", icon: FileText },
        { href: "/dashboard/student/tasks", label: "Tasks", icon: ListTodo },
        { href: "/dashboard/student/timeline", label: "Timeline & Progress", icon: Clock },
        { href: "/dashboard/student/discussion", label: "Discussion", icon: MessageSquare },
        { href: "/dashboard/student/settings", label: "Settings", icon: Settings },
    ]

    const facultyLinks = [
        { href: "/dashboard/faculty", label: "Overview", icon: LayoutDashboard },
        { href: "/dashboard/faculty/groups", label: "Project Groups", icon: Users },
        { href: "/dashboard/faculty/reviews", label: "Reviews", icon: BookOpen },
        { href: "/dashboard/faculty/find-students", label: "Find Students", icon: Search },
        { href: "/dashboard/faculty/schedule", label: "Schedule", icon: Calendar },
        { href: "/dashboard/faculty/discussion", label: "Announcements", icon: MessageSquare },
        { href: "/dashboard/faculty/settings", label: "Settings", icon: Settings },
    ]

    const adminLinks = [
        { href: "/dashboard/admin", label: "Overview", icon: LayoutDashboard },
        { href: "/dashboard/admin/users", label: "User Management", icon: Users },
        { href: "/dashboard/admin/all-groups", label: "All Groups", icon: FolderKanban },
        { href: "/dashboard/admin/project-types", label: "Project Types", icon: BookOpen },
        { href: "/dashboard/admin/academic-years", label: "Academic Years", icon: Calendar },
        { href: "/dashboard/admin/departments", label: "Departments", icon: GraduationCap },
        { href: "/dashboard/admin/schedules", label: "All Meetings", icon: CalendarDays },
        { href: "/dashboard/admin/reports", label: "Reports", icon: FileText },
        { href: "/dashboard/admin/settings", label: "Settings", icon: Settings },
    ]

    let links = studentLinks;
    if (actualRole === 'faculty') links = facultyLinks;
    if (actualRole === 'admin') links = adminLinks;

    return (
        <div className="flex h-full max-h-screen flex-col gap-2 relative group">
            <div className={cn(
                "flex h-14 items-center border-b font-semibold",
                isCollapsed ? "justify-center px-0" : "px-6"
            )}>
                {isCollapsed ? (
                    <GraduationCap className="h-6 w-6" />
                ) : (
                    <span className="truncate">SPMS</span>
                )}
            </div>

            <div className="flex-1 overflow-auto py-2">
                <nav className="grid items-start px-2 text-sm font-medium">
                    {links.map((link, index) => {
                        const isActive = pathname === link.href ||
                            (link.href !== `/dashboard/${actualRole}` && pathname.startsWith(link.href + '/'))
                        return (
                            <Link
                                key={index}
                                href={link.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                                    isCollapsed ? "justify-center px-2" : "",
                                    isActive
                                        ? "bg-muted text-primary"
                                        : "text-muted-foreground"
                                )}
                                title={isCollapsed ? link.label : undefined}
                            >
                                <link.icon className="h-4 w-4 shrink-0" />
                                {!isCollapsed && <span>{link.label}</span>}
                            </Link>
                        )
                    })}
                </nav>
            </div>

            {/* Collapse Toggle Button */}
            <div className={cn(
                "absolute -right-3 top-16 z-20 opacity-0 group-hover:opacity-100 transition-opacity",
                isCollapsed && "opacity-100"
            )}>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6 rounded-full shadow-md border bg-background"
                    onClick={toggleSidebar}
                >
                    {isCollapsed ? (
                        <ChevronRight className="h-3 w-3" />
                    ) : (
                        <ChevronLeft className="h-3 w-3" />
                    )}
                </Button>
            </div>
        </div>
    )
}
