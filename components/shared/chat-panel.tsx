"use client"

import { useEffect, useState, useRef, useTransition, useCallback } from "react"
import { getDiscussionMessages, sendDiscussionMessage, toggleReaction, searchMessages } from "@/lib/discussion-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Send, MessageSquare, Loader2, Paperclip, X, Search,
    Reply, Image as ImageIcon, FileText, Download
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useSocket } from "@/components/socket-provider"
import { toast } from "sonner"

type Reaction = {
    reaction_id: number
    message_id: number
    user_id: number
    user_role: string
    emoji: string
}

type ReplyTo = {
    message_id: number
    sender_name: string | null
    content: string
    sender_role: string
}

type Message = {
    message_id: number
    sender_id: number
    sender_role: string
    sender_name: string | null
    content: string
    channel: string
    reply_to_id: number | null
    attachment_url: string | null
    attachment_type: string | null
    created_at: Date | string
    reply_to: ReplyTo | null
    reactions: Reaction[]
    _channel?: string
}

interface ChatPanelProps {
    projectGroupId: number
    groupName: string
    currentUserId: number
    currentUserName: string
    currentUserRole: string
    channel: "discussion" | "announcement"
    canSend: boolean      // true if user can create new messages
    canReply?: boolean     // true if user can reply (students in announcement)
}

const EMOJI_LIST = ["👍", "❤️", "😂", "🎉", "✅", "❓"]

