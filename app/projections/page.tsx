
'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@neup/components/ui/card';
import { Button } from '@neup/components/ui/button';
import { PlusCircle, ArrowUpRight, ArrowDownLeft, Inbox, XCircle, Repeat } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@neup/components/ui/badge';
import { cn } from '@neup/core/utils';
import { Skeleton } from '@neup/components/ui/skeleton';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext, PaginationLink } from '@/components/ui/pagination';
import { useUser } from '@/core/providers/auth';
import { useProjections } from '@/core/hooks/api';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@neup/components/ui/alert-dialog';
import { useToast } from '@neup/components/ui/toast';
import { YearlyProjectionChart } from '@/components/charts/yearly-projection-chart';
import { stackedCardClassName } from '@/components/ui/stacked-card';
import { StackedEmptyStateRow } from '@/components/ui/stacked-empty-state';


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
    const { toast } = useToast();
    const { data: projections, isLoading: areProjectionsLoading } = useProjections();

    const [currentPage, setCurrentPage] = useState(1);

    const sortedProjections = projections?.sort((a, b) => {
        if (a.status === 'Canceled' && b.status !== 'Canceled') return 1;
        if (a.status !== 'Canceled' && b.status === 'Canceled') return -1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }) || [];


    const totalPages = Math.ceil((sortedProjections.length || 0) / ITEMS_PER_PAGE);
    const paginatedProjections = sortedProjections.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
        }
    };

    const handleCancelProjection = async (projectionId: string) => {
        if (!user?.uid) return;
        try {
            const res = await fetch('/bridge/api.v1/projections', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: projectionId, status: 'Canceled' }),
            });
            if (!res.ok) throw new Error('Failed to cancel projection');
            toast({
                name: 'app',
                title: "Projection Canceled",
                description: "The projection has been successfully canceled.",
            })
        } catch (error) {
            console.error("Error canceling projection:", error);
            toast({
                name: 'app',
                state: 'error',
                title: "Error",
                description: "Could not cancel the projection.",
            })
        }
    };
    
  const isLoading = isUserLoading || areProjectionsLoading;
  const stackedTotal = paginatedProjections.length > 0 ? paginatedProjections.length + 1 : 2;

  return (
    <AppShell>
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">Future Projections</h1>
                <p className="text-sm text-muted-foreground">Track expected income and expenses, then add a new projection from the first card.</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Future Projections</CardTitle>
                    <CardDescription>A list of your projected income and expenses.</CardDescription>
                </CardHeader>
                <CardContent>
                        {isLoading ? (
                        <div className="overflow-hidden rounded-lg border">
                          <div className="divide-y">
                            <div className={stackedCardClassName(0, 4, 'flex items-center justify-between p-4')}>
                              <div className="flex items-center gap-4">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="space-y-2">
                                  <Skeleton className="h-4 w-40" />
                                  <Skeleton className="h-3 w-52" />
                                </div>
                              </div>
                              <Skeleton className="h-9 w-9 rounded-md" />
                            </div>
                            <div className="flex items-center justify-between border-b border-border bg-card p-4">
                              <div className="flex items-center gap-4">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="space-y-2">
                                  <Skeleton className="h-4 w-36" />
                                  <Skeleton className="h-3 w-48" />
                                </div>
                              </div>
                              <Skeleton className="h-6 w-24" />
                            </div>
                            <div className="flex items-center justify-between border-b border-border bg-card p-4">
                              <div className="flex items-center gap-4">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="space-y-2">
                                  <Skeleton className="h-4 w-32" />
                                  <Skeleton className="h-3 w-44" />
                                </div>
                              </div>
                              <Skeleton className="h-6 w-28" />
                            </div>
                            <div className="flex items-center justify-between rounded-b-lg border-b-0 bg-card p-4">
                              <div className="flex items-center gap-4">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="space-y-2">
                                  <Skeleton className="h-4 w-28" />
                                  <Skeleton className="h-3 w-40" />
                                </div>
                              </div>
                              <Skeleton className="h-6 w-20" />
                            </div>
                          </div>
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-lg border">
                          <Link href="/projections/add" className="block">
                            <div className={stackedCardClassName(0, stackedTotal, 'flex items-center justify-between p-4')}>
                              <div className="flex items-center gap-4">
                                <div className="rounded-full bg-muted p-2">
                                  <PlusCircle className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div>
                                  <p className="font-semibold">Add Projection</p>
                                  <p className="text-sm text-muted-foreground">Create a future income or expense projection.</p>
                                </div>
                              </div>
                              <Button variant="ghost" size="icon">
                                <PlusCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </Link>

                          {paginatedProjections.length > 0 ? paginatedProjections.map((item, index) => (
                              <div key={item.id} className={stackedCardClassName(index + 1, stackedTotal, cn("flex items-center justify-between p-3", item.status === 'Canceled' && 'opacity-50 bg-muted/50'))}>
                                  <div className="flex items-center gap-4">
                                      <div className="p-2 rounded-full bg-muted">
                                          {typeIcons[item.type]}
                                      </div>
                                      <div>
                                          <p className={cn("font-semibold", item.status === 'Canceled' && 'line-through')}>{item.title}</p>
                                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                              <span>{new Date(item.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric'})}</span>
                                              {item.isRecurring && (
                                                  <div className="flex items-center gap-1">
                                                      <Repeat className="h-3 w-3" />
                                                      <span>{item.recurrence}</span>
                                                      {item.endsOn && <span>until {new Date(item.endsOn).toLocaleDateString('en-US', { month: 'short', day: 'numeric'})}</span>}
                                                  </div>
                                              )}
                                          </div>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                      <div className="text-right">
                                          <p className={cn("font-semibold", item.type === 'Income' ? 'text-green-500' : 'text-red-500', item.status === 'Canceled' && 'line-through')}>
                                              {new Intl.NumberFormat('en-US', { style: 'currency', currency: item.currency }).format(item.amount)}
                                          </p>
                                          {item.status === 'Canceled' ? (
                                              <Badge variant="destructive" className="mt-1">Canceled</Badge>
                                          ) : (
                                              <Badge variant="outline" className={cn("mt-1", certaintyColors[item.certainty])}>{item.certainty}</Badge>
                                          )}
                                      </div>
                                      {item.status !== 'Canceled' && (
                                      <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                              <Button variant="ghost" size="icon">
                                                  <XCircle className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                              </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                              <AlertDialogHeader>
                                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                  <AlertDialogDescription>
                                                      This action will mark the projection as canceled. You cannot undo this action.
                                                  </AlertDialogDescription>
                                              </AlertDialogHeader>
                                              <AlertDialogFooter>
                                                  <AlertDialogCancel>Back</AlertDialogCancel>
                                                  <AlertDialogAction onClick={() => handleCancelProjection(item.id!)}>Cancel Projection</AlertDialogAction>
                                              </AlertDialogFooter>
                                          </AlertDialogContent>
                                      </AlertDialog>
                                      )}
                                  </div>
                              </div>
                          )) : (
                          <StackedEmptyStateRow
                              icon={Inbox}
                              title="No projections found"
                              description="Create your first projection from the card above."
                              className={stackedCardClassName(1, 2, 'bg-card')}
                          />
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

            <Card>
                <CardHeader>
                    <CardTitle>Yearly Financial Projection</CardTitle>
                    <CardDescription>Estimated balance over the next 12 months.</CardDescription>
                </CardHeader>
                <CardContent>
                    <YearlyProjectionChart />
                </CardContent>
            </Card>

        </div>
    </AppShell>
  );
}
