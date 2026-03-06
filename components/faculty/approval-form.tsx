"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { approveGroup } from "@/lib/actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { CheckCircle2, XCircle, Loader2, Star } from "lucide-react"

interface ApprovalFormProps {
    groupId: number
}

const RATING_CATEGORIES = [
    { key: "problemClarity", label: "Problem Statement Clarity", desc: "Is the problem well-defined and clear?" },
    { key: "methodology", label: "Methodology Appropriateness", desc: "Is the proposed methodology sound?" },
    { key: "feasibility", label: "Feasibility Assessment", desc: "Can this project be completed in the given timeline?" },
    { key: "innovation", label: "Innovation / Originality", desc: "How original or novel is the approach?" },
] as const

function RatingStars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => onChange(star)}
                    className="p-0.5 transition-colors"
                >
                    <Star
                        className={`h-5 w-5 ${star <= value
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted-foreground/30"
                            }`}
                    />
                </button>
            ))}
        </div>
    )
}

export function ApprovalForm({ groupId }: ApprovalFormProps) {
    const [isPending, setIsPending] = useState(false)
    const [showRejectForm, setShowRejectForm] = useState(false)
    const [rejectionReason, setRejectionReason] = useState("")
    const router = useRouter()

    // Structured feedback state
    const [ratings, setRatings] = useState<Record<string, number>>({
        problemClarity: 0,
        methodology: 0,
        feasibility: 0,
        innovation: 0,
    })
    const [overallComments, setOverallComments] = useState("")
    const [sectionComments, setSectionComments] = useState<Record<string, string>>({
        description: "",
        objectives: "",
        methodology: "",
        outcomes: "",
    })

    const setRating = (key: string, value: number) => {
        setRatings((prev) => ({ ...prev, [key]: value }))
    }

    const setSectionComment = (key: string, value: string) => {
        setSectionComments((prev) => ({ ...prev, [key]: value }))
    }

    const buildFeedbackPayload = () => {
        return JSON.stringify({
            ratings,
            overallComments,
            sectionComments,
        })
    }

    async function handleApprove() {
        setIsPending(true)
        const formData = new FormData()
        formData.append("groupId", groupId.toString())
        formData.append("action", "approve")

        // Include structured feedback if any ratings were given
        const hasRatings = Object.values(ratings).some((r) => r > 0)
        if (hasRatings || overallComments) {
            formData.append("proposalFeedback", buildFeedbackPayload())
        }

        try {
            await approveGroup(formData)
            toast.success("Proposal approved successfully!")
            router.push("/dashboard/faculty/groups")
            router.refresh()
        } catch (error: any) {
            toast.error(error.message || "Failed to approve proposal")
        } finally {
            setIsPending(false)
        }
    }

    async function handleReject() {
        const hasRatings = Object.values(ratings).some((r) => r > 0)
        if (!hasRatings && !rejectionReason.trim()) {
            toast.error("Please provide ratings or a rejection reason")
            return
        }

        setIsPending(true)
        const formData = new FormData()
        formData.append("groupId", groupId.toString())
        formData.append("action", "reject")
        formData.append("rejectionReason", rejectionReason || overallComments || "See detailed feedback.")
        formData.append("proposalFeedback", buildFeedbackPayload())

        try {
            await approveGroup(formData)
            toast.success("Proposal rejected with feedback")
            router.push("/dashboard/faculty/groups")
            router.refresh()
        } catch (error: any) {
            toast.error(error.message || "Failed to reject proposal")
        } finally {
            setIsPending(false)
        }
    }

    return (
        <div className="space-y-4">
            {/* Structured Feedback Card */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Proposal Evaluation</CardTitle>
                    <CardDescription>Rate each aspect of the proposal (optional for approval).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {RATING_CATEGORIES.map((cat) => (
                        <div key={cat.key} className="flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">{cat.label}</p>
                                <p className="text-[11px] text-muted-foreground">{cat.desc}</p>
                            </div>
                            <RatingStars
                                value={ratings[cat.key]}
                                onChange={(v) => setRating(cat.key, v)}
                            />
                        </div>
                    ))}

                    <div className="border-t pt-3 space-y-3">
                        <div className="space-y-2">
                            <Label className="text-xs font-medium">Section-Specific Comments (optional)</Label>
                            {[
                                { key: "description", label: "Description" },
                                { key: "objectives", label: "Objectives" },
                                { key: "methodology", label: "Methodology" },
                                { key: "outcomes", label: "Expected Outcomes" },
                            ].map((s) => (
                                <div key={s.key}>
                                    <Label className="text-[11px] text-muted-foreground">{s.label}</Label>
                                    <Textarea
                                        value={sectionComments[s.key]}
                                        onChange={(e) => setSectionComment(s.key, e.target.value)}
                                        placeholder={`Comments on ${s.label.toLowerCase()}...`}
                                        rows={1}
                                        className="text-xs min-h-[32px]"
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Overall Comments</Label>
                            <Textarea
                                value={overallComments}
                                onChange={(e) => setOverallComments(e.target.value)}
                                placeholder="General feedback or suggestions..."
                                rows={2}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Decision Card */}
            {showRejectForm ? (
                <Card className="border-destructive">
                    <CardHeader>
                        <CardTitle className="text-destructive flex items-center gap-2">
                            <XCircle className="h-5 w-5" />
                            Reject Proposal
                        </CardTitle>
                        <CardDescription>
                            Provide a rejection reason (visible to students).
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Explain why this proposal is being rejected..."
                            rows={3}
                            disabled={isPending}
                        />
                    </CardContent>
                    <CardFooter className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => { setShowRejectForm(false); setRejectionReason("") }}
                            disabled={isPending}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={isPending}
                            className="flex-1"
                        >
                            {isPending ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Rejecting...</> : "Confirm Rejection"}
                        </Button>
                    </CardFooter>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Review Decision</CardTitle>
                        <CardDescription>Approve or reject this project proposal.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Button
                            className="w-full bg-green-600 hover:bg-green-700"
                            onClick={handleApprove}
                            disabled={isPending}
                        >
                            {isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                            Approve Proposal
                        </Button>
                        <Button
                            variant="destructive"
                            className="w-full"
                            onClick={() => setShowRejectForm(true)}
                            disabled={isPending}
                        >
                            <XCircle className="mr-2 h-4 w-4" />
                            Reject Proposal
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
