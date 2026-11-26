'use client';

import { useMemo, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { AlertCircle, CheckCircle2, CloudUpload, FileSpreadsheet } from 'lucide-react';
import { Button } from '@neup/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@neup/components/ui/card';
import { useFinAccountTransactions, type FinAccountTransaction } from '@/core/hooks/api';
import * as XLSX from 'xlsx';

type ReconcileTransactionsClientProps = { accountId: string; accountHref: string };
type StatementRow = { direction: 'in' | 'out'; amount: number; date: string; label: string };
type ReconciliationResult = { matched: Array<{ statement: StatementRow; account: FinAccountTransaction }>; statementOnly: StatementRow[]; accountOnly: FinAccountTransaction[] };

// Convert common direction labels or signed amounts into the account direction format.
function normalizeDirection(value: unknown, amount: number): 'in' | 'out' | null {
  const direction = String(value ?? '').trim().toLowerCase();
  if (['in', 'income', 'credit', 'deposit', 'received'].includes(direction)) return 'in';
  if (['out', 'expense', 'debit', 'withdrawal', 'payment', 'paid'].includes(direction)) return 'out';
  if (amount > 0) return 'in';
  if (amount < 0) return 'out';
  return null;
}

// Normalize spreadsheet dates, including Excel's serial date values, to calendar days.
function normalizeDate(value: unknown): string | null {
  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return null;
    return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
  }
  const text = String(value ?? '').trim();
  if (!text) return null;
  const iso = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

// Read supported structured file formats into normalized statement transaction rows.
async function parseStatementFile(file: File): Promise<StatementRow[]> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  let rows: Record<string, unknown>[];
  if (extension === 'json') {
    const parsed: unknown = JSON.parse(await file.text());
    const values = Array.isArray(parsed) ? parsed : parsed && typeof parsed === 'object' ? Object.values(parsed as Record<string, unknown>) : [];
    rows = values.filter((value): value is Record<string, unknown> => Boolean(value && typeof value === 'object' && !Array.isArray(value)));
  } else {
    const data = extension === 'csv' || extension === 'tsv' ? await file.text() : await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: typeof data === 'string' ? 'string' : 'array', cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    rows = sheet ? XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' }) : [];
  }

  return rows.flatMap((row, index) => {
    const normalized = Object.fromEntries(Object.entries(row).map(([key, value]) => [key.trim().toLowerCase().replace(/[^a-z0-9]/g, ''), value]));
    const amountValue = normalized.amount ?? normalized.value ?? normalized.transactionamount;
    const amount = Math.abs(Number(String(amountValue ?? '').replace(/[,$\s]/g, '')));
    const direction = normalizeDirection(normalized.direction ?? normalized.type ?? normalized.drcr, Number(String(amountValue ?? '').replace(/[,$\s]/g, '')));
    const date = normalizeDate(normalized.date ?? normalized.datetime ?? normalized.activityon ?? normalized.transactiondate);
    if (!direction || !Number.isFinite(amount) || amount <= 0 || !date) return [];
    return [{ direction, amount, date, label: String(normalized.description ?? normalized.title ?? normalized.reference ?? `Row ${index + 2}`) }];
  });
}

// Match each statement row to one unique account transaction by direction, amount, and day.
function reconcileRows(statementRows: StatementRow[], transactions: FinAccountTransaction[]): ReconciliationResult {
  const available = [...transactions];
  const matched: ReconciliationResult['matched'] = [];
  const statementOnly: StatementRow[] = [];
  for (const statement of statementRows) {
    const index = available.findIndex((transaction) => transaction.direction === statement.direction
      && Math.round(transaction.amount * 100) === Math.round(statement.amount * 100)
      && new Date(transaction.activityOn).toISOString().slice(0, 10) === statement.date);
    if (index < 0) statementOnly.push(statement);
    else matched.push({ statement, account: available.splice(index, 1)[0] });
  }
  return { matched, statementOnly, accountOnly: available };
}

