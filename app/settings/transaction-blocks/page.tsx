'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@neup/components/ui/badge';
import { Button } from '@neup/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@neup/components/ui/card';
import { Input } from '@neup/components/ui/input';
import { Label } from '@neup/components/ui/label';
import { Separator } from '@neup/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@neup/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@neup/components/ui/table';
import { useParties, useSelectedProject } from '@/core/hooks/api';
import { useToast } from '@neup/components/ui/toast';
import type { Party } from '@/core/lib/ledger';
import { transactionBlocksStorageKey } from '@/services/transactions/blocks';

type ApplicableFor = 'account' | 'assetGroup' | 'profile';
type SubblockCalculationMode =
  | 'transaction_amount'
  | 'custom_amount'
  | 'percent_of'
  | 'included_percent'
  | 'multiply'
  | 'taxable_amount'
  | 'final_amount';

type TransactionSubblock = {
  id: string;
  key: string;
  label: string;
  mode: SubblockCalculationMode;
  value: string;
  referenceKey: string;
};

type TransactionBlock = {
  id: string;
  fieldName: string;
  valueRule: string;
  subblocks: TransactionSubblock[];
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
  subblocks: TransactionSubblock[];
  applicableFor: ApplicableFor;
  partyId: string;
  note: string;
};

type SubblockForm = Omit<TransactionSubblock, 'id'>;

const applicableForOptions: { value: ApplicableFor; label: string; description: string }[] = [
  { value: 'account', label: 'Account', description: 'Rules tied to a specific account context.' },
  { value: 'assetGroup', label: 'Book', description: 'Rules tied to a book context.' },
  { value: 'profile', label: 'Profile', description: 'Rules tied to a transaction profile context.' },
];

const seedBlocks: TransactionBlock[] = [
  {
    id: 'seed-1',
    fieldName: 'vat',
    valueRule: '=13%',
    subblocks: [
      {
        id: 'seed-1-amount',
        key: 'amount',
        label: 'Transaction amount',
        mode: 'transaction_amount',
        value: '',
        referenceKey: '',
      },
      {
        id: 'seed-1-vat',
        key: 'vat',
        label: 'VAT',
        mode: 'percent_of',
        value: '13',
        referenceKey: 'amount',
      },
      {
        id: 'seed-1-final',
        key: 'final_amount',
        label: 'Final amount',
        mode: 'final_amount',
        value: '',
        referenceKey: '',
      },
    ],
    applicableFor: 'profile',
    partyName: 'VAT Office',
    note: 'Example tax rule connected to a payable party.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'seed-2',
    fieldName: 'service_fee',
    valueRule: '=150',
    subblocks: [
      {
        id: 'seed-2-amount',
        key: 'amount',
        label: 'Transaction amount',
        mode: 'transaction_amount',
        value: '',
        referenceKey: '',
      },
      {
        id: 'seed-2-fee',
        key: 'service_fee',
        label: 'Service fee',
        mode: 'custom_amount',
        value: '150',
        referenceKey: '',
      },
      {
        id: 'seed-2-final',
        key: 'final_amount',
        label: 'Final amount',
        mode: 'final_amount',
        value: '',
        referenceKey: '',
      },
    ],
    applicableFor: 'account',
    note: 'Fixed service charge for account-level entries.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'seed-3',
    fieldName: 'large_payment_fee',
    valueRule: 'if(amount>50000&amount<100000)=10%',
    subblocks: [
      {
        id: 'seed-3-amount',
        key: 'amount',
        label: 'Transaction amount',
        mode: 'transaction_amount',
        value: '',
        referenceKey: '',
      },
      {
        id: 'seed-3-fee',
        key: 'large_payment_fee',
        label: 'Large payment fee',
        mode: 'percent_of',
        value: '10',
        referenceKey: 'amount',
      },
      {
        id: 'seed-3-final',
        key: 'final_amount',
        label: 'Final amount',
        mode: 'final_amount',
        value: '',
        referenceKey: '',
      },
    ],
    applicableFor: 'assetGroup',
    note: 'Higher percentage for larger value buckets.',
    createdAt: new Date().toISOString(),
  },
];

