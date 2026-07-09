/*
::neup.documentation::transaction-block-calculation-service
::function calculateTransactionSubblocks(subblocks, transactionAmount)

Calculates ordered transaction subblocks for transaction creation and settings previews.

::param external subblocks
::datatype TransactionSubblock[]
::required true

The ordered subblocks to resolve.

::param external transactionAmount
::datatype number
::required true

The base transaction amount used by amount and fallback reference calculations.

::returns
::datatype CalculatedTransactionSubblock[]

Returns each subblock with its resolved numeric amount.

::end
*/

export type TransactionBlockScope = 'account' | 'assetGroup' | 'profile';

export type TransactionSubblockCalculationMode =
  | 'transaction_amount'
  | 'custom_amount'
  | 'percent_of'
  | 'included_percent'
  | 'multiply'
  | 'taxable_amount'
  | 'final_amount';

export type TransactionSubblock = {
  id: string;
  key: string;
  label: string;
  mode: TransactionSubblockCalculationMode;
  value: string;
  referenceKey: string;
};

export type CalculatedTransactionSubblock = TransactionSubblock & {
  amount: number;
};

export type TransactionBlock = {
  id: string;
  fieldName: string;
  valueRule: string;
  subblocks: TransactionSubblock[];
  applicableFor: TransactionBlockScope;
  partyId?: string;
  partyName?: string;
  note: string;
  createdAt: string;
};

export type LegacyTransactionBlock = TransactionBlock & {
  value?: string;
  valueType?: 'flat' | 'percentage';
};

export type TransactionBlockForm = {
  fieldName: string;
  valueRule: string;
  subblocks: TransactionSubblock[];
  applicableFor: TransactionBlockScope;
  partyId: string;
  note: string;
};

export type TransactionSubblockForm = Omit<TransactionSubblock, 'id'>;

export const TRANSACTION_BLOCKS_STORAGE_KEY = 'neup.finance.settings.transaction-blocks';

export const transactionBlockScopeOptions: Array<{
  value: TransactionBlockScope;
  label: string;
  description: string;
}> = [
  { value: 'account', label: 'Account', description: 'Rules tied to a specific account context.' },
  { value: 'assetGroup', label: 'Book', description: 'Rules tied to a book context.' },
  { value: 'profile', label: 'Profile', description: 'Rules tied to a transaction profile context.' },
];

export const emptyTransactionSubblockForm: TransactionSubblockForm = {
  key: '',
  label: '',
  mode: 'custom_amount',
  value: '',
  referenceKey: 'amount',
};

