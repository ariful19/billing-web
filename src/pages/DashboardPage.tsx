import React from 'react';
import { AppDatabaseState, NavTab } from '../types';
import { getCustomerSummary, getSupplierSummary, todayIsoDate } from '../services/billingEngine';
import { formatMoney, formatQty } from '../utils/htmlPrintRenderer';

interface DashboardPageProps {
  state: AppDatabaseState;
  onNavigate: (tab: NavTab) => void;
  onRefresh: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ state, onNavigate, onRefresh }) => {
  const today = todayIsoDate();
  const c = state.settings.currencyCode;

  const todaySales = state.sales.filter((s) => s.status === 'Posted' && s.saleDate === today);
  const todaySalesTotal = todaySales.reduce((acc, s) => acc + s.totalAmountMinor, 0);

  const todayCashIn = state.cashTransactions
    .filter((tx) => tx.transactionDate === today)
    .reduce((acc, tx) => acc + tx.cashInMinor, 0);

  const todayPurchasesTotal = state.purchases
    .filter((p) => p.status === 'Posted' && p.purchaseDate === today)
    .reduce((acc, p) => acc + p.totalAmountMinor, 0);

  const todayExpensesTotal = state.cashTransactions
    .filter((tx) => tx.transactionDate === today && tx.transactionType === 'GeneralExpense')
    .reduce((acc, tx) => acc + tx.cashOutMinor, 0);

  const customers = state.parties.filter((p) => p.isActive && (p.partyType === 'Customer' || p.partyType === 'Both'));
  const customerDueList = customers
    .map((p) => getCustomerSummary(state, p.id))
    .filter((s) => s.currentDueMinor > 0);
  const totalCustomerDue = customerDueList.reduce((acc, s) => acc + s.currentDueMinor, 0);

  const suppliers = state.parties.filter((p) => p.isActive && (p.partyType === 'Supplier' || p.partyType === 'Both'));
  const supplierDueList = suppliers
    .map((p) => getSupplierSummary(state, p.id))
    .filter((s) => s.currentPayableMinor > 0);
  const totalSupplierDue = supplierDueList.reduce((acc, s) => acc + s.currentPayableMinor, 0);

  const currentCashMinor = state.cashTransactions.reduce(
    (acc, tx) => acc + tx.cashInMinor - tx.cashOutMinor,
    0
  );

  const todayCogsMinor = todaySales.reduce(
    (acc, s) => acc + s.lines.reduce((lAcc, l) => lAcc + Math.round(l.quantity * l.unitCostMinor), 0),
    0
  );
  const todayGrossProfitMinor = todaySalesTotal - todayCogsMinor;

  const activeProducts = state.products.filter((p) => p.isActive);
  const outOfStockProducts = activeProducts.filter((p) => p.currentStock <= 0);
  const lowStockProducts = activeProducts.filter((p) => p.currentStock > 0 && p.currentStock <= p.reorderLevel);
  const alertStockProducts = activeProducts.filter((p) => p.currentStock <= p.reorderLevel);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[26px] font-semibold leading-tight">Dashboard</h1>
          <p className="text-sm text-[var(--app-muted-text)]">Daily retail health at a glance.</p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="win-btn"
        >
          Refresh
        </button>
      </div>

      {/* 3x4 KPI Grid matching DashboardPage.xaml */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="win-panel">
          <div className="text-xs text-[var(--app-muted-text)]">Today&apos;s sales</div>
          <div className="mt-1.5 text-2xl font-semibold">{formatMoney(todaySalesTotal, c)}</div>
        </div>
        <div className="win-panel">
          <div className="text-xs text-[var(--app-muted-text)]">Cash received</div>
          <div className="mt-1.5 text-2xl font-semibold">{formatMoney(todayCashIn, c)}</div>
        </div>
        <div className="win-panel">
          <div className="text-xs text-[var(--app-muted-text)]">Purchases</div>
          <div className="mt-1.5 text-2xl font-semibold">{formatMoney(todayPurchasesTotal, c)}</div>
        </div>
        <div className="win-panel">
          <div className="text-xs text-[var(--app-muted-text)]">Expenses</div>
          <div className="mt-1.5 text-2xl font-semibold">{formatMoney(todayExpensesTotal, c)}</div>
        </div>

        <div className="win-panel">
          <div className="text-xs text-[var(--app-muted-text)]">Customer due</div>
          <div className="mt-1.5 text-2xl font-semibold">{formatMoney(totalCustomerDue, c)}</div>
        </div>
        <div className="win-panel">
          <div className="text-xs text-[var(--app-muted-text)]">Supplier due</div>
          <div className="mt-1.5 text-2xl font-semibold">{formatMoney(totalSupplierDue, c)}</div>
        </div>
        <div className="win-panel">
          <div className="text-xs text-[var(--app-muted-text)]">Cash balance</div>
          <div className="mt-1.5 text-2xl font-semibold">{formatMoney(currentCashMinor, c)}</div>
        </div>
        <div className="win-panel">
          <div className="text-xs text-[var(--app-muted-text)]">Gross profit</div>
          <div className="mt-1.5 text-2xl font-semibold">{formatMoney(todayGrossProfitMinor, c)}</div>
        </div>

        <div className="win-panel">
          <div className="text-xs text-[var(--app-muted-text)]">Low stock</div>
          <div className="mt-1.5 text-2xl font-semibold">{lowStockProducts.length} items</div>
        </div>
        <div className="win-panel">
          <div className="text-xs text-[var(--app-muted-text)]">Out of stock</div>
          <div className="mt-1.5 text-2xl font-semibold">{outOfStockProducts.length} items</div>
        </div>
        <div className="win-panel sm:col-span-2">
          <div className="text-[17px] font-semibold">Quick actions</div>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <button type="button" onClick={() => onNavigate('sales')} className="win-btn">
              New sale
            </button>
            <button type="button" onClick={() => onNavigate('purchases')} className="win-btn">
              New purchase
            </button>
            <button type="button" onClick={() => onNavigate('parties')} className="win-btn">
              Parties
            </button>
            <button type="button" onClick={() => onNavigate('stock')} className="win-btn">
              Stock
            </button>
            <button type="button" onClick={() => onNavigate('cashbook')} className="win-btn">
              Cash book
            </button>
            <button type="button" onClick={() => onNavigate('reports')} className="win-btn">
              Reports
            </button>
          </div>
        </div>
      </div>

      {/* Bottom 3 Panels matching DashboardPage.xaml */}
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-3">
        <div className="win-panel flex flex-col">
          <h2 className="text-[17px] font-semibold">Low stock items</h2>
          <div className="mt-2.5 divide-y divide-[var(--app-border)] text-xs">
            <div className="grid grid-cols-[1fr_80px_80px] gap-2 py-1.5 font-semibold text-[var(--app-muted-text)]">
              <span>Product</span>
              <span className="text-right">Current</span>
              <span className="text-right">Reorder</span>
            </div>
            {alertStockProducts.length === 0 ? (
              <div className="py-6 text-center text-[var(--app-muted-text)]">All products are sufficiently stocked.</div>
            ) : (
              alertStockProducts.map((item) => {
                const unit = state.units.find((u) => u.id === item.unitId);
                return (
                  <div key={item.id} className="grid grid-cols-[1fr_80px_80px] items-center gap-2 py-2">
                    <span className="truncate font-semibold">{item.name}</span>
                    <span className="text-right">
                      {formatQty(item.currentStock)} {unit?.code}
                    </span>
                    <span className="text-right text-[var(--app-muted-text)]">
                      {formatQty(item.reorderLevel)} {unit?.code}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="win-panel flex flex-col">
          <h2 className="text-[17px] font-semibold">Customer due</h2>
          <div className="mt-2.5 divide-y divide-[var(--app-border)] text-xs">
            <div className="grid grid-cols-[1fr_110px] gap-2 py-1.5 font-semibold text-[var(--app-muted-text)]">
              <span>Customer</span>
              <span className="text-right">Balance</span>
            </div>
            {customerDueList.length === 0 ? (
              <div className="py-6 text-center text-[var(--app-muted-text)]">No outstanding customer dues.</div>
            ) : (
              customerDueList.map((item) => (
                <div key={item.customerId} className="grid grid-cols-[1fr_110px] items-center gap-2 py-2">
                  <span className="truncate font-semibold">{item.name}</span>
                  <span className="text-right font-semibold">{formatMoney(item.currentDueMinor, c)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="win-panel flex flex-col">
          <h2 className="text-[17px] font-semibold">Supplier payable</h2>
          <div className="mt-2.5 divide-y divide-[var(--app-border)] text-xs">
            <div className="grid grid-cols-[1fr_110px] gap-2 py-1.5 font-semibold text-[var(--app-muted-text)]">
              <span>Supplier</span>
              <span className="text-right">Balance</span>
            </div>
            {supplierDueList.length === 0 ? (
              <div className="py-6 text-center text-[var(--app-muted-text)]">No outstanding supplier payables.</div>
            ) : (
              supplierDueList.map((item) => (
                <div key={item.supplierId} className="grid grid-cols-[1fr_110px] items-center gap-2 py-2">
                  <span className="truncate font-semibold">{item.name}</span>
                  <span className="text-right font-semibold">{formatMoney(item.currentPayableMinor, c)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
