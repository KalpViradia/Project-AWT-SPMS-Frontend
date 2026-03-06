"use client"

import { useState, useEffect } from "react"
import { getFacultyGroups } from "@/lib/discussion-actions"
import { ChatPanel } from "@/components/shared/chat-panel"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { MessageSquare } from "lucide-react"
import { useSession } from "next-auth/react"

type Group = {
    project_group_id: number
    project_group_name: string
    project_title: string
}

export default function FacultyDiscussionPage() {
    const { data: session } = useSession()
    const [groups, setGroups] = useState<Group[]>([])
    const [selectedGroupId, setSelectedGroupId] = useState<string>("")

    useEffect(() => {
        getFacultyGroups().then((g) => setGroups(g))
    }, [])

    const selectedGroup = groups.find((g) => g.project_group_id === parseInt(selectedGroupId))
    const userId = parseInt((session?.user as any)?.id || "0")

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
                <p className="text-muted-foreground">
                    Post announcements to your guided project groups.
                </p>
            </div>

            <div className="max-w-xs">
                <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a group..." />
                    </SelectTrigger>
                    <SelectContent>
                        {groups.map((g) => (
                            <SelectItem key={g.project_group_id} value={String(g.project_group_id)}>
                                {g.project_group_name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {selectedGroup ? (
                <ChatPanel
                    key={selectedGroup.project_group_id}
                    projectGroupId={selectedGroup.project_group_id}
                    groupName={selectedGroup.project_group_name}
                    currentUserId={userId}
                    currentUserRole="faculty"
                    channel="announcement"
                    canSend={true}
                    canReply={true}
                />
            ) : (
                <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                        <MessageSquare className="mx-auto mb-4 h-12 w-12 opacity-40" />
                        <p>{groups.length === 0 ? "You are not a guide for any groups." : "Select a group to manage announcements."}</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
