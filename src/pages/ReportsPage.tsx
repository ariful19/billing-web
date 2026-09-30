import React, { useState } from 'react';
import { AppDatabaseState, PrintProfile } from '../types';
import { getCustomerSummary, getSupplierSummary, todayIsoDate } from '../services/billingEngine';
import {
  DailyClosingReportData,
  formatDateDisplay,
  formatMoney,
  formatQty,
  renderDailyClosingReportHtml,
} from '../utils/htmlPrintRenderer';

interface ReportsPageProps {
  state: AppDatabaseState;
  onOpenPrintPreview: (title: string, render: (profile: PrintProfile) => string) => void;
  onRefresh: () => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({
  state,
  onOpenPrintPreview,
  onRefresh,
}) => {
  const c = state.settings.currencyCode;
  const today = todayIsoDate();

  const [preset, setPreset] = useState<'Today' | 'Yesterday' | 'Last7Days' | 'ThisMonth' | 'Custom'>('Today');
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);

  const applyPreset = (p: typeof preset) => {
    setPreset(p);
    const now = new Date();
    if (p === 'Today') {
      const d = now.toISOString().slice(0, 10);
      setFromDate(d);
      setToDate(d);
    } else if (p === 'Yesterday') {
      const y = new Date(now.getTime() - 86400000).toISOString().slice(0, 10);
      setFromDate(y);
      setToDate(y);
    } else if (p === 'Last7Days') {
      const s = new Date(now.getTime() - 6 * 86400000).toISOString().slice(0, 10);
      setFromDate(s);
      setToDate(today);
    } else if (p === 'ThisMonth') {
      const s = `${today.slice(0, 7)}-01`;
      setFromDate(s);
      setToDate(today);
    }
  };

  const inRange = (d: string) => (!fromDate || d >= fromDate) && (!toDate || d <= toDate);

  const periodSales = state.sales.filter((s) => s.status === 'Posted' && inRange(s.saleDate));
  const totalSalesMinor = periodSales.reduce((acc, s) => acc + s.totalAmountMinor, 0);
  const cashSalesMinor = periodSales.reduce((acc, s) => acc + s.paidAmountMinor, 0);
  const dueCreatedMinor = periodSales.reduce((acc, s) => acc + s.dueAmountMinor, 0);

  const periodPurchases = state.purchases.filter((p) => p.status === 'Posted' && inRange(p.purchaseDate));
  const totalPurchasesMinor = periodPurchases.reduce((acc, p) => acc + p.totalAmountMinor, 0);
  const cashPurchasesMinor = periodPurchases.reduce((acc, p) => acc + p.paidAmountMinor, 0);
  const payableCreatedMinor = periodPurchases.reduce((acc, p) => acc + p.dueAmountMinor, 0);

  const openingCashMinor = state.cashTransactions
    .filter((tx) => fromDate && tx.transactionDate < fromDate)
    .reduce((acc, tx) => acc + tx.cashInMinor - tx.cashOutMinor, 0);
  const periodCash = state.cashTransactions.filter((tx) => inRange(tx.transactionDate));
  const cashReceivedMinor = periodCash.reduce((acc, tx) => acc + tx.cashInMinor, 0);
  const cashPaidMinor = periodCash.reduce((acc, tx) => acc + tx.cashOutMinor, 0);
  const closingCashMinor = openingCashMinor + cashReceivedMinor - cashPaidMinor;

  const purchasedQty = periodPurchases.reduce(
    (acc, p) => acc + p.lines.reduce((lAcc, l) => lAcc + l.quantity, 0),
    0
  );
  const soldQty = periodSales.reduce(
    (acc, s) => acc + s.lines.reduce((lAcc, l) => lAcc + l.quantity, 0),
    0
  );

  const activeProducts = state.products.filter((p) => p.isActive);
  const lowStockItems = activeProducts.filter((p) => p.currentStock <= p.reorderLevel);
  const outOfStockCount = activeProducts.filter((p) => p.currentStock <= 0).length;
  const lowStockOnlyCount = activeProducts.filter(
    (p) => p.currentStock > 0 && p.currentStock <= p.reorderLevel
  ).length;

  const customerDues = state.parties
    .filter((p) => p.isActive && (p.partyType === 'Customer' || p.partyType === 'Both'))
    .map((p) => getCustomerSummary(state, p.id))
    .filter((s) => s.currentDueMinor > 0);
  const totalCustomerDueMinor = customerDues.reduce((acc, s) => acc + s.currentDueMinor, 0);

