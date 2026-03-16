/**
 * Server-side Socket.IO emitter.
 * In production (Vercel), emits events by POSTing to the Render Socket.IO server.
 * In development, uses the in-process globalThis.__io if available, otherwise
 * falls back to HTTP relay.
 */

const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000"
const EMIT_SECRET = process.env.SOCKET_EMIT_SECRET || "dev-secret"

async function relayEmit(room: string, event: string, data: unknown) {
    try {
        await fetch(`${SOCKET_SERVER_URL}/emit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ secret: EMIT_SECRET, room, event, data }),
        })
    } catch (err) {
        console.error("[socket-emitter] Failed to relay event:", err)
    }
}

/**
 * Push a notification event to a specific user's room.
 */
export async function emitNotification(
    userId: number,
    userRole: string,
    data: { title: string; message: string; link?: string }
) {
    await relayEmit(`user:${userRole}:${userId}`, "notification:new", data)
}

/**
 * Broadcast a discussion message to a group room.
 */
export async function emitDiscussionMessage(
    groupId: number,
    message: Record<string, unknown>
) {
    await relayEmit(`group:${groupId}`, "discussion:message", message)
}
