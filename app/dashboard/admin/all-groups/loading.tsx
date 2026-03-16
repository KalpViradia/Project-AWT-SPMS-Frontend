import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function AdminAllGroupsLoading() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">All Project Groups</h1>
                    <Skeleton className="h-5 w-[300px] mt-1" />
                </div>
                <Skeleton className="h-10 w-[140px]" />
            </div>

            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead><Skeleton className="h-4 w-[100px]" /></TableHead>
                                <TableHead><Skeleton className="h-4 w-[180px]" /></TableHead>
                                <TableHead><Skeleton className="h-4 w-[80px]" /></TableHead>
                                <TableHead><Skeleton className="h-4 w-[120px]" /></TableHead>
                                <TableHead><Skeleton className="h-4 w-[100px]" /></TableHead>
                                <TableHead className="text-right"><Skeleton className="h-4 w-[60px] ml-auto" /></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[1, 2, 3, 4, 5].map((i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-[140px]" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-[200px]" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-[80px] rounded-full" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-[120px]" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                                    <TableCell className="text-right">
                                        <Skeleton className="h-8 w-16 ml-auto" />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
