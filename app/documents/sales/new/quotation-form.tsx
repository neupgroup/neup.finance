'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Plus, Save, Trash2, X } from 'lucide-react';
import { Badge } from '@neup/components/ui/badge';
import { Button } from '@neup/components/ui/button';
import { Input } from '@neup/components/ui/input';
import { InputUnderlined } from '@/@neup/components/ui/input_underlined';
import { CurrencyUnderlined } from '@/@neup/components/ui/currency_underlined';
import { QuantityUnitUnderlined } from '@/@neup/components/ui/quantity_unit_underlined';
import { Label } from '@neup/components/ui/label';
import { Textarea } from '@neup/components/ui/textarea';
import { Combobox } from '@/components/ui/combobox';
import { createDocumentInvoice, createDocumentProforma, createDocumentQuotation, useParties } from '@/core/hooks/api';
import { useToast } from '@neup/core/hooks/useToast';

type QuotationLine = { id: string; product: string; quantity: string; unit: string; rate: string; discount: string; tax: string };

const currencies = ['NPR', 'USD', 'INR', 'EUR', 'GBP'];
const creditTerms = ['Due on receipt', 'Net 7', 'Net 15', 'Net 30', 'Net 45', 'Net 60'];

// Format a local calendar date for native date inputs.
function toLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Create a blank quotation line for the editable item table.
function createQuotationLine(): QuotationLine {
  return { id: crypto.randomUUID(), product: '', quantity: '1', unit: 'pcs', rate: '', discount: '0', tax: '13' };
}

// Calculate one line's net amount, tax, and total from its editable fields.
function calculateQuotationLine(line: QuotationLine) {
  const quantity = Math.max(Number(line.quantity) || 0, 0);
  const rate = Math.max(Number(line.rate) || 0, 0);
  const discountPercent = Math.min(Math.max(Number(line.discount) || 0, 0), 100);
  const taxPercent = Math.max(Number(line.tax) || 0, 0);
  const subtotal = quantity * rate;
  const discount = subtotal * discountPercent / 100;
  const taxable = subtotal - discount;
  const tax = taxable * taxPercent / 100;
  return { subtotal, discount, taxable, tax, total: taxable + tax };
}

