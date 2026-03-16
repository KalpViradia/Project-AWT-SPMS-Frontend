import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function TasksLoading() {
    return (
        <div className="flex flex-col gap-10">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Task Boards</h1>
                <Skeleton className="h-5 w-[400px] mt-1" />
            </div>

            {[1].map((i) => (
                <Card key={i}>
                    <CardHeader>
                        <Skeleton className="h-6 w-[200px]" />
                        <Skeleton className="h-4 w-[300px] mt-1" />
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {['To Do', 'In Progress', 'In Review', 'Done'].map((column) => (
                                <div key={column} className="flex flex-col gap-4">
                                    <div className="flex items-center justify-between px-1">
                                        <Skeleton className="h-5 w-24" />
                                        <Skeleton className="h-5 w-6 rounded-full" />
                                    </div>
                                    <div className="bg-muted/50 rounded-lg p-3 min-h-[400px] space-y-3">
                                        {[1, 2].map(j => (
                                            <Card key={j} className="shadow-none border">
                                                <CardContent className="p-3 space-y-3">
                                                    <Skeleton className="h-4 w-full" />
                                                    <div className="flex justify-between items-center">
                                                        <Skeleton className="h-6 w-16" />
                                                        <Skeleton className="h-8 w-8 rounded-full" />
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
