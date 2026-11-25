'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
import { Button } from '@neup/components/ui/button';
import { Input } from '@neup/components/ui/input';
import { Label } from '@neup/components/ui/label';
import { Textarea } from '@neup/components/ui/textarea';
import { Combobox } from '@/components/ui/combobox';
import { useToast } from '@neup/core/hooks/useToast';
import { createTransaction, useProjectBooks } from '@/core/hooks/api';
import { currencyOptions } from '@/core/lib/ledger';

type JournalVoucherLine = {
  id: string;
  bookId: string;
  description: string;
  debit: string;
  credit: string;
};

// Format a local calendar date for the voucher date input.
function getLocalDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Create an empty debit or credit row for the voucher editor.
function createJournalVoucherLine(): JournalVoucherLine {
  return { id: crypto.randomUUID(), bookId: '', description: '', debit: '', credit: '' };
}

// Enter and save a balanced journal voucher independently from transaction entry.
export default function NewJournalVoucherPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { data: books } = useProjectBooks();
  const projectId = searchParams.get('project')?.trim();
  const backHref = `/documents${projectId ? `?project=${encodeURIComponent(projectId)}` : ''}`;
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => getLocalDateValue(new Date()));
  const [reference, setReference] = useState('');
  const [memo, setMemo] = useState('');
  const [currency, setCurrency] = useState('NPR');
  const [lines, setLines] = useState<JournalVoucherLine[]>([createJournalVoucherLine(), createJournalVoucherLine()]);
  const [isSaving, setIsSaving] = useState(false);
  const accountOptions = useMemo(() => (books ?? []).map((book) => ({ value: book.id, label: book.name })), [books]);
  const totalDebit = lines.reduce((total, line) => total + (Number(line.debit) || 0), 0);
  const totalCredit = lines.reduce((total, line) => total + (Number(line.credit) || 0), 0);
  const difference = Math.round((totalDebit - totalCredit) * 100) / 100;
  const activeLines = lines.filter((line) => line.bookId || line.debit || line.credit || line.description.trim());
  const isBalanced = activeLines.length >= 2 && Math.abs(difference) < 0.005;

  // Update one editable journal line field.
  const updateLine = (lineId: string, field: keyof Omit<JournalVoucherLine, 'id'>, value: string) => {
    setLines((current) => current.map((line) => line.id === lineId ? { ...line, [field]: value } : line));
  };

  // Save a journal voucher with equal total debits and credits.
  const saveJournalVoucher = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validLines = lines.filter((line) => Number(line.debit) > 0 || Number(line.credit) > 0);
    const hasInvalidLine = validLines.some((line) => {
      const debit = Number(line.debit) || 0;
      const credit = Number(line.credit) || 0;
      return !line.bookId || !((debit > 0 && credit === 0) || (credit > 0 && debit === 0));
    });

    if (!title.trim() || !date || validLines.length < 2 || hasInvalidLine || Math.abs(difference) >= 0.005) {
      toast({ name: 'app', state: 'error', title: 'Journal voucher is incomplete', description: 'Enter a title and date, assign an account to each line, and make sure total debits equal total credits.' });
      return;
    }

    const bookById = new Map((books ?? []).map((book) => [book.id, book]));
    setIsSaving(true);
    try {
      const saved = await createTransaction({
        title: title.trim(),
        description: memo.trim() || undefined,
        transaction_type: 'journal-voucher',
        category: 'general',
        status: 'posted',
        date,
        currency,
        reference_number: reference.trim() || undefined,
        lines: validLines.map((line, index) => {
          const book = bookById.get(line.bookId);
          const debit = Number(line.debit) || 0;
          const credit = Number(line.credit) || 0;
          return {
            title: book?.name ?? 'Journal account',
            description: line.description.trim() || undefined,
            line_type_id: 'journal',
            currency,
            base_amount: credit - debit,
            sort_order: index,
            fin_book: line.bookId,
            fin_account: book?.name ?? 'Journal account',
          };
        }),
      });

      toast({ name: 'app', title: 'Journal voucher saved', description: `${title.trim()} has been added to the financial journal.` });
      router.push(`/transactions/${encodeURIComponent(saved.id)}${projectId ? `?project=${encodeURIComponent(projectId)}` : ''}`);
    } catch (error) {
      toast({ name: 'app', state: 'error', title: 'Could not save journal voucher', description: error instanceof Error ? error.message : 'Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl space-y-6">
      <Link href={backHref} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to record types
      </Link>
      <form onSubmit={saveJournalVoucher} className="space-y-6">
        <header className="space-y-1">
          <p className="text-sm font-medium text-primary">Accounting</p>
          <h1 className="text-3xl font-bold tracking-tight">New Journal Voucher</h1>
          <p className="text-muted-foreground">Record a balanced adjustment across your accounts.</p>
        </header>

        <section className="grid gap-4 rounded-lg border p-5 md:grid-cols-2">
          <div className="space-y-2"><Label htmlFor="journal-title">Voucher title <span className="text-destructive">*</span></Label><Input id="journal-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Monthly depreciation" required /></div>
          <div className="space-y-2"><Label htmlFor="journal-date">Date <span className="text-destructive">*</span></Label><Input id="journal-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></div>
          <div className="space-y-2"><Label htmlFor="journal-reference">Reference number</Label><Input id="journal-reference" value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Optional reference" /></div>
          <div className="space-y-2"><Label htmlFor="journal-currency">Currency</Label><select id="journal-currency" className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={currency} onChange={(event) => setCurrency(event.target.value)}>{currencyOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
          <div className="space-y-2 md:col-span-2"><Label htmlFor="journal-memo">Memo</Label><Textarea id="journal-memo" rows={2} value={memo} onChange={(event) => setMemo(event.target.value)} placeholder="Add a note for this voucher" /></div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Journal lines</h2><p className="text-sm text-muted-foreground">Each line can have a debit or a credit amount.</p></div><Button type="button" variant="outline" onClick={() => setLines((current) => [...current, createJournalVoucherLine()])}><Plus className="mr-2 h-4 w-4" />Add line</Button></div>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-muted/50"><tr><th className="px-3 py-3 text-left">Account</th><th className="px-3 py-3 text-left">Description</th><th className="w-36 px-3 py-3 text-right">Debit</th><th className="w-36 px-3 py-3 text-right">Credit</th><th className="w-12 px-2 py-3" /></tr></thead>
              <tbody className="divide-y">
                {lines.map((line) => (
                  <tr key={line.id}>
                    <td className="min-w-56 px-3 py-2"><Combobox options={accountOptions} value={line.bookId} onChange={(value) => updateLine(line.id, 'bookId', value)} placeholder="Choose account" searchPlaceholder="Search accounts…" notFoundMessage="No accounts found." /></td>
                    <td className="min-w-56 px-3 py-2"><Input aria-label="Line description" value={line.description} onChange={(event) => updateLine(line.id, 'description', event.target.value)} placeholder="Description (optional)" /></td>
                    <td className="px-3 py-2"><Input aria-label="Debit amount" className="text-right tabular-nums" type="number" min="0" step="0.01" value={line.debit} onChange={(event) => updateLine(line.id, 'debit', event.target.value)} placeholder="0.00" /></td>
                    <td className="px-3 py-2"><Input aria-label="Credit amount" className="text-right tabular-nums" type="number" min="0" step="0.01" value={line.credit} onChange={(event) => updateLine(line.id, 'credit', event.target.value)} placeholder="0.00" /></td>
                    <td className="px-2 py-2"><Button type="button" variant="ghost" size="icon" aria-label="Remove line" disabled={lines.length <= 2} onClick={() => setLines((current) => current.filter((item) => item.id !== line.id))}><Trash2 className="h-4 w-4" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="ml-auto grid max-w-sm grid-cols-2 gap-x-8 gap-y-2 rounded-lg bg-muted/50 p-4 text-sm">
            <span>Total debits</span><span className="text-right font-medium tabular-nums">{currency} {totalDebit.toFixed(2)}</span>
            <span>Total credits</span><span className="text-right font-medium tabular-nums">{currency} {totalCredit.toFixed(2)}</span>
            <span className="border-t pt-2 font-semibold">Difference</span><span className={`border-t pt-2 text-right font-semibold tabular-nums ${isBalanced ? 'text-emerald-600' : 'text-destructive'}`}>{currency} {Math.abs(difference).toFixed(2)}</span>
          </div>
        </section>

        <footer className="flex items-center justify-between border-t pt-4">
          <Button type="button" variant="outline" asChild><Link href={backHref}><ArrowLeft className="mr-2 h-4 w-4" />Cancel</Link></Button>
          <Button type="submit" disabled={isSaving || !isBalanced}><Save className="mr-2 h-4 w-4" />{isSaving ? 'Saving…' : 'Save Journal Voucher'}</Button>
        </footer>
      </form>
    </main>
  );
}
