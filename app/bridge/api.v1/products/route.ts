import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@neup/core/database/prisma';
import { canAccess, getProjectAccess } from '@/server/access';
import { Prisma } from '@neup/core/database/prisma';

export async function GET(req: NextRequest) {
  const access = await getProjectAccess(req);
  if (!access || !canAccess(access, 'products.read')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const products = await prisma.product.findMany({ where: { projectId: access.projectId }, orderBy: { createdOn: 'desc' } });
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const access = await getProjectAccess(req);
  if (!access || !canAccess(access, 'products.write')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  const { type, name, code, category, tax, unit, currency, price, moreDetails } = body ?? {};
  if (!['goods', 'services'].includes(type) || !name || !code || !category || !tax || !unit || !currency || price === undefined || Number.isNaN(Number(price))) {
    return NextResponse.json({ error: 'Invalid product details' }, { status: 400 });
  }
  let details: unknown = null;
  if (moreDetails) {
    try { details = JSON.parse(moreDetails); }
    catch { return NextResponse.json({ error: 'More details must be valid JSON' }, { status: 400 }); }
  }
  const product = await prisma.product.create({
    data: { projectId: access.projectId, type, name: String(name).trim(), code: String(code).trim(), category: String(category).trim(), tax: String(tax).trim(), unit: String(unit).trim(), currency: String(currency).trim().toUpperCase(), price: Number(price), ...(details === null ? {} : { moreDetails: details as Prisma.InputJsonValue }) },
  });
  return NextResponse.json(product, { status: 201 });
}
