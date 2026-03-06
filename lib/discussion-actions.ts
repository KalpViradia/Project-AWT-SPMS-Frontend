'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { emitDiscussionMessage } from "@/lib/socket-emitter"

// ─── Get messages for a group + channel ───
export async function getDiscussionMessages(projectGroupId: number, channel: string = "discussion") {
    return prisma.discussion_message.findMany({
        where: { project_group_id: projectGroupId, channel },
        orderBy: { created_at: 'asc' },
        take: 200,
        include: {
            reply_to: {
                select: {
                    message_id: true,
                    sender_name: true,
                    content: true,
                    sender_role: true,
                }
            },
            reactions: true,
        }
    })
}

// ─── Send a message ───
export async function sendDiscussionMessage(formData: FormData) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")

    const user = session.user as { id: string; role?: string | null; name?: string | null }
    const content = formData.get('content') as string
    const groupIdStr = formData.get('projectGroupId') as string
    const channel = (formData.get('channel') as string) || 'discussion'
    const replyToIdStr = formData.get('replyToId') as string | null
    const attachmentUrl = formData.get('attachmentUrl') as string | null
    const attachmentType = formData.get('attachmentType') as string | null

    if (!content?.trim() && !attachmentUrl) throw new Error("Message cannot be empty.")
    if (!groupIdStr) throw new Error("Project group ID required.")

    const projectGroupId = parseInt(groupIdStr)
    const senderId = parseInt(user.id)
    const senderRole = user.role || 'student'

    // Permission checks
    if (channel === 'announcement' && senderRole !== 'faculty') {
        // Students can reply to announcements, but the reply_to_id must be set
        if (!replyToIdStr) {
            throw new Error("Only faculty can post announcements. Students can only reply.")
        }
    }
    if (channel === 'discussion' && senderRole !== 'student') {
        throw new Error("Only students can post in the discussion channel.")
    }

    // Get sender name
    let senderName = user.name || null
    if (!senderName) {
        if (senderRole === 'student') {
            const s = await prisma.student.findUnique({ where: { student_id: senderId }, select: { student_name: true } })
            senderName = s?.student_name || `Student #${senderId}`
        } else {
            const s = await prisma.staff.findUnique({ where: { staff_id: senderId }, select: { staff_name: true } })
            senderName = s?.staff_name || `Faculty #${senderId}`
        }
    }

    const replyToId = replyToIdStr ? parseInt(replyToIdStr) : null

    const created = await prisma.discussion_message.create({
        data: {
            project_group_id: projectGroupId,
            sender_id: senderId,
            sender_role: senderRole,
            sender_name: senderName,
            content: (content || '').trim(),
            channel,
            reply_to_id: replyToId,
            attachment_url: attachmentUrl || null,
            attachment_type: attachmentType || null,
        },
        include: {
            reply_to: {
                select: {
                    message_id: true,
                    sender_name: true,
                    content: true,
                    sender_role: true,
                }
            },
            reactions: true,
        }
    })

    // Broadcast via WebSocket
    emitDiscussionMessage(projectGroupId, {
        ...created,
        _channel: channel,
    })

    revalidatePath('/dashboard/student/discussion')
    revalidatePath('/dashboard/faculty/discussion')

    return created
}

// ─── Toggle reaction ───
export async function toggleReaction(messageId: number, emoji: string) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")

    const user = session.user as { id: string; role?: string | null }
    const userId = parseInt(user.id)
    const userRole = user.role || 'student'

    // Check if reaction exists
    const existing = await prisma.message_reaction.findUnique({
        where: {
            message_id_user_id_emoji: {
                message_id: messageId,
                user_id: userId,
                emoji,
            }
        }
    })

    if (existing) {
        await prisma.message_reaction.delete({ where: { reaction_id: existing.reaction_id } })
    } else {
        await prisma.message_reaction.create({
            data: {
                message_id: messageId,
                user_id: userId,
                user_role: userRole,
                emoji,
            }
        })
    }

    // Get updated reactions for the message
    const reactions = await prisma.message_reaction.findMany({
        where: { message_id: messageId },
    })

    return reactions
}

// ─── Search messages ───
export async function searchMessages(projectGroupId: number, channel: string, query: string) {
    if (!query.trim()) return []

    return prisma.discussion_message.findMany({
        where: {
            project_group_id: projectGroupId,
            channel,
            content: { contains: query, mode: 'insensitive' },
        },
        orderBy: { created_at: 'desc' },
        take: 50,
        include: {
            reactions: true,
            reply_to: {
                select: {
                    message_id: true,
                    sender_name: true,
                    content: true,
                    sender_role: true,
                }
            },
        }
    })
}

// ─── Get groups the user belongs to (for faculty) ───
export async function getFacultyGroups() {
    const session = await auth()
    if (!session?.user) return []

    const user = session.user as { id: string; role?: string | null }
    const staffId = parseInt(user.id)

    return prisma.project_group.findMany({
        where: { guide_staff_id: staffId },
        select: {
            project_group_id: true,
            project_group_name: true,
            project_title: true,
        },
        orderBy: { project_group_name: 'asc' },
    })
}

// ─── Get student's group id ───
export async function getStudentGroupId() {
    const session = await auth()
    if (!session?.user) return null

    const user = session.user as { id: string; role?: string | null }
    const studentId = parseInt(user.id)

    const membership = await prisma.project_group_member.findFirst({
        where: { student_id: studentId },
        include: {
            project_group: {
                select: {
                    project_group_id: true,
                    project_group_name: true,
                },
            },
        },
    })

    return membership
        ? { groupId: membership.project_group.project_group_id, groupName: membership.project_group.project_group_name }
        : null
}
