'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Combobox } from '@/components/ui/combobox';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/auth/provider';
import { type TransactionCategory, type TransactionStatus, type TransactionType } from '@/lib/mock-data';

const accounts = [
  { value: 'Checking Account', label: 'Checking Account' },
  { value: 'Savings Account', label: 'Savings Account' },
  { value: 'Wallet', label: 'Wallet' },
];

const categories: { value: TransactionCategory; label: TransactionCategory }[] = [
  { value: 'Sales', label: 'Sales' },
  { value: 'Purchases', label: 'Purchases' },
  { value: 'Discounts', label: 'Discounts' },
  { value: 'Payroll', label: 'Payroll' },
  { value: 'Utilities', label: 'Utilities' },
  { value: 'Vendor payments', label: 'Vendor payments' },
  { value: 'EMIs', label: 'EMIs' },
  { value: 'Bank charges', label: 'Bank charges' },
  { value: 'VAT / Tax', label: 'VAT / Tax' },
  { value: 'Transfers', label: 'Transfers' },
  { value: 'Refunds', label: 'Refunds' },
  { value: 'Other', label: 'Other' },
];

const transactionTypes: { value: TransactionType; label: string }[] = [
  { value: 'sale', label: 'Sale' },
  { value: 'purchase', label: 'Purchase' },
  { value: 'refund', label: 'Refund' },
  { value: 'expense', label: 'Expense' },
  { value: 'payroll', label: 'Payroll' },
  { value: 'income', label: 'Income' },
  { value: 'other', label: 'Other' },
];

const transactionStatuses: { value: TransactionStatus; label: string }[] = [
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'partially_paid', label: 'Partially paid' },
  { value: 'paid', label: 'Paid' },
  { value: 'canceled', label: 'Canceled' },
];

const currencies = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'JPY', label: 'JPY - Japanese Yen' },
  { value: 'INR', label: 'INR - Indian Rupee' },
  { value: 'NPR', label: 'NPR - Nepali Rupee' },
];

type ProfileFieldKey =
  | 'title'
  | 'description'
  | 'date'
  | 'transactionType'
  | 'category'
  | 'currency'
  | 'totalAmount'
  | 'status'
  | 'accountId'
  | 'recipient'
  | 'amountPaid'
  | 'dueOn'
  | 'attachmentLabel'
  | 'operations';

type OperationKind = 'vat' | 'tax' | 'service_fee' | 'discount' | 'custom';
type OperationValueType = 'percentage' | 'fixed';
type OperationAction = 'add_to_transaction' | 'transfer_to_account';

type ProfileOperation = {
  id: string;
  kind: OperationKind;
  label: string;
  valueType: OperationValueType;
  value: number | '';
  action: OperationAction;
  destinationAccount: string;
};

type PaymentProfile = {
  id: string;
  name: string;
  selectedFields: ProfileFieldKey[];
  title: string;
  description: string;
  date: string;
  transactionType: TransactionType | '';
  category: TransactionCategory | '';
  currency: string;
  totalAmount: number | '';
  status: TransactionStatus | '';
  accountId: string;
  recipient: string;
  amountPaid: number | '';
  dueOn: string;
  attachmentLabel: string;
  operations: ProfileOperation[];
  updatedAt: string;
};

type PaymentProfileForm = Omit<PaymentProfile, 'id' | 'updatedAt'>;

const profileFieldCatalog: { key: ProfileFieldKey; label: string; hint: string }[] = [
  { key: 'title', label: 'Title', hint: 'Default transaction title' },
  { key: 'description', label: 'Description', hint: 'Default memo/description' },
  { key: 'date', label: 'Date', hint: 'Default posting date' },
  { key: 'transactionType', label: 'Type', hint: 'Sale, purchase, expense, etc.' },
  { key: 'category', label: 'Category', hint: 'Reporting category' },
  { key: 'currency', label: 'Currency', hint: 'Default currency code' },
  { key: 'totalAmount', label: 'Total Amount', hint: 'Default amount value' },
  { key: 'status', label: 'Status', hint: 'Paid, unpaid, partially paid' },
  { key: 'accountId', label: 'Account', hint: 'Default payment account' },
  { key: 'recipient', label: 'Recipient', hint: 'Payee or payer name' },
  { key: 'amountPaid', label: 'Amount Paid', hint: 'Default settled amount' },
  { key: 'dueOn', label: 'Due On', hint: 'Default due date' },
  { key: 'attachmentLabel', label: 'Attachment Label', hint: 'Reference file name/text' },
  { key: 'operations', label: 'Operations (VAT/Tax/etc.)', hint: 'Apply adjustments or transfer rules' },
];