export function createEmptyTransactionBlockForm(): TransactionBlockForm {
  return {
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
}

export const transactionSubblockTemplates: Array<TransactionSubblockForm & { templateLabel: string }> = [
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

export const transactionSubblockCalculationModeOptions: Array<{
  value: TransactionSubblockCalculationMode;
  label: string;
  description: string;
}> = [
  { value: 'transaction_amount', label: 'Transaction amount', description: 'Uses the transaction amount as the block value.' },
  { value: 'custom_amount', label: 'Custom amount', description: 'Stores the typed amount as this block value.' },
  { value: 'percent_of', label: 'Percent of block', description: 'Calculates a percentage of a referenced block.' },
  { value: 'included_percent', label: 'Included percent', description: 'Extracts an included percentage from a referenced gross value.' },
  { value: 'multiply', label: 'Multiply blocks', description: 'Multiplies the referenced block by another block or number.' },
  { value: 'taxable_amount', label: 'Taxable amount', description: 'Transaction amount minus discount blocks.' },
  { value: 'final_amount', label: 'Final amount', description: 'Amount plus tax/VAT blocks minus discount blocks.' },
];

export function normalizeTransactionRuleInput(value?: string | null) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

export function normalizeTransactionBlockKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function parseTransactionBlockNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatTransactionBlockNumber(value: number) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function getReferencedValue(values: Record<string, number>, referenceKey: string, fallback = 0) {
  const normalized = normalizeTransactionBlockKey(referenceKey);
  return normalized && typeof values[normalized] === 'number' ? values[normalized] : fallback;
}

function getOperandValue(values: Record<string, number>, value: string) {
  const normalized = normalizeTransactionBlockKey(value);
  if (normalized && typeof values[normalized] === 'number') {
    return values[normalized];
  }

  return parseTransactionBlockNumber(value);
}

function isDiscountBlock(block: TransactionSubblock) {
  const haystack = `${block.key} ${block.label}`.toLowerCase();
  return haystack.includes('discount');
}

function isTaxBlock(block: TransactionSubblock) {
  const haystack = `${block.key} ${block.label}`.toLowerCase();
  return haystack.includes('vat') || haystack.includes('tax');
}

export function calculateTransactionSubblocks(
  subblocks: TransactionSubblock[],
  transactionAmount: number
) {
  const values: Record<string, number> = {};
  const rows: CalculatedTransactionSubblock[] = [];

  for (const subblock of subblocks) {
    const key = normalizeTransactionBlockKey(subblock.key);
    const referenceValue = getReferencedValue(values, subblock.referenceKey, transactionAmount);
    let amount = 0;

    if (subblock.mode === 'transaction_amount') {
      amount = transactionAmount;
    } else if (subblock.mode === 'custom_amount') {
      amount = parseTransactionBlockNumber(subblock.value);
    } else if (subblock.mode === 'percent_of') {
      amount = referenceValue * (parseTransactionBlockNumber(subblock.value) / 100);
    } else if (subblock.mode === 'included_percent') {
      const percentage = parseTransactionBlockNumber(subblock.value);
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

export function getTransactionSubblockFinalAmount(
  rows: CalculatedTransactionSubblock[],
  fallbackAmount: number
) {
  return (
    rows.find((row) => normalizeTransactionBlockKey(row.key) === 'final_amount')?.amount ??
    fallbackAmount
  );
}

export function previewTransactionRule(rule?: string | null) {
  const compact = normalizeTransactionRuleInput(rule);
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

export function describeTransactionSubblock(subblock: TransactionSubblock) {
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

export function migrateTransactionSubblocks(block: LegacyTransactionBlock): TransactionSubblock[] {
  if (Array.isArray(block.subblocks) && block.subblocks.length > 0) {
    return block.subblocks.map((subblock, index) => ({
      id: subblock.id || `${block.id}-subblock-${index}`,
      key: normalizeTransactionBlockKey(subblock.key || subblock.label || `block_${index + 1}`),
      label: subblock.label || subblock.key || `Block ${index + 1}`,
      mode: subblock.mode || 'custom_amount',
      value: subblock.value ?? '',
      referenceKey: subblock.referenceKey ?? '',
    }));
  }

  const valueRule = normalizeTransactionRuleInput(block.valueRule);
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
      key: normalizeTransactionBlockKey(block.fieldName || 'block_value'),
      label: block.fieldName || 'Block value',
      mode: percentMatch ? 'percent_of' : 'custom_amount',
      value: percentMatch?.[1] ?? fixedMatch?.[1] ?? normalizeTransactionRuleInput(block.value),
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

export function migrateTransactionBlock(block: LegacyTransactionBlock): TransactionBlock {
  if (typeof block.valueRule === 'string' && block.valueRule.trim()) {
    return {
      id: block.id,
      fieldName: block.fieldName ?? '',
      valueRule: normalizeTransactionRuleInput(block.valueRule),
      subblocks: migrateTransactionSubblocks(block),
      applicableFor: block.applicableFor,
      partyId: block.partyId,
      partyName: block.partyName,
      note: block.note ?? '',
      createdAt: block.createdAt ?? new Date().toISOString(),
    };
  }

  const legacyValue = normalizeTransactionRuleInput(block.value);
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
    subblocks: migrateTransactionSubblocks({ ...block, valueRule: legacyRule }),
    applicableFor: block.applicableFor,
    partyId: block.partyId,
    partyName: block.partyName,
    note: block.note ?? '',
    createdAt: block.createdAt ?? new Date().toISOString(),
  };
}
