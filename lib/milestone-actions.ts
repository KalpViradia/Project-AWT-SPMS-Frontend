'use server'

import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

// ============================================
// MILESTONE CRUD
// ============================================

export async function getMilestones(projectGroupId: number) {
    return prisma.project_milestone.findMany({
        where: { project_group_id: projectGroupId },
        orderBy: { sort_order: 'asc' },
    })
}

const CreateMilestoneSchema = z.object({
    projectGroupId: z.coerce.number().positive(),
    title: z.string().min(2, "Title must be at least 2 characters."),
    startDate: z.string().min(1, "Start date is required."),
    endDate: z.string().min(1, "End date is required."),
    progress: z.coerce.number().min(0).max(100).default(0),
    color: z.string().optional(),
})

export async function createMilestone(formData: FormData) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")

    const user = session.user as { id: string; role?: string | null }
    if (user.role !== 'student') throw new Error("Only students can create milestones.")

    const parsed = CreateMilestoneSchema.safeParse(Object.fromEntries(formData))
    if (!parsed.success) {
        return { error: parsed.error.issues.map(e => e.message).join(", ") }
    }

    const { projectGroupId, title, startDate, endDate, progress, color } = parsed.data

    // Verify student is in this group
    const studentId = parseInt(user.id)
    const membership = await prisma.project_group_member.findFirst({
        where: { student_id: studentId, project_group_id: projectGroupId },
    })
    if (!membership) return { error: "You are not a member of this group." }

    // Get next sort order
    const maxSort = await prisma.project_milestone.aggregate({
        where: { project_group_id: projectGroupId },
        _max: { sort_order: true },
    })

    await prisma.project_milestone.create({
        data: {
            project_group_id: projectGroupId,
            title,
            start_date: new Date(startDate),
            end_date: new Date(endDate),
            progress,
            color: color || '#3b82f6',
            sort_order: (maxSort._max.sort_order ?? -1) + 1,
        },
    })

    revalidatePath('/dashboard/student/timeline')
    return { success: true }
}

const UpdateMilestoneSchema = z.object({
    milestoneId: z.coerce.number().positive(),
    title: z.string().min(2, "Title must be at least 2 characters."),
    startDate: z.string().min(1, "Start date is required."),
    endDate: z.string().min(1, "End date is required."),
    progress: z.coerce.number().min(0).max(100).default(0),
    color: z.string().optional(),
})

export async function updateMilestone(formData: FormData) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")

    const user = session.user as { id: string; role?: string | null }
    if (user.role !== 'student') throw new Error("Only students can update milestones.")

    const parsed = UpdateMilestoneSchema.safeParse(Object.fromEntries(formData))
    if (!parsed.success) {
        return { error: parsed.error.issues.map(e => e.message).join(", ") }
    }

    const { milestoneId, title, startDate, endDate, progress, color } = parsed.data

    // Verify milestone exists and student is in the group
    const milestone = await prisma.project_milestone.findUnique({
        where: { milestone_id: milestoneId },
    })
    if (!milestone) return { error: "Milestone not found." }

    const studentId = parseInt(user.id)
    const membership = await prisma.project_group_member.findFirst({
        where: { student_id: studentId, project_group_id: milestone.project_group_id },
    })
    if (!membership) return { error: "You are not a member of this group." }

    await prisma.project_milestone.update({
        where: { milestone_id: milestoneId },
        data: {
            title,
            start_date: new Date(startDate),
            end_date: new Date(endDate),
            progress,
            color: color || '#3b82f6',
            modified_at: new Date(),
        },
    })

    revalidatePath('/dashboard/student/timeline')
    return { success: true }
}

const DeleteMilestoneSchema = z.object({
    milestoneId: z.coerce.number().positive(),
})

export async function deleteMilestone(formData: FormData) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")

    const user = session.user as { id: string; role?: string | null }
    if (user.role !== 'student') throw new Error("Only students can delete milestones.")

    const parsed = DeleteMilestoneSchema.safeParse(Object.fromEntries(formData))
    if (!parsed.success) {
        return { error: parsed.error.issues.map(e => e.message).join(", ") }
    }

    const { milestoneId } = parsed.data

    const milestone = await prisma.project_milestone.findUnique({
        where: { milestone_id: milestoneId },
    })
    if (!milestone) return { error: "Milestone not found." }

    const studentId = parseInt(user.id)
    const membership = await prisma.project_group_member.findFirst({
        where: { student_id: studentId, project_group_id: milestone.project_group_id },
    })
    if (!membership) return { error: "You are not a member of this group." }

    await prisma.project_milestone.delete({
        where: { milestone_id: milestoneId },
    })

    revalidatePath('/dashboard/student/timeline')
    return { success: true }
}
