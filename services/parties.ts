/*
::neup.documentation::party-service
::title Party Data Helpers

Shared lookup and creation helpers for account-scoped party data.

::end
*/

import { Prisma } from '@prisma/client';
import { prisma } from '@/server/db';

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
  assetGroupId: string;
  assetGroupName?: string;
  category: string;
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
  userId: string;
};

export type SerializedPartyPageData = {
  accountId: string;
  party: SerializedParty;
  transactions: SerializedPartyTransaction[];
};

const partyInclude = {
  contacts: true,
  paymentMethods: true,
} as const;

const partyTransactionInclude = {
  assetGroup: {
    select: {
      name: true,
    },
  },
} as const;

type PartyWithRelationsRecord = Prisma.PartyGetPayload<{
  include: typeof partyInclude;
}>;
type PartyTransactionRecord = Prisma.TransactionGetPayload<{
  include: typeof partyTransactionInclude;
}>;

function serializeParty(party: PartyWithRelationsRecord): SerializedParty {
  return {
    id: party.id,
    account_id: party.accountId,
    name: party.name,
    type: party.type,
    taxinfo: party.taxinfo,
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
  return {
    id: transaction.id,
    title: transaction.title,
    description: transaction.description ?? undefined,
    accountId: transaction.accountId,
    assetGroupId: transaction.assetGroupId,
    assetGroupName: transaction.assetGroup?.name,
    category: transaction.category,
    transaction_type: transaction.transaction_type,
    total_amount: Number(transaction.total_amount),
    total_paid: Number(transaction.total_paid),
    balance_due: Number(transaction.balance_due),
    status: transaction.status,
    date: transaction.date.toISOString(),
    currency: transaction.currency,
    recipient: transaction.recipient ?? undefined,
    due_on: transaction.due_on ? transaction.due_on.toISOString() : undefined,
    created_at: transaction.created_at.toISOString(),
    userId: transaction.userId,
  };
}

export async function getAccountIdByConnectionId(connectionId: string) {
  const account = await prisma.account.findUnique({
    where: { connection_id: connectionId },
    select: { id: true },
  });

  return account?.id ?? null;
}

export async function getPartiesForAccount(accountId: string): Promise<SerializedParty[]> {
  const parties = await prisma.party.findMany({
    where: { accountId },
    orderBy: { name: 'asc' },
    include: partyInclude,
  });

  return parties.map(serializeParty);
}

export async function getPartyById(accountId: string, id: string): Promise<SerializedParty | null> {
  const party = await prisma.party.findFirst({
    where: { accountId, id },
    include: partyInclude,
  });

  return party ? serializeParty(party) : null;
}

export async function getPartyTransactions(accountId: string, partyId: string): Promise<SerializedPartyTransaction[]> {
  const transactions = await prisma.transaction.findMany({
    where: {
      partyId,
      party: {
        is: {
          accountId,
        },
      },
    },
    orderBy: {
      date: 'desc',
    },
    include: partyTransactionInclude,
  });

  return transactions.map(serializePartyTransaction);
}

/*
::neup.documentation::party-page-data-service
::function getPartyPageData(connectionId, partyId)

Resolves the active account from the connection id and returns the matching
party with its related transactions for party route pages.

::param external connectionId
::datatype string

The authenticated account connection id cookie value.

::param external partyId
::datatype string

The route id for the requested party.

::returns SerializedPartyPageData | null

Returns null when the connection or party cannot be resolved for the current
account.

::end
*/
export async function getPartyPageData(connectionId: string, partyId: string): Promise<SerializedPartyPageData | null> {
  const accountId = await getAccountIdByConnectionId(connectionId);
  if (!accountId) {
    return null;
  }

  const party = await getPartyById(accountId, partyId);
  if (!party) {
    return null;
  }

  const transactions = await getPartyTransactions(accountId, party.id);

  return {
    accountId,
    party,
    transactions,
  };
}

export async function createPartyForAccount(accountId: string, input: CreatePartyInput): Promise<SerializedParty> {
  const created = await prisma.party.create({
    data: {
      accountId,
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
