import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Star } from "lucide-react"

type ProposalFeedbackData = {
    problem_clarity: number
    methodology: number
    feasibility: number
    innovation: number
    overall_comments: string | null
    section_comments: string | null
    staff?: { staff_name: string } | null
}

interface FeedbackDisplayProps {
    feedback: ProposalFeedbackData
}

const CATEGORIES = [
    { key: "problem_clarity", label: "Problem Statement Clarity" },
    { key: "methodology", label: "Methodology Appropriateness" },
    { key: "feasibility", label: "Feasibility Assessment" },
    { key: "innovation", label: "Innovation / Originality" },
]

function Stars({ count }: { count: number }) {
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
                <Star
                    key={s}
                    className={`h-4 w-4 ${s <= count
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/20"
                        }`}
                />
            ))}
        </div>
    )
}

export function FeedbackDisplay({ feedback }: FeedbackDisplayProps) {
    const hasRatings = feedback.problem_clarity > 0 || feedback.methodology > 0 || feedback.feasibility > 0 || feedback.innovation > 0

    let sectionComments: Record<string, string> = {}
    if (feedback.section_comments) {
        try {
            sectionComments = JSON.parse(feedback.section_comments)
        } catch { }
    }

    const hasSectionComments = Object.values(sectionComments).some((v) => v?.trim())
    const avgRating =
        hasRatings
            ? (
                (feedback.problem_clarity +
                    feedback.methodology +
                    feedback.feasibility +
                    feedback.innovation) /
                4
            ).toFixed(1)
            : null

    if (!hasRatings && !feedback.overall_comments && !hasSectionComments) {
        return null
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                    <span>Proposal Feedback</span>
                    {avgRating && (
                        <span className="text-sm font-normal text-muted-foreground">
                            Avg: {avgRating}/5
                        </span>
                    )}
                </CardTitle>
                {feedback.staff && (
                    <p className="text-xs text-muted-foreground">
                        Reviewed by {feedback.staff.staff_name}
                    </p>
                )}
            </CardHeader>
            <CardContent className="space-y-3">
                {hasRatings && (
                    <div className="space-y-2">
                        {CATEGORIES.map((cat) => {
                            const ratingMap: Record<string, number> = {
                                problem_clarity: feedback.problem_clarity,
                                methodology: feedback.methodology,
                                feasibility: feedback.feasibility,
                                innovation: feedback.innovation,
                            }
                            const val = ratingMap[cat.key] || 0
                            return val > 0 ? (
                                <div key={cat.key} className="flex items-center justify-between">
                                    <span className="text-sm">{cat.label}</span>
                                    <Stars count={val} />
                                </div>
                            ) : null
                        })}
                    </div>
                )}

                {hasSectionComments && (
                    <div className="border-t pt-3 space-y-2">
                        {Object.entries(sectionComments).map(([key, val]) =>
                            val?.trim() ? (
                                <div key={key}>
                                    <p className="text-xs font-medium capitalize">{key}</p>
                                    <p className="text-xs text-muted-foreground">{val}</p>
                                </div>
                            ) : null
                        )}
                    </div>
                )}

                {feedback.overall_comments && (
                    <div className="border-t pt-3">
                        <p className="text-xs font-medium">Overall Comments</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {feedback.overall_comments}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
