"use client"

import { useState } from "react"
import { ChatPanel } from "@/components/shared/chat-panel"

interface Props {
    groupId: number
    groupName: string
    studentId: number
}

export function StudentDiscussionClient({ groupId, groupName, studentId }: Props) {
    const [tab, setTab] = useState<"discussion" | "announcement">("discussion")

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Discussion</h1>
                <p className="text-muted-foreground">
                    Chat with your group members and view guide announcements.
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
                <button
                    onClick={() => setTab("discussion")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === "discussion"
                            ? "bg-background shadow text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                >
                    💬 Discussion
                </button>
                <button
                    onClick={() => setTab("announcement")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === "announcement"
                            ? "bg-background shadow text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                >
                    📢 Announcements
                </button>
            </div>

            <ChatPanel
                key={`${groupId}-${tab}`}
                projectGroupId={groupId}
                groupName={groupName}
                currentUserId={studentId}
                currentUserRole="student"
                channel={tab}
                canSend={tab === "discussion"}
                canReply={tab === "announcement"}
            />
        </div>
    )
}
