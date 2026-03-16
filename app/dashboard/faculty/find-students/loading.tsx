import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function FindStudentsLoading() {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Find Students</h1>
                <p className="text-muted-foreground">Search for students based on their skills and expertise.</p>
            </div>
            <div className="space-y-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col gap-4">
                            <Skeleton className="h-4 w-28" />
                            <div className="flex gap-2">
                                <Skeleton className="h-10 flex-1" />
                                <Skeleton className="h-10 w-24" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Card key={i}>
                            <CardContent className="pt-6 flex flex-col items-center text-center gap-4">
                                <Skeleton className="h-20 w-20 rounded-full" />
                                <div className="space-y-2 w-full">
                                    <Skeleton className="h-6 w-3/4 mx-auto" />
                                    <Skeleton className="h-4 w-1/2 mx-auto" />
                                </div>
                                <div className="flex flex-wrap justify-center gap-2 w-full">
                                    <Skeleton className="h-5 w-16 rounded-full" />
                                    <Skeleton className="h-5 w-20 rounded-full" />
                                    <Skeleton className="h-5 w-14 rounded-full" />
                                </div>
                                <Skeleton className="h-9 w-full mt-2" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}
