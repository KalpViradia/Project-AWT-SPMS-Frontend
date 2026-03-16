import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function AdminDashboardLoading() {
    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>

            {/* Stat Cards */}
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-4 w-[100px]" />
                            <Skeleton className="h-5 w-5 rounded-full" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-[60px]" />
                            <Skeleton className="h-3 w-[80px] mt-1" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-5 w-[120px]" />
                            <Skeleton className="h-4 w-[200px] mt-1" />
                        </CardHeader>
                        <CardContent className="h-[250px] flex items-center justify-center">
                            <Skeleton className="h-full w-full rounded-md" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Second Charts Row */}
            <div className="grid gap-4 md:grid-cols-2">
                {[1, 2].map((i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-5 w-[150px]" />
                            <Skeleton className="h-4 w-[220px] mt-1" />
                        </CardHeader>
                        <CardContent className="h-[200px] flex items-center justify-center">
                            <Skeleton className="h-full w-full rounded-md" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Table Card */}
            <Card>
                <CardHeader>
                    <Skeleton className="h-5 w-[180px]" />
                    <Skeleton className="h-4 w-[350px] mt-1" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                                <Skeleton className="h-5 w-[150px]" />
                                <Skeleton className="h-5 w-[200px]" />
                                <Skeleton className="h-5 w-[100px]" />
                                <Skeleton className="h-10 w-[120px]" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
