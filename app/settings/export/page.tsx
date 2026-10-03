'use client';

import { useState } from 'react';
import { Download, FileJson, FolderArchive, Loader2 } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@neup/components/ui/card';
import { Button } from '@neup/components/ui/button';
import { Badge } from '@neup/components/ui/badge';
import { useToast } from '@neup/components/ui/toast';
import { useParties, useProjections, useTransactionsList, useProjectBooks, useSelectedProject } from '@/core/hooks/api';

/*
::neup.documentation::settings-export-page
::function ExportSettingsPage()

Provides `/settings/export` so the current user can download transactions,
books, parties, and projections from the live local ledger APIs as JSON files.

::end
*/

type ExportKey = 'transactions' | 'books' | 'parties' | 'projections' | 'everything';

function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function ExportSettingsPage() {
  const { toast } = useToast();
  const { project } = useSelectedProject();
  const { data: transactions, isLoading: areTransactionsLoading } = useTransactionsList();
  const { data: accounts, isLoading: areAccountsLoading } = useProjectBooks();
  const { data: parties, isLoading: arePartiesLoading } = useParties();
  const { data: projections, isLoading: areProjectionsLoading } = useProjections();
  const [activeExport, setActiveExport] = useState<ExportKey | null>(null);

  const isLoading = areTransactionsLoading || areAccountsLoading || arePartiesLoading || areProjectionsLoading;

  const exportItems = [
    {
      key: 'transactions' as const,
      title: 'Transactions',
      description: 'Export the full transaction list including any nested line items.',
      count: transactions?.length ?? 0,
    },
    {
      key: 'books' as const,
      title: 'Books',
      description: 'Export the books in the selected project.',
      count: accounts?.length ?? 0,
    },
    {
      key: 'parties' as const,
      title: 'Parties',
      description: 'Export party records with contacts, payment methods, and totals.',
      count: parties?.length ?? 0,
    },
    {
      key: 'projections' as const,
      title: 'Projections',
      description: 'Export saved future projections from the selected project.',
      count: projections?.length ?? 0,
    },
  ];

  const handleExport = (key: ExportKey) => {
    if (isLoading) {
      toast({
        name: 'app',
        title: 'Export not ready',
        description: 'Please wait until the current data finishes loading.',
      });
      return;
    }

    setActiveExport(key);

    const stamp = new Date().toISOString().slice(0, 10);
    const datasets = {
      transactions: transactions ?? [],
      books: accounts ?? [],
      parties: parties ?? [],
      projections: projections ?? [],
    };

    if (key === 'everything') {
      downloadJson(`finance-export-${stamp}.json`, {
        exportedAt: new Date().toISOString(),
        projectId: project?.id ?? null,
        ...datasets,
      });
    } else {
      downloadJson(`finance-${key}-${stamp}.json`, datasets[key]);
    }

    toast({
      name: 'app',
      title: 'Export ready',
      description: key === 'everything'
        ? 'Your full finance export has been downloaded.'
        : `${key.charAt(0).toUpperCase()}${key.slice(1)} export has been downloaded.`,
    });

    setActiveExport(null);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Export</h1>
          <p className="text-sm text-muted-foreground">
            Download a JSON copy of your current ledger data from the live finance APIs.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Full Export</CardTitle>
            <CardDescription>
              Download transactions, books, parties, and projections together in one file.
            </CardDescription>
          </CardHeader>
          <CardFooter className="border-t px-6 py-4">
            <Button onClick={() => handleExport('everything')} disabled={isLoading || activeExport !== null}>
              {activeExport === 'everything' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FolderArchive className="mr-2 h-4 w-4" />}
              Export Everything
            </Button>
          </CardFooter>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {exportItems.map((item) => (
            <Card key={item.key}>
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <FileJson className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </div>
                  <Badge variant="secondary">{item.count}</Badge>
                </div>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {isLoading ? 'Loading live data...' : `${item.count} records ready to export.`}
                </p>
              </CardContent>
              <CardFooter className="border-t px-6 py-4">
                <Button variant="outline" onClick={() => handleExport(item.key)} disabled={isLoading || activeExport !== null}>
                  {activeExport === item.key ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                  Export {item.title}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
