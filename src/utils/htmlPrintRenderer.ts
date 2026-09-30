import {
  CompanySettings,
  CustomerReceipt,
  Party,
  PrintProfile,
  Purchase,
  Sale,
  SupplierPayment,
} from '../types';

export function formatMoney(minor: number, currencyCode = 'BDT'): string {
  const value = (minor / 100).toFixed(2);
  return `${currencyCode} ${value}`;
}

export function formatQty(qty: number): string {
  if (Number.isInteger(qty)) return qty.toString();
  return Number(qty.toFixed(3)).toString();
}

export function formatDateDisplay(isoDate: string): string {
  if (!isoDate) return '';
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTimeDisplay(isoDate: string): string {
  if (!isoDate) return '';
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function escapeHtml(value: string): string {
  return (value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getPrintCss(profile: PrintProfile): string {
  const page =
    profile === 'A5'
      ? 'size: A5; margin: 10mm;'
      : profile === 'Thermal80'
      ? 'size: 80mm auto; margin: 4mm;'
      : profile === 'Thermal58'
      ? 'size: 58mm auto; margin: 3mm;'
      : 'size: A4; margin: 12mm;';

  const thermal = profile === 'Thermal80' || profile === 'Thermal58';
  const width =
    profile === 'Thermal80'
      ? '72mm'
      : profile === 'Thermal58'
      ? '52mm'
      : profile === 'A5'
      ? '128mm'
      : '186mm';
  const font = thermal ? '11px' : '13px';

  return `
    @page { ${page} }
    * { box-sizing: border-box; }
    html, body { width: 100%; overflow-x: hidden; }
    body { margin: 0; padding: 12px 8px 16px; background: #f4f4f4; color: #1f2933; font-family: 'Segoe UI', Arial, sans-serif; font-size: ${font}; }
    .doc { width: min(100%, ${width}); max-width: ${width}; margin: 0 auto; background: #fff; padding: ${thermal ? '6px' : '18px'}; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    header { display: flex; justify-content: space-between; gap: 12px; border-bottom: 1px solid #d0d7de; padding-bottom: 10px; margin-bottom: 12px; }
    .brand { display: flex; gap: 10px; align-items: flex-start; }
    h1, h2, h3 { margin: 0 0 4px; letter-spacing: 0; }
    h1 { font-size: ${thermal ? '15px' : '22px'}; }
    h2 { font-size: ${thermal ? '14px' : '20px'}; }
    h3 { font-size: 14px; }
    .doc-title { text-align: right; }
    .party, .facts, .notes, .summary, .card { margin: 10px 0; }
    .muted { color: #667085; font-size: 0.9em; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; table-layout: fixed; }
    th, td { border-bottom: 1px solid #e5e7eb; padding: ${thermal ? '4px 2px' : '7px 5px'}; text-align: left; vertical-align: top; overflow-wrap: anywhere; }
    th { color: #475467; font-weight: 700; }
    .num { text-align: right; white-space: nowrap; }
    .summary { margin-left: auto; width: ${thermal ? '100%' : '280px'}; }
    .summary.wide { width: 100%; }
    .summary-row, .info-row { display: flex; justify-content: space-between; gap: 12px; padding: 4px 0; border-bottom: 1px solid #edf2f7; }
    .grid { display: grid; grid-template-columns: ${thermal ? '1fr' : '1fr 1fr'}; gap: 10px; }
    .card { border: 1px solid #d0d7de; border-radius: 6px; padding: 10px; }
    .cancelled { margin: 8px 0 12px; padding: 8px; border: 2px solid #b42318; color: #b42318; text-align: center; font-weight: 800; letter-spacing: 0; }
    footer { width: min(100%, ${width}); max-width: ${width}; margin: 8px auto 0; color: #667085; text-align: center; font-size: 0.9em; overflow-wrap: anywhere; }
    @media print { body { padding: 0; background: #fff; } .doc { width: ${width}; max-width: none; padding: 0; box-shadow: none; } footer { width: ${width}; max-width: none; } }
  `;
}

function renderShell(settings: CompanySettings, profile: PrintProfile, title: string, body: string): string {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <style>${getPrintCss(profile)}</style>
</head>
<body>
  <main class="doc">${body}</main>
  <footer>${escapeHtml(settings.footerNote)}</footer>
</body>
</html>`;
}

function renderHeader(settings: CompanySettings, title: string, number: string, dateText: string): string {
  return `<header>
    <div class="brand">
      <div>
        <h1>${escapeHtml(settings.companyName)}</h1>
        ${settings.storeTagline ? `<div style="font-size:0.9em;color:#666;font-style:italic;">${escapeHtml(settings.storeTagline)}</div>` : ''}
        <div>${escapeHtml(settings.address)}</div>
        <div>${escapeHtml(settings.phone)}${settings.email ? ` | ${escapeHtml(settings.email)}` : ''}</div>
        ${settings.taxNumber ? `<div style="font-weight:600;font-size:0.9em;">VAT/BIN: ${escapeHtml(settings.taxNumber)}</div>` : ''}
      </div>
    </div>
    <div class="doc-title">
      <h2>${escapeHtml(title)}</h2>
      <div><strong>${escapeHtml(number)}</strong></div>
      <div>${escapeHtml(dateText)}</div>
    </div>
  </header>`;
}

function renderCancelled(status: string): string {
  return status === 'Cancelled' ? `<section class="cancelled">CANCELLED</section>` : '';
}

function renderPartyBlock(label: string, name: string, phone = '', address = ''): string {
  return `<section class="party">
    <strong>${escapeHtml(label)}</strong>
    <div>${escapeHtml(name)}</div>
    ${phone ? `<div>${escapeHtml(phone)}</div>` : ''}
    ${address ? `<div>${escapeHtml(address)}</div>` : ''}
  </section>`;
}

function summaryRow(label: string, amountMinor: number, currency: string): string {
  return `<div class="summary-row"><span>${escapeHtml(label)}</span><strong>${escapeHtml(formatMoney(amountMinor, currency))}</strong></div>`;
}

function infoRow(label: string, value: string): string {
  if (!value) return '';
  return `<div class="info-row"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function renderNotes(notes: string): string {
  if (!notes) return '';
  return `<section class="notes"><strong>Notes</strong><div>${escapeHtml(notes)}</div></section>`;
}

export function renderSalesInvoiceHtml(
  sale: Sale,
  customer: Party | null,
  settings: CompanySettings,
  profile: PrintProfile = settings.defaultPrintProfile
): string {
  const c = settings.currencyCode;
  const rows = sale.lines
    .map(
      (line) => `<tr>
        <td>${escapeHtml(line.productName)}<div class="muted">${escapeHtml(line.unitCode)}</div></td>
        <td class="num">${escapeHtml(formatQty(line.quantity))}</td>
        <td class="num">${escapeHtml(formatMoney(line.unitPriceMinor, c))}</td>
        <td class="num">${escapeHtml(formatMoney(line.lineTotalMinor, c))}</td>
      </tr>`
    )
    .join('');

  const prevDueRow = settings.showPreviousDueOnSalesInvoice
    ? summaryRow('Previous receivable', sale.previousReceivableMinor, c)
    : '';

  return renderShell(
    settings,
    profile,
    `Sales Invoice - ${sale.invoiceNumber}`,
    `
      ${renderHeader(settings, 'Sales Invoice', sale.invoiceNumber, formatDateTimeDisplay(sale.saleDate || sale.createdAt))}
      ${renderCancelled(sale.status)}
      ${renderPartyBlock('Customer', customer?.name || sale.customerName || 'Walk-in customer', customer?.phone, customer?.address)}
      <table>
        <thead><tr><th>Item</th><th class="num">Qty</th><th class="num">Price</th><th class="num">Total</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <section class="summary">
        ${summaryRow('Total', sale.totalAmountMinor, c)}
        ${summaryRow('Paid', sale.paidAmountMinor, c)}
        ${summaryRow('Due', sale.dueAmountMinor, c)}
        ${prevDueRow}
        ${summaryRow('Current balance', sale.updatedReceivableMinor, c)}
      </section>
      ${renderNotes(sale.notes)}
    `
  );
}

export function renderPurchaseReceiptHtml(
  purchase: Purchase,
  supplier: Party | null,
  settings: CompanySettings,
  profile: PrintProfile = settings.defaultPrintProfile
): string {
  const c = settings.currencyCode;
  const rows = purchase.lines
    .map(
      (line) => `<tr>
        <td>${escapeHtml(line.productName)}<div class="muted">${escapeHtml(line.unitCode)}</div></td>
        <td class="num">${escapeHtml(formatQty(line.quantity))}</td>
        <td class="num">${escapeHtml(formatMoney(line.unitPurchasePriceMinor, c))}</td>
        <td class="num">${escapeHtml(formatMoney(line.lineTotalMinor, c))}</td>
      </tr>`
    )
    .join('');

  return renderShell(
    settings,
    profile,
    `Purchase Receipt - ${purchase.purchaseNumber}`,
    `
      ${renderHeader(settings, 'Purchase Receipt', purchase.purchaseNumber, formatDateTimeDisplay(purchase.purchaseDate || purchase.createdAt))}
      ${renderCancelled(purchase.status)}
      ${renderPartyBlock('Supplier', supplier?.name || purchase.supplierName, supplier?.phone, supplier?.address)}
      ${infoRow('Supplier invoice', purchase.supplierInvoiceNumber)}
      <table>
        <thead><tr><th>Item</th><th class="num">Qty</th><th class="num">Cost</th><th class="num">Total</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <section class="summary">
        ${summaryRow('Total', purchase.totalAmountMinor, c)}
        ${summaryRow('Paid', purchase.paidAmountMinor, c)}
        ${summaryRow('Payable', purchase.dueAmountMinor, c)}
        ${summaryRow('Previous payable', purchase.previousPayableMinor, c)}
        ${summaryRow('Current payable', purchase.updatedPayableMinor, c)}
      </section>
      ${renderNotes(purchase.notes)}
    `
  );
}

export function renderCustomerReceiptHtml(
  receipt: CustomerReceipt,
  customer: Party | null,
  settings: CompanySettings,
  profile: PrintProfile = settings.defaultPrintProfile
): string {
  const c = settings.currencyCode;
  return renderShell(
    settings,
    profile,
    `Customer Receipt - ${receipt.receiptNumber}`,
    `
      ${renderHeader(settings, 'Customer Receipt', receipt.receiptNumber, formatDateTimeDisplay(receipt.receiptDate || receipt.createdAt))}
      ${renderCancelled(receipt.status)}
      ${renderPartyBlock('Customer', customer?.name || receipt.customerName, customer?.phone, customer?.address)}
      <section class="summary wide">
        ${summaryRow('Previous due', receipt.previousBalanceMinor, c)}
        ${summaryRow('Amount', receipt.amountMinor, c)}
        ${summaryRow('Updated due', receipt.updatedBalanceMinor, c)}
      </section>
      <section class="facts">
        ${infoRow('Payment method', receipt.paymentMethod)}
        ${infoRow('Reference', receipt.reference)}
      </section>
      ${renderNotes(receipt.notes)}
    `
  );
}

export function renderSupplierPaymentHtml(
  payment: SupplierPayment,
  supplier: Party | null,
  settings: CompanySettings,
  profile: PrintProfile = settings.defaultPrintProfile
): string {
  const c = settings.currencyCode;
  return renderShell(
    settings,
    profile,
    `Supplier Payment Receipt - ${payment.paymentNumber}`,
    `
      ${renderHeader(settings, 'Supplier Payment Receipt', payment.paymentNumber, formatDateTimeDisplay(payment.paymentDate || payment.createdAt))}
      ${renderCancelled(payment.status)}
      ${renderPartyBlock('Supplier', supplier?.name || payment.supplierName, supplier?.phone, supplier?.address)}
      <section class="summary wide">
        ${summaryRow('Previous payable', payment.previousBalanceMinor, c)}
        ${summaryRow('Amount', payment.amountMinor, c)}
        ${summaryRow('Updated payable', payment.updatedBalanceMinor, c)}
      </section>
      <section class="facts">
        ${infoRow('Payment method', payment.paymentMethod)}
        ${infoRow('Reference', payment.reference)}
      </section>
      ${renderNotes(payment.notes)}
    `
  );
}

export interface StatementLedgerLine {
  transactionDate: string;
  referenceNumber: string;
  description: string;
  debitMinor: number;
  creditMinor: number;
  runningBalanceMinor: number;
  referenceType?: string;
  referenceId?: number;
  canCancel?: boolean;
}

export function renderPartyStatementHtml(
  title: 'Customer Statement' | 'Supplier Statement',
  party: Party,
  currentBalanceMinor: number,
  lines: StatementLedgerLine[],
  settings: CompanySettings,
  profile: PrintProfile = settings.defaultPrintProfile
): string {
  const c = settings.currencyCode;
  const rows = lines
    .map(
      (line) => `<tr>
        <td>${escapeHtml(formatDateDisplay(line.transactionDate))}</td>
        <td>${escapeHtml(line.referenceNumber)}</td>
        <td>${escapeHtml(line.description)}</td>
        <td class="num">${escapeHtml(formatMoney(line.debitMinor, c))}</td>
        <td class="num">${escapeHtml(formatMoney(line.creditMinor, c))}</td>
        <td class="num">${escapeHtml(formatMoney(line.runningBalanceMinor, c))}</td>
      </tr>`
    )
    .join('');

  return renderShell(
    settings,
    profile,
    `${title} - ${party.name}`,
    `
      ${renderHeader(settings, title, party.name, formatDateTimeDisplay(new Date().toISOString()))}
      ${renderPartyBlock('Party', party.name, party.phone, party.address)}
      ${summaryRow('Current balance', currentBalanceMinor, c)}
      <table>
        <thead><tr><th>Date</th><th>Ref</th><th>Description</th><th class="num">Debit</th><th class="num">Credit</th><th class="num">Balance</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `
  );
}

export interface DailyClosingReportData {
  fromDate: string;
  toDate: string;
  invoiceCount: number;
  totalSalesMinor: number;
  cashSalesMinor: number;
  dueCreatedMinor: number;
  customerCollectionsMinor: number;
  purchaseCount: number;
  totalPurchasesMinor: number;
  cashPurchasesMinor: number;
  payableCreatedMinor: number;
  supplierPaymentsMinor: number;
  openingCashMinor: number;
  cashReceivedMinor: number;
  cashPaidMinor: number;
  closingCashMinor: number;
  salesRevenueMinor: number;
  cogsMinor: number;
  grossProfitMinor: number;
  profitNote: string;
}

export function renderDailyClosingReportHtml(
  report: DailyClosingReportData,
  settings: CompanySettings,
  profile: PrintProfile = settings.defaultPrintProfile
): string {
  const c = settings.currencyCode;
  const renderCard = (title: string, subtitle: string, rows: [string, number][]) => `
    <section class="card">
      <h3>${escapeHtml(title)}</h3>
      ${subtitle ? `<div class="muted">${escapeHtml(subtitle)}</div>` : ''}
      ${rows.map(([label, val]) => summaryRow(label, val, c)).join('')}
    </section>
  `;

  return renderShell(
    settings,
    profile,
    'Daily Closing Report',
    `
      ${renderHeader(
        settings,
        'Daily Closing Report',
        `${formatDateDisplay(report.fromDate)} - ${formatDateDisplay(report.toDate)}`,
        formatDateTimeDisplay(new Date().toISOString())
      )}
      <section class="grid">
        ${renderCard('Sales', `Invoices: ${report.invoiceCount}`, [
          ['Total', report.totalSalesMinor],
          ['Cash', report.cashSalesMinor],
          ['Due created', report.dueCreatedMinor],
          ['Collections', report.customerCollectionsMinor],
        ])}
        ${renderCard('Purchases', `Purchases: ${report.purchaseCount}`, [
          ['Total', report.totalPurchasesMinor],
          ['Cash', report.cashPurchasesMinor],
          ['Payable', report.payableCreatedMinor],
          ['Payments', report.supplierPaymentsMinor],
        ])}
        ${renderCard('Cash', '', [
          ['Opening', report.openingCashMinor],
          ['Received', report.cashReceivedMinor],
          ['Paid', report.cashPaidMinor],
          ['Closing', report.closingCashMinor],
        ])}
        ${renderCard('Profit', report.profitNote, [
          ['Revenue', report.salesRevenueMinor],
          ['COGS', report.cogsMinor],
          ['Gross profit', report.grossProfitMinor],
        ])}
      </section>
    `
  );
}
