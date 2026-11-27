import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { prisma } from '@neup/core/database/prisma';
import { canAccess, getProjectAccess } from '@/server/access';

type PdfLine = { text: string; size?: number; bold?: boolean; gap?: number };
const runFile = promisify(execFile);

// Load Next's generated Outfit font asset so headless Chrome embeds the app font in PDFs.
async function getOutfitFontDataUrl() {
  const cwd = process.cwd();
  for (const manifestPath of ['.next/dev/server/next-font-manifest.json', '.next/server/next-font-manifest.json']) {
    try {
      const manifest = JSON.parse(await readFile(path.join(cwd, manifestPath), 'utf8')) as { app?: Record<string, string[]> };
      const fontAsset = Object.values(manifest.app ?? {}).flat().find((asset) => asset.endsWith('.woff2'));
      if (!fontAsset) continue;
      for (const assetPath of [path.join(cwd, '.next/dev', fontAsset), path.join(cwd, '.next', fontAsset)]) {
        try {
          const font = await readFile(assetPath);
          return `data:font/woff2;base64,${font.toString('base64')}`;
        } catch {
          // Try the next build output location.
        }
      }
    } catch {
      // Try the next Next.js manifest location.
    }
  }
  return null;
}

// Escape dynamic text before placing it into the HTML print template.
function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);
}

