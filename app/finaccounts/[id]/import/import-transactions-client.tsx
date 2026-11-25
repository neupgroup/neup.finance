'use client';

import { useMemo, useState, type ChangeEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle2, FileSpreadsheet, Loader, Upload } from 'lucide-react';
import { Button } from '@neup/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@neup/components/ui/card';
import { Input } from '@neup/components/ui/input';
import { LinkButton } from '@neup/components/ui/link-button';
import type { ImportedAccountTransaction } from '@/services/transactions/account-file-import';

const basePath = process.env.NEXT_PUBLIC_APP_BASEPATH ?? '';
const supportedExtensions = ['xlsx', 'xls', 'pdf', 'doc', 'docx', 'csv', 'tsv', 'tsx', 'txt'];

type ImportTransactionsClientProps = {
  accountId: string;
  accountCurrency: string;
  accountHref: string;
};

type ImportAnalysisResponse = { transactions: ImportedAccountTransaction[]; error?: string };
type ImportResult = { imported: number; skippedAsDuplicate: number; error?: string };

// Format transaction amounts using the account currency.
function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

// Build the account-specific import API path while preserving selected project context.
function getImportApiPath(accountId: string, projectId: string | null) {
  const query = projectId ? `?project=${encodeURIComponent(projectId)}` : '';
  return `${basePath}/bridge/api.v1/books/${encodeURIComponent(accountId)}/transactions/import${query}`;
}

// Upload, review, and import AI-extracted transactions for one account.
export default function ImportTransactionsClient({ accountId, accountCurrency, accountHref }: ImportTransactionsClientProps) {
  const router = useRouter();
  const projectId = useSearchParams().get('project');
  const [file, setFile] = useState<File | null>(null);
  const [transactions, setTransactions] = useState<ImportedAccountTransaction[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);

  const newTransactions = useMemo(() => transactions.filter((transaction) => !transaction.duplicate), [transactions]);

  // Store an accepted file and reset prior analysis results.
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    setFile(nextFile);
    setTransactions([]);
    setResult(null);
    setError('');
    if (nextFile) {
      const extension = nextFile.name.split('.').pop()?.toLowerCase() ?? '';
      if (!supportedExtensions.includes(extension)) {
        setError('Choose an XLSX, XLS, PDF, DOC, DOCX, CSV, TSV, TSX, or TXT file.');
        setFile(null);
      } else if (nextFile.size > 15 * 1024 * 1024) {
        setError('Files must be 15 MB or smaller.');
        setFile(null);
      }
    }
  };

  // Send the selected file for text extraction and AI duplicate analysis.
  const handleAnalyze = async () => {
    if (!file) return;
    setError('');
    setResult(null);
    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.set('file', file);
      const response = await fetch(getImportApiPath(accountId, projectId), {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const body = await response.json() as ImportAnalysisResponse;
      if (!response.ok) throw new Error(body.error ?? 'Could not analyze the selected file.');
      setTransactions(body.transactions ?? []);
      if (!body.transactions?.length) setError('No transactions were found in this file.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not analyze the selected file.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Submit reviewed candidates so the server can skip duplicates and save the rest atomically.
  const handleImport = async () => {
    if (newTransactions.length === 0) return;
    setError('');
    setIsImporting(true);
    try {
      const response = await fetch(getImportApiPath(accountId, projectId), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions }),
      });
      const body = await response.json() as ImportResult;
      if (!response.ok) throw new Error(body.error ?? 'Could not import transactions.');
      setResult(body);
      setTransactions([]);
      setFile(null);
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not import transactions.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Choose a file</CardTitle>
          <CardDescription>Upload a statement or transaction report. AI will extract entries and compare them with this account’s history before you import.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input type="file" accept=".xlsx,.xls,.pdf,.doc,.docx,.csv,.tsv,.tsx,.txt" onChange={handleFileChange} />
          <p className="text-sm text-muted-foreground">Supported: XLSX, XLS, PDF, DOC, DOCX, CSV, TSV, TSX, and TXT. Maximum file size: 15 MB.</p>
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleAnalyze} disabled={!file || isAnalyzing || isImporting}>
              {isAnalyzing ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              {isAnalyzing ? 'Analyzing file…' : 'Analyze transactions'}
            </Button>
            <LinkButton href={accountHref} variant="outline">Cancel</LinkButton>
          </div>
        </CardContent>
      </Card>

      {error ? <div role="alert" className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div> : null}
      {result ? (
        <Card>
          <CardContent className="flex items-start gap-3 p-5">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium">Import complete</p>
              <p className="text-sm text-muted-foreground">{result.imported} added; {result.skippedAsDuplicate} duplicate entries skipped.</p>
              <a className="mt-2 inline-block text-sm text-primary underline" href={accountHref}>Return to transaction history</a>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {transactions.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileSpreadsheet className="h-5 w-5" />Review extracted transactions</CardTitle>
            <CardDescription>{newTransactions.length} new entries will be imported. {transactions.length - newTransactions.length} likely duplicates or invalid dates will be skipped.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="bg-muted/60 text-muted-foreground">
                  <tr><th className="p-3">Date</th><th className="p-3">Description</th><th className="p-3">Direction</th><th className="p-3 text-right">Amount</th><th className="p-3">Review</th></tr>
                </thead>
                <tbody>
                  {transactions.map((transaction, index) => (
                    <tr key={`${transaction.date}-${transaction.title}-${index}`} className="border-t align-top">
                      <td className="p-3 whitespace-nowrap">{transaction.date}</td>
                      <td className="p-3"><div className="font-medium">{transaction.title}</div>{transaction.description ? <div className="text-xs text-muted-foreground">{transaction.description}</div> : null}</td>
                      <td className="p-3 capitalize">{transaction.direction}</td>
                      <td className="p-3 text-right whitespace-nowrap">{formatAmount(transaction.amount, transaction.currency || accountCurrency)}</td>
                      <td className="p-3">{transaction.duplicate ? <span className="text-amber-700">Skip · {transaction.duplicateReason || 'Likely already reported'}</span> : <span className="text-green-700">New</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">You can review the detected rows before saving them.</p>
              <Button onClick={handleImport} disabled={newTransactions.length === 0 || isImporting || isAnalyzing}>
                {isImporting ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isImporting ? 'Importing…' : `Import ${newTransactions.length} new transaction${newTransactions.length === 1 ? '' : 's'}`}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
