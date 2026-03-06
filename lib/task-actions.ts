'use server'

import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

// ============================================
// TASK / KANBAN CRUD
// ============================================

export async function getTasks(projectGroupId: number) {
    return prisma.project_task.findMany({
        where: { project_group_id: projectGroupId },
        include: { student: { select: { student_id: true, student_name: true } } },
        orderBy: { sort_order: 'asc' },
    })
}

export async function getTaskCounts(projectGroupId: number) {
    const tasks = await prisma.project_task.groupBy({
        by: ['status'],
        where: { project_group_id: projectGroupId },
        _count: true,
    })
    const counts: Record<string, number> = { todo: 0, in_progress: 0, review: 0, done: 0 }
    for (const t of tasks) { counts[t.status] = t._count }
    return counts
}

const CreateTaskSchema = z.object({
    projectGroupId: z.coerce.number().positive(),
    title: z.string().min(2, "Title must be at least 2 characters."),
    description: z.string().optional(),
    priority: z.enum(["low", "medium", "high"]).default("medium"),
    assignedTo: z.coerce.number().optional().nullable(),
    dueDate: z.string().optional(),
})

export async function createTask(formData: FormData) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")
    const user = session.user as { id: string; role?: string | null }
    if (user.role !== 'student') throw new Error("Only students can create tasks.")

    const raw = Object.fromEntries(formData)
    if (!raw.assignedTo || raw.assignedTo === '') delete raw.assignedTo
    if (!raw.dueDate || raw.dueDate === '') delete raw.dueDate

    const parsed = CreateTaskSchema.safeParse(raw)
    if (!parsed.success) {
        return { error: parsed.error.issues.map(e => e.message).join(", ") }
    }

    const { projectGroupId, title, description, priority, assignedTo, dueDate } = parsed.data

    const studentId = parseInt(user.id)
    const membership = await prisma.project_group_member.findFirst({
        where: { student_id: studentId, project_group_id: projectGroupId },
    })
    if (!membership) return { error: "You are not a member of this group." }

    const maxSort = await prisma.project_task.aggregate({
        where: { project_group_id: projectGroupId },
        _max: { sort_order: true },
    })

    await prisma.project_task.create({
        data: {
            project_group_id: projectGroupId,
            title,
            description: description || null,
            priority,
            assigned_to: assignedTo || null,
            due_date: dueDate ? new Date(dueDate) : null,
            sort_order: (maxSort._max.sort_order ?? -1) + 1,
        },
    })

    revalidatePath('/dashboard/student/tasks')
    return { success: true }
}

const UpdateTaskSchema = z.object({
    taskId: z.coerce.number().positive(),
    title: z.string().min(2).optional(),
    description: z.string().optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
    assignedTo: z.coerce.number().optional().nullable(),
    dueDate: z.string().optional(),
    status: z.enum(["todo", "in_progress", "review", "done"]).optional(),
})

export async function updateTask(formData: FormData) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")
    const user = session.user as { id: string; role?: string | null }
    if (user.role !== 'student') throw new Error("Only students can update tasks.")

    const raw = Object.fromEntries(formData)
    if (!raw.assignedTo || raw.assignedTo === '') delete raw.assignedTo
    if (!raw.dueDate || raw.dueDate === '') delete raw.dueDate

    const parsed = UpdateTaskSchema.safeParse(raw)
    if (!parsed.success) {
        return { error: parsed.error.issues.map(e => e.message).join(", ") }
    }

    const { taskId, title, description, priority, assignedTo, dueDate, status } = parsed.data

    const task = await prisma.project_task.findUnique({ where: { task_id: taskId } })
    if (!task) return { error: "Task not found." }

    const studentId = parseInt(user.id)
    const membership = await prisma.project_group_member.findFirst({
        where: { student_id: studentId, project_group_id: task.project_group_id },
    })
    if (!membership) return { error: "You are not a member of this group." }

    await prisma.project_task.update({
        where: { task_id: taskId },
        data: {
            ...(title !== undefined && { title }),
            ...(description !== undefined && { description: description || null }),
            ...(priority !== undefined && { priority }),
            ...(assignedTo !== undefined && { assigned_to: assignedTo || null }),
            ...(dueDate !== undefined && { due_date: dueDate ? new Date(dueDate) : null }),
            ...(status !== undefined && { status }),
            modified_at: new Date(),
        },
    })

    revalidatePath('/dashboard/student/tasks')
    return { success: true }
}

export async function updateTaskStatus(formData: FormData) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")
    const user = session.user as { id: string; role?: string | null }
    if (user.role !== 'student') throw new Error("Only students can move tasks.")

    const taskId = parseInt(formData.get('taskId') as string)
    const status = formData.get('status') as string

    if (!['todo', 'in_progress', 'review', 'done'].includes(status)) {
        return { error: "Invalid status." }
    }

    const task = await prisma.project_task.findUnique({ where: { task_id: taskId } })
    if (!task) return { error: "Task not found." }

    const studentId = parseInt(user.id)
    const membership = await prisma.project_group_member.findFirst({
        where: { student_id: studentId, project_group_id: task.project_group_id },
    })
    if (!membership) return { error: "You are not a member of this group." }

    await prisma.project_task.update({
        where: { task_id: taskId },
        data: { status, modified_at: new Date() },
    })

    revalidatePath('/dashboard/student/tasks')
    return { success: true }
}

export async function deleteTask(formData: FormData) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")
    const user = session.user as { id: string; role?: string | null }
    if (user.role !== 'student') throw new Error("Only students can delete tasks.")

    const taskId = parseInt(formData.get('taskId') as string)

    const task = await prisma.project_task.findUnique({ where: { task_id: taskId } })
    if (!task) return { error: "Task not found." }

    const studentId = parseInt(user.id)
    const membership = await prisma.project_group_member.findFirst({
        where: { student_id: studentId, project_group_id: task.project_group_id },
    })
    if (!membership) return { error: "You are not a member of this group." }

    await prisma.project_task.delete({ where: { task_id: taskId } })

    revalidatePath('/dashboard/student/tasks')
    return { success: true }
}