// Normalize branding values so saved line breaks do not split words in the PDF header.
function normalizeBrandingText(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

// Render the same branded A4 print sheet style as the app's document preview to PDF.
async function createPdf(lines: PdfLine[], options: { companyLogo?: string | null; companyName?: string; companyInfo?: string[]; customBody?: string; customHeaderRight?: string } = {}) {
  const outfitFont = await getOutfitFontDataUrl();
  const logo = options.companyLogo ? `<img class="logo" src="${escapeHtml(options.companyLogo)}" alt="Company logo" />` : '<div class="logo-mark">N</div>';
  const infoItems = options.companyInfo ?? [];
  const companyInfo = infoItems.map((value, index) => `<p${index === infoItems.length - 1 && infoItems.length >= 2 ? ' class="contact-row"' : ''}>${escapeHtml(value)}</p>`).join('');
  const content = options.customBody ?? lines.slice(1).map((line) => `<p style="font-size:${line.size ?? 15}px;font-weight:${line.bold ? 700 : 400};margin-top:${line.gap ?? 10}px">${escapeHtml(line.text)}</p>`).join('');
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    @font-face{font-family:Outfit;src:url('${outfitFont ?? ''}') format('woff2');font-style:normal;font-weight:100 900;font-display:block}
    @page{size:A4;margin:14mm}*{box-sizing:border-box}body{margin:0;background:#e2e8f0;color:#0f172a;font-family:Outfit,ui-sans-serif,system-ui,sans-serif;font-kerning:normal;font-feature-settings:normal;font-synthesis:none;letter-spacing:normal;word-spacing:normal;-webkit-font-smoothing:antialiased}
    .sheet{width:210mm;min-height:269mm;margin:0 auto;background:#fff;padding:12mm 14mm;box-shadow:0 16px 48px #0f172a22;display:flex;flex-direction:column}
    header{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;border-bottom:1px solid #cbd5e1;padding-bottom:16px}.brand{display:flex;flex-direction:column;align-items:flex-start;gap:10px;min-width:0;width:calc(100% - 64mm)}.logo{width:52px;height:52px;padding:3px;object-fit:contain;border:1px dotted #64748b;border-radius:4px}.logo-mark{width:52px;height:52px;padding:3px;border:1px dotted #64748b;border-radius:4px;background:#0f172a;color:#fff;display:grid;place-items:center;font-weight:700;font-size:22px}
    .company{font-size:15px;font-weight:700;margin:0 0 6px;letter-spacing:normal;line-height:1.3}.company-info{max-width:100%;font-family:Outfit,ui-sans-serif,system-ui,sans-serif;letter-spacing:normal;word-spacing:normal}.company-info p{font-size:15px;font-weight:400;line-height:1.57;color:#64748b;margin:1px 0 0;white-space:normal;word-break:normal;overflow-wrap:normal;letter-spacing:normal}.company-info .contact-row{display:flex;gap:10px;white-space:nowrap}.header-right{text-align:right;font-size:15px;font-weight:400;letter-spacing:normal;line-height:1.2;color:#64748b;min-width:58mm}.header-right strong{display:block;font-size:17px;font-weight:700;line-height:1.2;color:#64748b}.header-right p{font-size:15px;font-weight:400;margin:7px 0 0;line-height:1.2;color:#64748b}.body{padding-top:22px;flex:1;font-size:15px}.body p{font-size:15px;line-height:1.55;margin-bottom:0;white-space:pre-wrap}.body p:first-child{margin-top:0!important}.body.receipt{display:flex;flex-direction:column}.receipt .intro{font-size:15px}.receipt .receipt-lines{font-size:15px;line-height:2}.receipt .value{border-bottom:1px dotted #475569}.receipt .from{margin-top:28px;font-size:15px;line-height:1.8}.receipt .verify{margin-top:auto;padding-top:120px;font-size:15px}.receipt .signature{width:230px;border-top:1px solid #334155;margin-top:34px;padding-top:6px}.receipt .partyline{display:block}
    .record-summary{border:1px solid #cbd5e1;border-radius:8px;padding:18px 20px;background:#f8fafc}.record-summary .eyebrow{font-size:13px;color:#64748b;margin:0 0 4px}.record-summary .amount{font-size:25px;font-weight:700;line-height:1.3;margin:0}.record-summary .flow{font-size:14px;color:#64748b;margin:7px 0 0}.record-section-title{font-size:16px;font-weight:600;margin:26px 0 10px}.record-table{width:100%;border-collapse:collapse;font-size:15px}.record-table th,.record-table td{padding:10px 12px;border:1px solid #cbd5e1;text-align:left;vertical-align:top}.record-table th{width:34%;font-weight:500;color:#64748b;background:#f8fafc}
    @media print{body{background:#fff}.sheet{margin:0;box-shadow:none;width:100%;min-height:269mm;padding:0}}
  </style></head><body><article class="sheet"><header><div class="brand">${logo}<div><h1 class="company">${escapeHtml(options.companyName ?? lines[0]?.text ?? 'Company')}</h1><div class="company-info">${companyInfo}</div></div></div>${options.customHeaderRight ? `<div class="header-right">${options.customHeaderRight}</div>` : ''}</header><main class="body ${options.customBody ? 'receipt' : ''}">${content}</main></article></body></html>`;
  const directory = await mkdtemp(path.join(tmpdir(), 'finance-document-'));
  const htmlPath = path.join(directory, 'document.html');
  const pdfPath = path.join(directory, 'document.pdf');
  await writeFile(htmlPath, html, 'utf8');
  try {
    const executables = process.env.CHROME_BIN
      ? [process.env.CHROME_BIN]
      : process.platform === 'darwin'
        ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', 'chromium']
        : process.platform === 'win32'
          ? ['chrome']
          : ['chromium', 'google-chrome', 'google-chrome-stable', 'chromium-browser'];
    let lastError: unknown;
    for (const executable of executables) {
      try {
        await runFile(executable, ['--headless', '--disable-gpu', '--no-sandbox', '--no-pdf-header-footer', `--print-to-pdf=${pdfPath}`, `file://${htmlPath}`], { timeout: 30000, maxBuffer: 1024 * 1024 });
        return new Uint8Array(await readFile(pdfPath));
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError ?? new Error('Chrome was not available for PDF rendering');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

// Format a value as a currency amount for the printable document.
function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

// Spell out the whole-number portion of an amount for receipt vouchers.
function amountInWords(amount: number) {
  const small = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const underThousand = (value: number): string => value < 20
    ? small[value]
    : value < 100
      ? `${tens[Math.floor(value / 10)]}${value % 10 ? ` ${small[value % 10]}` : ''}`
      : `${small[Math.floor(value / 100)]} hundred${value % 100 ? ` ${underThousand(value % 100)}` : ''}`;
  const whole = Math.floor(Math.abs(amount));
  if (!whole) return 'Zero';
  let remainder = whole;
  const parts: string[] = [];
  for (const [scale, label] of [[1_000_000_000, 'billion'], [1_000_000, 'million'], [1_000, 'thousand'], [1, '']] as const) {
    const group = Math.floor(remainder / scale);
    if (group) {
      const words = underThousand(group);
      const capitalized = words.replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
      parts.push(`${capitalized}${label ? ` ${label}` : ''}`);
    }
    remainder %= scale;
  }
  return parts.join(' ');
}

// Serve an authenticated transaction document as an inline PDF in the browser.
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const access = await getProjectAccess(request);
  const { id: routeId } = await context.params;
  const query = request.nextUrl.searchParams;
  const id = query.get('id') || routeId;
  const source = query.get('source');
  const type = query.get('type') || 'payment_voucher';
  const bankSource = source === 'banktransaction' || type === 'bank-transaction';
  if (!access || !canAccess(access, bankSource ? 'books.read' : 'transactions.read')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const lines: PdfLine[] = [];
  let companyLogo: string | null = null;
  let companyName = 'Company';
  let companyInfo: string[] = [];
  let customBody: string | undefined;
  let customHeaderRight: string | undefined;
  if (bankSource) {
    const accountId = query.get('accountId');
    if (!accountId) return NextResponse.json({ error: 'Account is required' }, { status: 400 });
    const record = await prisma.finAccountTransaction.findFirst({
      where: { id, finAccountId: accountId, finAccount: { projectId: access.projectId } },
      include: { party: { include: { contacts: true } }, finAccount: true },
    });
    if (!record) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    const project = await prisma.project.findUnique({ where: { id: access.projectId }, select: { name: true, details: true } });
    const accountProfile = await prisma.account.findUnique({ where: { id: access.accountId }, select: { displayName: true } });
    const branding = project?.details && typeof project.details === 'object' && 'branding' in project.details
      ? (project.details as { branding?: Record<string, unknown> }).branding
      : undefined;
    companyName = normalizeBrandingText(project?.name || 'Company');
    companyLogo = typeof branding?.logo === 'string' ? branding.logo : null;
    const partyName = record.party?.name || '—';
    const date = `${record.activityOn.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}, ${record.activityOn.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    const amount = formatAmount(Number(record.amount), record.currency);
    const titles: Record<string, string> = { payment_advise: 'Payment Advice', payment_receipt: 'Payment Receipt', payment_voucher: 'Payment Voucher', receipt_voucher: 'Receipt Voucher', 'bank-transaction': 'Transaction Record' };
    const headerDate = record.activityOn.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    customHeaderRight = `<strong>${escapeHtml(titles[type] || 'Payment Document')}</strong><p>${escapeHtml(headerDate)}</p>`;
    lines.push({ text: companyName, size: 20, bold: true, gap: 32 });
    companyInfo = [
      ...(typeof branding?.panNumber === 'string' ? [`${typeof branding.taxType === 'string' ? normalizeBrandingText(branding.taxType) : 'PAN'}: ${normalizeBrandingText(branding.panNumber)}`] : []),
      ...(typeof branding?.location === 'string' ? [normalizeBrandingText(branding.location)] : []),
      ...([branding?.phone, branding?.email].some((entry) => typeof entry === 'string' && entry.trim())
        ? [[branding?.phone, branding?.email].filter((entry): entry is string => typeof entry === 'string' && Boolean(entry.trim())).map(normalizeBrandingText).join(' | ')]
        : []),
    ];
    lines.push({ text: titles[type] || 'Payment Document', size: 16, bold: true, gap: 36 });
    if (type === 'bank-transaction') {
      const details = record.details && typeof record.details === 'object' && !Array.isArray(record.details) ? record.details as Record<string, unknown> : {};
      const detailText = (keys: string[], fallback = '—') => {
        for (const key of keys) {
          const value = details[key];
          if (typeof value === 'string' && value.trim()) return normalizeBrandingText(value);
        }
        return fallback;
      };
      const category = detailText(['category'], '—').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
      const paymentMethod = detailText(['paymentMethod', 'payment_method', 'method', 'channel']);
      const reference = detailText(['reference', 'referenceNumber', 'reference_number', 'externalReference']);
      const status = record.status === 'active' ? 'Completed' : record.status === 'reviewRequired' ? 'Review Required' : 'Draft';
      customBody = `<section class="record-summary"><p class="eyebrow">TRANSACTION AMOUNT</p><p class="amount">${escapeHtml(amount)}</p><p class="flow">${record.direction === 'in' ? 'Money In' : 'Money Out'} · ${escapeHtml(record.finAccount.name)}</p></section><h2 class="record-section-title">More Information</h2><table class="record-table"><tbody><tr><th>Transaction ID</th><td>${escapeHtml(id)}</td></tr><tr><th>Transaction date</th><td>${escapeHtml(date)}</td></tr><tr><th>Account</th><td>${escapeHtml(record.finAccount.name)}</td></tr><tr><th>Counterparty</th><td>${escapeHtml(partyName)}</td></tr><tr><th>Payment method</th><td>${escapeHtml(paymentMethod)}</td></tr><tr><th>Reference</th><td>${escapeHtml(reference)}</td></tr><tr><th>Category</th><td>${escapeHtml(category)}</td></tr><tr><th>Status</th><td>${escapeHtml(status)}</td></tr></tbody></table>`;
    } else if (type === 'receipt_voucher') {
      const dotted = (value: string) => `<span class="value">${escapeHtml(value)}</span>`;
      const words = amountInWords(Number(record.amount));
      const accountMethod = record.finAccount.type === 'Bank' ? 'Bank Payment' : record.finAccount.type;
      const tax = record.party?.taxinfo && typeof record.party.taxinfo === 'object' ? record.party.taxinfo as Record<string, unknown> : {};
      customHeaderRight = `<strong>Receipt Voucher</strong><p>${escapeHtml(date)}</p><p>Reference: ${escapeHtml(id)}</p>`;
      customBody = `<p class="intro">Received a sum of:</p><div class="receipt-lines"><div>${dotted(`${record.currency === 'NPR' ? 'NRS' : record.currency} ${words} only (${amount})`)}</div><div><strong>On</strong> ${dotted(date)}</div><div><strong>For</strong> ${dotted(record.title)}</div></div><div class="from"><strong>From:</strong><div class="partyline">${dotted(partyName)} by ${dotted(accountMethod)}</div>${typeof tax.taxNumber === 'string' ? `<div>${escapeHtml(String(tax.taxType || 'PAN'))}: ${dotted(tax.taxNumber)}</div>` : ''}${(record.party?.contacts ?? []).map((contact) => `<div>${dotted(`${contact.type}: ${contact.value}`)}</div>`).join('')}</div><div class="verify">${record.finAccount.type === 'Cash' ? `<div>Received by: ${escapeHtml(accountProfile?.displayName || '________________')}</div>` : ''}<div><strong>Verified by:</strong> ${escapeHtml(accountProfile?.displayName || '________________')}</div><div class="signature">Signature</div></div>`;
      lines.push({ text: 'Receipt Voucher', size: 16, bold: true, gap: 36 });
      lines.push({ text: `Reference: ${id}` });
      lines.push({ text: date });
      lines.push({ text: 'Received a sum of:' });
      lines.push({ text: `${record.currency === 'NPR' ? 'NRS' : record.currency} ${words} only (${amount})` });
      lines.push({ text: `On: ${date}` });
      lines.push({ text: `For: ${record.title}` });
      lines.push({ text: `From: ${partyName} by ${accountMethod}` });
      if (record.party?.taxinfo && typeof record.party.taxinfo === 'object') {
        const tax = record.party.taxinfo as Record<string, unknown>;
        if (typeof tax.taxNumber === 'string') lines.push({ text: `${String(tax.taxType || 'PAN')}: ${tax.taxNumber}` });
      }
      for (const contact of record.party?.contacts ?? []) lines.push({ text: `${contact.type}: ${contact.value}` });
      if (record.finAccount.type === 'Cash') lines.push({ text: `Received by: ${accountProfile?.displayName || '________________'}`, gap: 180 });
      lines.push({ text: `Verified by: ${accountProfile?.displayName || '________________'}`, gap: record.finAccount.type === 'Cash' ? 18 : 180 });
      lines.push({ text: 'Signature: _____________________________________________' });
    } else {
      lines.push({ text: `Date: ${date}` });
      lines.push({ text: `${record.direction === 'in' ? 'From' : 'To'}: ${partyName}` });
      lines.push({ text: `Amount: ${amount}`, size: 14, bold: true, gap: 28 });
      lines.push({ text: `Reference: ${record.title}` });
      lines.push({ text: `Payment method: ${record.finAccount.name}` });
      if (record.description) lines.push({ text: `Details: ${record.description}`, gap: 28 });
      lines.push({ text: 'Authorized by: ________________________________________', gap: 180 });
      lines.push({ text: 'Signature: _____________________________________________' });
    }
  } else {
    const record = await prisma.transaction.findFirst({ where: { id, projectId: access.projectId }, include: { lines: true, project: true } });
    if (!record) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    const documentTitle = type.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase());
    customHeaderRight = `<strong>${escapeHtml(documentTitle)}</strong><p>${escapeHtml(record.transactionDate.toLocaleDateString())}</p>`;
    lines.push({ text: record.project.name, size: 20, bold: true, gap: 32 });
    lines.push({ text: type.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase()), size: 16, bold: true, gap: 36 });
    lines.push({ text: record.title, size: 13, bold: true });
    lines.push({ text: `Date: ${record.transactionDate.toLocaleDateString()}` });
    lines.push({ text: `Status: ${record.status}` });
    lines.push({ text: `Amount: ${formatAmount(Number(record.finalAmount), record.currency)}`, size: 14, bold: true, gap: 28 });
    if (record.description) lines.push({ text: record.description });
    for (const item of record.lines) lines.push({ text: `${item.title}: ${formatAmount(Number(item.baseAmount), item.currency)}` });
  }

  const pdf = await createPdf(lines, { companyLogo, companyName, companyInfo, customBody, customHeaderRight });
  return new NextResponse(pdf, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${type.replace(/[^a-z0-9_-]/gi, '-')}-${id}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
