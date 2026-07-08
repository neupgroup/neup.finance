'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useParties } from '@/hooks/api';
import { useToast } from '@/hooks/use-toast';
import type { Party } from '@/lib/mock-data';

type ApplicableFor = 'account' | 'assetGroup' | 'profile';

type TransactionBlock = {
  id: string;
  fieldName: string;
  valueRule: string;
  applicableFor: ApplicableFor;
  partyId?: string;
  partyName?: string;
  note: string;
  createdAt: string;
};

type LegacyTransactionBlock = TransactionBlock & {
  value?: string;
  valueType?: 'flat' | 'percentage';
};

type TransactionBlockForm = {
  fieldName: string;
  valueRule: string;
  applicableFor: ApplicableFor;
  partyId: string;
  note: string;
};

const STORAGE_KEY = 'neup.finance.settings.transaction-blocks';

const applicableForOptions: { value: ApplicableFor; label: string; description: string }[] = [
  { value: 'account', label: 'Account', description: 'Rules tied to a specific account context.' },
  { value: 'assetGroup', label: 'Asset Group', description: 'Rules tied to an asset group context.' },
  { value: 'profile', label: 'Profile', description: 'Rules tied to a transaction profile context.' },
];

const seedBlocks: TransactionBlock[] = [
  {
    id: 'seed-1',
    fieldName: 'vat',
    valueRule: '=13%',
    applicableFor: 'profile',
    partyName: 'VAT Office',
    note: 'Example tax rule connected to a payable party.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'seed-2',
    fieldName: 'service_fee',
    valueRule: '=150',
    applicableFor: 'account',
    note: 'Fixed service charge for account-level entries.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'seed-3',
    fieldName: 'large_payment_fee',
    valueRule: 'if(amount>50000&amount<100000)=10%',
    applicableFor: 'assetGroup',
    note: 'Higher percentage for larger value buckets.',
    createdAt: new Date().toISOString(),
  },
];

const emptyForm: TransactionBlockForm = {
  fieldName: '',
  valueRule: '',
  applicableFor: 'account',
  partyId: '',
  note: '',
};

const ruleExamples = [
  { label: 'Fixed amount', value: '=100' },
  { label: 'Percentage', value: '=5%' },
  { label: 'Condition 1', value: 'if(amount<50000)=1%' },
  { label: 'Condition 2', value: 'if(amount>50000&amount<100000)=10%' },
];

