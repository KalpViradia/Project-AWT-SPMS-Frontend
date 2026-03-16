import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function TimelineLoading() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Timeline & Progress</h1>
                <Skeleton className="h-5 w-[420px] mt-1" />
            </div>

            {[1].map(i => (
                <div key={i} className="space-y-6 pt-6 border-t first:border-t-0 first:pt-0">
                    <Skeleton className="h-8 w-[350px]" />

                    <div className="grid gap-6 md:grid-cols-4">
                        <Card className="md:col-span-1">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Overall Completion</CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center justify-center pt-4">
                                <Skeleton className="h-24 w-24 rounded-full" />
                                <Skeleton className="h-6 w-12 mt-4" />
                            </CardContent>
                        </Card>
                        <Card className="md:col-span-3">
                            <CardHeader>
                                <CardTitle>Project Milestones</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                                    {[1, 2, 3].map(j => (
                                        <div key={j} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-300 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                                <Skeleton className="h-4 w-4" />
                                            </div>
                                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-slate-200 shadow">
                                                <div className="flex items-center justify-between space-x-2 mb-1">
                                                    <Skeleton className="h-4 w-1/2" />
                                                    <Skeleton className="h-3 w-16" />
                                                </div>
                                                <Skeleton className="h-3 w-full" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            ))}
        </div>
    )
}
