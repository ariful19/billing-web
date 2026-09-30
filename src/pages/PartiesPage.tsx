import React, { useState } from 'react';
import {
  AppDatabaseState,
  CustomerReceipt,
  Party,
  PartyType,
  PrintProfile,
  SupplierPayment,
} from '../types';
import {
  getCustomerLedger,
  getCustomerSummary,
  getSupplierLedger,
  getSupplierSummary,
  todayIsoDate,
} from '../services/billingEngine';
import {
  formatDateDisplay,
  formatMoney,
  renderCustomerReceiptHtml,
  renderPartyStatementHtml,
  renderSupplierPaymentHtml,
} from '../utils/htmlPrintRenderer';

interface PartiesPageProps {
  state: AppDatabaseState;
  customerSearchRef: React.RefObject<HTMLInputElement | null>;
  onCollectCustomerDue: (input: {
    customerId: number;
    receiptDate: string;
    amountMinor: number;
    paymentMethod: string;
    reference: string;
    notes: string;
  }) => CustomerReceipt | null;
  onPaySupplierPayable: (input: {
    supplierId: number;
    paymentDate: string;
    amountMinor: number;
    paymentMethod: string;
    reference: string;
    notes: string;
  }) => SupplierPayment | null;
  onSaveParty: (party: {
    id?: number;
    partyType: PartyType;
    name: string;
    phone: string;
    address: string;
    openingBalanceMinor: number;
  }) => Party;
  onCancelTransaction: (
    referenceType: 'Sale' | 'Purchase' | 'CustomerReceipt' | 'SupplierPayment',
    referenceId: number,
    reason: string
  ) => void;
  onOpenPrintPreview: (title: string, render: (profile: PrintProfile) => string) => void;
  onRefresh: () => void;
}

