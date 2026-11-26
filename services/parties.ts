/*
::neup.documentation::party-service
::title Party Data Helpers

Shared lookup and creation helpers for account-scoped party data.

::end
*/

import { Prisma, prisma } from '@neup/core/database/prisma';
import { getProjectAccessForToken, canAccess } from '@/server/access';
import { parseTransactionCompatibilityDetails } from '@/services/transactions/records';

export type PartyContactInput = {
  type: string;
  value: string;
  details?: unknown;
};

export type PartyPaymentMethodInput = {
  type: string;
  value: string;
  details?: unknown;
};

export type CreatePartyInput = {
  name: string;
  type: string;
  taxinfo?: unknown;
  contacts?: PartyContactInput[];
  paymentMethods?: PartyPaymentMethodInput[];
};

export type SerializedParty = {
  id: string;
  account_id: string;
  name: string;
  type: string;
  taxinfo: unknown;
  totals: {
    received: Array<{
      currency: string;
      amount: number;
    }>;
    sent: Array<{
      currency: string;
      amount: number;
    }>;
  };
  contacts: Array<{
    id: string;
    party_id: string;
    type: string;
    value: string;
    added_on: string;
    details: unknown;
  }>;
  paymentMethods: Array<{
    id: string;
    party_id: string;
    type: string;
    value: string;
    added_on: string;
    details: unknown;
  }>;
};

export type SerializedPartyTransaction = {
  id: string;
  title: string;
  description?: string;
  accountId: string;
  assetGroupId?: string;
  assetGroupName?: string;
  category?: string;
  transaction_type: string;
  total_amount: number;
  total_paid: number;
  balance_due: number;
  status: string;
  date: string;
  currency: string;
  recipient?: string;
  due_on?: string;
  created_at: string;
  userId?: string;
};

export type SerializedPartyPageData = {
  accountId: string;
  party: SerializedParty;
  activities: SerializedPartyActivity[];
};

export type SerializedPartyActivity = {
  id: string;
  type: 'transaction' | 'fin-account-transaction' | 'quotation' | 'invoice' | 'proforma-invoice';
  title: string;
  description?: string;
  status: string;
  amount: number;
  currency: string;
  date: string;
  href: string;
  incoming: boolean;
};

const partyInclude = {
  contacts: true,
  paymentMethods: true,
} as const;

type PartyWithRelationsRecord = Prisma.PartyGetPayload<{
  include: typeof partyInclude;
}>;
type PartyTransactionRecord = Prisma.TransactionGetPayload<{
  include: {
    lines: true;
  };
}>;

function serializeParty(party: PartyWithRelationsRecord): SerializedParty {
  const receivedTotals = new Map<string, number>();
  const sentTotals = new Map<string, number>();

  return {
    id: party.id,
    account_id: party.accountId,
    name: party.name,
    type: party.type,
    taxinfo: party.taxinfo,
    totals: {
      received: Array.from(receivedTotals.entries()).map(([currency, amount]) => ({ currency, amount })),
      sent: Array.from(sentTotals.entries()).map(([currency, amount]) => ({ currency, amount })),
    },
    contacts: party.contacts.map((contact) => ({
      id: contact.id,
      party_id: contact.partyId,
      type: contact.type,
      value: contact.value,
      added_on: contact.addedOn.toISOString(),
      details: contact.details,
    })),
    paymentMethods: party.paymentMethods.map((method) => ({
      id: method.id,
      party_id: method.partyId,
      type: method.type,
      value: method.value,
      added_on: method.addedOn.toISOString(),
      details: method.details,
    })),
  };
}

function serializePartyTransaction(transaction: PartyTransactionRecord): SerializedPartyTransaction {
  const details = parseTransactionCompatibilityDetails(transaction.details);
  const bookLine = transaction.lines.find((line) => line.finBook);

  return {
    id: transaction.id,
    title: transaction.title,
    description: transaction.description ?? undefined,
    accountId: details.accountId ?? transaction.organizationId,
    assetGroupId: details.assetGroupId ?? bookLine?.finBook ?? undefined,
    assetGroupName: undefined,
    category: details.category,
    transaction_type: transaction.transactionTypeId,
    total_amount: Number(transaction.finalAmount),
    total_paid: Number(details.total_paid ?? (transaction.status === 'paid' ? Number(transaction.finalAmount) : 0)),
    balance_due: Number(details.balance_due ?? 0),
    status: transaction.status,
    date: transaction.transactionDate.toISOString(),
    currency: transaction.currency,
    recipient: details.recipient ?? undefined,
    due_on: details.due_on,
    created_at: transaction.createdAt.toISOString(),
    userId: transaction.createdBy ?? undefined,
  };
}

export async function getPartiesForAccount(projectId: string): Promise<SerializedParty[]> {
  const parties = await prisma.party.findMany({
    where: { projectId },
    orderBy: { name: 'asc' },
    include: partyInclude,
  });

  return parties.map(serializeParty);
}

export async function getPartyById(projectId: string, id: string): Promise<SerializedParty | null> {
  const party = await prisma.party.findFirst({
    where: { projectId, id },
    include: partyInclude,
  });

  return party ? serializeParty(party) : null;
}

export async function getPartyTransactions(projectId: string, partyId: string): Promise<SerializedPartyTransaction[]> {
  const transactions = await prisma.transaction.findMany({
    where: {
      projectId,
      details: {
        path: ['partyId'],
        equals: partyId,
      },
    },
    orderBy: {
      transactionDate: 'desc',
    },
    include: {
      lines: {
        orderBy: [
          { sortOrder: 'asc' },
          { id: 'asc' },
        ],
      },
    },
  });

  return transactions.map(serializePartyTransaction);
}

