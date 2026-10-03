'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileJson, Loader2, Upload } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@neup/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@neup/components/ui/card';
import { Input } from '@neup/components/ui/input';
import { Label } from '@neup/components/ui/label';
import { Textarea } from '@neup/components/ui/textarea';
import { Badge } from '@neup/components/ui/badge';
import { useToast } from '@neup/components/ui/toast';
import { useUser } from '@/core/providers/auth';
import { importTransactions } from '@/core/hooks/api';
import { cn } from '@neup/core/utils';

/*
::neup.documentation::transactions-import-page
::function ImportTransactionsPage()

Provides `/transactions/import` for CSV and JSON transaction imports, posting
file or pasted content to the transaction import API and showing row results.

::end
*/

type ImportFormat = 'csv' | 'json';

type ImportResult = {
  created: Array<{ id?: string; title: string; total_amount: number; currency: string }>;
  failed: Array<{ row: number; title?: string; error: string }>;
  totalRows: number;
};

const sampleCsvPlaceholder = [
  'date,title,transaction_type,status,currency,amount,category,account,party,reference',
  '2026-07-16,Client payment,income,paid,NPR,25000,Sales,Cash,Acme,INV-1001',
].join('\n');

export default function ImportTransactionsPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [format, setFormat] = useState<ImportFormat>('csv');
  const [content, setContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const rowCount = useMemo(() => {
    if (!content.trim()) return 0;
    if (format === 'json') {
      try {
        const parsed = JSON.parse(content) as unknown;
        if (Array.isArray(parsed)) return parsed.length;
        if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { transactions?: unknown }).transactions)) {
          return (parsed as { transactions: unknown[] }).transactions.length;
        }
      } catch {
        return 0;
      }
      return 0;
    }

    return Math.max(content.split(/\r?\n/).filter((line) => line.trim()).length - 1, 0);
  }, [content, format]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setFormat(file.name.toLowerCase().endsWith('.json') ? 'json' : 'csv');
    setContent(await file.text());
    setResult(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!user) {
      toast({
        name: 'app',
        state: 'error',
        title: 'Not signed in',
        description: 'Please sign in before importing transactions.',
      });
      return;
    }

    if (!content.trim()) {
      toast({
        name: 'app',
        state: 'error',
        title: 'Import file required',
        description: 'Choose a file or paste transaction rows.',
      });
      return;
    }

    setIsSubmitting(true);
    setResult(null);

    try {
      const importResult = await importTransactions({
        format,
        content,
      });
      setResult(importResult);
      toast({
        name: 'app',
        title: 'Import finished',
        description: `${importResult.created.length} imported, ${importResult.failed.length} failed.`,
      });
    } catch (error) {
      toast({
        name: 'app',
        state: 'error',
        title: 'Import failed',
        description: error instanceof Error ? error.message : 'Could not import transactions.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="space-y-2">
          <Button asChild variant="ghost" className="w-fit -ml-3 text-muted-foreground hover:text-foreground">
            <Link href="/transactions">
              <ArrowLeft className="h-4 w-4" />
              Back to transactions
            </Link>
          </Button>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">Import Transactions</h1>
              <p className="text-sm text-muted-foreground">CSV and JSON transaction rows.</p>
            </div>
            <Badge variant="secondary">{rowCount} rows</Badge>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Card>
            <CardHeader className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle>Source</CardTitle>
                <div className="grid grid-cols-2 gap-2 rounded-md border p-1">
                  {(['csv', 'json'] as const).map((item) => (
                    <Button
                      key={item}
                      type="button"
                      variant={format === item ? 'default' : 'ghost'}
                      className="h-8"
                      onClick={() => {
                        setFormat(item);
                        setResult(null);
                      }}
                    >
                      {item.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="transactionImportFile">File</Label>
                <Input
                  id="transactionImportFile"
                  type="file"
                  accept=".csv,.json,text/csv,application/json"
                  onChange={handleFileChange}
                />
                {fileName ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileJson className="h-4 w-4" />
                    {fileName}
                  </div>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="transactionImportContent">Rows</Label>
                <Textarea
                  id="transactionImportContent"
                  value={content}
                  onChange={(event) => {
                    setContent(event.target.value);
                    setResult(null);
                  }}
                  placeholder={format === 'csv' ? sampleCsvPlaceholder : '{"transactions":[]}'}
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {result ? (
            <Card>
              <CardHeader>
                <CardTitle>Result</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-md border p-3">
                    <p className="text-sm text-muted-foreground">Rows</p>
                    <p className="text-2xl font-semibold">{result.totalRows}</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-sm text-muted-foreground">Imported</p>
                    <p className="text-2xl font-semibold text-chart-2">{result.created.length}</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-sm text-muted-foreground">Failed</p>
                    <p className={cn('text-2xl font-semibold', result.failed.length ? 'text-destructive' : 'text-chart-2')}>
                      {result.failed.length}
                    </p>
                  </div>
                </div>

                {result.failed.length > 0 ? (
                  <div className="space-y-2">
                    {result.failed.map((failure) => (
                      <div key={`${failure.row}-${failure.title ?? failure.error}`} className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">Row {failure.row}</p>
                            {failure.title ? <p className="text-sm text-muted-foreground">{failure.title}</p> : null}
                          </div>
                          <Badge variant="destructive">Failed</Badge>
                        </div>
                        <p className="mt-2 text-sm text-destructive">{failure.error}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          <div className="flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="outline" asChild>
              <Link href="/transactions">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting || rowCount === 0}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Import transactions
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
