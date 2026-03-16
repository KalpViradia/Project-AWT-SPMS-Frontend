import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function ProjectDetailsLoading() {
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Project Details</h1>
                    <Skeleton className="h-5 w-[320px] mt-1" />
                </div>
            </div>

            <div className="space-y-10">
                {[1].map((i) => (
                    <div key={i} className="space-y-6 pt-6 border-t first:border-t-0 first:pt-0">
                        <Skeleton className="h-8 w-[400px]" />

                        <div className="grid gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Project Content</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-8">
                                    <div className="space-y-3">
                                        <Skeleton className="h-5 w-32" />
                                        <Skeleton className="h-24 w-full" />
                                    </div>
                                    <div className="space-y-3 pt-4 border-t">
                                        <Skeleton className="h-5 w-28" />
                                        <Skeleton className="h-20 w-full" />
                                    </div>
                                    <div className="space-y-3 pt-4 border-t">
                                        <Skeleton className="h-5 w-36" />
                                        <Skeleton className="h-16 w-full" />
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="grid gap-6 md:grid-cols-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Status & Type</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <Skeleton className="h-4 w-20" />
                                            <Skeleton className="h-6 w-24 rounded-full" />
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <Skeleton className="h-4 w-24" />
                                            <Skeleton className="h-6 w-28 rounded-full" />
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Deliverables</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {[1, 2, 3].map(j => (
                                            <div key={j} className="flex items-center gap-2">
                                                <Skeleton className="h-4 w-4 rounded-sm" />
                                                <Skeleton className="h-4 w-3/4" />
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