// Upload, parse, and compare a statement file against the selected finance account.
export default function ReconcileTransactionsClient({ accountId }: ReconcileTransactionsClientProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: transactions, isLoading } = useFinAccountTransactions(accountId);
  const [file, setFile] = useState<File | null>(null);
  const [statementRows, setStatementRows] = useState<StatementRow[]>([]);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const result = useMemo(() => statementRows.length ? reconcileRows(statementRows, transactions ?? []) : null, [statementRows, transactions]);

  // Validate the chosen file and clear any stale comparison results.
  const selectFile = (selected: File | null) => {
    setFile(selected);
    setStatementRows([]);
    setError('');
    if (selected && !['xlsx', 'xls', 'csv', 'tsv', 'json'].includes(selected.name.split('.').pop()?.toLowerCase() ?? '')) {
      setError('Choose an XLSX, XLS, CSV, TSV, or JSON file.');
      setFile(null);
    } else if (selected && selected.size > 15 * 1024 * 1024) {
      setError('Files must be 15 MB or smaller.');
      setFile(null);
    }
  };

  // Parse the selected statement and report rows that cannot be compared.
  const handleReconcile = async () => {
    if (!file) return;
    setIsParsing(true);
    setError('');
    try {
      const parsed = await parseStatementFile(file);
      if (!parsed.length) throw new Error('No usable rows found. Include direction, amount, and date columns.');
      setStatementRows(parsed);
    } catch (reason) {
      setStatementRows([]);
      setError(reason instanceof Error ? reason.message : 'Could not read this file.');
    } finally {
      setIsParsing(false);
    }
  };

  // Accept files dropped onto the upload area.
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    selectFile(event.dataTransfer.files?.[0] ?? null);
  };

  // Accept files selected through the native file picker.
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    selectFile(event.target.files?.[0] ?? null);
    event.currentTarget.value = '';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Compare a statement</CardTitle>
          <CardDescription>Upload a spreadsheet or structured file with direction, amount, and date columns. Rows match on all three values.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input ref={inputRef} className="sr-only" type="file" accept=".xlsx,.xls,.csv,.tsv,.json" onChange={handleFileChange} />
          <div onDragOver={(event) => { event.preventDefault(); setDragActive(true); }} onDragLeave={() => setDragActive(false)} onDrop={handleDrop} className={`flex min-h-52 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 text-center ${dragActive ? 'border-primary bg-primary/10' : 'border-blue-400 bg-blue-50/70 dark:bg-blue-950/20'}`}>
            {file ? <><FileSpreadsheet className="h-8 w-8 text-primary" /><p className="max-w-full truncate font-medium">{file.name}</p><Button type="button" variant="outlined" onClick={() => inputRef.current?.click()}>Change file</Button></> : <><CloudUpload className="h-9 w-9 text-primary" /><p className="text-muted-foreground">Drop a file here or <Button type="button" variant="text" className="h-auto px-0 py-0" onClick={() => inputRef.current?.click()}>browse</Button></p><p className="text-sm text-muted-foreground">XLSX, XLS, CSV, TSV, or JSON · Maximum size: 15 MB</p></>}
          </div>
          {error ? <p role="alert" className="flex items-center gap-2 text-sm text-destructive"><AlertCircle className="h-4 w-4" />{error}</p> : null}
          <Button onClick={handleReconcile} disabled={!file || isParsing || isLoading || !transactions}><FileSpreadsheet className="mr-2 h-4 w-4" />{isParsing ? 'Comparing…' : isLoading ? 'Loading account transactions…' : 'Reconcile'}</Button>
        </CardContent>
      </Card>

      {result ? <>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card><CardHeader><CardDescription>Matched</CardDescription><CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-green-600" />{result.matched.length}</CardTitle></CardHeader></Card>
          <Card><CardHeader><CardDescription>Only in file</CardDescription><CardTitle>{result.statementOnly.length}</CardTitle></CardHeader></Card>
          <Card><CardHeader><CardDescription>Only in account</CardDescription><CardTitle>{result.accountOnly.length}</CardTitle></CardHeader></Card>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card><CardHeader><CardTitle>Only in uploaded file</CardTitle><CardDescription>These rows have no matching account transaction.</CardDescription></CardHeader><CardContent><ResultRows rows={result.statementOnly.map((row) => ({ direction: row.direction, amount: row.amount, date: row.date, label: row.label }))} emptyText="Every usable statement row matched." /></CardContent></Card>
          <Card><CardHeader><CardTitle>Only in account</CardTitle><CardDescription>These account transactions have no matching statement row.</CardDescription></CardHeader><CardContent><ResultRows rows={result.accountOnly.map((row) => ({ direction: row.direction, amount: row.amount, date: row.activityOn.slice(0, 10), label: row.title }))} emptyText="Every account transaction matched." /></CardContent></Card>
        </div>
      </> : null}
    </div>
  );
}

// Render unmatched transactions in a compact list with their comparison fields.
function ResultRows({ rows, emptyText }: { rows: Array<{ direction: string; amount: number; date: string; label: string }>; emptyText: string }) {
  if (!rows.length) return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  return <ul className="divide-y">{rows.map((row, index) => <li key={`${row.date}-${row.direction}-${row.amount}-${index}`} className="flex items-center justify-between gap-3 py-3 text-sm"><span className="min-w-0"><span className="block truncate font-medium">{row.label}</span><span className="text-muted-foreground">{row.date} · {row.direction}</span></span><span className="shrink-0 font-medium">{new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(row.amount)}</span></li>)}</ul>;
}
