"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { signIn, signOut } from "next-auth/react"
import { useSidebar } from "@/components/sidebar-provider"
import { Keyboard } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

interface ShortcutItem {
    label: string
    keys: string
}

interface ShortcutGroup {
    title: string
    items: ShortcutItem[]
}

interface KeyboardShortcutsProviderProps {
    role: string
    children: React.ReactNode
}

export function KeyboardShortcutsProvider({ role, children }: KeyboardShortcutsProviderProps) {
    const [open, setOpen] = useState(false)
    const router = useRouter()
    const { theme, setTheme } = useTheme()
    const { toggleSidebar } = useSidebar()

    const actualRole = role || "student"

    const navLinks: { href: string; label: string }[] =
        actualRole === "faculty"
            ? [
                { href: "/dashboard/faculty", label: "Overview" },
                { href: "/dashboard/faculty/groups", label: "Project Groups" },
                { href: "/dashboard/faculty/reviews", label: "Reviews" },
                { href: "/dashboard/faculty/find-students", label: "Find Students" },
                { href: "/dashboard/faculty/schedule", label: "Schedule" },
                { href: "/dashboard/faculty/discussion", label: "Announcements" }
            ]
            : actualRole === "admin"
                ? [
                    { href: "/dashboard/admin", label: "Overview" },
                    { href: "/dashboard/admin/users", label: "User Management" },
                    { href: "/dashboard/admin/all-groups", label: "All Groups" },
                    { href: "/dashboard/admin/project-types", label: "Project Types" },
                    { href: "/dashboard/admin/academic-years", label: "Academic Years" },
                    { href: "/dashboard/admin/departments", label: "Departments" },
                    { href: "/dashboard/admin/schedules", label: "All Meetings" },
                    { href: "/dashboard/admin/reports", label: "Reports" }
                ]
                : [
                    { href: "/dashboard/student", label: "Overview" },
                    { href: "/dashboard/student/my-group", label: "My Group" },
                    { href: "/dashboard/student/join-group", label: "Join Group" },
                    { href: "/dashboard/student/project-details", label: "Project Details" },
                    { href: "/dashboard/student/schedule", label: "Schedule & Calendar" },
                    { href: "/dashboard/student/reports", label: "Reports" },
                    { href: "/dashboard/student/tasks", label: "Tasks" },
                    { href: "/dashboard/student/timeline", label: "Timeline & Progress" },
                    { href: "/dashboard/student/discussion", label: "Discussion" }
                ]

    const shortcuts: ShortcutGroup[] = [
        {
            title: "Navigation",
            items: navLinks.map((link, i) => ({
                label: link.label,
                keys: i < 9 ? `Alt + ${i + 1}` : (i === 9 ? `Alt + 0` : `Alt + Shift + ${i - 9}`),
            })),
        },
        {
            title: "Quick Actions",
            items: [
                { label: "Go to Profile", keys: "Alt + P" },
                { label: "Toggle sidebar", keys: "Alt + B" },
                { label: "Toggle theme", keys: "Alt + T" },
                { label: "Log out", keys: "Alt + Q" },
            ],
        },
        {
            title: "General",
            items: [
                { label: "Show shortcuts", keys: "Ctrl + /" },
            ],
        },
    ]

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            const target = e.target as HTMLElement
            const isTyping = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable

            // Ctrl + / — toggle shortcuts dialog (works everywhere)
            if (e.ctrlKey && e.key === "/") {
                e.preventDefault()
                setOpen(prev => !prev)
                return
            }

            // Skip all other shortcuts when typing
            if (isTyping) return

            if (e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
                const key = e.key.toLowerCase()

                // Alt + number — page navigation
                const num = parseInt(key)
                if (!isNaN(num)) {
                    const targetIndex = num === 0 ? 9 : num - 1
                    if (targetIndex >= 0 && targetIndex < navLinks.length) {
                        e.preventDefault()
                        router.push(navLinks[targetIndex].href)
                        return
                    }
                }

                // Alt + P — Profile
                if (key === "p") {
                    e.preventDefault()
                    router.push(`/dashboard/${actualRole}/profile`)
                    return
                }


                // Alt + B — Toggle sidebar
                if (key === "b") {
                    e.preventDefault()
                    toggleSidebar()
                    return
                }

                // Alt + T — Toggle theme (light ↔ dark)
                if (key === "t") {
                    e.preventDefault()
                    setTheme(theme === "dark" ? "light" : "dark")
                    return
                }

                // Alt + Q — Log out
                if (key === "q") {
                    e.preventDefault()
                    signOut({ callbackUrl: "/" })
                    return
                }
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [navLinks, router, actualRole, toggleSidebar, theme, setTheme])

    return (
        <>
            {children}

            {/* Floating shortcut trigger button - Bottom Left, Expand on hover */}
            <div className="fixed bottom-4 left-[18px] z-50 flex items-center group">
                <button
                    onClick={() => setOpen(true)}
                    className="flex items-center gap-0 overflow-hidden rounded-full border border-border bg-background/80 backdrop-blur-sm p-2.5 text-xs text-muted-foreground shadow-lg hover:text-foreground hover:border-primary/50 hover:shadow-xl transition-all duration-300 ease-in-out group-hover:gap-2 group-hover:px-4"
                    title="Keyboard shortcuts (Ctrl + /)"
                >
                    <Keyboard className="h-4 w-4 shrink-0 transition-colors group-hover:text-primary" />
                    <span className="max-w-0 opacity-0 whitespace-nowrap transition-all duration-300 ease-in-out group-hover:max-w-[100px] group-hover:opacity-100">
                        <span className="flex items-center gap-1.5 ml-1">
                            <kbd className="inline-flex items-center rounded border bg-muted px-1 py-0.5 font-mono text-[9px]">Ctrl</kbd>
                            <span className="text-muted-foreground/50">/</span>
                        </span>
                    </span>
                </button>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
                    <DialogHeader className="px-5 pt-5 pb-3">
                        <DialogTitle className="text-base font-semibold">Keyboard shortcuts</DialogTitle>
                    </DialogHeader>
                    <div className="px-5 pb-5 space-y-5 max-h-[70vh] overflow-y-auto">
                        {shortcuts.map((group) => (
                            <div key={group.title}>
                                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">{group.title}</p>
                                <div className="space-y-0.5">
                                    {group.items.map((item) => (
                                        <div
                                            key={item.label}
                                            className="flex items-center justify-between py-1.5"
                                        >
                                            <span className="text-sm">{item.label}</span>
                                            <div className="flex items-center gap-1">
                                                {item.keys.split(" + ").map((k, i) => (
                                                    <span key={i} className="flex items-center gap-1">
                                                        {i > 0 && <span className="text-xs text-muted-foreground">+</span>}
                                                        <kbd className="inline-flex h-6 min-w-[24px] items-center justify-center rounded border bg-muted px-1.5 font-mono text-xs text-muted-foreground">
                                                            {k}
                                                        </kbd>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}