const emptyProfileForm: PaymentProfileForm = {
  name: '',
  selectedFields: [],
  title: '',
  description: '',
  date: '',
  transactionType: '',
  category: '',
  currency: '',
  totalAmount: '',
  status: '',
  accountId: '',
  recipient: '',
  amountPaid: '',
  dueOn: '',
  attachmentLabel: '',
  operations: [],
};

const operationKinds: { value: OperationKind; label: string }[] = [
  { value: 'vat', label: 'VAT' },
  { value: 'tax', label: 'Tax' },
  { value: 'service_fee', label: 'Service fee' },
  { value: 'discount', label: 'Discount' },
  { value: 'custom', label: 'Custom' },
];

const operationValueTypes: { value: OperationValueType; label: string }[] = [
  { value: 'percentage', label: 'Percentage' },
  { value: 'fixed', label: 'Fixed amount' },
];

const operationActions: { value: OperationAction; label: string }[] = [
  { value: 'add_to_transaction', label: 'Add to transaction amount' },
  { value: 'transfer_to_account', label: 'Transfer to another account' },
];

function makeDefaultOperation(kind: OperationKind = 'vat'): ProfileOperation {
  return {
    id: crypto.randomUUID(),
    kind,
    label: kind === 'vat' ? 'VAT' : kind === 'tax' ? 'Tax' : '',
    valueType: 'percentage',
    value: '',
    action: kind === 'vat' ? 'transfer_to_account' : 'add_to_transaction',
    destinationAccount: kind === 'vat' ? 'VAT Account' : '',
  };
}

function isFieldSelected(form: PaymentProfileForm, key: ProfileFieldKey) {
  return form.selectedFields.includes(key);
}

function normalizeProfile(raw: any): PaymentProfile {
  const inferredFields: ProfileFieldKey[] = [];

  profileFieldCatalog.forEach(({ key }) => {
    const value = raw?.[key];
    if (value !== undefined && value !== null && value !== '') {
      inferredFields.push(key);
    }
  });

  const selectedFields = Array.isArray(raw?.selectedFields)
    ? (raw.selectedFields.filter((field: string) => profileFieldCatalog.some((item) => item.key === field)) as ProfileFieldKey[])
    : inferredFields;

  return {
    id: typeof raw?.id === 'string' ? raw.id : crypto.randomUUID(),
    name: typeof raw?.name === 'string' ? raw.name : 'Untitled profile',
    selectedFields,
    title: typeof raw?.title === 'string' ? raw.title : '',
    description: typeof raw?.description === 'string' ? raw.description : '',
    date: typeof raw?.date === 'string' ? raw.date : '',
    transactionType: raw?.transactionType ?? '',
    category: raw?.category ?? '',
    currency: typeof raw?.currency === 'string' ? raw.currency : '',
    totalAmount: typeof raw?.totalAmount === 'number' ? raw.totalAmount : '',
    status: raw?.status ?? '',
    accountId: typeof raw?.accountId === 'string' ? raw.accountId : '',
    recipient: typeof raw?.recipient === 'string' ? raw.recipient : '',
    amountPaid: typeof raw?.amountPaid === 'number' ? raw.amountPaid : '',
    dueOn: typeof raw?.dueOn === 'string' ? raw.dueOn : '',
    attachmentLabel: typeof raw?.attachmentLabel === 'string' ? raw.attachmentLabel : '',
    operations: Array.isArray(raw?.operations)
      ? raw.operations.map((item: any) => ({
          id: typeof item?.id === 'string' ? item.id : crypto.randomUUID(),
          kind: (item?.kind as OperationKind) ?? 'custom',
          label: typeof item?.label === 'string' ? item.label : '',
          valueType: (item?.valueType as OperationValueType) ?? 'fixed',
          value: typeof item?.value === 'number' ? item.value : '',
          action: (item?.action as OperationAction) ?? 'add_to_transaction',
          destinationAccount: typeof item?.destinationAccount === 'string' ? item.destinationAccount : '',
        }))
      : [],
    updatedAt: typeof raw?.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
  };
}

