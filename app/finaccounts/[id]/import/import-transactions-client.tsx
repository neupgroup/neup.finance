'use client';

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle2, CloudUpload, FileSpreadsheet, Loader, Upload } from 'lucide-react';
import { Button } from '@neup/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@neup/components/ui/card';
import { Input } from '@neup/components/ui/input';
import { LinkButton } from '@neup/components/ui/link-button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@neup/components/ui/select';
import { Textarea } from '@neup/components/ui/textarea';
import { useParties } from '@/core/hooks/api';
import { getApiPath } from '@/core/helpers/app-path';
import type { ImportedAccountTransaction } from '@/services/transactions/account-file-import';

const supportedExtensions = ['xlsx', 'xls', 'pdf', 'doc', 'docx', 'csv', 'tsv', 'tsx', 'txt', 'json'];
const directExtensions = new Set(['xlsx', 'xls', 'csv', 'tsv', 'txt', 'json']);

type ImportTransactionsClientProps = {
  accountId: string;
  accountCurrency: string;
  accountHref: string;
};

type ImportAnalysisResponse = { transactions: ImportedAccountTransaction[]; error?: string };
type ImportResult = { imported: number; transaction?: { title: string }; error?: string };

// Build the account-specific import API path while preserving selected project context.
function getImportApiPath(accountId: string, projectId: string | null) {
  const query = projectId ? `?project=${encodeURIComponent(projectId)}` : '';
  return getApiPath(`/bridge/api.v1/books/${encodeURIComponent(accountId)}/transactions/import${query}`);
}

