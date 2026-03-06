import type { Server } from "socket.io"

declare global {
    // eslint-disable-next-line no-var
    var __io: Server | undefined
}

function getIO(): Server | null {
    return globalThis.__io ?? null
}

/**
 * Push a notification event to a specific user's room.
 */
export function emitNotification(
    userId: number,
    userRole: string,
    data: { title: string; message: string; link?: string }
) {
    const io = getIO()
    if (!io) return
    io.to(`user:${userRole}:${userId}`).emit("notification:new", data)
}

/**
 * Broadcast a discussion message to a group room.
 */
export function emitDiscussionMessage(
    groupId: number,
    message: Record<string, unknown>
) {
    const io = getIO()
    if (!io) return
    io.to(`group:${groupId}`).emit("discussion:message", message)
}
