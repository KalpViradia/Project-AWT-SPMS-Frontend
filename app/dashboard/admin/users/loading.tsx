import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function AdminUsersLoading() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                    <Skeleton className="h-5 w-[250px] mt-1" />
                </div>
                <Skeleton className="h-10 w-[120px]" />
            </div>

            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <Skeleton className="h-10 flex-1" />
                        <Skeleton className="h-10 w-[150px]" />
                        <Skeleton className="h-10 w-[150px]" />
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead><Skeleton className="h-4 w-[100px]" /></TableHead>
                                <TableHead><Skeleton className="h-4 w-[150px]" /></TableHead>
                                <TableHead><Skeleton className="h-4 w-[80px]" /></TableHead>
                                <TableHead><Skeleton className="h-4 w-[120px]" /></TableHead>
                                <TableHead className="text-right"><Skeleton className="h-4 w-[60px] ml-auto" /></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[1, 2, 3, 4, 5].map((i) => (
                                <TableRow key={i}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Skeleton className="h-8 w-8 rounded-full" />
                                            <Skeleton className="h-5 w-[120px]" />
                                        </div>
                                    </TableCell>
                                    <TableCell><Skeleton className="h-5 w-[180px]" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-[70px] rounded-full" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Skeleton className="h-8 w-8 rounded-md" />
                                            <Skeleton className="h-8 w-8 rounded-md" />
                                        </div>
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
