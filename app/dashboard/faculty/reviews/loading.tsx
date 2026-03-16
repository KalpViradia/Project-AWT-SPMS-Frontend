import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function ReportReviewsLoading() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Report Reviews</h1>
                <Skeleton className="h-5 w-[350px] mt-1" />
            </div>

            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <Card key={i}>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div className="space-y-2">
                                    <Skeleton className="h-6 w-[200px]" />
                                    <Skeleton className="h-4 w-[300px]" />
                                    <Skeleton className="h-4 w-[150px]" />
                                </div>
                                <Skeleton className="h-6 w-16" />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-24 w-full" />
                            </div>
                            <div className="space-y-3 border-t pt-4">
                                <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-20 w-full" />
                                    </div>
                                    <div className="space-y-2 sm:w-24">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <Skeleton className="h-9 w-[180px]" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
