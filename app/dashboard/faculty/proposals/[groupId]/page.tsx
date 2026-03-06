import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { RedirectType, redirect } from "next/navigation"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, User, FileText, CheckCircle2, XCircle } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { ApprovalForm } from "@/components/faculty/approval-form"
import { FeedbackDisplay } from "@/components/shared/feedback-display"

export default async function ProposalReviewPage({ params }: { params: Promise<{ groupId: string }> }) {
    const session = await auth()
    if (!session || !session.user) {
        redirect('/', RedirectType.replace)
    }

    const user = session.user as { id: string; role?: string | null }

    if (user.role !== 'faculty') {
        redirect('/', RedirectType.replace)
    }

    const { groupId } = await params;
    const id = parseInt(groupId);

    if (isNaN(id)) {
        return <div>Invalid Group ID</div>
    }

    const group = await prisma.project_group.findUnique({
        where: { project_group_id: id },
        include: {
            project_type: true,
            staff_project_group_guide_staff_idTostaff: true,
            staff_project_group_reviewed_byTostaff: true,
            project_group_member: {
                include: {
                    student: true
                }
            },
            proposal_feedback: {
                include: { staff: { select: { staff_name: true } } },
            },
        }
    })

    if (!group) {
        return <div>Proposal not found</div>
    }

    // Check if faculty is the guide for this group
    const staffId = parseInt(user.id);
    if (group.guide_staff_id !== staffId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <AlertCircle className="h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">You are not the guide for this project group.</p>
                <Button asChild>
                    <Link href="/dashboard/faculty/groups">Back to Groups</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/dashboard/faculty/groups">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold tracking-tight">Review Project Proposal</h1>
                    <p className="text-muted-foreground">{group.project_group_name}</p>
                </div>
            </div>

            {group.status !== 'pending' && (
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Proposal Already Reviewed</AlertTitle>
                    <AlertDescription>
                        This proposal has been {group.status}
                        {group.proposal_reviewed_at && ` on ${new Date(group.proposal_reviewed_at).toLocaleDateString()}`}
                        {group.staff_project_group_reviewed_byTostaff && ` by ${group.staff_project_group_reviewed_byTostaff.staff_name}`}.
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid gap-6 md:grid-cols-3">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Project Information</CardTitle>
                                <Badge variant={
                                    group.status === 'approved' ? 'default' :
                                        group.status === 'rejected' ? 'destructive' :
                                            'secondary'
                                }>
                                    {group.status}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <div className="text-muted-foreground">Project Title</div>
                                    <div className="font-medium">{group.project_title}</div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground">Project Type</div>
                                    <div className="font-medium">{group.project_type.project_type_name}</div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground">Submitted</div>
                                    <div className="font-medium">
                                        {group.proposal_submitted_at
                                            ? new Date(group.proposal_submitted_at).toLocaleDateString()
                                            : new Date(group.created_at).toLocaleDateString()
                                        }
                                    </div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground">Team Size</div>
                                    <div className="font-medium">{group.project_group_member.length} members</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Proposal Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h3 className="text-sm font-semibold mb-2">Description</h3>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {group.project_description || "No description provided."}
                                </p>
                            </div>

                            {group.project_objectives && (
                                <div>
                                    <h3 className="text-sm font-semibold mb-2">Objectives</h3>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                        {group.project_objectives}
                                    </p>
                                </div>
                            )}

                            {group.project_methodology && (
                                <div>
                                    <h3 className="text-sm font-semibold mb-2">Methodology</h3>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                        {group.project_methodology}
                                    </p>
                                </div>
                            )}

                            {group.project_expected_outcomes && (
                                <div>
                                    <h3 className="text-sm font-semibold mb-2">Expected Outcomes</h3>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                        {group.project_expected_outcomes}
                                    </p>
                                </div>
                            )}

                            {group.proposal_file_path && (
                                <div>
                                    <h3 className="text-sm font-semibold mb-2">Proposal Document</h3>
                                    <Button variant="outline" size="sm" asChild>
                                        <a href={group.proposal_file_path} target="_blank" rel="noopener noreferrer">
                                            <FileText className="h-4 w-4 mr-2" />
                                            Download Proposal
                                        </a>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {group.status === 'rejected' && group.rejection_reason && (
                        <Card className="border-destructive">
                            <CardHeader>
                                <CardTitle className="text-destructive flex items-center gap-2">
                                    <XCircle className="h-5 w-5" />
                                    Rejection Reason
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm">{group.rejection_reason}</p>
                            </CardContent>
                        </Card>
                    )}

                    {group.proposal_feedback?.[0] && (
                        <FeedbackDisplay feedback={group.proposal_feedback[0]} />
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Team Members</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-4">
                                {group.project_group_member.map((member) => (
                                    <li key={member.student_id} className="flex flex-col gap-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">{member.student.student_name}</span>
                                            {member.is_group_leader && (
                                                <Badge variant="secondary" className="text-xs">Leader</Badge>
                                            )}
                                        </div>
                                        <span className="text-xs text-muted-foreground">{member.student.email}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>

                    {group.status === 'pending' && (
                        <ApprovalForm groupId={group.project_group_id} />
                    )}

                    {group.status === 'approved' && (
                        <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
                            <CardHeader>
                                <CardTitle className="text-green-900 dark:text-green-200 flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5" />
                                    Approved
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-green-800 dark:text-green-300">
                                This proposal was approved on{' '}
                                {group.proposal_reviewed_at && new Date(group.proposal_reviewed_at).toLocaleDateString()}.
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
