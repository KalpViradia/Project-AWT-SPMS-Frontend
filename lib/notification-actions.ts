'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { emitNotification } from "@/lib/socket-emitter"

// ─── Helper: create a notification ───
export async function createNotification({
    userId,
    userRole,
    title,
    message,
    link,
}: {
    userId: number
    userRole: string
    title: string
    message: string
    link?: string
}) {
    await prisma.notification.create({
        data: {
            user_id: userId,
            user_role: userRole,
            title,
            message,
            link: link || null,
        },
    })

    // Push real-time event via WebSocket
    await emitNotification(userId, userRole, { title, message, link })
}

// ─── Get notifications for current user ───
export async function getNotifications() {
    const session = await auth()
    if (!session?.user) return []

    const userId = parseInt((session.user as any).id)
    const userRole = (session.user as any).role as string

    return prisma.notification.findMany({
        where: { user_id: userId, user_role: userRole },
        orderBy: { created_at: 'desc' },
        take: 20,
    })
}

// ─── Get unread count ───
export async function getUnreadCount() {
    const session = await auth()
    if (!session?.user) return 0

    const userId = parseInt((session.user as any).id)
    const userRole = (session.user as any).role as string

    return prisma.notification.count({
        where: { user_id: userId, user_role: userRole, is_read: false },
    })
}

// ─── Mark one notification as read ───
export async function markNotificationAsRead(notificationId: number) {
    const session = await auth()
    if (!session?.user) return

    await prisma.notification.update({
        where: { notification_id: notificationId },
        data: { is_read: true },
    })
    revalidatePath('/dashboard')
}

// ─── Mark all as read ───
export async function markAllNotificationsAsRead() {
    const session = await auth()
    if (!session?.user) return

    const userId = parseInt((session.user as any).id)
    const userRole = (session.user as any).role as string

    await prisma.notification.updateMany({
        where: { user_id: userId, user_role: userRole, is_read: false },
        data: { is_read: true },
    })
    revalidatePath('/dashboard')
}
