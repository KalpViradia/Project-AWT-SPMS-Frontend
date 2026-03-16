import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function FacultyScheduleLoading() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Schedule</h1>
                    <Skeleton className="h-5 w-[200px] mt-1" />
                </div>
                <Skeleton className="h-10 w-[150px]" />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Monthly Overview</CardTitle>
                    <Skeleton className="h-4 w-[250px] mt-1" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-7 gap-4">
                        {[1, 2, 3, 4, 5, 6, 7].map(i => (
                            <Skeleton key={i} className="h-4 w-full" />
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                        {Array.from({ length: 31 }).map((_, i) => (
                            <div key={i} className="flex flex-col items-center gap-1 py-1">
                                <Skeleton className="h-8 w-8 rounded-full" />
                                <Skeleton className="h-3 w-6" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <Card key={i}>
                        <CardHeader className="pb-2 flex flex-row items-start justify-between">
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-[140px]" />
                                <Skeleton className="h-4 w-[100px]" />
                            </div>
                            <Skeleton className="h-8 w-8 rounded-full" />
                        </CardHeader>
                        <CardContent className="space-y-4 pt-2">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-4 w-28" />
                                <Skeleton className="h-4 w-36" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