  const supplierDues = state.parties
    .filter((p) => p.isActive && (p.partyType === 'Supplier' || p.partyType === 'Both'))
    .map((p) => getSupplierSummary(state, p.id))
    .filter((s) => s.currentPayableMinor > 0);
  const totalSupplierDueMinor = supplierDues.reduce((acc, s) => acc + s.currentPayableMinor, 0);

  const customerCollectionsMinor = state.customerReceipts
    .filter((r) => r.status === 'Posted' && inRange(r.receiptDate))
    .reduce((acc, r) => acc + r.amountMinor, 0);

  const supplierPaymentsMinor = state.supplierPayments
    .filter((p) => p.status === 'Posted' && inRange(p.paymentDate))
    .reduce((acc, p) => acc + p.amountMinor, 0);

  const cogsMinor = periodSales.reduce(
    (acc, s) => acc + s.lines.reduce((lAcc, l) => lAcc + Math.round(l.quantity * l.unitCostMinor), 0),
    0
  );
  const grossProfitMinor = totalSalesMinor - cogsMinor;

  const reportData: DailyClosingReportData = {
    fromDate,
    toDate,
    invoiceCount: periodSales.length,
    totalSalesMinor,
    cashSalesMinor,
    dueCreatedMinor,
    customerCollectionsMinor,
    purchaseCount: periodPurchases.length,
    totalPurchasesMinor,
    cashPurchasesMinor,
    payableCreatedMinor,
    supplierPaymentsMinor,
    openingCashMinor,
    cashReceivedMinor,
    cashPaidMinor,
    closingCashMinor,
    salesRevenueMinor: totalSalesMinor,
    cogsMinor,
    grossProfitMinor,
    profitNote: 'Estimated using weighted-average product cost at time of sale.',
  };

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[26px] font-semibold leading-tight">Reports</h1>
          <p className="text-sm text-[var(--app-muted-text)]">
            Daily sales, purchase, cash, stock, due, and gross profit report.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onRefresh} className="win-btn">
            Refresh
          </button>
          <button
            type="button"
            onClick={() =>
              onOpenPrintPreview('Daily Closing Report', (profile) =>
                renderDailyClosingReportHtml(reportData, state.settings, profile)
              )
            }
            className="win-btn-primary"
          >
            Print report
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="win-panel flex flex-wrap items-end gap-3">
        <div className="w-44">
          <label className="win-label">Preset</label>
          <select
            value={preset}
            onChange={(e) => applyPreset(e.target.value as any)}
            className="win-input"
          >
            <option value="Today">Today</option>
            <option value="Yesterday">Yesterday</option>
            <option value="Last7Days">Last 7 days</option>
            <option value="ThisMonth">This month</option>
            <option value="Custom">Custom range</option>
          </select>
        </div>
        <div className="w-40">
          <label className="win-label">From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => {
              setPreset('Custom');
              setFromDate(e.target.value);
            }}
            className="win-input"
          />
        </div>
        <div className="w-40">
          <label className="win-label">To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => {
              setPreset('Custom');
              setToDate(e.target.value);
            }}
            className="win-input"
          />
        </div>
        <button
          type="button"
          onClick={() => applyPreset('Today')}
          className="win-btn"
        >
          Today
        </button>
      </div>

      {/* 6 Report Sections matching ReportsPage.xaml */}
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
        <div className="win-panel space-y-1.5 text-xs">
          <h2 className="text-[17px] font-semibold">Sales</h2>
          <div>Invoices: {periodSales.length}</div>
          <div>Total sales: {formatMoney(totalSalesMinor, c)}</div>
          <div>Cash sales: {formatMoney(cashSalesMinor, c)}</div>
          <div>Due created: {formatMoney(dueCreatedMinor, c)}</div>
        </div>

        <div className="win-panel space-y-1.5 text-xs">
          <h2 className="text-[17px] font-semibold">Purchases</h2>
          <div>Purchases: {periodPurchases.length}</div>
          <div>Total purchases: {formatMoney(totalPurchasesMinor, c)}</div>
          <div>Cash purchases: {formatMoney(cashPurchasesMinor, c)}</div>
          <div>Payable created: {formatMoney(payableCreatedMinor, c)}</div>
        </div>

        <div className="win-panel space-y-1.5 text-xs">
          <h2 className="text-[17px] font-semibold">Cash</h2>
          <div>Opening cash: {formatMoney(openingCashMinor, c)}</div>
          <div>Cash received: {formatMoney(cashReceivedMinor, c)}</div>
          <div>Cash paid: {formatMoney(cashPaidMinor, c)}</div>
          <div className="font-semibold">Closing cash: {formatMoney(closingCashMinor, c)}</div>
        </div>

        <div className="win-panel space-y-1.5 text-xs">
          <h2 className="text-[17px] font-semibold">Stock</h2>
          <div>Purchased quantity: {formatQty(purchasedQty)}</div>
          <div>Sold quantity: {formatQty(soldQty)}</div>
          <div>Low stock products: {lowStockOnlyCount}</div>
          <div>Out of stock products: {outOfStockCount}</div>
        </div>

        <div className="win-panel space-y-1.5 text-xs">
          <h2 className="text-[17px] font-semibold">Due</h2>
          <div>Total customer due: {formatMoney(totalCustomerDueMinor, c)}</div>
          <div>Total supplier payable: {formatMoney(totalSupplierDueMinor, c)}</div>
          <div>Customer collections: {formatMoney(customerCollectionsMinor, c)}</div>
          <div>Supplier payments: {formatMoney(supplierPaymentsMinor, c)}</div>
        </div>

        <div className="win-panel space-y-1.5 text-xs">
          <h2 className="text-[17px] font-semibold">Gross profit</h2>
          <div>Sales revenue: {formatMoney(totalSalesMinor, c)}</div>
          <div>Cost of goods sold: {formatMoney(cogsMinor, c)}</div>
          <div className="font-semibold">Gross profit estimate: {formatMoney(grossProfitMinor, c)}</div>
          <div className="text-[var(--app-muted-text)]">{reportData.profitNote}</div>
        </div>
      </div>

      {/* Bottom 3 Lists matching ReportsPage.xaml */}
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-3">
        <div className="win-panel space-y-2 text-xs">
          <h2 className="text-[17px] font-semibold">Low stock items</h2>
          <div className="divide-y divide-[var(--app-border)]">
            {lowStockItems.map((item) => (
              <div key={item.id} className="grid grid-cols-[1fr_70px_70px] gap-2 py-1.5">
                <span className="truncate">{item.name}</span>
                <span className="text-right">{formatQty(item.currentStock)}</span>
                <span className="text-right text-[var(--app-muted-text)]">
                  {formatQty(item.reorderLevel)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="win-panel space-y-2 text-xs">
          <h2 className="text-[17px] font-semibold">Customer due</h2>
          <div className="divide-y divide-[var(--app-border)]">
            {customerDues.map((item) => (
              <div key={item.customerId} className="grid grid-cols-[1fr_110px] gap-2 py-1.5">
                <span className="truncate">{item.name}</span>
                <span className="text-right font-semibold">{formatMoney(item.currentDueMinor, c)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="win-panel space-y-2 text-xs">
          <h2 className="text-[17px] font-semibold">Supplier payable</h2>
          <div className="divide-y divide-[var(--app-border)]">
            {supplierDues.map((item) => (
              <div key={item.supplierId} className="grid grid-cols-[1fr_110px] gap-2 py-1.5">
                <span className="truncate">{item.name}</span>
                <span className="text-right font-semibold">{formatMoney(item.currentPayableMinor, c)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Automatic Accounting Journals Audit Section */}
      <div className="win-panel space-y-2.5 overflow-x-auto">
        <div>
          <h2 className="text-[17px] font-semibold">Automatic accounting journals</h2>
          <p className="text-xs text-[var(--app-muted-text)]">
            Balanced double-entry journals posted automatically by sales, purchases, collections, payments, and cash entries.
          </p>
        </div>
        <div className="divide-y divide-[var(--app-border)] text-xs">
          {state.journalEntries.slice(0, 12).map((j) => (
            <div key={j.id} className="py-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2 font-semibold">
                <span>
                  {j.entryNumber} — {j.description} ({j.status})
                </span>
                <span className="text-[var(--app-muted-text)]">
                  {formatDateDisplay(j.entryDate)} | Ref: {j.referenceNumber}
                </span>
              </div>
              <div className="mt-1.5 grid grid-cols-[90px_1fr_110px_110px] gap-2 rounded bg-[var(--app-muted-panel)]/60 px-2.5 py-1.5 text-[11px]">
                {j.lines.map((line) => (
                  <React.Fragment key={line.id}>
                    <span className="font-mono">{line.accountCode}</span>
                    <span>
                      {line.accountName} — <span className="text-[var(--app-muted-text)]">{line.description}</span>
                    </span>
                    <span className="text-right">
                      {line.debitMinor > 0 ? `Dr ${formatMoney(line.debitMinor, c)}` : ''}
                    </span>
                    <span className="text-right">
                      {line.creditMinor > 0 ? `Cr ${formatMoney(line.creditMinor, c)}` : ''}
                    </span>
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
