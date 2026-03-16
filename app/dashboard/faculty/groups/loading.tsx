import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function FacultyGroupsLoading() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Groups</h1>
                    <Skeleton className="h-5 w-[250px] mt-1" />
                </div>
                <Skeleton className="h-10 w-[100px]" />
            </div>

            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-6 items-end">
                        <div className="space-y-2 flex flex-col min-w-[200px]">
                            <Skeleton className="h-4 w-[80px]" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="flex items-center gap-3 ml-auto">
                            <Skeleton className="h-10 w-[120px]" />
                            <Skeleton className="h-10 w-[80px]" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Assigned Groups</CardTitle>
                    <Skeleton className="h-4 w-[250px] mt-1" />
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead><Skeleton className="h-4 w-[100px]" /></TableHead>
                                <TableHead><Skeleton className="h-4 w-[150px]" /></TableHead>
                                <TableHead><Skeleton className="h-4 w-[80px]" /></TableHead>
                                <TableHead><Skeleton className="h-4 w-[100px]" /></TableHead>
                                <TableHead><Skeleton className="h-4 w-[120px]" /></TableHead>
                                <TableHead className="text-right"><Skeleton className="h-4 w-[60px] ml-auto" /></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[1, 2, 3, 4, 5].map((i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-[120px]" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-[200px]" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-[70px] rounded-full" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-[40px]" /></TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-2">
                                            <Skeleton className="h-4 w-[140px]" />
                                            <Skeleton className="h-4 w-[120px]" />
                                        </div>
                                    </TableCell>
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
