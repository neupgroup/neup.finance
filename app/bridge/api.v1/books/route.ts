import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@neup/core/database/prisma'
import { getProjectAccess, canAccess } from '@/server/access'
import { getBooksForProject } from '@/services/books'

/*
::neup.documentation::project-books-route
::api GET /api/books
::api POST /api/books

Lists book accounts and derives each non-stock balance from the replacement
transaction line amounts stored against that book.

::end
*/

export async function GET(req: NextRequest) {
  const access = await getProjectAccess(req)
  if (!access || !canAccess(access, 'books.read')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return NextResponse.json(await getBooksForProject(access.projectId))
}

export async function POST(req: NextRequest) {
  const access = await getProjectAccess(req)
  if (!access || !canAccess(access, 'books.write')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await req.json()
  const { name, type, currency, bankName, branch, accountType } = body || {}
  if (!name || !['Bank', 'Cash'].includes(type) || !currency) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
  if (type === 'Bank' && !String(bankName ?? '').trim()) {
    return NextResponse.json({ error: 'Bank name is required for bank accounts' }, { status: 400 })
  }
  if (type === 'Bank' && accountType != null && !['saving', 'current', 'fixed'].includes(accountType)) {
    return NextResponse.json({ error: 'Bank account type must be saving, current, or fixed' }, { status: 400 })
  }
  const created = await prisma.assetGroup.create({
    data: {
      name,
      type,
      bankName: type === 'Bank' ? String(bankName).trim() : null,
      branch: type === 'Bank' && String(branch ?? '').trim() ? String(branch).trim() : null,
      accountType: type === 'Bank' ? accountType ?? null : null,
      currency,
      accountId: access.accountId,
      projectId: access.projectId,
    },
  })
  return NextResponse.json({
    id: created.id,
    name: created.name,
    type: created.type,
    bankName: created.bankName,
    branch: created.branch,
    accountType: created.accountType,
    balance: 0,
    currency: created.currency,
    projectId: created.projectId,
  })
}