// Upload, review, and import AI-extracted transactions for one account.
export default function ImportTransactionsClient({ accountId, accountCurrency, accountHref }: ImportTransactionsClientProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const projectId = useSearchParams().get('project');
  const { data: parties } = useParties();
  const [sourceMode, setSourceMode] = useState<'file' | 'text'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [sourceText, setSourceText] = useState('');
  const [transactions, setTransactions] = useState<ImportedAccountTransaction[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [transactionSource, setTransactionSource] = useState<'direct' | 'ai'>('ai');

  const invalidTransactions = useMemo(() => transactions.filter((transaction) => !transaction.title.trim() || !Number.isFinite(transaction.amount) || transaction.amount <= 0), [transactions]);

  useEffect(() => {
    if (hasAnalyzed) return;
    const pasteTextIntoImport = (event: ClipboardEvent) => {
      const pastedText = event.clipboardData?.getData('text/plain')?.trim();
      if (!pastedText) return;
      event.preventDefault();
      setSourceMode('text');
      setSourceText(pastedText);
      setFile(null);
      setTransactions([]);
      setSuccessMessage('');
      setError('');
    };
    window.addEventListener('paste', pasteTextIntoImport);
    return () => window.removeEventListener('paste', pasteTextIntoImport);
  }, [hasAnalyzed]);

  // Update an extracted row and let edited duplicate fields be checked again on import.
  const updateTransaction = (index: number, updates: Partial<ImportedAccountTransaction>) => {
    setTransactions((current) => current.map((transaction, transactionIndex) => transactionIndex === index
      ? { ...transaction, ...updates, ...(Object.keys(updates).some((key) => ['title', 'amount', 'direction'].includes(key)) ? { duplicate: false, duplicateReason: null } : {}) }
      : transaction));
  };

  // Store an accepted file and reset prior analysis results.
  const handleSelectedFile = (nextFile: File | null) => {
    setFile(nextFile);
    setTransactions([]);
    setSuccessMessage('');
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

  // Read a selected file and clear the input so the same file can be selected again.
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleSelectedFile(event.target.files?.[0] ?? null);
    event.currentTarget.value = '';
  };

  // Accept dragged files in the upload target.
  const handleFileDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);
    handleSelectedFile(event.dataTransfer.files?.[0] ?? null);
  };

  // Parse a structured file directly or analyze it with AI for less structured documents.
  const handleFileAction = async (mode: 'direct' | 'analyze') => {
    if (!file) return;
    setError('');
    setSuccessMessage('');
    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.set('file', file);
      formData.set('mode', mode);
      const response = await fetch(getImportApiPath(accountId, projectId), {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const body = await response.json() as ImportAnalysisResponse;
      if (!response.ok) throw new Error(body.error ?? (mode === 'direct' ? 'Could not parse the selected file.' : 'Could not analyze the selected file.'));
      setTransactions(body.transactions ?? []);
      setTransactionSource(mode === 'direct' ? 'direct' : 'ai');
      setHasAnalyzed(true);
      if (!body.transactions?.length) setError('No transactions were found in this file.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not import the selected file.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Send pasted transaction notes through the same AI extraction and duplicate review flow.
  const handleAnalyzeText = async () => {
    if (!sourceText.trim()) return;
    setError('');
    setSuccessMessage('');
    setIsAnalyzing(true);
    try {
      const response = await fetch(getImportApiPath(accountId, projectId), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceText: sourceText.trim() }),
      });
      const body = await response.json() as ImportAnalysisResponse;
      if (!response.ok) throw new Error(body.error ?? 'Could not analyze the pasted text.');
      setTransactions(body.transactions ?? []);
      setTransactionSource('ai');
      setHasAnalyzed(true);
      if (!body.transactions?.length) setError('No transactions were found in the pasted text.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not analyze the pasted text.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Clear reviewed data so another file or text source can be analyzed.
  const handleChooseAnotherSource = () => {
    setHasAnalyzed(false);
    setTransactions([]);
    setFile(null);
    setSourceText('');
    setSourceMode('file');
    setSuccessMessage('');
    setError('');
  };

  // Save one reviewed transaction and leave the remaining candidates for individual review.
  const handleImport = async (index: number) => {
    const transaction = transactions[index];
    if (!transaction || transaction.duplicate) return;
    setError('');
    setSuccessMessage('');
    setIsImporting(true);
    try {
      const response = await fetch(getImportApiPath(accountId, projectId), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: [transaction], source: transactionSource }),
      });
      const body = await response.json() as ImportResult;
      if (!response.ok) throw new Error(body.error ?? 'Could not import transactions.');
      setTransactions((current) => current.filter((_, transactionIndex) => transactionIndex !== index));
      setSuccessMessage(`Added transaction successfully: ${transaction.title}`);
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not import transactions.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {!hasAnalyzed ? <Card>
        <CardHeader>
          <CardTitle>Import transactions</CardTitle>
          <CardDescription>Import structured transaction files directly, or use AI to analyze statements and unstructured notes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sourceMode === 'file' ? (
            <div className="space-y-3">
              <input ref={fileInputRef} className="sr-only" type="file" accept=".xlsx,.xls,.pdf,.doc,.docx,.csv,.tsv,.tsx,.txt,.json" onChange={handleFileChange} />
              <div
                onDragOver={(event) => { event.preventDefault(); setIsDragActive(true); }}
                onDragLeave={() => setIsDragActive(false)}
                onDrop={handleFileDrop}
                className={`flex min-h-64 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'border-blue-400 bg-blue-50/70 dark:bg-blue-950/20'}`}
              >
                {file ? (
                  <>
                    <FileSpreadsheet className="h-8 w-8 text-primary" />
                    <p className="max-w-full truncate font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                    <Button type="button" variant="outlined" onClick={() => fileInputRef.current?.click()}>Change file</Button>
                  </>
                ) : (
                  <>
                    <CloudUpload className="h-9 w-9 text-primary" />
                    <p className="text-muted-foreground">Drag and drop your file or{' '}
                      <Button type="button" variant="text" className="h-auto px-0 py-0" onClick={() => fileInputRef.current?.click()}>Browse</Button>
                    </p>
                    <p className="text-sm text-muted-foreground">Supported formats: XLSX, XLS, CSV, TSV, JSON, TXT, PDF, DOC, DOCX, TSX · Maximum size: 15 MB</p>
                    <p className="text-sm text-muted-foreground">Or enter or paste transaction text instead.</p>
                  </>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Button type="button" variant="text" className="px-0" onClick={() => setSourceMode('text')}>Enter or paste text instead</Button>
                {file && directExtensions.has(file.name.split('.').pop()?.toLowerCase() ?? '') ? <Button onClick={() => handleFileAction('direct')} disabled={!file || isAnalyzing || isImporting}>
                  {isAnalyzing ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  {isAnalyzing ? 'Parsing file…' : 'Import directly'}
                </Button> : null}
                <Button variant={file && directExtensions.has(file.name.split('.').pop()?.toLowerCase() ?? '') ? 'outlined' : 'solid'} onClick={() => handleFileAction('analyze')} disabled={!file || isAnalyzing || isImporting}>
                  {isAnalyzing ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  {isAnalyzing ? 'Analyzing file…' : 'Analyze with AI'}
                </Button>
              </div>
            </div>
          ) : null}
          {sourceMode === 'text' ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">For direct import, use one field per line in this order, with `--` between records: datetime, title, description, tags, direction, currency, amount. Required: datetime, direction, currency, amount. Title, description, and tags are optional. Or use AI to analyze free-form text.</p>
              <Textarea value={sourceText} onChange={(event) => setSourceText(event.target.value)} placeholder="Paste a statement, transaction list, or notes here…" rows={7} />
              <div className="flex flex-wrap gap-3">
              <Button onClick={handleAnalyzeText} disabled={!sourceText.trim() || isAnalyzing || isImporting}>
                {isAnalyzing ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                {isAnalyzing ? 'Analyzing text…' : 'Analyze pasted text'}
              </Button>
              <Button variant="outlined" onClick={async () => {
                if (!sourceText.trim()) return;
                setIsAnalyzing(true); setError(''); setSuccessMessage('');
                try {
                  const formData = new FormData();
                  formData.set('mode', 'direct');
                  formData.set('file', new File([sourceText], 'transactions.txt', { type: 'text/plain' }));
                  const response = await fetch(getImportApiPath(accountId, projectId), { method: 'POST', credentials: 'include', body: formData });
                  const body = await response.json() as ImportAnalysisResponse;
                  if (!response.ok) throw new Error(body.error ?? 'Could not parse transaction text.');
                  setTransactions(body.transactions ?? []); setTransactionSource('direct'); setHasAnalyzed(true);
                  if (!body.transactions?.length) setError('No transactions were found in the text.');
                } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not parse transaction text.'); }
                finally { setIsAnalyzing(false); }
              }} disabled={!sourceText.trim() || isAnalyzing || isImporting}>{isAnalyzing ? 'Parsing text…' : 'Import formatted text'}</Button>
              </div>
              <Button type="button" variant="text" className="px-0" onClick={() => { setSourceMode('file'); setSourceText(''); }}>Choose a file instead</Button>
            </div>
          ) : null}
          <LinkButton href={accountHref} variant="outlined">Cancel</LinkButton>
        </CardContent>
      </Card> : null}

      {hasAnalyzed ? <Button type="button" variant="outlined" onClick={handleChooseAnotherSource}>Choose another source</Button> : null}

      {error ? <div role="alert" className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div> : null}
      {successMessage ? (
        <Card>
          <CardContent className="flex items-start gap-3 p-5">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium">{successMessage}</p>
              <LinkButton href={accountHref} variant="text" className="mt-2 h-auto px-0 py-0">View transaction history</LinkButton>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {transactions.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileSpreadsheet className="h-5 w-5" />Review transactions</CardTitle>
            <CardDescription>{transactions.length} transaction{transactions.length === 1 ? '' : 's'} remain. Save each transaction individually after reviewing it.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              {transactions.map((transaction, index) => (
                <Card key={index} className="bg-muted/20">
                  <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-3">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base">Transaction {index + 1}</CardTitle>
                      <CardDescription>{transaction.date}</CardDescription>
                    </div>
                    {transaction.duplicate
                      ? <span className="shrink-0 text-sm font-medium text-amber-700">Skip · {transaction.duplicateReason || 'Likely already reported'}</span>
                      : <span className="shrink-0 text-sm font-medium text-green-700">New</span>}
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor={`import-title-${index}`} className="text-sm font-medium">Title</label>
                      <Input id={`import-title-${index}`} value={transaction.title} aria-invalid={!transaction.title.trim()} onChange={(event) => updateTransaction(index, { title: event.target.value })} />
                      {!transaction.title.trim() ? <span className="text-xs text-destructive">Title is required.</span> : null}
                    </div>
                    <div className="space-y-2">
                      <label htmlFor={`import-description-${index}`} className="text-sm font-medium">Description</label>
                      <Textarea id={`import-description-${index}`} value={transaction.description ?? ''} onChange={(event) => updateTransaction(index, { description: event.target.value })} placeholder="Optional description" rows={2} />
                    </div>
                    {transactionSource === 'direct' ? <div className="space-y-2 sm:col-span-2">
                      <label htmlFor={`import-tags-${index}`} className="text-sm font-medium">Tags (comma-separated)</label>
                      <Input id={`import-tags-${index}`} value={(transaction.tags ?? []).join(', ')} placeholder="Optional tags" onChange={(event) => updateTransaction(index, { tags: event.target.value.split(',').map((tag) => tag.trim()).filter(Boolean) })} />
                    </div> : null}
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor={`import-direction-${index}`}>Direction</label>
                      <Select value={transaction.direction} onValueChange={(value: 'in' | 'out') => updateTransaction(index, { direction: value })}>
                        <SelectTrigger id={`import-direction-${index}`}><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="in">Money in</SelectItem><SelectItem value="out">Money out</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor={`import-amount-${index}`}>Amount ({transaction.currency || accountCurrency})</label>
                      <Input id={`import-amount-${index}`} type="number" min="0.01" step="0.01" value={transaction.amount} aria-invalid={!Number.isFinite(transaction.amount) || transaction.amount <= 0} onChange={(event) => updateTransaction(index, { amount: event.target.value === '' ? 0 : Number(event.target.value) })} />
                      {transaction.amount <= 0 ? <span className="text-xs text-destructive">Amount must be greater than zero.</span> : null}
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-sm font-medium" htmlFor={`import-party-${index}`}>Party (optional)</label>
                      <Select value={transaction.partyId ?? 'none'} onValueChange={(value) => updateTransaction(index, { partyId: value === 'none' ? null : value })}>
                        <SelectTrigger id={`import-party-${index}`}><SelectValue placeholder="No party" /></SelectTrigger>
                        <SelectContent><SelectItem value="none">No party</SelectItem>{(parties ?? []).map((party: { id: string; name: string }) => <SelectItem key={party.id} value={party.id}>{party.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                  {!transaction.duplicate ? <CardContent className="flex justify-end pt-0">
                    <Button onClick={() => handleImport(index)} disabled={invalidTransactions.includes(transaction) || isImporting || isAnalyzing}>
                      {isImporting ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {isImporting ? 'Adding transaction…' : 'Add transaction'}
                    </Button>
                  </CardContent> : null}
                </Card>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">Each transaction is saved individually after review.</p>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
