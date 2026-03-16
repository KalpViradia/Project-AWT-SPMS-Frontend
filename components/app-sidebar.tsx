"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSidebar } from "@/components/sidebar-provider"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
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
    PlusCircle,
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
        { href: "/dashboard/student/join-group", label: "Join Group", icon: PlusCircle },
        { href: "/dashboard/student/project-details", label: "Project Details", icon: BookOpen },
        { href: "/dashboard/student/schedule", label: "Schedule & Calendar", icon: Calendar },
        { href: "/dashboard/student/reports", label: "Reports", icon: FileText },
        { href: "/dashboard/student/tasks", label: "Tasks", icon: ListTodo },
        { href: "/dashboard/student/timeline", label: "Timeline & Progress", icon: Clock },
        { href: "/dashboard/student/discussion", label: "Discussion", icon: MessageSquare },
    ]

    const facultyLinks = [
        { href: "/dashboard/faculty", label: "Overview", icon: LayoutDashboard },
        { href: "/dashboard/faculty/groups", label: "Project Groups", icon: Users },
        { href: "/dashboard/faculty/reviews", label: "Reviews", icon: BookOpen },
        { href: "/dashboard/faculty/find-students", label: "Find Students", icon: Search },
        { href: "/dashboard/faculty/schedule", label: "Schedule", icon: Calendar },
        { href: "/dashboard/faculty/discussion", label: "Announcements", icon: MessageSquare },
    ]

    const adminLinks = [
        { href: "/dashboard/admin", label: "Overview", icon: LayoutDashboard },
        { href: "/dashboard/admin/users", label: "User Management", icon: Users },
        { href: "/dashboard/admin/all-groups", label: "All Groups", icon: FolderKanban },
        { href: "/dashboard/admin/project-types", label: "Project Types", icon: BookOpen },
        { href: "/dashboard/admin/departments", label: "Departments", icon: GraduationCap },
        { href: "/dashboard/admin/schedules", label: "All Meetings", icon: CalendarDays },
        { href: "/dashboard/admin/reports", label: "Reports", icon: FileText },
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
                    <>
                        <img src="/icon-dark.png" alt="Studionex" className="h-6 w-6 hidden dark:block" />
                        <img src="/icon-light.png" alt="Studionex" className="h-6 w-6 block dark:hidden" />
                    </>
                ) : (
                    <div className="flex items-center gap-2">
                        <img src="/logo-dark.png" alt="Studionex" className="h-6 hidden dark:block" />
                        <img src="/logo-light.png" alt="Studionex" className="h-6 block dark:hidden" />
                        <span className="text-lg font-bold tracking-tight">Studionex</span>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-auto py-2">
                <nav className="grid items-start px-2 text-sm font-medium">
                    {links.map((link, index) => {
                        const isActive = pathname === link.href ||
                            (link.href !== `/dashboard/${actualRole}` && pathname.startsWith(link.href + '/'))
                        
                        const shortcutText = index < 9 ? `Alt + ${index + 1}` : (index === 9 ? `Alt + 0` : `Alt + Shift + ${index - 9}`)

                        return (
                            <Tooltip key={index}>
                                <TooltipTrigger asChild>
                                    <Link
                                        href={link.href}
                                        className={cn(
                                            "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                                            isCollapsed ? "justify-center px-2" : "",
                                            isActive
                                                ? "bg-muted text-primary"
                                                : "text-muted-foreground"
                                        )}
                                    >
                                        <link.icon className="h-4 w-4 shrink-0" />
                                        {!isCollapsed && <span>{link.label}</span>}
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="flex items-center gap-2">
                                    {link.label}
                                    <kbd className="inline-flex h-5 items-center justify-center rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground ml-1">
                                        {shortcutText}
                                    </kbd>
                                </TooltipContent>
                            </Tooltip>
                        )
                    })}
                </nav>
            </div>

            {/* Collapse Toggle Button */}
            <div className={cn(
                "absolute -right-3 top-16 z-20 opacity-0 group-hover:opacity-100 transition-opacity",
                isCollapsed && "opacity-100"
            )}>
                <Tooltip>
                    <TooltipTrigger asChild>
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
                    </TooltipTrigger>
                    <TooltipContent side="right" className="flex items-center gap-2">
                        Toggle Sidebar
                        <kbd className="inline-flex h-5 items-center justify-center rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground ml-1">
                            Alt + B
                        </kbd>
                    </TooltipContent>
                </Tooltip>
            </div>
        </div>
    )
}
