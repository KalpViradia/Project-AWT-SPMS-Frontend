import { Skeleton } from "@/components/ui/skeleton"

export default function JoinGroupLoading() {
    return (
        <div className="flex flex-col gap-8 max-w-5xl mx-auto w-full">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Create or Join a Group</h1>
                    <Skeleton className="h-5 w-[450px] mt-1" />
                </div>
            </div>

            <div className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight">Your Invitations</h2>
                <div className="space-y-3">
                    <Skeleton className="h-20 w-full" />
                </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
                <h2 className="text-2xl font-semibold tracking-tight">Submit New Proposal</h2>
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-32 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <div className="flex flex-wrap gap-2">
                            {[1, 2, 3, 4, 5].map(i => (
                                <Skeleton key={i} className="h-8 w-16 rounded-full" />
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-end pt-4">
                        <Skeleton className="h-10 w-40" />
                    </div>
                </div>
            </div>
        </div>
    )
}