export const PartiesPage: React.FC<PartiesPageProps> = ({
  state,
  customerSearchRef,
  onCollectCustomerDue,
  onPaySupplierPayable,
  onSaveParty,
  onCancelTransaction,
  onOpenPrintPreview,
  onRefresh,
}) => {
  const c = state.settings.currencyCode;
  const [activePivot, setActivePivot] = useState<'Customers' | 'Suppliers'>('Customers');

  // Customer tab state
  const [custSearch, setCustSearch] = useState('');
  const [onlyWithDue, setOnlyWithDue] = useState(false);
  const firstCustomer = state.parties.find((p) => p.partyType === 'Customer' || p.partyType === 'Both');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(firstCustomer?.id ?? null);
  const [receiptDate, setReceiptDate] = useState(todayIsoDate());
  const [custAmountText, setCustAmountText] = useState('0');
  const [custPaymentMethod, setCustPaymentMethod] = useState<string>(state.settings.defaultPaymentMethod);
  const [custReference, setCustReference] = useState('');
  const [custNotes, setCustNotes] = useState('');
  const [custValidation, setCustValidation] = useState('');
  const [lastReceipt, setLastReceipt] = useState<CustomerReceipt | null>(null);

  // Supplier tab state
  const [supSearch, setSupSearch] = useState('');
  const [onlyWithPayable, setOnlyWithPayable] = useState(false);
  const firstSupplier = state.parties.find((p) => p.partyType === 'Supplier' || p.partyType === 'Both');
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(firstSupplier?.id ?? null);
  const [paymentDate, setPaymentDate] = useState(todayIsoDate());
  const [supAmountText, setSupAmountText] = useState('0');
  const [supPaymentMethod, setSupPaymentMethod] = useState<string>(state.settings.defaultPaymentMethod);
  const [supReference, setSupReference] = useState('');
  const [supNotes, setSupNotes] = useState('');
  const [supValidation, setSupValidation] = useState('');
  const [lastPayment, setLastPayment] = useState<SupplierPayment | null>(null);

  // Add Party Modal
  const [showPartyModal, setShowPartyModal] = useState(false);
  const [partyType, setPartyType] = useState<PartyType>('Customer');
  const [partyName, setPartyName] = useState('');
  const [partyPhone, setPartyPhone] = useState('');
  const [partyAddress, setPartyAddress] = useState('');
  const [partyOpeningText, setPartyOpeningText] = useState('0');

  const customerSummaries = state.parties
    .filter((p) => p.isActive && (p.partyType === 'Customer' || p.partyType === 'Both'))
    .map((p) => getCustomerSummary(state, p.id))
    .filter((s) => {
      if (onlyWithDue && s.currentDueMinor <= 0) return false;
      if (custSearch.trim()) {
        const q = custSearch.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.phone.toLowerCase().includes(q);
      }
      return true;
    });

  const supplierSummaries = state.parties
    .filter((p) => p.isActive && (p.partyType === 'Supplier' || p.partyType === 'Both'))
    .map((p) => getSupplierSummary(state, p.id))
    .filter((s) => {
      if (onlyWithPayable && s.currentPayableMinor <= 0) return false;
      if (supSearch.trim()) {
        const q = supSearch.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.phone.toLowerCase().includes(q);
      }
      return true;
    });

  const currentCustSummary = selectedCustomerId
    ? getCustomerSummary(state, selectedCustomerId)
    : null;
  const currentCustLedger = selectedCustomerId
    ? getCustomerLedger(state, selectedCustomerId)
    : [];

  const currentSupSummary = selectedSupplierId
    ? getSupplierSummary(state, selectedSupplierId)
    : null;
  const currentSupLedger = selectedSupplierId
    ? getSupplierLedger(state, selectedSupplierId)
    : [];

  const fillCustomerDue = () => {
    if (currentCustSummary) {
      setCustAmountText((currentCustSummary.currentDueMinor / 100).toFixed(2));
    }
  };

  const fillSupplierPayable = () => {
    if (currentSupSummary) {
      setSupAmountText((currentSupSummary.currentPayableMinor / 100).toFixed(2));
    }
  };

  const handleSaveReceipt = () => {
    setCustValidation('');
    if (!selectedCustomerId) {
      setCustValidation('Select a customer first.');
      return;
    }
    try {
      const amountMinor = Math.round((parseFloat(custAmountText) || 0) * 100);
      const saved = onCollectCustomerDue({
        customerId: selectedCustomerId,
        receiptDate,
        amountMinor,
        paymentMethod: custPaymentMethod,
        reference: custReference,
        notes: custNotes,
      });
      if (saved) {
        setLastReceipt(saved);
        setCustAmountText('0');
        setCustReference('');
        setCustNotes('');
      }
    } catch (err: any) {
      setCustValidation(err?.message || 'Could not save customer receipt.');
    }
  };

  const handleSavePayment = () => {
    setSupValidation('');
    if (!selectedSupplierId) {
      setSupValidation('Select a supplier first.');
      return;
    }
    try {
      const amountMinor = Math.round((parseFloat(supAmountText) || 0) * 100);
      const saved = onPaySupplierPayable({
        supplierId: selectedSupplierId,
        paymentDate,
        amountMinor,
        paymentMethod: supPaymentMethod,
        reference: supReference,
        notes: supNotes,
      });
      if (saved) {
        setLastPayment(saved);
        setSupAmountText('0');
        setSupReference('');
        setSupNotes('');
      }
    } catch (err: any) {
      setSupValidation(err?.message || 'Could not save supplier payment.');
    }
  };

  const handlePrintCustReceipt = () => {
    const r =
      lastReceipt ||
      state.customerReceipts.find((item) => item.customerId === selectedCustomerId);
    if (!r) return;
    const party = state.parties.find((p) => p.id === r.customerId) ?? null;
    onOpenPrintPreview(`Customer Receipt ${r.receiptNumber}`, (profile) =>
      renderCustomerReceiptHtml(r, party, state.settings, profile)
    );
  };

  const handlePrintCustStatement = () => {
    if (!selectedCustomerId || !currentCustSummary) return;
    const party = state.parties.find((p) => p.id === selectedCustomerId);
    if (!party) return;
    onOpenPrintPreview(`Customer Statement - ${party.name}`, (profile) =>
      renderPartyStatementHtml(
        'Customer Statement',
        party,
        currentCustSummary.currentDueMinor,
        currentCustLedger,
        state.settings,
        profile
      )
    );
  };

  const handlePrintSupPayment = () => {
    const p =
      lastPayment ||
      state.supplierPayments.find((item) => item.supplierId === selectedSupplierId);
    if (!p) return;
    const party = state.parties.find((item) => item.id === p.supplierId) ?? null;
    onOpenPrintPreview(`Supplier Payment ${p.paymentNumber}`, (profile) =>
      renderSupplierPaymentHtml(p, party, state.settings, profile)
    );
  };

  const handlePrintSupStatement = () => {
    if (!selectedSupplierId || !currentSupSummary) return;
    const party = state.parties.find((p) => p.id === selectedSupplierId);
    if (!party) return;
    onOpenPrintPreview(`Supplier Statement - ${party.name}`, (profile) =>
      renderPartyStatementHtml(
        'Supplier Statement',
        party,
        currentSupSummary.currentPayableMinor,
        currentSupLedger,
        state.settings,
        profile
      )
    );
  };

  return (
    <div className="space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-[26px] font-semibold leading-tight">Parties</h1>
          <p className="text-sm text-[var(--app-muted-text)]">
            Customer receivables, supplier payables, collections, payments, and running ledgers.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setPartyType(activePivot === 'Customers' ? 'Customer' : 'Supplier');
              setShowPartyModal(true);
            }}
            className="win-btn-primary"
          >
            Add party
          </button>
          <button type="button" onClick={fillCustomerDue} className="win-btn">
            Fill customer due
          </button>
          <button type="button" onClick={fillSupplierPayable} className="win-btn">
            Fill supplier payable
          </button>
        </div>
      </div>

      {/* Pivot Tabs */}
      <div className="flex gap-6 border-b border-[var(--app-border)]">
        {(['Customers', 'Suppliers'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActivePivot(tab)}
            className={`border-b-2 pb-2 text-sm font-semibold transition ${
              activePivot === tab
                ? 'border-emerald-600 text-[var(--app-text)]'
                : 'border-transparent text-[var(--app-muted-text)] hover:text-[var(--app-text)]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activePivot === 'Customers' ? (
        <div className="space-y-3.5">
          {/* Top Search & Action Bar */}
          <div className="win-panel flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-1 flex-wrap items-end gap-4">
              <div className="min-w-[240px] flex-1">
                <label className="win-label">Customer search (F3)</label>
                <input
                  ref={customerSearchRef}
                  type="text"
                  placeholder="Search by name or phone"
                  value={custSearch}
                  onChange={(e) => setCustSearch(e.target.value)}
                  className="win-input"
                />
              </div>
              <label className="flex items-center gap-2 pb-1.5 text-xs font-medium">
                <input
                  type="checkbox"
                  checked={onlyWithDue}
                  onChange={(e) => setOnlyWithDue(e.target.checked)}
                />
                Only with due
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={onRefresh} className="win-btn">
                Refresh
              </button>
              <button type="button" onClick={handleSaveReceipt} className="win-btn-primary">
                Save receipt
              </button>
              <button type="button" onClick={handlePrintCustReceipt} className="win-btn">
                Print
              </button>
              <button type="button" onClick={handlePrintCustStatement} className="win-btn">
                Statement
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-[380px_1fr]">
            {/* Customer List */}
            <div className="win-panel space-y-2.5">
              <h2 className="text-[17px] font-semibold">Customer due</h2>
              <div className="divide-y divide-[var(--app-border)] text-xs">
                {customerSummaries.map((cust) => (
                  <div
                    key={cust.customerId}
                    onClick={() => setSelectedCustomerId(cust.customerId)}
                    className={`cursor-pointer rounded px-2 py-2.5 transition ${
                      selectedCustomerId === cust.customerId
                        ? 'bg-[var(--app-muted-panel)]'
                        : 'hover:bg-[var(--app-muted-panel)]/50'
                    }`}
                  >
                    <div className="flex justify-between font-semibold">
                      <span className="truncate">{cust.name}</span>
                      <span>{formatMoney(cust.currentDueMinor, c)}</span>
                    </div>
                    <div className="mt-0.5 flex justify-between text-[var(--app-muted-text)]">
                      <span>{cust.phone || 'No phone'}</span>
                      <span>{cust.lastTransactionDate ? formatDateDisplay(cust.lastTransactionDate) : 'No tx'}</span>
                    </div>
                    <div className="mt-1 flex gap-3 text-[11px] text-[var(--app-muted-text)]">
                      <span>Sales: {formatMoney(cust.totalSalesMinor, c)}</span>
                      <span>Paid: {formatMoney(cust.totalPaidMinor, c)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Collect Due & Customer Ledger */}
            <div className="space-y-3.5">
              <div className="win-panel space-y-3">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div>
                    <div className="text-[17px] font-semibold">Collect due</div>
                    <div className="truncate text-xs font-semibold">
                      {currentCustSummary?.name || 'None selected'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--app-muted-text)]">Total sales</div>
                    <div className="text-sm font-semibold">
                      {formatMoney(currentCustSummary?.totalSalesMinor ?? 0, c)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--app-muted-text)]">Total paid</div>
                    <div className="text-sm font-semibold">
                      {formatMoney(currentCustSummary?.totalPaidMinor ?? 0, c)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--app-muted-text)]">Current due</div>
                    <div className="text-sm font-semibold">
                      {formatMoney(currentCustSummary?.currentDueMinor ?? 0, c)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_150px_150px_auto]">
                  <div>
                    <label className="win-label">Receipt date</label>
                    <input
                      type="date"
                      value={receiptDate}
                      onChange={(e) => setReceiptDate(e.target.value)}
                      className="win-input"
                    />
                  </div>
                  <div>
                    <label className="win-label">Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={custAmountText}
                      onChange={(e) => setCustAmountText(e.target.value)}
                      className="win-input"
                    />
                  </div>
                  <div>
                    <label className="win-label">Payment method</label>
                    <select
                      value={custPaymentMethod}
                      onChange={(e) => setCustPaymentMethod(e.target.value)}
                      className="win-input"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Card">Card</option>
                      <option value="Mobile">Mobile</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button type="button" onClick={fillCustomerDue} className="win-btn w-full">
                      Fill due
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_2fr_auto]">
                  <div>
                    <label className="win-label">Reference</label>
                    <input
                      type="text"
                      placeholder="Optional"
                      value={custReference}
                      onChange={(e) => setCustReference(e.target.value)}
                      className="win-input"
                    />
                  </div>
                  <div>
                    <label className="win-label">Notes</label>
                    <input
                      type="text"
                      placeholder="Optional collection note"
                      value={custNotes}
                      onChange={(e) => setCustNotes(e.target.value)}
                      className="win-input"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <button type="button" onClick={handleSaveReceipt} className="win-btn-primary">
                      Save
                    </button>
                    <button type="button" onClick={handlePrintCustReceipt} className="win-btn">
                      Print
                    </button>
                    <button type="button" onClick={handlePrintCustStatement} className="win-btn">
                      Statement
                    </button>
                  </div>
                </div>

                {custValidation && (
                  <div className="rounded border border-amber-500/40 bg-[var(--app-warning-soft)] px-3 py-2 text-xs font-medium">
                    {custValidation}
                  </div>
                )}

                {lastReceipt && (
                  <div className="rounded bg-[var(--app-accent-soft)] px-3 py-2 text-xs">
                    Saved receipt <strong>{lastReceipt.receiptNumber}</strong> ({formatMoney(lastReceipt.amountMinor, c)})
                  </div>
                )}
              </div>

              <div className="win-panel space-y-2.5 overflow-x-auto">
                <h2 className="text-[17px] font-semibold">Customer ledger</h2>
                <div className="min-w-[640px]">
                  <div className="grid grid-cols-[110px_110px_1fr_105px_105px_115px_70px] gap-2 border-b border-[var(--app-border)] px-1 pb-2 text-xs font-semibold">
                    <span>Date</span>
                    <span>Reference</span>
                    <span>Description</span>
                    <span className="text-right">Debit</span>
                    <span className="text-right">Credit</span>
                    <span className="text-right">Balance</span>
                    <span />
                  </div>
                  <div className="divide-y divide-[var(--app-border)] text-xs">
                    {currentCustLedger.map((line, idx) => (
                      <div
                        key={`${line.referenceNumber}-${idx}`}
                        className="grid grid-cols-[110px_110px_1fr_105px_105px_115px_70px] items-center gap-2 px-1 py-2"
                      >
                        <span>{formatDateDisplay(line.transactionDate)}</span>
                        <span className="font-mono text-[11px]">{line.referenceNumber}</span>
                        <span className="truncate">{line.description}</span>
                        <span className="text-right">{formatMoney(line.debitMinor, c)}</span>
                        <span className="text-right">{formatMoney(line.creditMinor, c)}</span>
                        <span className="text-right font-semibold">
                          {formatMoney(line.runningBalanceMinor, c)}
                        </span>
                        <div className="text-right">
                          {line.canCancel && line.referenceType && line.referenceId && (
                            <button
                              type="button"
                              onClick={() =>
                                onCancelTransaction(
                                  line.referenceType as any,
                                  line.referenceId!,
                                  'Reversed from customer ledger'
                                )
                              }
                              className="win-btn px-2 py-0.5 text-[11px] text-rose-600"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3.5">
          {/* Suppliers Tab */}
          <div className="win-panel flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-1 flex-wrap items-end gap-4">
              <div className="min-w-[240px] flex-1">
                <label className="win-label">Supplier search</label>
                <input
                  type="text"
                  placeholder="Search by name or phone"
                  value={supSearch}
                  onChange={(e) => setSupSearch(e.target.value)}
                  className="win-input"
                />
              </div>
              <label className="flex items-center gap-2 pb-1.5 text-xs font-medium">
                <input
                  type="checkbox"
                  checked={onlyWithPayable}
                  onChange={(e) => setOnlyWithPayable(e.target.checked)}
                />
                Only with payable
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={onRefresh} className="win-btn">
                Refresh
              </button>
              <button type="button" onClick={handleSavePayment} className="win-btn-primary">
                Save payment
              </button>
              <button type="button" onClick={handlePrintSupPayment} className="win-btn">
                Print
              </button>
              <button type="button" onClick={handlePrintSupStatement} className="win-btn">
                Statement
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-[380px_1fr]">
            <div className="win-panel space-y-2.5">
              <h2 className="text-[17px] font-semibold">Supplier payable</h2>
              <div className="divide-y divide-[var(--app-border)] text-xs">
                {supplierSummaries.map((sup) => (
                  <div
                    key={sup.supplierId}
                    onClick={() => setSelectedSupplierId(sup.supplierId)}
                    className={`cursor-pointer rounded px-2 py-2.5 transition ${
                      selectedSupplierId === sup.supplierId
                        ? 'bg-[var(--app-muted-panel)]'
                        : 'hover:bg-[var(--app-muted-panel)]/50'
                    }`}
                  >
                    <div className="flex justify-between font-semibold">
                      <span className="truncate">{sup.name}</span>
                      <span>{formatMoney(sup.currentPayableMinor, c)}</span>
                    </div>
                    <div className="mt-0.5 flex justify-between text-[var(--app-muted-text)]">
                      <span>{sup.phone || 'No phone'}</span>
                      <span>{sup.lastTransactionDate ? formatDateDisplay(sup.lastTransactionDate) : 'No tx'}</span>
                    </div>
                    <div className="mt-1 flex gap-3 text-[11px] text-[var(--app-muted-text)]">
                      <span>Purchases: {formatMoney(sup.totalPurchasesMinor, c)}</span>
                      <span>Paid: {formatMoney(sup.totalPaidMinor, c)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3.5">
              <div className="win-panel space-y-3">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div>
                    <div className="text-[17px] font-semibold">Pay supplier</div>
                    <div className="truncate text-xs font-semibold">
                      {currentSupSummary?.name || 'None selected'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--app-muted-text)]">Total purchases</div>
                    <div className="text-sm font-semibold">
                      {formatMoney(currentSupSummary?.totalPurchasesMinor ?? 0, c)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--app-muted-text)]">Total paid</div>
                    <div className="text-sm font-semibold">
                      {formatMoney(currentSupSummary?.totalPaidMinor ?? 0, c)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--app-muted-text)]">Current payable</div>
                    <div className="text-sm font-semibold">
                      {formatMoney(currentSupSummary?.currentPayableMinor ?? 0, c)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_150px_150px_auto]">
                  <div>
                    <label className="win-label">Payment date</label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="win-input"
                    />
                  </div>
                  <div>
                    <label className="win-label">Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={supAmountText}
                      onChange={(e) => setSupAmountText(e.target.value)}
                      className="win-input"
                    />
                  </div>
                  <div>
                    <label className="win-label">Payment method</label>
                    <select
                      value={supPaymentMethod}
                      onChange={(e) => setSupPaymentMethod(e.target.value)}
                      className="win-input"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Card">Card</option>
                      <option value="Mobile">Mobile</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button type="button" onClick={fillSupplierPayable} className="win-btn w-full">
                      Fill payable
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_2fr_auto]">
                  <div>
                    <label className="win-label">Reference</label>
                    <input
                      type="text"
                      placeholder="Optional"
                      value={supReference}
                      onChange={(e) => setSupReference(e.target.value)}
                      className="win-input"
                    />
                  </div>
                  <div>
                    <label className="win-label">Notes</label>
                    <input
                      type="text"
                      placeholder="Optional payment note"
                      value={supNotes}
                      onChange={(e) => setSupNotes(e.target.value)}
                      className="win-input"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <button type="button" onClick={handleSavePayment} className="win-btn-primary">
                      Save
                    </button>
                    <button type="button" onClick={handlePrintSupPayment} className="win-btn">
                      Print
                    </button>
                    <button type="button" onClick={handlePrintSupStatement} className="win-btn">
                      Statement
                    </button>
                  </div>
                </div>

                {supValidation && (
                  <div className="rounded border border-amber-500/40 bg-[var(--app-warning-soft)] px-3 py-2 text-xs font-medium">
                    {supValidation}
                  </div>
                )}

                {lastPayment && (
                  <div className="rounded bg-[var(--app-accent-soft)] px-3 py-2 text-xs">
                    Saved payment <strong>{lastPayment.paymentNumber}</strong> ({formatMoney(lastPayment.amountMinor, c)})
                  </div>
                )}
              </div>

              <div className="win-panel space-y-2.5 overflow-x-auto">
                <h2 className="text-[17px] font-semibold">Supplier ledger</h2>
                <div className="min-w-[640px]">
                  <div className="grid grid-cols-[110px_110px_1fr_105px_105px_115px_70px] gap-2 border-b border-[var(--app-border)] px-1 pb-2 text-xs font-semibold">
                    <span>Date</span>
                    <span>Reference</span>
                    <span>Description</span>
                    <span className="text-right">Debit</span>
                    <span className="text-right">Credit</span>
                    <span className="text-right">Balance</span>
                    <span />
                  </div>
                  <div className="divide-y divide-[var(--app-border)] text-xs">
                    {currentSupLedger.map((line, idx) => (
                      <div
                        key={`${line.referenceNumber}-${idx}`}
                        className="grid grid-cols-[110px_110px_1fr_105px_105px_115px_70px] items-center gap-2 px-1 py-2"
                      >
                        <span>{formatDateDisplay(line.transactionDate)}</span>
                        <span className="font-mono text-[11px]">{line.referenceNumber}</span>
                        <span className="truncate">{line.description}</span>
                        <span className="text-right">{formatMoney(line.debitMinor, c)}</span>
                        <span className="text-right">{formatMoney(line.creditMinor, c)}</span>
                        <span className="text-right font-semibold">
                          {formatMoney(line.runningBalanceMinor, c)}
                        </span>
                        <div className="text-right">
                          {line.canCancel && line.referenceType && line.referenceId && (
                            <button
                              type="button"
                              onClick={() =>
                                onCancelTransaction(
                                  line.referenceType as any,
                                  line.referenceId!,
                                  'Reversed from supplier ledger'
                                )
                              }
                              className="win-btn px-2 py-0.5 text-[11px] text-rose-600"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Party Modal */}
      {showPartyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="win-panel w-full max-w-md space-y-3 shadow-xl">
            <h3 className="text-base font-semibold">Add Party</h3>
            <div>
              <label className="win-label">Party type</label>
              <select
                value={partyType}
                onChange={(e) => setPartyType(e.target.value as PartyType)}
                className="win-input"
              >
                <option value="Customer">Customer</option>
                <option value="Supplier">Supplier</option>
                <option value="Both">Both (Customer &amp; Supplier)</option>
              </select>
            </div>
            <div>
              <label className="win-label">Name *</label>
              <input
                type="text"
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
                className="win-input"
              />
            </div>
            <div>
              <label className="win-label">Phone</label>
              <input
                type="text"
                value={partyPhone}
                onChange={(e) => setPartyPhone(e.target.value)}
                className="win-input"
              />
            </div>
            <div>
              <label className="win-label">Address</label>
              <input
                type="text"
                value={partyAddress}
                onChange={(e) => setPartyAddress(e.target.value)}
                className="win-input"
              />
            </div>
            <div>
              <label className="win-label">Opening balance ({c})</label>
              <input
                type="number"
                step="0.01"
                value={partyOpeningText}
                onChange={(e) => setPartyOpeningText(e.target.value)}
                className="win-input"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPartyModal(false)}
                className="win-btn"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!partyName.trim()) return;
                  const created = onSaveParty({
                    partyType,
                    name: partyName.trim(),
                    phone: partyPhone.trim(),
                    address: partyAddress.trim(),
                    openingBalanceMinor: Math.round((parseFloat(partyOpeningText) || 0) * 100),
                  });
                  if (partyType === 'Customer' || partyType === 'Both') {
                    setSelectedCustomerId(created.id);
                  } else {
                    setSelectedSupplierId(created.id);
                  }
                  setPartyName('');
                  setPartyPhone('');
                  setPartyAddress('');
                  setPartyOpeningText('0');
                  setShowPartyModal(false);
                }}
                className="win-btn-primary"
              >
                Save Party
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
