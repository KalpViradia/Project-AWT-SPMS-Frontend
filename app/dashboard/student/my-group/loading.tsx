import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function MyGroupLoading() {
    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Groups</h1>
                    <Skeleton className="h-5 w-[280px] mt-1" />
                </div>
            </div>

            <div className="space-y-12">
                {[1].map((i) => (
                    <div key={i} className="flex flex-col gap-6 pt-4 border-t first:border-t-0 first:pt-0">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-8 w-[250px]" />
                            <div className="flex gap-2">
                                <Skeleton className="h-10 w-28" />
                                <Skeleton className="h-10 w-28" />
                            </div>
                        </div>

                        <Skeleton className="h-20 w-full rounded-lg" />

                        <div className="grid gap-6 md:grid-cols-2">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle>Group Information</CardTitle>
                                    <Skeleton className="h-6 w-20 rounded-full" />
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        {[1, 2, 3, 4].map(j => (
                                            <div key={j} className="space-y-1">
                                                <Skeleton className="h-3 w-20" />
                                                <Skeleton className="h-5 w-24" />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="pt-4 border-t space-y-2">
                                        <Skeleton className="h-3 w-24" />
                                        <div className="flex gap-2">
                                            <Skeleton className="h-5 w-16 rounded-full" />
                                            <Skeleton className="h-5 w-20 rounded-full" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-10 w-full" />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Members</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {[1, 2, 3].map(j => (
                                            <div key={j} className="flex items-center justify-between">
                                                <div className="flex items-center space-x-4">
                                                    <Skeleton className="h-10 w-10 rounded-full" />
                                                    <div className="space-y-1">
                                                        <Skeleton className="h-4 w-24" />
                                                        <Skeleton className="h-3 w-32" />
                                                    </div>
                                                </div>
                                                <Skeleton className="h-5 w-14 rounded-full" />
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="md:col-span-2">
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle>Documents</CardTitle>
                                    <Skeleton className="h-10 w-32" />
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {[1, 2].map(j => (
                                            <Skeleton key={j} className="h-12 w-full" />
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
