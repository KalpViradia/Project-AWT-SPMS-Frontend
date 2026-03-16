import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function AdminReportsLoading() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">System Reports</h1>
                    <Skeleton className="h-5 w-[320px] mt-1" />
                </div>
                <Skeleton className="h-10 w-[120px]" />
            </div>

            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <Skeleton className="h-10 flex-1" />
                        <Skeleton className="h-10 w-[180px]" />
                        <Skeleton className="h-10 w-[120px]" />
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead><Skeleton className="h-4 w-[80px]" /></TableHead>
                                <TableHead><Skeleton className="h-4 w-[150px]" /></TableHead>
                                <TableHead><Skeleton className="h-4 w-[100px]" /></TableHead>
                                <TableHead><Skeleton className="h-4 w-[120px]" /></TableHead>
                                <TableHead><Skeleton className="h-4 w-[80px]" /></TableHead>
                                <TableHead className="text-right"><Skeleton className="h-4 w-[60px] ml-auto" /></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[1, 2, 3, 4, 5].map((i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-[40px]" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-[140px]" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-[160px]" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-[70px] rounded-full" /></TableCell>
                                    <TableCell className="text-right">
                                        <Skeleton className="h-8 w-12 ml-auto" />
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