export default function PaymentProfilesSettingsPage() {
  const { user } = useUser();
  const { toast } = useToast();

  const [profiles, setProfiles] = useState<PaymentProfile[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PaymentProfileForm>({ ...emptyProfileForm });

  const storageKey = useMemo(() => {
    return `payment_profiles_${user?.uid ?? 'guest'}`;
  }, [user?.uid]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        setProfiles([]);
        return;
      }

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        setProfiles([]);
        return;
      }

      setProfiles(parsed.map((item) => normalizeProfile(item)));
    } catch {
      setProfiles([]);
    }
  }, [storageKey]);

  const persistProfiles = (nextProfiles: PaymentProfile[]) => {
    setProfiles(nextProfiles);
    localStorage.setItem(storageKey, JSON.stringify(nextProfiles));
  };

  const clearForm = () => {
    setForm({ ...emptyProfileForm });
    setEditingId(null);
  };

  const toggleField = (field: ProfileFieldKey, checked: boolean) => {
    setForm((prev) => {
      if (checked) {
        if (prev.selectedFields.includes(field)) {
          return prev;
        }
        return { ...prev, selectedFields: [...prev.selectedFields, field] };
      }

      return {
        ...prev,
        selectedFields: prev.selectedFields.filter((key) => key !== field),
      };
    });
  };

  const addOperation = (kind: OperationKind = 'custom') => {
    setForm((prev) => ({
      ...prev,
      operations: [...prev.operations, makeDefaultOperation(kind)],
    }));
  };

  const updateOperation = (operationId: string, patch: Partial<ProfileOperation>) => {
    setForm((prev) => ({
      ...prev,
      operations: prev.operations.map((op) => (op.id === operationId ? { ...op, ...patch } : op)),
    }));
  };

  const removeOperation = (operationId: string) => {
    setForm((prev) => ({
      ...prev,
      operations: prev.operations.filter((op) => op.id !== operationId),
    }));
  };

  const balanceDuePreview = useMemo(() => {
    const total = typeof form.totalAmount === 'number' ? form.totalAmount : 0;
    const paid = typeof form.amountPaid === 'number' ? form.amountPaid : 0;

    if (form.status === 'paid') {
      return 0;
    }

    if (form.status === 'partially_paid') {
      return Math.max(total - paid, 0);
    }

    return total;
  }, [form.amountPaid, form.status, form.totalAmount]);

  const handleSaveProfile = () => {
    if (!form.name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Profile name required',
        description: 'Give this payment profile a name before saving.',
      });
      return;
    }

    if (form.selectedFields.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Select fields first',
        description: 'Choose at least one field to include in this profile.',
      });
      return;
    }

    if (isFieldSelected(form, 'operations')) {
      for (const operation of form.operations) {
        if (!operation.label.trim()) {
          toast({
            variant: 'destructive',
            title: 'Operation label required',
            description: 'Each operation needs a label, such as VAT 13% or Withholding tax.',
          });
          return;
        }

        if (operation.value === '' || Number(operation.value) <= 0) {
          toast({
            variant: 'destructive',
            title: 'Operation value required',
            description: 'Each operation must have a value greater than 0.',
          });
          return;
        }

        if (operation.action === 'transfer_to_account' && !operation.destinationAccount.trim()) {
          toast({
            variant: 'destructive',
            title: 'Destination account required',
            description: 'Choose where to transfer amounts for transfer operations.',
          });
          return;
        }
      }
    }

    const updatedAt = new Date().toISOString();

    const profilePayload: PaymentProfile = {
      id: editingId ?? crypto.randomUUID(),
      name: form.name.trim(),
      selectedFields: form.selectedFields,
      title: form.title.trim(),
      description: form.description.trim(),
      date: form.date,
      transactionType: form.transactionType,
      category: form.category,
      currency: form.currency,
      totalAmount: form.totalAmount,
      status: form.status,
      accountId: form.accountId,
      recipient: form.recipient.trim(),
      amountPaid: form.amountPaid,
      dueOn: form.dueOn,
      attachmentLabel: form.attachmentLabel.trim(),
      operations: form.operations,
      updatedAt,
    };

    if (editingId) {
      const nextProfiles = profiles.map((profile) => {
        if (profile.id !== editingId) return profile;
        return profilePayload;
      });
      persistProfiles(nextProfiles);
      toast({
        title: 'Profile updated',
        description: 'Your payment profile defaults were updated.',
      });
    } else {
      persistProfiles([profilePayload, ...profiles]);
      toast({
        title: 'Profile saved',
        description: 'A new payment profile is now available.',
      });
    }

    clearForm();
  };

  const handleEditProfile = (profile: PaymentProfile) => {
    setEditingId(profile.id);
    setForm({
      name: profile.name,
      selectedFields: profile.selectedFields,
      title: profile.title,
      description: profile.description,
      date: profile.date,
      transactionType: profile.transactionType,
      category: profile.category,
      currency: profile.currency,
      totalAmount: profile.totalAmount,
      status: profile.status,
      accountId: profile.accountId,
      recipient: profile.recipient,
      amountPaid: profile.amountPaid,
      dueOn: profile.dueOn,
      attachmentLabel: profile.attachmentLabel,
      operations: profile.operations,
    });
  };

  const handleDeleteProfile = (profileId: string) => {
    const nextProfiles = profiles.filter((profile) => profile.id !== profileId);
    persistProfiles(nextProfiles);

    if (editingId === profileId) {
      clearForm();
    }

    toast({
      title: 'Profile removed',
      description: 'The payment profile was deleted.',
    });
  };

  const handleApplyToForm = (profile: PaymentProfile) => {
    handleEditProfile(profile);
    toast({
      title: 'Profile loaded',
      description: `Loaded defaults from ${profile.name}.`,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payment Profiles</CardTitle>
          <CardDescription>
            Step 1: name the profile and choose what fields it should control. Step 2: provide defaults only for those selected fields.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="profile_name">Profile Name <span className="text-destructive">*</span></Label>
            <Input
              id="profile_name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Monthly Payroll, Client Invoice, Utility Bill"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Fields to include in this profile</Label>
              <Badge variant="outline">{form.selectedFields.length} selected</Badge>
            </div>
            <div className="grid gap-3 rounded-md border p-4 md:grid-cols-2">
              {profileFieldCatalog.map((field) => (
                <div key={field.key} className="flex items-start gap-3">
                  <Checkbox
                    id={`field_${field.key}`}
                    checked={isFieldSelected(form, field.key)}
                    onCheckedChange={(checked) => toggleField(field.key, checked === true)}
                  />
                  <div className="space-y-0.5">
                    <Label htmlFor={`field_${field.key}`} className="cursor-pointer">{field.label}</Label>
                    <p className="text-xs text-muted-foreground">{field.hint}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 rounded-md border p-4">
            <div>
              <p className="text-sm font-medium">Default values for selected fields</p>
              <p className="text-xs text-muted-foreground">Only selected fields are shown below.</p>
            </div>

            {form.selectedFields.length === 0 ? (
              <p className="text-sm text-muted-foreground">Select one or more fields above to configure defaults.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {isFieldSelected(form, 'title') && (
                  <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={form.title}
                      onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Office internet bill"
                    />
                  </div>
                )}

                {isFieldSelected(form, 'description') && (
                  <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={form.description}
                      onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Optional memo or recurring context"
                    />
                  </div>
                )}

                {isFieldSelected(form, 'date') && (
                  <div className="grid gap-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                      className={!form.date ? 'text-muted-foreground' : ''}
                    />
                  </div>
                )}

                {isFieldSelected(form, 'recipient') && (
                  <div className="grid gap-2">
                    <Label htmlFor="recipient">Recipient</Label>
                    <Input
                      id="recipient"
                      value={form.recipient}
                      onChange={(e) => setForm((prev) => ({ ...prev, recipient: e.target.value }))}
                      placeholder="e.g., Electricity Board"
                    />
                  </div>
                )}

                {isFieldSelected(form, 'transactionType') && (
                  <div className="grid gap-2">
                    <Label htmlFor="type">Type</Label>
                    <Combobox
                      options={transactionTypes}
                      value={form.transactionType}
                      onChange={(value) => setForm((prev) => ({ ...prev, transactionType: value as TransactionType | '' }))}
                      placeholder="Select transaction type"
                      searchPlaceholder="Search types..."
                      notFoundMessage="No type found."
                    />
                  </div>
                )}

                {isFieldSelected(form, 'category') && (
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Combobox
                      options={categories}
                      value={form.category}
                      onChange={(value) => setForm((prev) => ({ ...prev, category: value as TransactionCategory | '' }))}
                      placeholder="Select category"
                      searchPlaceholder="Search categories..."
                      notFoundMessage="No category found."
                    />
                  </div>
                )}

                {isFieldSelected(form, 'currency') && (
                  <div className="grid gap-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Combobox
                      options={currencies}
                      value={form.currency}
                      onChange={(value) => setForm((prev) => ({ ...prev, currency: value }))}
                      placeholder="Select currency"
                      searchPlaceholder="Search currencies..."
                      notFoundMessage="No currency found."
                    />
                  </div>
                )}

                {isFieldSelected(form, 'totalAmount') && (
                  <div className="grid gap-2">
                    <Label htmlFor="total_amount">Total Amount</Label>
                    <Input
                      id="total_amount"
                      type="number"
                      value={form.totalAmount}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          totalAmount: e.target.value === '' ? '' : parseFloat(e.target.value),
                        }))
                      }
                      placeholder="0.00"
                    />
                  </div>
                )}

                {isFieldSelected(form, 'status') && (
                  <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Combobox
                      options={transactionStatuses}
                      value={form.status}
                      onChange={(value) => setForm((prev) => ({ ...prev, status: value as TransactionStatus | '' }))}
                      placeholder="Select status"
                      searchPlaceholder="Search statuses..."
                      notFoundMessage="No status found."
                    />
                  </div>
                )}

                {isFieldSelected(form, 'accountId') && (
                  <div className="grid gap-2">
                    <Label htmlFor="account">Account</Label>
                    <Combobox
                      options={accounts}
                      value={form.accountId}
                      onChange={(value) => setForm((prev) => ({ ...prev, accountId: value }))}
                      placeholder="Select account"
                      searchPlaceholder="Search accounts..."
                      notFoundMessage="No account found."
                    />
                  </div>
                )}

                {isFieldSelected(form, 'amountPaid') && (
                  <div className="grid gap-2">
                    <Label htmlFor="amount_paid">Amount Paid</Label>
                    <Input
                      id="amount_paid"
                      type="number"
                      value={form.amountPaid}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          amountPaid: e.target.value === '' ? '' : parseFloat(e.target.value),
                        }))
                      }
                      placeholder="0.00"
                    />
                  </div>
                )}

                {isFieldSelected(form, 'dueOn') && (
                  <div className="grid gap-2">
                    <Label htmlFor="due_on">Due On</Label>
                    <Input
                      id="due_on"
                      type="date"
                      value={form.dueOn}
                      onChange={(e) => setForm((prev) => ({ ...prev, dueOn: e.target.value }))}
                      className={!form.dueOn ? 'text-muted-foreground' : ''}
                    />
                  </div>
                )}

                {isFieldSelected(form, 'attachmentLabel') && (
                  <div className="grid gap-2">
                    <Label htmlFor="attachment">Attachment Label</Label>
                    <Input
                      id="attachment"
                      value={form.attachmentLabel}
                      onChange={(e) => setForm((prev) => ({ ...prev, attachmentLabel: e.target.value }))}
                      placeholder="e.g., recurring_invoice_template.pdf"
                    />
                  </div>
                )}

                {isFieldSelected(form, 'operations') && (
                  <div className="grid gap-3 md:col-span-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/20 p-3">
                      <div>
                        <p className="text-sm font-medium">Tax/VAT Operations</p>
                        <p className="text-xs text-muted-foreground">
                          Add rules like VAT, tax, fees, or complex transfer operations.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => addOperation('vat')}>
                          + VAT rule
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => addOperation('tax')}>
                          + Tax rule
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => addOperation('custom')}>
                          + Custom rule
                        </Button>
                      </div>
                    </div>

                    {form.operations.length === 0 ? (
                      <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                        No operations added yet. Example: Add VAT and set action to transfer amount to VAT Account.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {form.operations.map((operation, index) => (
                          <div key={operation.id} className="grid gap-3 rounded-md border p-3 md:grid-cols-2">
                            <div className="flex items-center justify-between md:col-span-2">
                              <p className="text-sm font-medium">Operation #{index + 1}</p>
                              <Button type="button" size="sm" variant="ghost" onClick={() => removeOperation(operation.id)}>
                                Remove
                              </Button>
                            </div>

                            <div className="grid gap-2">
                              <Label>Kind</Label>
                              <Combobox
                                options={operationKinds}
                                value={operation.kind}
                                onChange={(value) => updateOperation(operation.id, { kind: value as OperationKind })}
                                placeholder="Select kind"
                              />
                            </div>

                            <div className="grid gap-2">
                              <Label>Label</Label>
                              <Input
                                value={operation.label}
                                onChange={(e) => updateOperation(operation.id, { label: e.target.value })}
                                placeholder="e.g., VAT 13%"
                              />
                            </div>

                            <div className="grid gap-2">
                              <Label>Value Type</Label>
                              <Combobox
                                options={operationValueTypes}
                                value={operation.valueType}
                                onChange={(value) => updateOperation(operation.id, { valueType: value as OperationValueType })}
                                placeholder="Select value type"
                              />
                            </div>

                            <div className="grid gap-2">
                              <Label>Value</Label>
                              <Input
                                type="number"
                                value={operation.value}
                                onChange={(e) =>
                                  updateOperation(operation.id, {
                                    value: e.target.value === '' ? '' : parseFloat(e.target.value),
                                  })
                                }
                                placeholder={operation.valueType === 'percentage' ? 'e.g., 13' : 'e.g., 500'}
                              />
                            </div>

                            <div className="grid gap-2 md:col-span-2">
                              <Label>Action</Label>
                              <Combobox
                                options={operationActions}
                                value={operation.action}
                                onChange={(value) => updateOperation(operation.id, { action: value as OperationAction })}
                                placeholder="Select action"
                              />
                            </div>

                            {operation.action === 'transfer_to_account' && (
                              <div className="grid gap-2 md:col-span-2">
                                <Label>Destination account</Label>
                                <Input
                                  value={operation.destinationAccount}
                                  onChange={(e) => updateOperation(operation.id, { destinationAccount: e.target.value })}
                                  placeholder="e.g., VAT Account"
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {(isFieldSelected(form, 'status') || isFieldSelected(form, 'totalAmount') || isFieldSelected(form, 'amountPaid')) && (
                  <div className="flex items-end md:col-span-2">
                    <div className="w-full rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                      Balance due preview: <span className="font-medium text-foreground">{balanceDuePreview.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="gap-2 border-t px-6 py-4">
          <Button onClick={handleSaveProfile}>{editingId ? 'Update Profile' : 'Save Profile'}</Button>
          <Button variant="outline" onClick={clearForm}>Clear</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Saved Profiles</CardTitle>
          <CardDescription>
            Apply or edit existing payment profiles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Profile</TableHead>
                <TableHead className="hidden md:table-cell">Included Fields</TableHead>
                <TableHead className="hidden lg:table-cell">Operations</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    No payment profiles saved yet.
                  </TableCell>
                </TableRow>
              ) : (
                profiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{profile.name}</p>
                        <p className="text-xs text-muted-foreground">{profile.title || 'No default title'}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{profile.selectedFields.length}</TableCell>
                    <TableCell className="hidden lg:table-cell">{profile.operations.length}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleApplyToForm(profile)}>
                          Apply
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleEditProfile(profile)}>
                          Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteProfile(profile.id)}>
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