// Collect every project-scoped document and transaction attached to a party.
async function getPartyActivities(projectId: string, partyId: string): Promise<SerializedPartyActivity[]> {
  const [transactions, accountTransactions, quotations, invoices, proformas] = await Promise.all([
    prisma.transaction.findMany({
      where: { projectId, details: { path: ['partyId'], equals: partyId } },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      include: { lines: { orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] } },
    }),
    prisma.finAccountTransaction.findMany({
      where: { partyId, finAccount: { projectId } },
      orderBy: [{ activityOn: 'asc' }, { id: 'asc' }],
      include: { finAccount: { select: { name: true } } },
    }),
    prisma.documentQuotation.findMany({ where: { customerId: partyId, document: { projectId } }, include: { document: true }, orderBy: [{ document: { createdAt: 'asc' } }, { id: 'asc' }] }),
    prisma.invoice.findMany({ where: { customerId: partyId, document: { projectId } }, include: { document: true }, orderBy: [{ document: { createdAt: 'asc' } }, { id: 'asc' }] }),
    prisma.proforma.findMany({ where: { customerId: partyId, document: { projectId } }, include: { document: true }, orderBy: [{ document: { createdAt: 'asc' } }, { id: 'asc' }] }),
  ]);

  const items: Array<SerializedPartyActivity & { createdAt: number }> = [
    ...transactions.map((transaction) => ({
      id: transaction.id, type: 'transaction' as const, title: transaction.title,
      description: transaction.description ?? undefined, status: transaction.status,
      amount: Number(transaction.finalAmount), currency: transaction.currency,
      date: transaction.createdAt.toISOString(), createdAt: transaction.createdAt.getTime(),
      href: `/transactions/${transaction.id}?project=${encodeURIComponent(projectId)}`,
      incoming: ['sale', 'refund', 'income'].includes(transaction.transactionTypeId),
    })),
    ...accountTransactions.map((transaction) => ({
      id: transaction.id, type: 'fin-account-transaction' as const, title: transaction.title,
      description: transaction.description ?? transaction.finAccount.name,
      status: transaction.direction, amount: Number(transaction.amount), currency: transaction.currency,
      date: transaction.activityOn.toISOString(), createdAt: transaction.activityOn.getTime(),
      href: `/finaccounts/${transaction.finAccountId}/${transaction.id}?project=${encodeURIComponent(projectId)}`,
      incoming: transaction.direction === 'in',
    })),
    ...quotations.map((document) => ({ id: document.id, type: 'quotation' as const, title: document.subject, status: document.status, amount: Number(document.total), currency: document.currency, date: document.document.createdAt.toISOString(), createdAt: document.document.createdAt.getTime(), href: `/documents/${document.id}?type=quotation&project=${encodeURIComponent(projectId)}`, incoming: true })),
    ...invoices.map((document) => ({ id: document.id, type: 'invoice' as const, title: document.subject, status: document.status, amount: Number(document.total), currency: document.currency, date: document.document.createdAt.toISOString(), createdAt: document.document.createdAt.getTime(), href: `/documents/${document.id}?type=invoice&project=${encodeURIComponent(projectId)}`, incoming: true })),
    ...proformas.map((document) => ({ id: document.id, type: 'proforma-invoice' as const, title: document.subject, status: document.status, amount: Number(document.total), currency: document.currency, date: document.document.createdAt.toISOString(), createdAt: document.document.createdAt.getTime(), href: `/documents/${document.id}?type=proforma-invoice&project=${encodeURIComponent(projectId)}`, incoming: true })),
  ];

  return items.sort((first, second) => first.createdAt - second.createdAt || first.id.localeCompare(second.id)).map(({ createdAt: _createdAt, ...activity }) => activity);
}

/*
::neup.documentation::party-page-data-service
::function getPartyPageData(authToken, projectId, partyId)

Verifies the active account and project grant, then returns the matching party
with its related transactions for party route pages.

::param external authToken
::datatype string

The authenticated account token cookie value.

::param external projectId
::datatype string

The selected project id.

::param external partyId
::datatype string

The route id for the requested party.

::returns SerializedPartyPageData | null

Returns null when the connection or party cannot be resolved for the current
account.

::end
*/
export async function getPartyPageData(authToken: string, projectId: string, partyId: string): Promise<SerializedPartyPageData | null> {
  const access = await getProjectAccessForToken(authToken, projectId);
  if (!access || !canAccess(access, 'parties.read')) {
    return null;
  }
  const accountId = access.accountId;

  const party = await getPartyById(projectId, partyId);
  if (!party) {
    return null;
  }

  const activities = await getPartyActivities(projectId, party.id);

  return {
    accountId,
    party,
    activities,
  };
}

export async function createPartyForAccount(accountId: string, projectId: string, input: CreatePartyInput): Promise<SerializedParty> {
  const created = await prisma.party.create({
    data: {
      accountId,
      projectId,
      name: String(input.name).trim(),
      type: String(input.type).trim(),
      taxinfo: input.taxinfo ?? Prisma.JsonNull,
      contacts: {
        create: Array.isArray(input.contacts)
          ? input.contacts
              .filter((item) => item?.type && item?.value)
              .map((item) => ({
                type: String(item.type).trim(),
                value: String(item.value).trim(),
                details: item.details ?? Prisma.JsonNull,
              }))
          : [],
      },
      paymentMethods: {
        create: Array.isArray(input.paymentMethods)
          ? input.paymentMethods
              .filter((item) => item?.type && item?.value)
              .map((item) => ({
                type: String(item.type).trim(),
                value: String(item.value).trim(),
                details: item.details ?? Prisma.JsonNull,
              }))
          : [],
      },
    },
    include: partyInclude,
  });

  return serializeParty(created);
}
