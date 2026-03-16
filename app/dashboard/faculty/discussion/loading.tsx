import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function FacultyDiscussionLoading() {
    return (
        <div className="flex flex-col gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
                <Skeleton className="h-5 w-[300px] mt-1" />
            </div>

            <div className="max-w-xs">
                <Skeleton className="h-10 w-full" />
            </div>

            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4 border-b pb-4">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-[150px]" />
                                <Skeleton className="h-3 w-[100px]" />
                            </div>
                        </div>
                        <div className="space-y-4 py-4 h-[400px]">
                            <div className="flex justify-start">
                                <Skeleton className="h-16 w-[300px] rounded-lg" />
                            </div>
                            <div className="flex justify-end">
                                <Skeleton className="h-12 w-[250px] rounded-lg" />
                            </div>
                            <div className="flex justify-start">
                                <Skeleton className="h-20 w-[350px] rounded-lg" />
                            </div>
                            <div className="flex justify-end">
                                <Skeleton className="h-10 w-[200px] rounded-lg" />
                            </div>
                        </div>
                        <div className="flex gap-2 pt-4 border-t">
                            <Skeleton className="h-10 flex-1" />
                            <Skeleton className="h-10 w-20" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