function formatCreatedAt(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function toPartyLabel(party?: Party | null) {
  if (!party) {
    return '';
  }

  return `${party.name} (${party.type})`;
}

function normalizeRuleInput(value?: string | null) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

function previewRule(rule?: string | null) {
  const compact = normalizeRuleInput(rule);
  if (!compact) {
    return 'Enter a rule to see a preview.';
  }

  const exactMatch = compact.match(/^=\s*([0-9]+(?:\.[0-9]+)?)\s*(%)?$/);
  if (exactMatch) {
    return exactMatch[2]
      ? `Apply ${exactMatch[1]} percent`
      : `Apply a flat value of ${exactMatch[1]}`;
  }

  const conditionalMatch = compact.match(/^if\((.+)\)\s*=\s*([0-9]+(?:\.[0-9]+)?)\s*(%)?$/i);
  if (conditionalMatch) {
    const condition = conditionalMatch[1]
      .replace(/&/g, ' and ')
      .replace(/\|/g, ' or ')
      .replace(/([<>]=?|=)/g, ' $1 ')
      .replace(/\s+/g, ' ')
      .trim();

    return conditionalMatch[3]
      ? `If ${condition}, apply ${conditionalMatch[2]} percent`
      : `If ${condition}, apply a flat value of ${conditionalMatch[2]}`;
  }

  return 'Stored as written. Keep it short and explicit.';
}

function migrateBlock(block: LegacyTransactionBlock): TransactionBlock {
  if (typeof block.valueRule === 'string' && block.valueRule.trim()) {
    return {
      id: block.id,
      fieldName: block.fieldName ?? '',
      valueRule: normalizeRuleInput(block.valueRule),
      applicableFor: block.applicableFor,
      partyId: block.partyId,
      partyName: block.partyName,
      note: block.note ?? '',
      createdAt: block.createdAt ?? new Date().toISOString(),
    };
  }

  const legacyValue = normalizeRuleInput(block.value);
  const legacyRule =
    block.valueType === 'percentage' && legacyValue
      ? `=${legacyValue.replace(/%$/, '')}%`
      : legacyValue
        ? `=${legacyValue}`
        : '';

  return {
    id: block.id,
    fieldName: block.fieldName ?? '',
    valueRule: legacyRule,
    applicableFor: block.applicableFor,
    partyId: block.partyId,
    partyName: block.partyName,
    note: block.note ?? '',
    createdAt: block.createdAt ?? new Date().toISOString(),
  };
}

export default function TransactionBlocksSettingsPage() {
  const { toast } = useToast();
  const { data: parties } = useParties();
  const [form, setForm] = useState<TransactionBlockForm>(emptyForm);
  const [blocks, setBlocks] = useState<TransactionBlock[]>(seedBlocks);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as LegacyTransactionBlock[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setBlocks(parsed.map(migrateBlock).filter((block) => Boolean(block.fieldName)));
        }
      }
    } catch {
      // Keep seeded rules if local storage is unavailable or malformed.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(blocks));
  }, [blocks, hydrated]);

  const summary = useMemo(() => {
    const accountBlocks = blocks.filter((block) => block.applicableFor === 'account').length;
    const assetGroupBlocks = blocks.filter((block) => block.applicableFor === 'assetGroup').length;
    const profileBlocks = blocks.filter((block) => block.applicableFor === 'profile').length;

    return { accountBlocks, assetGroupBlocks, profileBlocks };
  }, [blocks]);

  const selectedParty = parties?.find((party) => party.id === form.partyId) ?? null;

  const handleSubmit = () => {
    if (!form.fieldName.trim()) {
      toast({
        title: 'Field name required',
        description: 'Enter the field name you want to block or adjust.',
        variant: 'destructive',
      });
      return;
    }

    if (!form.valueRule.trim()) {
      toast({
        title: 'Rule required',
        description: 'Enter a value rule like =100, =5%, or if(amount<50000)=1%.',
        variant: 'destructive',
      });
      return;
    }

    const nextBlock: TransactionBlock = {
      id: crypto.randomUUID(),
      fieldName: form.fieldName.trim(),
      valueRule: normalizeRuleInput(form.valueRule),
      applicableFor: form.applicableFor,
      partyId: form.partyId || undefined,
      partyName: parties?.find((party) => party.id === form.partyId)?.name,
      note: form.note.trim(),
      createdAt: new Date().toISOString(),
    };

    setBlocks((current) => [nextBlock, ...current]);
    setForm(emptyForm);
    toast({
      title: 'Transaction block saved',
      description: `${nextBlock.fieldName} was added for ${nextBlock.applicableFor}.`,
    });
  };

  const handleDelete = (id: string) => {
    setBlocks((current) => current.filter((block) => block.id !== id));
    toast({
      title: 'Transaction block removed',
      description: 'The selected block has been deleted.',
    });
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Transaction Blocks</CardTitle>
            <CardDescription>
              Define block rules for accounts, asset groups, or profiles using a single readable
              rule string. You can also attach the rule to a party for future payable tracking.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="text-sm text-muted-foreground">Account rules</div>
              <div className="mt-2 text-3xl font-semibold">{summary.accountBlocks}</div>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="text-sm text-muted-foreground">Asset group rules</div>
              <div className="mt-2 text-3xl font-semibold">{summary.assetGroupBlocks}</div>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="text-sm text-muted-foreground">Profile rules</div>
              <div className="mt-2 text-3xl font-semibold">{summary.profileBlocks}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create a block</CardTitle>
            <CardDescription>
              Use a rule format people can read quickly. Examples: <span className="font-medium">=100</span>,{' '}
              <span className="font-medium">=5%</span>,{' '}
              <span className="font-medium">if(amount&lt;50000)=1%</span>, or{' '}
              <span className="font-medium">if(amount&gt;50000&amp;amount&lt;100000)=10%</span>.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fieldName">Field name</Label>
              <Input
                id="fieldName"
                value={form.fieldName}
                onChange={(event) => setForm((current) => ({ ...current, fieldName: event.target.value }))}
                placeholder="vat, service_fee, withholding_tax"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="partyId">Linked party</Label>
              <Combobox
                options={(parties ?? []).map((party) => ({
                  value: party.id,
                  label: toPartyLabel(party),
                }))}
                value={form.partyId}
                onChange={(value) => setForm((current) => ({ ...current, partyId: value }))}
                placeholder="Select a party"
                searchPlaceholder="Search parties..."
                notFoundMessage="No parties found. Add one in Party."
              />
              <p className="text-xs text-muted-foreground">
                Link VAT, tax, or other blocks to a party so later reports can sum what is payable to
                that counterparty.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="applicableFor">Applicable for</Label>
              <Select
                value={form.applicableFor}
                onValueChange={(value) =>
                  setForm((current) => ({ ...current, applicableFor: value as ApplicableFor }))
                }
              >
                <SelectTrigger id="applicableFor">
                  <SelectValue placeholder="Select scope" />
                </SelectTrigger>
                <SelectContent>
                  {applicableForOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedParty ? (
                <p className="text-xs text-muted-foreground">
                  Selected party: {selectedParty.name}. This is useful when the rule later maps to a
                  payable VAT or similar liability.
                </p>
              ) : null}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="valueRule">Value rule</Label>
              <Input
                id="valueRule"
                value={form.valueRule}
                onChange={(event) =>
                  setForm((current) => ({ ...current, valueRule: event.target.value }))
                }
                placeholder="=100, =5%, if(amount<50000)=1%"
              />
              <p className="text-xs text-muted-foreground">
                Direct rules start with `=`. Conditions use `if(...)`. Keep the format compact and
                readable.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {ruleExamples.map((example) => (
                  <Button
                    key={example.value}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 rounded-full px-3 text-xs"
                    onClick={() =>
                      setForm((current) => ({ ...current, valueRule: example.value }))
                    }
                  >
                    {example.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="note">Note</Label>
              <Input
                id="note"
                value={form.note}
                onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
                placeholder="Optional explanation for why this block exists"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">Preview: {previewRule(form.valueRule)}</p>
            <Button onClick={handleSubmit}>Add block</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Saved blocks</CardTitle>
            <CardDescription>
              These rules are stored locally for now and can be expanded into a backend model later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Scope</TableHead>
                    <TableHead>Field</TableHead>
                    <TableHead>Rule</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blocks.map((block) => (
                    <TableRow key={block.id}>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          <Badge variant="secondary">{block.applicableFor}</Badge>
                          {block.partyName ? <Badge variant="outline">{block.partyName}</Badge> : null}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{block.fieldName}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-mono text-sm">{block.valueRule || 'N/A'}</span>
                          <span className="text-xs text-muted-foreground">
                            {previewRule(block.valueRule)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[280px] text-sm text-muted-foreground">
                        {block.note || 'No note added'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatCreatedAt(block.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(block.id)}>
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {applicableForOptions.map((option) => (
                <span key={option.value} className="inline-flex items-center gap-2">
                  <Badge variant="outline">{option.label}</Badge>
                  <span>{option.description}</span>
                </span>
              ))}
            </div>
          </CardFooter>
        </Card>
        <Separator />
      </div>
    </AppShell>
  );
}
