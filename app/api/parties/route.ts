import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/server/db';

function getConnectionIdFromCookie(req: NextRequest): string | null {
  const connectionId = req.cookies.get('connection_id')?.value?.trim()
    || req.cookies.get('accountId')?.value?.trim();
  return connectionId || null;
}

export async function GET(req: NextRequest) {
  const connectionId = getConnectionIdFromCookie(req);
  if (!connectionId) {
    return NextResponse.json({ error: 'connection_id cookie required' }, { status: 401 });
  }

  const owner = await prisma.account.findUnique({
    where: { connection_id: connectionId },
    select: { id: true },
  });
  if (!owner) {
    return NextResponse.json({ error: 'connection_id not registered' }, { status: 404 });
  }

  const parties = await prisma.party.findMany({
    where: { accountId: owner.id },
    orderBy: { name: 'asc' },
    include: {
      contacts: true,
      paymentMethods: true,
    },
  });

  return NextResponse.json(
    parties.map((party) => ({
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
    }))
  );
}

export async function POST(req: NextRequest) {
  const connectionId = getConnectionIdFromCookie(req);
  if (!connectionId) {
    return NextResponse.json({ error: 'connection_id cookie required' }, { status: 401 });
  }

  const owner = await prisma.account.findUnique({
    where: { connection_id: connectionId },
    select: { id: true },
  });
  if (!owner) {
    return NextResponse.json({ error: 'connection_id not registered' }, { status: 404 });
  }

  const body = await req.json();
  const {
    name,
    type,
    taxinfo,
    contacts = [],
    paymentMethods = [],
  } = body || {};

  if (!name || !type) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const created = await prisma.party.create({
    data: {
      accountId: owner.id,
      name: String(name).trim(),
      type: String(type).trim(),
      taxinfo: taxinfo ?? Prisma.JsonNull,
      contacts: {
        create: Array.isArray(contacts)
          ? contacts
              .filter((item) => item?.type && item?.value)
              .map((item) => ({
                type: String(item.type).trim(),
                value: String(item.value).trim(),
                details: item.details ?? Prisma.JsonNull,
              }))
          : [],
      },
      paymentMethods: {
        create: Array.isArray(paymentMethods)
          ? paymentMethods
              .filter((item) => item?.type && item?.value)
              .map((item) => ({
                type: String(item.type).trim(),
                value: String(item.value).trim(),
                details: item.details ?? Prisma.JsonNull,
              }))
          : [],
      },
    },
    include: {
      contacts: true,
      paymentMethods: true,
    },
  });

  return NextResponse.json({
    id: created.id,
    account_id: created.accountId,
    name: created.name,
    type: created.type,
    taxinfo: created.taxinfo,
    contacts: created.contacts.map((contact) => ({
      id: contact.id,
      party_id: contact.partyId,
      type: contact.type,
      value: contact.value,
      added_on: contact.addedOn.toISOString(),
      details: contact.details,
    })),
    paymentMethods: created.paymentMethods.map((method) => ({
      id: method.id,
      party_id: method.partyId,
      type: method.type,
      value: method.value,
      added_on: method.addedOn.toISOString(),
      details: method.details,
    })),
  });
}
