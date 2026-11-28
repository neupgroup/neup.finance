import { NextRequest, NextResponse } from 'next/server';
import { Prisma, prisma } from '@neup/core/database/prisma';
import { canAccess, getProjectAccess } from '@/server/access';

type LifecycleAction = 'cancel' | 'convert' | 'record-payment' | 'generate-invoice';

// Format a standard API error response.
function fail(code: string, description: string, status: number) {
  return NextResponse.json({ status: false, error: { code, description } }, { status });
}

// Verify that the actor identifier can be stored in the UUID lifecycle columns.
function validUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

// Perform one authorized document lifecycle action and record it atomically.
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const access = await getProjectAccess(request);
  if (!access || !canAccess(access, 'transactions.write')) return fail('forbidden', 'You do not have access to update documents in this project.', 403);
  if (!validUuid(access.accountId)) return fail('invalid_actor_id', 'The current account ID is not a UUID required by the document lifecycle schema.', 400);

  const { id } = await context.params;
  const body = await request.json().catch(() => null) as { action?: LifecycleAction; transactionId?: string } | null;
  const action = body?.action;
  if (!action || !['cancel', 'convert', 'record-payment', 'generate-invoice'].includes(action)) {
    return fail('invalid_lifecycle_action', 'Choose a supported document lifecycle action.', 400);
  }

  const source = await prisma.document.findFirst({
    where: { id, projectId: access.projectId },
    include: {
      quotation: { include: { items: { orderBy: { sortIndex: 'asc' } } } },
      salesOrder: { include: { items: { orderBy: { sortIndex: 'asc' } } } },
      proforma: { include: { items: { orderBy: { sortIndex: 'asc' } } } },
      invoice: { include: { items: { orderBy: { sortIndex: 'asc' } } } },
      targetRelationships: { include: { targetDocument: { include: { events: true } } } },
    },
  });
  if (!source) return fail('document_not_found', 'Document not found in this project.', 404);

  const sourceRecord = source.quotation ?? source.salesOrder ?? source.proforma ?? source.invoice;
  if (!sourceRecord) return fail('unsupported_document', 'This document type does not support lifecycle actions.', 400);
  if (sourceRecord.status.toLowerCase() === 'canceled' || sourceRecord.status.toLowerCase() === 'cancelled') {
    return fail('document_canceled', 'A canceled document cannot continue through the lifecycle.', 409);
  }
  if (action !== 'cancel' && sourceRecord.status.toLowerCase() === 'converted') {
    return fail('document_already_advanced', 'This document has already advanced to its next stage.', 409);
  }

  if (action === 'cancel') {
    if (sourceRecord.status.toLowerCase() === 'converted' || source.type === 'invoice' || source.targetRelationships.some((relationship) => relationship.targetDocument.type === 'customer-payment')) {
      return fail('document_already_advanced', 'This document has already advanced and cannot be canceled here.', 409);
    }
    await prisma.$transaction(async (tx) => {
      if (source.type === 'quotation') await tx.documentQuotation.update({ where: { id }, data: { status: 'canceled' } });
      else if (source.type === 'sales-order') await tx.salesOrder.update({ where: { id }, data: { status: 'canceled' } });
      else if (source.type === 'proforma-invoice') await tx.proforma.update({ where: { id }, data: { status: 'canceled' } });
      else return;
      await tx.documentEvent.create({ data: { documentId: id, type: 'canceled', performedBy: access.accountId, data: { previousStatus: sourceRecord.status } } });
    });
    return NextResponse.json({ status: true, result: { targetId: id, targetType: source.type } });
  }

  if (action === 'record-payment') {
    if (source.type !== 'proforma-invoice' || !source.proforma || !body?.transactionId) {
      return fail('invalid_payment_stage', 'A customer payment can only be recorded against a proforma invoice.', 400);
    }
    const existingPayment = source.targetRelationships.find((relationship) => relationship.targetDocument.type === 'customer-payment');
    if (existingPayment) return fail('payment_already_recorded', 'A customer payment is already linked to this proforma invoice.', 409);

    const paymentTransaction = await prisma.transaction.findFirst({
      where: { id: body.transactionId, projectId: access.projectId },
      select: { id: true, status: true, transactionTypeId: true, currency: true, details: true, transactionDate: true },
    });
    const paymentDetails = paymentTransaction?.details && typeof paymentTransaction.details === 'object' && !Array.isArray(paymentTransaction.details)
      ? paymentTransaction.details as Record<string, unknown>
      : {};
    if (!paymentTransaction || paymentTransaction.status !== 'paid' || paymentTransaction.transactionTypeId !== 'income' || paymentDetails.category !== 'receivable' || Number(paymentDetails.total_paid ?? 0) < Number(source.proforma.total) || paymentDetails.partyId !== source.proforma.customerId || paymentTransaction.currency !== source.proforma.currency) {
      return fail('invalid_customer_payment', 'Select a fully paid customer payment for this proforma customer and currency.', 400);
    }

    const paymentDocument = await prisma.$transaction(async (tx) => {
      const document = await tx.document.create({ data: { projectId: access.projectId, type: 'customer-payment' } });
      await tx.proforma.update({ where: { id }, data: { status: 'paid' } });
      await tx.documentRelationship.create({
        data: { sourceDocumentId: id, targetDocumentId: document.id, type: 'payment_received', createdBy: access.accountId },
      });
      await tx.documentEvent.create({
        data: { documentId: document.id, type: 'payment_recorded', performedBy: access.accountId, data: { transactionId: paymentTransaction.id, proformaId: id } },
      });
      await tx.documentEvent.create({
        data: { documentId: id, type: 'payment_recorded', performedBy: access.accountId, data: { paymentDocumentId: document.id, transactionId: paymentTransaction.id } },
      });
      return document;
    });
    return NextResponse.json({ status: true, result: { targetId: paymentDocument.id, targetType: 'customer-payment' } }, { status: 201 });
  }

  if (action === 'convert' && !['quotation', 'sales-order'].includes(source.type)) {
    return fail('invalid_conversion_stage', 'This document must receive a customer payment before an invoice is generated.', 400);
  }
  if (sourceRecord.status.toLowerCase() === 'converted') {
    return fail('document_already_advanced', 'This document has already advanced to its next stage.', 409);
  }
  if (action === 'generate-invoice' && (source.type !== 'proforma-invoice' || !source.proforma)) {
    return fail('invalid_invoice_stage', 'Only a proforma invoice can generate its final invoice.', 400);
  }

  const paymentRelationship = source.targetRelationships.find((relationship) => relationship.targetDocument.type === 'customer-payment');
  if (action === 'generate-invoice' && !paymentRelationship) {
    return fail('payment_required', 'Record a customer payment before generating the invoice.', 409);
  }

  const targetType = action === 'generate-invoice' ? 'invoice' : source.type === 'quotation' ? 'sales-order' : 'proforma-invoice';
  const target = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${access.projectId}))`;
    const counterSource = targetType === 'sales-order'
      ? await tx.salesOrder.findFirst({ where: { document: { projectId: access.projectId } }, orderBy: { counter: 'desc' }, select: { counter: true } })
      : targetType === 'proforma-invoice'
        ? await tx.proforma.findFirst({ where: { document: { projectId: access.projectId } }, orderBy: { counter: 'desc' }, select: { counter: true } })
        : await tx.invoice.findFirst({ where: { document: { projectId: access.projectId } }, orderBy: { counter: 'desc' }, select: { counter: true } });
    const counter = (counterSource?.counter ?? 0) + 1;
    const targetDocument = await tx.document.create({ data: { projectId: access.projectId, type: targetType } });
    const refPrefix = targetType === 'sales-order' ? 'SO' : targetType === 'proforma-invoice' ? 'PFI' : 'INV';
    const referenceNumber = `${refPrefix}-${access.projectId.slice(0, 8).toUpperCase()}-${String(counter).padStart(5, '0')}`;
    const items = 'items' in sourceRecord ? sourceRecord.items : [];
    const documentValues = {
      id: targetDocument.id,
      customerId: sourceRecord.customerId,
      counter,
      referenceNumber,
      subject: sourceRecord.subject,
      currency: sourceRecord.currency,
      exchangeRate: sourceRecord.exchangeRate,
      subtotal: sourceRecord.subtotal,
      discountType: sourceRecord.discountType,
      discountValue: sourceRecord.discountValue,
      discountAmount: sourceRecord.discountAmount,
      taxTotal: sourceRecord.taxTotal,
      hasAdjustments: sourceRecord.hasAdjustments,
      total: sourceRecord.total,
      status: targetType === 'sales-order' ? 'confirmed' : targetType === 'invoice' ? 'paid' : 'draft',
      date: new Date(),
      dueDate: 'dueDate' in sourceRecord ? sourceRecord.dueDate : sourceRecord.expires,
      details: sourceRecord.details ?? Prisma.JsonNull,
    };
    let salesIncomeTransactionId: string | undefined;

    if (targetType === 'sales-order') {
      await tx.salesOrder.create({ data: documentValues });
      await tx.salesOrderItem.createMany({ data: items.map((item) => ({
        salesOrderId: targetDocument.id, name: item.name, description: item.description, quantity: item.quantity,
        unit: item.unit, rate: item.rate, discountType: item.discountType, discountValue: item.discountValue,
        discountAmount: item.discountAmount, taxRate: item.taxRate, taxAmount: item.taxAmount, amount: item.amount, sortIndex: item.sortIndex,
      })) });
    } else if (targetType === 'proforma-invoice') {
      await tx.proforma.create({ data: documentValues });
      await tx.proformaItem.createMany({ data: items.map((item) => ({
        proformaId: targetDocument.id, name: item.name, description: item.description, quantity: item.quantity,
        unit: item.unit, rate: item.rate, discountType: item.discountType, discountValue: item.discountValue,
        discountAmount: item.discountAmount, taxRate: item.taxRate, taxAmount: item.taxAmount, amount: item.amount, sortIndex: item.sortIndex,
      })) });
    } else {
      await tx.invoice.create({ data: documentValues });
      await tx.invoiceItem.createMany({ data: items.map((item) => ({
        invoiceId: targetDocument.id, name: item.name, description: item.description, quantity: item.quantity,
        unit: item.unit, rate: item.rate, discountType: item.discountType, discountValue: item.discountValue,
        discountAmount: item.discountAmount, taxRate: item.taxRate, taxAmount: item.taxAmount, amount: item.amount, sortIndex: item.sortIndex,
      })) });

      const saleTransaction = await tx.transaction.create({
        data: {
          organizationId: access.accountId,
          projectId: access.projectId,
          transactionTypeId: 'sale',
          title: `Sales income · ${referenceNumber}`,
          transactionDate: new Date(),
          status: 'paid',
          referenceNumber,
          currency: sourceRecord.currency,
          finalAmount: sourceRecord.total,
          createdBy: access.accountId,
          details: { entryKind: 'invoice_revenue', category: 'sales', partyId: sourceRecord.customerId, total_paid: Number(sourceRecord.total), balance_due: 0, reference_document: targetDocument.id },
        },
      });
      salesIncomeTransactionId = saleTransaction.id;
      await tx.transactionLine.create({
        data: {
          transactionId: saleTransaction.id,
          title: `Sales income · ${referenceNumber}`,
          lineTypeId: 'sales',
          referenceType: 'document',
          referenceId: targetDocument.id,
          currency: sourceRecord.currency,
          baseAmount: sourceRecord.total,
          sortOrder: 0,
        },
      });
    }

    if (source.type === 'quotation') await tx.documentQuotation.update({ where: { id }, data: { status: 'converted' } });
    else if (source.type === 'sales-order') await tx.salesOrder.update({ where: { id }, data: { status: 'converted' } });
    else if (source.type === 'proforma-invoice') await tx.proforma.update({ where: { id }, data: { status: 'converted' } });

    await tx.documentRelationship.create({
      data: { sourceDocumentId: id, targetDocumentId: targetDocument.id, type: 'converted_to', createdBy: access.accountId },
    });
    if (action === 'generate-invoice' && paymentRelationship) {
      await tx.documentRelationship.create({
        data: { sourceDocumentId: targetDocument.id, targetDocumentId: paymentRelationship.targetDocument.id, type: 'settled_by', createdBy: access.accountId },
      });
    }
    const eventType = action === 'generate-invoice' ? 'invoice_generated' : 'converted_to';
    const eventData = { targetDocumentId: targetDocument.id, targetType, referenceNumber, ...(salesIncomeTransactionId ? { salesIncomeTransactionId } : {}) } as Prisma.InputJsonValue;
    await tx.documentEvent.create({ data: { documentId: id, type: eventType, performedBy: access.accountId, data: eventData } });
    await tx.documentEvent.create({ data: { documentId: targetDocument.id, type: eventType, performedBy: access.accountId, data: { sourceDocumentId: id, sourceType: source.type } } });
    return { id: targetDocument.id, type: targetType };
  });

  return NextResponse.json({ status: true, result: { targetId: target.id, targetType: target.type } }, { status: 201 });
}
