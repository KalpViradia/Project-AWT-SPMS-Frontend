"use client"

import { useState, useEffect, useTransition } from "react"
import { Bell, Check, CheckCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatDistanceToNow } from "date-fns"
import {
    getNotifications,
    getUnreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
} from "@/lib/notification-actions"
import { useRouter } from "next/navigation"
import { useSocket } from "@/components/socket-provider"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

type Notification = {
    notification_id: number
    title: string
    message: string
    link: string | null
    is_read: boolean
    created_at: Date
}

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [open, setOpen] = useState(false)
    const [hasMounted, setHasMounted] = useState(false)
    const [isPending, startTransition] = useTransition()
    const router = useRouter()
    const { socket } = useSocket()

    const fetchData = async () => {
        const [notifs, count] = await Promise.all([
            getNotifications(),
            getUnreadCount(),
        ])
        setNotifications(notifs as Notification[])
        setUnreadCount(count)
    }

    // Initial load
    useEffect(() => {
        setHasMounted(true)
        fetchData()
    }, [])

    // Listen for real-time notifications via WebSocket
    useEffect(() => {
        if (!socket) return

        const handler = () => {
            // Re-fetch from DB to get full notification data
            fetchData()
            // Refresh server components to keep UI in sync
            router.refresh()
        }

        socket.on("notification:new", handler)
        return () => {
            socket.off("notification:new", handler)
        }
    }, [socket])

    // Keyboard shortcut to toggle notifications (Alt + N)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement
            const isTyping = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable
            
            if (isTyping) return

            if (e.altKey && e.key.toLowerCase() === "n" && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
                e.preventDefault()
                setOpen(prev => !prev)
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [])

    useEffect(() => {
        if (open) fetchData()
    }, [open])

    const handleMarkRead = (id: number) => {
        startTransition(async () => {
            await markNotificationAsRead(id)
            await fetchData()
        })
    }

    const handleMarkAllRead = () => {
        startTransition(async () => {
            await markAllNotificationsAsRead()
            await fetchData()
        })
    }

    const handleNotificationClick = (notif: Notification) => {
        if (!notif.is_read) handleMarkRead(notif.notification_id)
        if (notif.link) {
            setOpen(false)
            router.push(notif.link)
        }
    }

    if (!hasMounted) {
        return (
            <Button variant="outline" size="icon" className="relative">
                <Bell className="h-[1.2rem] w-[1.2rem]" />
                <span className="sr-only">Notifications</span>
            </Button>
        )
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="icon" className="relative">
                            <Bell className="h-[1.2rem] w-[1.2rem]" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                    {unreadCount > 9 ? "9+" : unreadCount}
                                </span>
                            )}
                            <span className="sr-only">Notifications</span>
                        </Button>
                    </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="flex items-center gap-2">
                    Notifications
                    <kbd className="inline-flex h-5 items-center justify-center rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground ml-1">
                        Alt + N
                    </kbd>
                </TooltipContent>
            </Tooltip>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <h4 className="text-sm font-semibold">Notifications</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto px-2 py-1 text-xs"
                            onClick={handleMarkAllRead}
                            disabled={isPending}
                        >
                            <CheckCheck className="mr-1 h-3 w-3" />
                            Mark all read
                        </Button>
                    )}
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                            <Bell className="mb-2 h-8 w-8 opacity-40" />
                            <p className="text-sm">No notifications yet</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notif) => (
                                <div
                                    key={notif.notification_id}
                                    className={`flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50 ${!notif.is_read ? "bg-primary/5" : ""}`}
                                    onClick={() => handleNotificationClick(notif)}
                                >
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <p className={`text-sm leading-none ${!notif.is_read ? "font-semibold" : "font-medium"}`}>
                                                {notif.title}
                                            </p>
                                            {!notif.is_read && (
                                                <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                            {notif.message}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground/70">
                                            {hasMounted ? formatDistanceToNow(new Date(notif.created_at), { addSuffix: true }) : "Recent"}
                                        </p>
                                    </div>
                                    {!notif.is_read && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 flex-shrink-0"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleMarkRead(notif.notification_id)
                                            }}
                                        >
                                            <Check className="h-3 w-3" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}
