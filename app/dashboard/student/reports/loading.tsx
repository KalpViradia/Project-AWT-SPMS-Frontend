import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function StudentReportsLoading() {
    return (
        <div className="flex flex-col gap-10">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Project Reports</h1>
                <Skeleton className="h-5 w-[380px] mt-1" />
            </div>

            {[1, 2].map((groupIndex) => (
                <div key={groupIndex} className="space-y-6 pt-6 border-t first:border-t-0 first:pt-0">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <Skeleton className="h-8 w-[300px]" />
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-10 w-[100px]" />
                            <Skeleton className="h-10 w-[150px]" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        {[1, 2].map((i) => (
                            <Card key={i}>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-2">
                                            <Skeleton className="h-5 w-[180px]" />
                                            <Skeleton className="h-4 w-[250px]" />
                                            <Skeleton className="h-4 w-[200px]" />
                                        </div>
                                        <Skeleton className="h-5 w-5" />
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Skeleton className="h-12 w-full" />
                                    <div className="pt-4 border-t space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Skeleton className="h-5 w-[120px]" />
                                            <Skeleton className="h-5 w-[80px]" />
                                            <Skeleton className="h-5 w-[100px] ml-auto" />
                                        </div>
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}
