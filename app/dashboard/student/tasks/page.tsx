import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { KanbanBoard } from "@/components/shared/kanban-board"
import { getTasks } from "@/lib/task-actions"
import { ListTodo } from "lucide-react"

export default async function TasksPage() {
    const session = await auth()
    if (!session?.user) redirect("/login")

    const user = session.user as { id: string; role?: string | null }
    if (user.role !== "student") redirect("/")

    const studentId = parseInt(user.id)

    const membership = await prisma.project_group_member.findFirst({
        where: { student_id: studentId },
        include: {
            project_group: {
                include: {
                    project_group_member: {
                        include: { student: { select: { student_id: true, student_name: true } } },
                    },
                },
            },
        },
    })

    if (!membership) {
        return (
            <div className="flex flex-col gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Task Board</h1>
                <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                        <ListTodo className="mx-auto mb-4 h-12 w-12 opacity-40" />
                        <p>Join a project group to use the task board.</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const group = membership.project_group
    const groupId = group.project_group_id

    const tasks = await getTasks(groupId)
    const members = group.project_group_member.map((m) => ({
        student_id: m.student.student_id,
        student_name: m.student.student_name,
    }))

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Task Board</h1>
                <p className="text-muted-foreground">
                    Manage your project tasks across columns. Click arrows to move tasks.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{group.project_group_name}</CardTitle>
                    <CardDescription>
                        {group.project_title} · {tasks.length} task{tasks.length !== 1 ? "s" : ""}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <KanbanBoard
                        tasks={tasks}
                        projectGroupId={groupId}
                        members={members}
                        editable={true}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