// Render and save a quotation or invoice using the shared sales-document layout.
export function SalesDocumentForm({ type }: { type: 'quotation' | 'invoice' | 'proforma-invoice' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { data: parties } = useParties();
  const projectId = searchParams.get('project')?.trim();
  const isQuotation = type === 'quotation';
  const documentLabel = isQuotation ? 'Quotation' : type === 'invoice' ? 'Invoice' : 'Proforma Invoice';
  const dateLabel = isQuotation ? 'Expiry Date' : 'Due Date';
  const [partyId, setPartyId] = useState('');
  const [date, setDate] = useState(() => toLocalDate(new Date()));
  const [expiryDate, setExpiryDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + (isQuotation ? 6 : 30));
    return toLocalDate(date);
  });
  const [terms, setTerms] = useState('');
  const [showTerms, setShowTerms] = useState(false);
  const [tags, setTags] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [exchangeRate, setExchangeRate] = useState('1');
  const [creditTerm, setCreditTerm] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<QuotationLine[]>([createQuotationLine()]);
  const [isSaving, setIsSaving] = useState(false);
  const totals = useMemo(() => lines.reduce((all, line) => {
    const lineTotals = calculateQuotationLine(line);
    return {
      subtotal: all.subtotal + lineTotals.subtotal,
      discount: all.discount + lineTotals.discount,
      taxable: all.taxable + lineTotals.taxable,
      tax: all.tax + lineTotals.tax,
      total: all.total + lineTotals.total,
    };
  }, { subtotal: 0, discount: 0, taxable: 0, tax: 0, total: 0 }), [lines]);
  const selectedParty = parties?.find((party) => party.id === partyId);
  const backHref = `/documents/sales?type=${type}${projectId ? `&project=${encodeURIComponent(projectId)}` : ''}`;

  const updateLine = (lineId: string, field: keyof Omit<QuotationLine, 'id'>, value: string) => {
    setLines((current) => current.map((line) => line.id === lineId ? { ...line, [field]: value } : line));
  };

  const stepLineValue = (lineId: string, field: 'discount' | 'tax', direction: 1 | -1, max = Number.POSITIVE_INFINITY) => {
    const line = lines.find((item) => item.id === lineId);
    if (!line) return;
    const current = Number(line[field]) || 0;
    updateLine(lineId, field, String(Math.min(max, Math.max(0, current + direction))));
  };

  const formatMoney = (value: number, currencyCode = currency) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency', currency: currencyCode, minimumFractionDigits: 2,
      }).format(value);
    } catch {
      return currencyCode ? `${currencyCode} ${value.toFixed(2)}` : value.toFixed(2);
    }
  };

  const saveSalesDocument = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedParty) {
      toast({ name: 'app', state: 'error', title: 'Customer required', description: `Choose a customer for this ${documentLabel.toLowerCase()}.` });
      return;
    }
    if (!currencies.includes(currency)) {
      toast({ name: 'app', state: 'error', title: 'Unsupported currency', description: 'Choose NPR, USD, INR, EUR, or GBP.' });
      return;
    }
    const completedLines = lines.filter((line) => line.product.trim() && Number(line.quantity) > 0);
    if (!completedLines.length) {
      toast({ name: 'app', state: 'error', title: 'Add a product or service', description: 'Add at least one named item with a quantity.' });
      return;
    }

    setIsSaving(true);
    try {
      const quotationItems = completedLines.map((line, index) => {
        const calculated = calculateQuotationLine(line);
        return {
          name: line.product.trim(),
          description: `${line.quantity} ${line.unit || 'units'}`,
          quantity: Number(line.quantity),
          unit: line.unit || 'pcs',
          rate: Number(line.rate) || 0,
          discountType: 'percentage',
          discountValue: Number(line.discount) || 0,
          discountAmount: calculated.discount,
          taxRate: Number(line.tax) || 0,
          taxAmount: calculated.tax,
          amount: calculated.total,
          sortIndex: index,
        };
      });
      const documentData = {
        customerId: selectedParty.id,
        subject: `${documentLabel} for ${selectedParty.name}`,
        status: 'draft',
        date,
        currency,
        exchangeRate: Number(exchangeRate) || 1,
        subtotal: totals.subtotal,
        discountType: 'line_items',
        discountValue: totals.discount,
        discountAmount: totals.discount,
        taxTotal: totals.tax,
        hasAdjustments: false,
        total: totals.total,
        details: {
          creditTerm,
          notes: notes.trim(),
          terms: terms.trim(),
          reportingTags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
          taxableTotal: totals.taxable,
        },
        items: quotationItems,
      };
      const saved = isQuotation
        ? await createDocumentQuotation({ ...documentData, expires: expiryDate })
        : type === 'invoice'
          ? await createDocumentInvoice({ ...documentData, dueDate: expiryDate })
          : await createDocumentProforma({ ...documentData, dueDate: expiryDate });
      toast({ name: 'app', title: `${documentLabel} saved`, description: `${documentLabel} for ${selectedParty.name} has been saved.` });
      router.push(`/documents/${saved.id}?type=${type}${projectId ? `&project=${encodeURIComponent(projectId)}` : ''}`);
    } catch (error) {
      console.error(`Error saving ${documentLabel.toLowerCase()}:`, error);
      toast({ name: 'app', state: 'error', title: `Could not save ${documentLabel.toLowerCase()}`, description: 'Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={saveSalesDocument} className="space-y-7">
      <div className="space-y-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">New {documentLabel}</h1>
          <p className="text-muted-foreground">Create a new {documentLabel.toLowerCase()} for a customer.</p>
        </div>
      </div>

      <div className="space-y-7">
        <div className="space-y-2">
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-2">
            <Label>Customer Name <span className="text-destructive">*</span></Label>
            <Combobox
              options={(parties ?? []).map((party) => ({ value: party.id, label: `${party.name} (${party.type})` }))}
              value={partyId}
              onChange={setPartyId}
              placeholder="Choose a customer"
              searchPlaceholder="Search customers…"
              notFoundMessage="No customers found. Add one in Party."
            />
          </div>
        </div>
        {selectedParty ? (
          <div className="rounded-md border bg-muted/50 p-3 text-sm lg:w-2/3">
            <p className="font-medium">{selectedParty.name}</p>
            <p className="text-muted-foreground">{selectedParty.type}</p>
          </div>
        ) : null}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Status</span>
          <Badge variant="outline">Draft</Badge>
        </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2"><Label htmlFor="quotation-date">Date *</Label><Input id="quotation-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></div>
        </div>

        <div className="overflow-x-auto rounded-md border">
          <table className="w-full min-w-[940px] text-sm">
            <thead className="bg-muted text-left"><tr>{['S.N.', 'Product / service', 'Qty / Unit', 'Rate', 'Discount %', 'Tax %', 'Amount', ''].map((heading, index) => <th key={heading} className={`px-3 py-3 font-medium ${index >= 2 && index <= 6 ? 'text-right' : ''}`}>{heading}</th>)}</tr></thead>
            <tbody>
              {lines.map((line, index) => (
                <tr key={line.id} className="border-t border-border/50 odd:bg-muted/20 even:bg-background">
                  <td className="px-3 py-3 text-muted-foreground">{index + 1}</td>
                  <td className="min-w-52 px-3 py-2"><InputUnderlined aria-label="Product or service" placeholder="Product or service" value={line.product} onChange={(event) => updateLine(line.id, 'product', event.target.value)} /></td>
                  <td className="w-48 px-2 py-2"><QuantityUnitUnderlined quantity={line.quantity} unit={line.unit} onQuantityChange={(value) => updateLine(line.id, 'quantity', value)} onUnitChange={(value) => updateLine(line.id, 'unit', value)} /></td>
                  <td className="w-36 px-2 py-2"><CurrencyUnderlined amount={line.rate} currency={currency} currencies={currencies.map((code) => ({ value: code, label: code }))} onCurrencyChange={setCurrency} onAmountChange={(value) => updateLine(line.id, 'rate', value)} currencyLabel="Rate currency" amountLabel="Rate" /></td>
                  <td className="w-28 px-2 py-2"><div className="flex items-center gap-2 border-b border-dashed border-muted-foreground/50"><InputUnderlined aria-label="Discount percentage" type="number" min="0" max="100" step="any" className="underlined-stepper flex-1 border-0 px-0 text-right focus-visible:border-0 focus-visible:ring-0" value={line.discount} onChange={(event) => updateLine(line.id, 'discount', event.target.value)} onKeyDown={(event) => {
                    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
                    event.preventDefault();
                    stepLineValue(line.id, 'discount', event.key === 'ArrowUp' ? 1 : -1, 100);
                  }} /><span className="shrink-0 text-sm text-muted-foreground">%</span></div></td>
                  <td className="w-24 px-2 py-2"><div className="flex items-center gap-2 border-b border-dashed border-muted-foreground/50"><InputUnderlined aria-label="Tax percentage" type="number" min="0" step="any" className="underlined-stepper flex-1 border-0 px-0 text-right focus-visible:border-0 focus-visible:ring-0" value={line.tax} onChange={(event) => updateLine(line.id, 'tax', event.target.value)} onKeyDown={(event) => {
                    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
                    event.preventDefault();
                    stepLineValue(line.id, 'tax', event.key === 'ArrowUp' ? 1 : -1);
                  }} /><span className="shrink-0 text-sm text-muted-foreground">%</span></div></td>
                  <td className="whitespace-nowrap px-3 py-2 text-right font-medium">{formatMoney(calculateQuotationLine(line).total)}</td>
                  <td className="px-2 py-2"><Button type="button" variant="ghost" size="icon" aria-label="Remove item" disabled={lines.length === 1} onClick={() => setLines((current) => current.filter((item) => item.id !== line.id))}><Trash2 className="h-4 w-4" /></Button></td>
                </tr>
              ))}
              <tr
                className="border-t text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                onClick={() => setLines((current) => [...current, createQuotationLine()])}
              >
                <td colSpan={8} className="cursor-pointer px-3 py-3 text-left text-sm">
                  <span className="inline-flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add product or service
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2"><Label htmlFor="document-expiry">{dateLabel} *</Label><Input id="document-expiry" type="date" value={expiryDate} min={date} onChange={(event) => setExpiryDate(event.target.value)} required /></div>
          <div className="space-y-2"><Label htmlFor="credit-terms">Credit Terms</Label><Input id="credit-terms" list="quotation-credit-terms" value={creditTerm} onChange={(event) => setCreditTerm(event.target.value)} placeholder="Select or enter terms" /><datalist id="quotation-credit-terms">{creditTerms.map((term) => <option key={term} value={term} />)}</datalist></div>
          <div className="space-y-2"><Label htmlFor="exchange-rate">Exchange Rate To NPR *</Label><Input id="exchange-rate" type="number" min="0.000001" step="any" className="underlined-stepper" value={exchangeRate} onChange={(event) => setExchangeRate(event.target.value)} onKeyDown={(event) => {
            if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
            event.preventDefault();
            const current = Number(exchangeRate) || 0;
            setExchangeRate(String(Math.max(0.000001, current + (event.key === 'ArrowUp' ? 0.01 : -0.01))));
          }} required /></div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-2"><Label htmlFor="quotation-notes">Notes</Label><Textarea id="quotation-notes" rows={5} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Notes shown on the quotation" /><p className="text-xs text-muted-foreground">This will appear on print.</p></div>
          <section className="space-y-3 rounded-md bg-muted/60 p-4" aria-label="Quotation totals">
            <div className="flex justify-between gap-4"><span>Sub Total</span><span>{formatMoney(totals.subtotal)}</span></div>
            <div className="flex justify-between gap-4"><span>Discount</span><span>-{formatMoney(totals.discount)}</span></div>
            <div className="flex justify-between gap-4"><span>Non-Taxable Total</span><span>{formatMoney(0)}</span></div>
            <div className="flex justify-between gap-4"><span>Taxable Total</span><span>{formatMoney(totals.taxable)}</span></div>
            <div className="flex justify-between gap-4"><span>Tax</span><span>{formatMoney(totals.tax)}</span></div>
            <div className="flex justify-between border-t pt-3 text-lg font-bold"><span>Grand Total</span><span>{formatMoney(totals.total)}</span></div>
            {currency !== 'NPR' ? <p className="text-right text-xs text-muted-foreground">NPR equivalent: {formatMoney(totals.total * (Number(exchangeRate) || 1), 'NPR')}</p> : null}
          </section>
        </div>

        <section className="space-y-3 border-t pt-5">
          {showTerms ? <div className="space-y-2"><Label htmlFor="quotation-terms">Terms and Conditions</Label><Textarea id="quotation-terms" rows={3} value={terms} onChange={(event) => setTerms(event.target.value)} placeholder="Enter terms and conditions" /></div> : <Button type="button" variant="link" className="px-0" onClick={() => setShowTerms(true)}>+ Add Terms and Conditions</Button>}
        </section>
        <section className="space-y-3 border-t pt-5">
          <div className="space-y-2"><Label htmlFor="quotation-tags">Reporting Tags</Label><Input id="quotation-tags" value={tags} onChange={(event) => setTags(event.target.value)} placeholder="Add tags separated by commas" /></div>
        </section>
        <div className="flex items-center justify-between border-t pt-4">
          <Button type="button" variant="outline" asChild><Link href={backHref}><ArrowLeft className="mr-2 h-4 w-4" />Back</Link></Button>
          <div className="flex items-center gap-2">
            <Button type="submit" disabled={isSaving || !selectedParty}><Save className="mr-2 h-4 w-4" />{isSaving ? 'Saving…' : `Save ${documentLabel}`}</Button>
            <Button type="button" variant="ghost" size="icon" asChild><Link href={backHref} aria-label={`Close ${documentLabel.toLowerCase()}`}><X className="h-5 w-5" /></Link></Button>
          </div>
        </div>
      </div>
    </form>
  );
}

export default function QuotationForm() {
  return <SalesDocumentForm type="quotation" />;
}