const emptyForm: TransactionBlockForm = {
  fieldName: '',
  valueRule: '',
  subblocks: [
    {
      id: 'default-amount',
      key: 'amount',
      label: 'Transaction amount',
      mode: 'transaction_amount',
      value: '',
      referenceKey: '',
    },
  ],
  applicableFor: 'account',
  partyId: '',
  note: '',
};

const emptySubblockForm: SubblockForm = {
  key: '',
  label: '',
  mode: 'custom_amount',
  value: '',
  referenceKey: 'amount',
};

const ruleExamples = [
  { label: 'Fixed amount', value: '=100' },
  { label: 'Percentage', value: '=5%' },
  { label: 'Condition 1', value: 'if(amount<50000)=1%' },
  { label: 'Condition 2', value: 'if(amount>50000&amount<100000)=10%' },
];

const subblockTemplates: Array<SubblockForm & { templateLabel: string }> = [
  {
    templateLabel: 'Amount',
    key: 'amount',
    label: 'Transaction amount',
    mode: 'transaction_amount',
    value: '',
    referenceKey: '',
  },
  {
    templateLabel: 'Quantity',
    key: 'quantity',
    label: 'Quantity',
    mode: 'custom_amount',
    value: '1',
    referenceKey: '',
  },
  {
    templateLabel: 'Rate',
    key: 'rate',
    label: 'Rate',
    mode: 'custom_amount',
    value: '0',
    referenceKey: '',
  },
  {
    templateLabel: 'Line amount',
    key: 'line_amount',
    label: 'Line amount',
    mode: 'multiply',
    value: 'quantity',
    referenceKey: 'rate',
  },
  {
    templateLabel: 'Individual discount',
    key: 'discount_individual',
    label: 'Discount individual',
    mode: 'custom_amount',
    value: '0',
    referenceKey: '',
  },
  {
    templateLabel: 'Overall discount',
    key: 'discount_overall',
    label: 'Discount overall',
    mode: 'percent_of',
    value: '0',
    referenceKey: 'amount',
  },
  {
    templateLabel: 'Taxable amount',
    key: 'taxable_amount',
    label: 'Taxable amount',
    mode: 'taxable_amount',
    value: '',
    referenceKey: '',
  },
  {
    templateLabel: 'VAT 13%',
    key: 'vat',
    label: 'VAT',
    mode: 'percent_of',
    value: '13',
    referenceKey: 'taxable_amount',
  },
  {
    templateLabel: 'VAT included',
    key: 'vat_included',
    label: 'VAT included in price',
    mode: 'included_percent',
    value: '13',
    referenceKey: 'amount',
  },
  {
    templateLabel: 'Tax',
    key: 'tax',
    label: 'Tax',
    mode: 'percent_of',
    value: '0',
    referenceKey: 'taxable_amount',
  },
  {
    templateLabel: 'Final amount',
    key: 'final_amount',
    label: 'Final amount',
    mode: 'final_amount',
    value: '',
    referenceKey: '',
  },
];

