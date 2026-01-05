
'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { SmartProjections } from '@/components/dashboard/smart-projections';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, ArrowUpRight, ArrowDownLeft, Loader } from 'lucide-react';
import Link from 'next/link';
import { type Projection } from '@/lib/mock-data';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext, PaginationLink } from '@/components/ui/pagination';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';


const certaintyColors = {
    Fixed: 'bg-blue-500/20 text-blue-500',
    Probable: 'bg-amber-500/20 text-amber-500',
    Possible: 'bg-gray-500/20 text-gray-500',
}

const typeIcons = {
    Income: <ArrowUpRight className="h-4 w-4 text-green-500" />,
    Expense: <ArrowDownLeft className="h-4 w-4 text-red-500" />,
}

const ITEMS_PER_PAGE = 10;

export default function ProjectionsPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    
    const projectionsCollection = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return collection(firestore, 'users', user.uid, 'projections');
    }, [firestore, user?.uid]);

    const { data: projections, isLoading: areProjectionsLoading } = useCollection<Projection>(projectionsCollection);

    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil((projections?.length || 0) / ITEMS_PER_PAGE);
    const paginatedProjections = projections?.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    ) || [];

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
        }
    };
    
    const isLoading = isUserLoading || areProjectionsLoading;

  return (
    <AppShell>
        <div className="grid gap-6">
            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Future Projections</CardTitle>
                                <CardDescription>A list of your projected income and expenses.</CardDescription>
                            </div>
                            <Link href="/projections/add">
                                <Button disabled={isLoading}>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Add Projection
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                             {isLoading ? (
                                <div className="flex items-center justify-center py-12 text-muted-foreground">
                                    <Loader className="mr-3 h-6 w-6 animate-spin" />
                                    <p>Loading your projections...</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {paginatedProjections.length > 0 ? paginatedProjections.map((item) => (
                                        <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 rounded-full bg-muted">
                                                    {typeIcons[item.type]}
                                                </div>
                                                <div>
                                                    <p className="font-semibold">{item.title}</p>
                                                    <p className="text-sm text-muted-foreground">{new Date(item.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric'})}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={cn("font-semibold", item.type === 'Income' ? 'text-green-500' : 'text-red-500')}>
                                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: item.currency }).format(item.amount)}
                                                </p>
                                                <Badge variant="outline" className={cn("mt-1", certaintyColors[item.certainty])}>{item.certainty}</Badge>
                                            </div>
                                        </div>
                                    )) : (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <p>No projections found. Add your first one!</p>
                                    </div>
                                    )}
                                </div>
                            )}
                             {totalPages > 1 && (
                                <Pagination className="mt-6">
                                    <PaginationContent>
                                        <PaginationItem>
                                            <PaginationPrevious onClick={() => handlePageChange(currentPage - 1)}
                                            className={cn({
                                                'cursor-not-allowed text-muted-foreground': currentPage === 1,
                                            })}
                                            />
                                        </PaginationItem>
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                            <PaginationItem key={page}>
                                                <PaginationLink onClick={() => handlePageChange(page)} isActive={currentPage === page}>{page}</PaginationLink>
                                            </PaginationItem>
                                        ))}
                                        <PaginationItem>
                                            <PaginationNext onClick={() => handlePageChange(currentPage + 1)} 
                                                className={cn({
                                                    'cursor-not-allowed text-muted-foreground': currentPage === totalPages,
                                                })}
                                            />
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            )}
                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-6">
                    <SmartProjections />
                </div>
            </div>
        </div>
    </AppShell>
  );
}
