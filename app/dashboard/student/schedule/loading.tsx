import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function StudentScheduleLoading() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Schedule & Calendar</h1>
                <Skeleton className="h-5 w-[350px] mt-1" />
            </div>

            <div className="grid gap-6 md:grid-cols-7">
                <Card className="md:col-span-4">
                    <CardHeader>
                        <CardTitle>Monthly Overview</CardTitle>
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
                                    <Skeleton className="h-3 w-4 mx-auto" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <div className="md:col-span-3 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Upcoming Meetings</CardTitle>
                            <Skeleton className="h-4 w-[120px] mt-1" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[1, 2].map(i => (
                                <div key={i} className="flex items-start gap-4 p-3 border rounded-lg">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-1/2" />
                                        <Skeleton className="h-3 w-[100px]" />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
