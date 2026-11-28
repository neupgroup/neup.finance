import { NextRequest, NextResponse } from 'next/server';
import { Prisma, prisma } from '@neup/core/database/prisma';
import { canAccess, getProjectAccess } from '@/server/access';

type SalesOrderItemInput = {
  name?: unknown; description?: unknown; quantity?: unknown; unit?: unknown; rate?: unknown;
  discountType?: unknown; discountValue?: unknown; discountAmount?: unknown;
  taxRate?: unknown; taxAmount?: unknown; amount?: unknown; sortIndex?: unknown;
};

// Format a standard API error response.
function fail(code: string, description: string, status: number) {
  return NextResponse.json({ status: false, error: { code, description } }, { status });
}

// Parse a JSON value as a finite numeric amount.
function numberValue(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

// List sales orders for the authenticated project.
export async function GET(request: NextRequest) {
  const access = await getProjectAccess(request);
  if (!access || !canAccess(access, 'transactions.read')) return fail('forbidden', 'You do not have access to read documents in this project.', 403);

  const salesOrders = await prisma.salesOrder.findMany({
    where: { document: { projectId: access.projectId, type: 'sales-order' } },
    orderBy: { createdAt: 'desc' },
    include: { customer: { select: { id: true, name: true, type: true } } },
  });
  return NextResponse.json({ status: true, result: salesOrders });
}

// Create a sales order and its item rows in the authenticated project.
export async function POST(request: NextRequest) {
  const access = await getProjectAccess(request);
  if (!access || !canAccess(access, 'transactions.write')) return fail('forbidden', 'You do not have access to create documents in this project.', 403);

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const items = Array.isArray(body?.items) ? body.items as SalesOrderItemInput[] : [];
  const customerId = typeof body?.customerId === 'string' ? body.customerId : '';
  const currency = typeof body?.currency === 'string' ? body.currency.trim().toUpperCase() : '';
  const date = typeof body?.date === 'string' ? body.date : '';
  const dueDate = typeof body?.dueDate === 'string' ? body.dueDate : '';
  const exchangeRate = numberValue(body?.exchangeRate);

  if (!customerId || !currency || !date || !dueDate || !items.length || !exchangeRate || exchangeRate <= 0) {
    return fail('invalid_sales_order', 'Customer, currency, dates, exchange rate, and at least one item are required.', 400);
  }

  const normalizedItems = items.map((item, index) => ({
    name: typeof item.name === 'string' ? item.name.trim() : '',
    description: typeof item.description === 'string' ? item.description.slice(0, 128) : null,
    quantity: numberValue(item.quantity),
    unit: typeof item.unit === 'string' ? item.unit.trim() : '',
    rate: numberValue(item.rate),
    discountType: typeof item.discountType === 'string' ? item.discountType : 'percentage',
    discountValue: numberValue(item.discountValue),
    discountAmount: numberValue(item.discountAmount),
    taxRate: numberValue(item.taxRate),
    taxAmount: numberValue(item.taxAmount),
    amount: numberValue(item.amount),
    sortIndex: Number.isInteger(item.sortIndex) ? Number(item.sortIndex) : index,
  }));

  if (normalizedItems.some((item) => !item.name || !item.unit || item.quantity === null || item.quantity <= 0 || item.rate === null || item.discountValue === null || item.discountAmount === null || item.taxRate === null || item.taxAmount === null || item.amount === null)) {
    return fail('invalid_sales_order_items', 'Each sales order item must have a name, valid quantity, unit, and numeric amounts.', 400);
  }

  const customer = await prisma.party.findFirst({ where: { id: customerId, projectId: access.projectId }, select: { id: true, name: true } });
  if (!customer) return fail('customer_not_found', 'The selected customer is not in this project.', 404);

  const totals = ['subtotal', 'discountValue', 'discountAmount', 'taxTotal', 'total'].map((key) => numberValue(body?.[key]));
  if (totals.some((value) => value === null)) return fail('invalid_totals', 'Sales order totals must be valid numbers.', 400);
  const details = body?.details && typeof body.details === 'object' && !Array.isArray(body.details)
    ? body.details as Prisma.InputJsonValue
    : Prisma.JsonNull;

  const salesOrder = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${access.projectId}))`;
    const latest = await tx.salesOrder.findFirst({ where: { document: { projectId: access.projectId } }, orderBy: { counter: 'desc' }, select: { counter: true } });
    const counter = (latest?.counter ?? 0) + 1;
    const document = await tx.document.create({ data: { projectId: access.projectId, type: 'sales-order' } });
    const referenceNumber = `SO-${access.projectId.slice(0, 8).toUpperCase()}-${String(counter).padStart(5, '0')}`;

    await tx.salesOrder.create({
      data: {
        id: document.id,
        customerId,
        counter,
        referenceNumber,
        subject: typeof body?.subject === 'string' && body.subject.trim() ? body.subject.trim() : `Sales order for ${customer.name}`,
        currency,
        exchangeRate,
        subtotal: totals[0]!,
        discountType: typeof body?.discountType === 'string' ? body.discountType : 'line_items',
        discountValue: totals[1]!,
        discountAmount: totals[2]!,
        taxTotal: totals[3]!,
        hasAdjustments: Boolean(body?.hasAdjustments),
        total: totals[4]!,
        status: typeof body?.status === 'string' ? body.status : 'confirmed',
        date: new Date(`${date}T00:00:00.000Z`),
        dueDate: new Date(`${dueDate}T00:00:00.000Z`),
        details,
      },
    });
    await tx.salesOrderItem.createMany({ data: normalizedItems.map((item) => ({
      salesOrderId: document.id,
      name: item.name,
      description: item.description,
      quantity: item.quantity!,
      unit: item.unit,
      rate: item.rate!,
      discountType: item.discountType,
      discountValue: item.discountValue!,
      discountAmount: item.discountAmount!,
      taxRate: item.taxRate!,
      taxAmount: item.taxAmount!,
      amount: item.amount!,
      sortIndex: item.sortIndex,
    })) });
    await tx.documentEvent.create({
      data: { documentId: document.id, type: 'created', performedBy: access.accountId, data: { status: 'confirmed' } },
    });

    return tx.salesOrder.findUnique({
      where: { id: document.id },
      include: { document: true, customer: { select: { id: true, name: true, type: true } }, items: { orderBy: { sortIndex: 'asc' } } },
    });
  });
  return NextResponse.json({ status: true, result: salesOrder }, { status: 201 });
}