const calculationModeOptions: Array<{ value: SubblockCalculationMode; label: string; description: string }> = [
  { value: 'transaction_amount', label: 'Transaction amount', description: 'Uses the transaction amount as the block value.' },
  { value: 'custom_amount', label: 'Custom amount', description: 'Stores the typed amount as this block value.' },
  { value: 'percent_of', label: 'Percent of block', description: 'Calculates a percentage of a referenced block.' },
  { value: 'included_percent', label: 'Included percent', description: 'Extracts an included percentage from a referenced gross value.' },
  { value: 'multiply', label: 'Multiply blocks', description: 'Multiplies the referenced block by another block or number.' },
  { value: 'taxable_amount', label: 'Taxable amount', description: 'Transaction amount minus discount blocks.' },
  { value: 'final_amount', label: 'Final amount', description: 'Amount plus tax/VAT blocks minus discount blocks.' },
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

function normalizeBlockKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function parseNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function getReferencedValue(values: Record<string, number>, referenceKey: string, fallback = 0) {
  const normalized = normalizeBlockKey(referenceKey);
  return normalized && typeof values[normalized] === 'number' ? values[normalized] : fallback;
}

function getOperandValue(values: Record<string, number>, value: string) {
  const normalized = normalizeBlockKey(value);
  if (normalized && typeof values[normalized] === 'number') {
    return values[normalized];
  }

  return parseNumber(value);
}

function isDiscountBlock(block: TransactionSubblock) {
  const haystack = `${block.key} ${block.label}`.toLowerCase();
  return haystack.includes('discount');
}

function isTaxBlock(block: TransactionSubblock) {
  const haystack = `${block.key} ${block.label}`.toLowerCase();
  return haystack.includes('vat') || haystack.includes('tax');
}

function calculateSubblocks(subblocks: TransactionSubblock[], transactionAmount: number) {
  const values: Record<string, number> = {};
  const rows: Array<TransactionSubblock & { amount: number }> = [];

  for (const subblock of subblocks) {
    const key = normalizeBlockKey(subblock.key);
    const referenceValue = getReferencedValue(values, subblock.referenceKey, transactionAmount);
    let amount = 0;

    if (subblock.mode === 'transaction_amount') {
      amount = transactionAmount;
    } else if (subblock.mode === 'custom_amount') {
      amount = parseNumber(subblock.value);
    } else if (subblock.mode === 'percent_of') {
      amount = referenceValue * (parseNumber(subblock.value) / 100);
    } else if (subblock.mode === 'included_percent') {
      const percentage = parseNumber(subblock.value);
      amount = percentage > 0 ? referenceValue - referenceValue / (1 + percentage / 100) : 0;
    } else if (subblock.mode === 'multiply') {
      amount = referenceValue * getOperandValue(values, subblock.value);
    } else if (subblock.mode === 'taxable_amount') {
      const discounts = rows
        .filter((row) => isDiscountBlock(row))
        .reduce((sum, row) => sum + row.amount, 0);
      const includedTaxes = rows
        .filter((row) => isTaxBlock(row) && row.mode === 'included_percent')
        .reduce((sum, row) => sum + row.amount, 0);
      amount = Math.max(transactionAmount - discounts - includedTaxes, 0);
    } else if (subblock.mode === 'final_amount') {
      const taxTotal = rows
        .filter((row) => isTaxBlock(row) && row.mode !== 'included_percent')
        .reduce((sum, row) => sum + row.amount, 0);
      const discounts = rows
        .filter((row) => isDiscountBlock(row))
        .reduce((sum, row) => sum + row.amount, 0);
      amount = Math.max(transactionAmount + taxTotal - discounts, 0);
    }

    if (key) {
      values[key] = amount;
    }
    rows.push({ ...subblock, key, amount });
  }

  return rows;
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

function describeSubblock(subblock: TransactionSubblock) {
  if (subblock.mode === 'transaction_amount') {
    return 'Uses the transaction amount.';
  }
  if (subblock.mode === 'custom_amount') {
    return `Stores ${subblock.value || '0'} as a custom amount.`;
  }
  if (subblock.mode === 'percent_of') {
    return `${subblock.value || '0'}% of ${subblock.referenceKey || 'transaction amount'}.`;
  }
  if (subblock.mode === 'included_percent') {
    return `Extracts ${subblock.value || '0'}% already included in ${subblock.referenceKey || 'transaction amount'}.`;
  }
  if (subblock.mode === 'multiply') {
    return `Multiplies ${subblock.referenceKey || 'transaction amount'} by ${subblock.value || '0'}.`;
  }
  if (subblock.mode === 'taxable_amount') {
    return 'Transaction amount minus discounts and included tax/VAT blocks.';
  }
  return 'Transaction amount plus tax/VAT blocks minus discount blocks.';
}

function migrateSubblocks(block: LegacyTransactionBlock): TransactionSubblock[] {
  if (Array.isArray(block.subblocks) && block.subblocks.length > 0) {
    return block.subblocks.map((subblock, index) => ({
      id: subblock.id || `${block.id}-subblock-${index}`,
      key: normalizeBlockKey(subblock.key || subblock.label || `block_${index + 1}`),
      label: subblock.label || subblock.key || `Block ${index + 1}`,
      mode: subblock.mode || 'custom_amount',
      value: subblock.value ?? '',
      referenceKey: subblock.referenceKey ?? '',
    }));
  }

  const valueRule = normalizeRuleInput(block.valueRule);
  const fixedMatch = valueRule.match(/^=\s*([0-9]+(?:\.[0-9]+)?)$/);
  const percentMatch = valueRule.match(/^=\s*([0-9]+(?:\.[0-9]+)?)\s*%$/);

  return [
    {
      id: `${block.id}-amount`,
      key: 'amount',
      label: 'Transaction amount',
      mode: 'transaction_amount',
      value: '',
      referenceKey: '',
    },
    {
      id: `${block.id}-value`,
      key: normalizeBlockKey(block.fieldName || 'block_value'),
      label: block.fieldName || 'Block value',
      mode: percentMatch ? 'percent_of' : 'custom_amount',
      value: percentMatch?.[1] ?? fixedMatch?.[1] ?? normalizeRuleInput(block.value),
      referenceKey: percentMatch ? 'amount' : '',
    },
    {
      id: `${block.id}-final`,
      key: 'final_amount',
      label: 'Final amount',
      mode: 'final_amount',
      value: '',
      referenceKey: '',
    },
  ];
}

function migrateBlock(block: LegacyTransactionBlock): TransactionBlock {
  if (typeof block.valueRule === 'string' && block.valueRule.trim()) {
    return {
      id: block.id,
      fieldName: block.fieldName ?? '',
      valueRule: normalizeRuleInput(block.valueRule),
      subblocks: migrateSubblocks(block),
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
    subblocks: migrateSubblocks({ ...block, valueRule: legacyRule }),
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
  const { project } = useSelectedProject();
  const [form, setForm] = useState<TransactionBlockForm>(emptyForm);
  const [subblockForm, setSubblockForm] = useState<SubblockForm>(emptySubblockForm);
  const [sampleAmount, setSampleAmount] = useState('1000');
  const [blocks, setBlocks] = useState<TransactionBlock[]>(seedBlocks);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!project) return;
    try {
      const raw = window.localStorage.getItem(transactionBlocksStorageKey(project.id));
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
  }, [project?.id]);

  useEffect(() => {
    if (!hydrated || !project) {
      return;
    }
    window.localStorage.setItem(transactionBlocksStorageKey(project.id), JSON.stringify(blocks));
  }, [blocks, hydrated, project?.id]);

  const summary = useMemo(() => {
    const accountBlocks = blocks.filter((block) => block.applicableFor === 'account').length;
    const assetGroupBlocks = blocks.filter((block) => block.applicableFor === 'assetGroup').length;
    const profileBlocks = blocks.filter((block) => block.applicableFor === 'profile').length;

    return { accountBlocks, assetGroupBlocks, profileBlocks };
  }, [blocks]);

  const selectedParty = parties?.find((party) => party.id === form.partyId) ?? null;
  const formPreviewRows = useMemo(
    () => calculateSubblocks(form.subblocks, parseNumber(sampleAmount)),
    [form.subblocks, sampleAmount]
  );
  const formPreviewFinalAmount =
    formPreviewRows.find((row) => normalizeBlockKey(row.key) === 'final_amount')?.amount ??
    formPreviewRows.at(-1)?.amount ??
    0;

  const addSubblockToForm = (nextSubblock: SubblockForm) => {
    const key = normalizeBlockKey(nextSubblock.key || nextSubblock.label);
    const label = nextSubblock.label.trim();

    if (!key || !label) {
      toast({
        name: 'app',
        title: 'Subblock name required',
        description: 'Enter a label and key for the transaction subblock.',
        state: 'error',
      });
      return;
    }

    if (form.subblocks.some((subblock) => normalizeBlockKey(subblock.key) === key)) {
      toast({
        name: 'app',
        title: 'Duplicate subblock key',
        description: `${key} already exists in this transaction block.`,
        state: 'error',
      });
      return;
    }

    const requiresValue = ['custom_amount', 'percent_of', 'included_percent', 'multiply'].includes(nextSubblock.mode);
    if (requiresValue && !nextSubblock.value.trim()) {
      toast({
        name: 'app',
        title: 'Value required',
        description: 'Enter an amount, percentage, or referenced key for this calculation.',
        state: 'error',
      });
      return;
    }

    setForm((current) => ({
      ...current,
      subblocks: [
        ...current.subblocks,
        {
          id: crypto.randomUUID(),
          key,
          label,
          mode: nextSubblock.mode,
          value: nextSubblock.value.trim(),
          referenceKey: normalizeBlockKey(nextSubblock.referenceKey),
        },
      ],
    }));
    setSubblockForm(emptySubblockForm);
  };

  const addTemplateSubblock = (template: SubblockForm) => {
    addSubblockToForm(template);
  };

  const removeSubblockFromForm = (id: string) => {
    setForm((current) => ({
      ...current,
      subblocks: current.subblocks.filter((subblock) => subblock.id !== id),
    }));
  };

  const handleSubmit = () => {
    if (!form.fieldName.trim()) {
      toast({
        name: 'app',
        title: 'Field name required',
        description: 'Enter the field name you want to block or adjust.',
        state: 'error',
      });
      return;
    }

    if (!form.valueRule.trim() && form.subblocks.length === 0) {
      toast({
        name: 'app',
        title: 'Rule required',
        description: 'Enter a value rule like =100, =5%, if(amount<50000)=1%, or add transaction subblocks.',
        state: 'error',
      });
      return;
    }

    if (form.subblocks.length === 0) {
      toast({
        name: 'app',
        title: 'Subblock required',
        description: 'Add at least one transaction subblock.',
        state: 'error',
      });
      return;
    }

    const nextBlock: TransactionBlock = {
      id: crypto.randomUUID(),
      fieldName: form.fieldName.trim(),
      valueRule: normalizeRuleInput(form.valueRule),
      subblocks: form.subblocks,
      applicableFor: form.applicableFor,
      partyId: form.partyId || undefined,
      partyName: parties?.find((party) => party.id === form.partyId)?.name,
      note: form.note.trim(),
      createdAt: new Date().toISOString(),
    };

    setBlocks((current) => [nextBlock, ...current]);
    setForm({
      ...emptyForm,
      subblocks: emptyForm.subblocks.map((subblock) => ({ ...subblock, id: crypto.randomUUID() })),
    });
    setSubblockForm(emptySubblockForm);
    toast({
      name: 'app',
      title: 'Transaction block saved',
      description: `${nextBlock.fieldName} was added with ${nextBlock.subblocks.length} subblocks.`,
    });
  };

  const handleDelete = (id: string) => {
    setBlocks((current) => current.filter((block) => block.id !== id));
    toast({
      name: 'app',
      title: 'Transaction block removed',
      description: 'The selected block has been deleted.',
    });
  };

  return (

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Transaction Blocks</CardTitle>
            <CardDescription>
              Define block rules for accounts, books, or profiles using a single readable
              rule string. You can also attach the rule to a party for future payable tracking.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="text-sm text-muted-foreground">Account rules</div>
              <div className="mt-2 text-3xl font-semibold">{summary.accountBlocks}</div>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="text-sm text-muted-foreground">Book rules</div>
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

            <div className="space-y-4 rounded-lg border p-4 md:col-span-2">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-semibold">Transaction subblocks</h3>
                  <p className="text-sm text-muted-foreground">
                    Add ordered values such as amount, quantity, rate, discounts, taxable amount,
                    VAT, tax, and final amount. Calculated blocks are saved as resolved values when
                    applied to a transaction.
                  </p>
                </div>
                <div className="w-full max-w-[180px] space-y-2">
                  <Label htmlFor="sampleAmount">Sample amount</Label>
                  <Input
                    id="sampleAmount"
                    type="number"
                    value={sampleAmount}
                    onChange={(event) => setSampleAmount(event.target.value)}
                    placeholder="1000"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {subblockTemplates.map((template) => (
                  <Button
                    key={template.templateLabel}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 rounded-full px-3 text-xs"
                    onClick={() => addTemplateSubblock(template)}
                  >
                    + {template.templateLabel}
                  </Button>
                ))}
              </div>

              <div className="grid gap-4 rounded-lg bg-muted/30 p-4 md:grid-cols-5">
                <div className="space-y-2">
                  <Label htmlFor="subblockLabel">Label</Label>
                  <Input
                    id="subblockLabel"
                    value={subblockForm.label}
                    onChange={(event) => {
                      const label = event.target.value;
                      setSubblockForm((current) => ({
                        ...current,
                        label,
                        key: current.key || normalizeBlockKey(label),
                      }));
                    }}
                    placeholder="VAT"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subblockKey">Key</Label>
                  <Input
                    id="subblockKey"
                    value={subblockForm.key}
                    onChange={(event) =>
                      setSubblockForm((current) => ({
                        ...current,
                        key: normalizeBlockKey(event.target.value),
                      }))
                    }
                    placeholder="vat"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subblockMode">Calculation</Label>
                  <Select
                    value={subblockForm.mode}
                    onValueChange={(value) =>
                      setSubblockForm((current) => ({
                        ...current,
                        mode: value as SubblockCalculationMode,
                      }))
                    }
                  >
                    <SelectTrigger id="subblockMode">
                      <SelectValue placeholder="Mode" />
                    </SelectTrigger>
                    <SelectContent>
                      {calculationModeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subblockReference">Reference</Label>
                  <Select
                    value={subblockForm.referenceKey || 'none'}
                    onValueChange={(value) =>
                      setSubblockForm((current) => ({
                        ...current,
                        referenceKey: value === 'none' ? '' : value,
                      }))
                    }
                  >
                    <SelectTrigger id="subblockReference">
                      <SelectValue placeholder="Reference" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No reference</SelectItem>
                      {form.subblocks.map((subblock) => (
                        <SelectItem key={subblock.id} value={normalizeBlockKey(subblock.key)}>
                          {subblock.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subblockValue">Value</Label>
                  <Input
                    id="subblockValue"
                    value={subblockForm.value}
                    onChange={(event) =>
                      setSubblockForm((current) => ({ ...current, value: event.target.value }))
                    }
                    placeholder="13, 100, quantity"
                  />
                </div>
                <div className="flex items-end md:col-span-5">
                  <Button type="button" onClick={() => addSubblockToForm(subblockForm)}>
                    Add subblock
                  </Button>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subblock</TableHead>
                      <TableHead>Calculation</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Preview value</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formPreviewRows.map((subblock) => (
                      <TableRow key={subblock.id}>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">{subblock.label}</span>
                            <span className="font-mono text-xs text-muted-foreground">{subblock.key}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span>{calculationModeOptions.find((option) => option.value === subblock.mode)?.label}</span>
                            <span className="text-xs text-muted-foreground">{describeSubblock(subblock)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {subblock.referenceKey || 'N/A'}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatNumber(subblock.amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSubblockFromForm(subblock.id)}
                          >
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
            <p className="text-sm text-muted-foreground">
              Preview:{' '}
              {form.valueRule.trim()
                ? previewRule(form.valueRule)
                : `Subblocks resolve to ${formatNumber(formPreviewFinalAmount)} with the sample amount.`}
            </p>
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
                    <TableHead>Subblocks</TableHead>
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
                      <TableCell>
                        <div className="flex max-w-[320px] flex-col gap-2">
                          {calculateSubblocks(block.subblocks, parseNumber(sampleAmount)).map((subblock) => (
                            <div key={subblock.id} className="rounded-md bg-muted/40 px-2 py-1 text-xs">
                              <div className="flex items-center justify-between gap-3">
                                <span className="font-medium">{subblock.label}</span>
                                <span className="font-semibold">{formatNumber(subblock.amount)}</span>
                              </div>
                              <div className="mt-1 text-muted-foreground">{describeSubblock(subblock)}</div>
                            </div>
                          ))}
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

  );
}