export function ChatPanel({
    projectGroupId,
    groupName,
    currentUserId,
    currentUserName,
    currentUserRole,
    channel,
    canSend,
    canReply = false,
}: ChatPanelProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState("")
    const [typingUsers, setTypingUsers] = useState<Record<number, string>>({})
    const [isPending, startTransition] = useTransition()
    const [isUploading, setIsUploading] = useState(false)
    const [replyTo, setReplyTo] = useState<ReplyTo | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [showSearch, setShowSearch] = useState(false)
    const [searchResults, setSearchResults] = useState<Message[] | null>(null)
    const [attachment, setAttachment] = useState<{ url: string; type: string; name: string } | null>(null)
    const scrollRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { socket, isWaking } = useSocket()
    const prevGroupRef = useRef<number | null>(null)
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Fetch messages
    const fetchMessages = useCallback(async () => {
        try {
            const msgs = await getDiscussionMessages(projectGroupId, channel)
            setMessages(msgs as Message[])
        } catch (err) {
            console.error("Failed to fetch messages:", err)
        }
    }, [projectGroupId, channel])

    // Socket join/leave
    useEffect(() => {
        if (!socket) return

        if (prevGroupRef.current && prevGroupRef.current !== projectGroupId) {
            socket.emit("leave:group", { groupId: prevGroupRef.current })
        }

        socket.emit("join:group", { groupId: projectGroupId })
        prevGroupRef.current = projectGroupId

        const handler = (msg: Message) => {
            // Only add if same channel
            const msgChannel = msg._channel || msg.channel
            if (msgChannel === channel) {
                setMessages((prev) => {
                    // Avoid duplicates
                    if (prev.some(m => m.message_id === msg.message_id)) return prev
                    return [...prev, msg]
                })
            }
        }

        socket.on("discussion:message", handler)

        const typingHandler = ({ userId, userName, isTyping }: { userId: number, userName: string, isTyping: boolean }) => {
            if (userId === currentUserId) return
            setTypingUsers(prev => {
                const next = { ...prev }
                if (isTyping) {
                    next[userId] = userName
                } else {
                    delete next[userId]
                }
                return next
            })
        }

        socket.on("typing:update", typingHandler)

        return () => {
            socket.off("discussion:message", handler)
            socket.off("typing:update", typingHandler)
        }
    }, [socket, projectGroupId, channel, currentUserId])

    // Handling typing emission
    const handleInputChange = (val: string) => {
        setNewMessage(val)
        if (!socket) return

        // Emit typing status
        socket.emit("typing", {
            groupId: projectGroupId,
            userId: currentUserId,
            userName: currentUserName,
            isTyping: val.length > 0
        })

        // Debounce stopping typing
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit("typing", {
                groupId: projectGroupId,
                userId: currentUserId,
                userName: currentUserName,
                isTyping: false
            })
        }, 3000)
    }

    // Initial fetch
    useEffect(() => {
        fetchMessages()
        setSearchResults(null)
        setSearchQuery("")
        setShowSearch(false)
    }, [projectGroupId, channel, fetchMessages])

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current && !searchResults) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages, searchResults])

    // File upload handler
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 10 * 1024 * 1024) {
            toast.error("File size exceeds 10MB limit")
            return
        }

        setIsUploading(true)
        try {
            const formData = new FormData()
            formData.append("file", file)

            const res = await fetch("/api/chat-upload", { method: "POST", body: formData })
            const data = await res.json()

            if (!res.ok) throw new Error(data.error)

            setAttachment({ url: data.url, type: data.type, name: data.name || file.name })
            toast.success("File ready to send")
        } catch (err: any) {
            toast.error(err.message || "Upload failed")
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ""
        }
    }

    // Send message
    const handleSend = (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() && !attachment) return

        const formData = new FormData()
        formData.set("content", newMessage)
        formData.set("projectGroupId", String(projectGroupId))
        formData.set("channel", channel)
        if (replyTo) formData.set("replyToId", String(replyTo.message_id))
        if (attachment) {
            formData.set("attachmentUrl", attachment.url)
            formData.set("attachmentType", attachment.type)
        }

        startTransition(async () => {
            try {
                await sendDiscussionMessage(formData)
                setNewMessage("")
                setReplyTo(null)
                setAttachment(null)
            } catch (err: any) {
                toast.error(err.message || "Failed to send message")
            }
        })
    }

    // Toggle reaction
    const handleReaction = async (messageId: number, emoji: string) => {
        try {
            const updated = await toggleReaction(messageId, emoji)
            setMessages((prev) =>
                prev.map((m) =>
                    m.message_id === messageId ? { ...m, reactions: updated } : m
                )
            )
        } catch {
            toast.error("Failed to update reaction")
        }
    }

    // Search
    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            setSearchResults(null)
            return
        }
        const results = await searchMessages(projectGroupId, channel, searchQuery)
        setSearchResults(results as Message[])
    }

    const isOwn = (msg: Message) =>
        msg.sender_id === currentUserId && msg.sender_role === currentUserRole

    const displayMessages = searchResults ?? messages
    const canUserSend = canSend || (canReply && replyTo !== null)

    return (
        <div className="flex flex-col h-[550px] border rounded-lg overflow-hidden bg-card transition-all duration-300">
            {/* Wake-up Banner */}
            {isWaking && (
                <div className="bg-primary/10 border-b px-4 py-2 flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                    <p className="text-[11px] font-medium text-primary tracking-wide">
                        Server is waking up... please wait a few seconds.
                    </p>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center gap-2 border-b px-4 py-2.5 bg-muted/30">
                <MessageSquare className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">{groupName}</h3>
                <span className="text-xs text-muted-foreground">
                    {channel === "announcement" ? "📢 Announcements" : "💬 Discussion"}
                </span>
                <div className="ml-auto flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setShowSearch(!showSearch); setSearchResults(null) }}>
                        <Search className="h-3.5 w-3.5" />
                    </Button>
                    <span className="text-xs text-muted-foreground">
                        {messages.length} msg{messages.length !== 1 ? "s" : ""}
                    </span>
                </div>
            </div>

            {/* Click-away overlay for search (invisible) */}
            {showSearch && (
                <div 
                    className="fixed inset-0 z-40 bg-transparent" 
                    onClick={() => {
                        if (!searchQuery.trim() && !searchResults) {
                            setShowSearch(false)
                        }
                    }} 
                />
            )}

            {/* Search bar */}
            {showSearch && (
                <div className="relative z-50 flex items-center gap-2 px-3 py-2 border-b bg-muted/10 animate-in slide-in-from-top-2 duration-200">
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        onBlur={() => {
                            if (!searchQuery.trim() && !searchResults) {
                                setShowSearch(false)
                            }
                        }}
                        autoFocus
                        placeholder="Search messages..."
                        className="h-8 text-xs flex-1"
                    />
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleSearch}>
                        Search
                    </Button>
                    {searchResults && (
                        <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => { setSearchResults(null); setSearchQuery("") }}>
                            Clear
                        </Button>
                    )}
                </div>
            )}

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {searchResults && (
                    <div className="text-xs text-muted-foreground mb-2 pb-2 border-b">
                        Found {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for &quot;{searchQuery}&quot;
                    </div>
                )}

                {displayMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <MessageSquare className="h-10 w-10 mb-2 opacity-30" />
                        <p className="text-sm">
                            {searchResults ? "No messages found." : channel === "announcement" ? "No announcements yet." : "No messages yet. Start the conversation!"}
                        </p>
                    </div>
                ) : (
                    displayMessages.map((msg) => (
                        <div
                            key={msg.message_id}
                            className={`flex ${isOwn(msg) ? "justify-end" : "justify-start"}`}
                        >
                            <div className={`max-w-[80%] group`}>
                                {/* Reply context */}
                                {msg.reply_to && (
                                    <div className="text-[10px] text-muted-foreground bg-muted/50 rounded-t px-2 py-1 border-l-2 border-primary/40 mb-0.5">
                                        ↩ {msg.reply_to.sender_name || msg.reply_to.sender_role}: {msg.reply_to.content?.slice(0, 60)}{(msg.reply_to.content?.length || 0) > 60 ? "..." : ""}
                                    </div>
                                )}

                                <div className={`rounded-lg px-3 py-2 text-sm ${isOwn(msg)
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted"
                                    }`}>
                                    {/* Sender name */}
                                    {!isOwn(msg) && (
                                        <p className="text-[11px] font-semibold mb-0.5 opacity-80">
                                            {msg.sender_name || (msg.sender_role === "faculty" ? "Guide" : `Student`)}
                                            {msg.sender_role === "faculty" && (
                                                <span className="ml-1 text-[9px] font-normal opacity-60">• Faculty</span>
                                            )}
                                        </p>
                                    )}

                                    {/* Content */}
                                    {msg.content && (
                                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                    )}

                                    {/* Attachment */}
                                    {msg.attachment_url && (
                                        <div className="mt-1.5">
                                            {msg.attachment_type === "image" ? (
                                                <img
                                                    src={msg.attachment_url}
                                                    alt="Attachment"
                                                    className="max-w-full max-h-48 rounded border cursor-pointer"
                                                    onClick={() => window.open(msg.attachment_url!, "_blank")}
                                                />
                                            ) : (
                                                <a
                                                    href={msg.attachment_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded border ${isOwn(msg) ? "border-primary-foreground/30 text-primary-foreground" : "border-border"
                                                        }`}
                                                >
                                                    <FileText className="h-3 w-3" />
                                                    <span className="truncate max-w-[150px]">
                                                        {msg.attachment_url.split("/").pop()}
                                                    </span>
                                                    <Download className="h-3 w-3" />
                                                </a>
                                            )}
                                        </div>
                                    )}

                                    {/* Timestamp */}
                                    <p className={`text-[10px] mt-1 ${isOwn(msg) ? "text-primary-foreground/60" : "text-muted-foreground/60"}`}>
                                        {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                                    </p>
                                </div>

                                {/* Reactions display */}
                                {msg.reactions && msg.reactions.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-0.5">
                                        {Object.entries(
                                            msg.reactions.reduce<Record<string, { count: number; hasOwn: boolean }>>((acc, r) => {
                                                if (!acc[r.emoji]) acc[r.emoji] = { count: 0, hasOwn: false }
                                                acc[r.emoji].count++
                                                if (r.user_id === currentUserId && r.user_role === currentUserRole) {
                                                    acc[r.emoji].hasOwn = true
                                                }
                                                return acc
                                            }, {})
                                        ).map(([emoji, { count, hasOwn }]) => (
                                            <button
                                                key={emoji}
                                                onClick={() => handleReaction(msg.message_id, emoji)}
                                                className={`text-xs px-1.5 py-0.5 rounded-full border transition-colors ${hasOwn ? "bg-primary/10 border-primary/30" : "bg-muted border-transparent hover:border-border"
                                                    }`}
                                            >
                                                {emoji} {count}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Actions (visible on hover) */}
                                <div className="flex items-center gap-0.5 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {EMOJI_LIST.map((emoji) => (
                                        <button
                                            key={emoji}
                                            onClick={() => handleReaction(msg.message_id, emoji)}
                                            className="text-xs p-0.5 rounded hover:bg-muted transition-colors"
                                            title={emoji}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                    {(canSend || canReply) && (
                                        <button
                                            onClick={() => setReplyTo({
                                                message_id: msg.message_id,
                                                sender_name: msg.sender_name,
                                                content: msg.content,
                                                sender_role: msg.sender_role,
                                            })}
                                            className="text-xs p-0.5 rounded hover:bg-muted transition-colors ml-1"
                                            title="Reply"
                                        >
                                            <Reply className="h-3 w-3" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Reply preview */}
            {replyTo && (
                <div className="flex items-center gap-2 px-4 py-1.5 border-t bg-muted/30 text-xs">
                    <Reply className="h-3 w-3 text-primary" />
                    <span className="text-muted-foreground truncate flex-1">
                        Replying to <strong>{replyTo.sender_name || replyTo.sender_role}</strong>: {replyTo.content?.slice(0, 50)}
                    </span>
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setReplyTo(null)}>
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            )}

            {/* Attachment preview */}
            {attachment && (
                <div className="flex items-center gap-2 px-4 py-1.5 border-t bg-muted/30 text-xs">
                    {attachment.type === "image" ? <ImageIcon className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                    <span className="truncate flex-1">{attachment.name}</span>
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setAttachment(null)}>
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            )}

            {/* Typing indicator */}
            <div className="px-4 py-1 h-6">
                {Object.values(typingUsers).length > 0 && (
                    <p className="text-[10px] text-muted-foreground italic animate-pulse">
                        {Object.values(typingUsers).join(", ")} {Object.values(typingUsers).length === 1 ? "is" : "are"} typing...
                    </p>
                )}
            </div>

            {/* Input (hidden if no send or reply permission) */}
            {(canSend || (canReply && replyTo)) && (
                <form onSubmit={handleSend} className="flex items-center gap-2 border-t px-4 py-3">
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleFileSelect}
                        accept="image/*,.pdf,.doc,.docx,.txt,.zip,.xlsx,.pptx,.csv"
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isPending || isUploading}
                    >
                        {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                    </Button>
                    <Input
                        value={newMessage}
                        onChange={(e) => handleInputChange(e.target.value)}
                        placeholder={replyTo ? "Write a reply..." : "Type a message..."}
                        className="flex-1"
                        disabled={isPending}
                    />
                    <Button type="submit" size="icon" disabled={isPending || (!newMessage.trim() && !attachment)}>
                        {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </form>
            )}

            {/* No send permission notice */}
            {!canSend && !canReply && (
                <div className="text-center text-xs text-muted-foreground py-3 border-t">
                    {channel === "announcement"
                        ? "Click reply on a message to respond."
                        : "You cannot send messages in this channel."}
                </div>
            )}

            {/* Reply-only notice for announcements */}
            {!canSend && canReply && !replyTo && (
                <div className="text-center text-xs text-muted-foreground py-3 border-t">
                    📢 Click reply on a message to respond to an announcement.
                </div>
            )}
        </div>
    )
}
