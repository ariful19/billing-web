import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { AppDatabaseState, CashTransaction, CashTransactionType } from '../types';
import { todayIsoDate } from '../services/billingEngine';
import { formatDateDisplay, formatMoney } from '../utils/htmlPrintRenderer';

interface CashBookPageProps {
  state: AppDatabaseState;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  onCreateManualCashEntry: (input: {
    entryDate: string;
    entryType: 'GeneralExpense' | 'OtherIncome' | 'OwnerCapital' | 'OwnerWithdrawal' | 'CashAdjustment';
    direction?: 'In' | 'Out';
    amountMinor: number;
    paymentMethod: string;
    reference: string;
    description: string;
    notes: string;
  }) => CashTransaction | null;
  onRefresh: () => void;
}

export const CashBookPage: React.FC<CashBookPageProps> = ({
  state,
  searchInputRef,
  onCreateManualCashEntry,
  onRefresh,
}) => {
  const c = state.settings.currencyCode;
  const today = todayIsoDate();

  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [typeFilter, setTypeFilter] = useState<'All' | CashTransactionType>('All');
  const [searchText, setSearchText] = useState('');

  const [showEntryPanel, setShowEntryPanel] = useState(true);
  const [entryDate, setEntryDate] = useState(today);
  const [entryType, setEntryType] = useState<
    'GeneralExpense' | 'OtherIncome' | 'OwnerCapital' | 'OwnerWithdrawal' | 'CashAdjustment'
  >('GeneralExpense');
  const [amountText, setAmountText] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState<string>(state.settings.defaultPaymentMethod);
  const [reference, setReference] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [validationMessage, setValidationMessage] = useState('');
  const [lastEntryText, setLastEntryText] = useState('');

  const sortedAll = [...state.cashTransactions].sort(
    (a, b) => a.transactionDate.localeCompare(b.transactionDate) || a.id - b.id
  );

  let openingCashMinor = 0;
  let running = 0;
  const linesWithRunning = sortedAll.map((tx) => {
    if (tx.transactionDate < fromDate) {
      openingCashMinor += tx.cashInMinor - tx.cashOutMinor;
    }
    running += tx.cashInMinor - tx.cashOutMinor;
    return {
      ...tx,
      runningBalanceMinor: running,
    };
  });

  const periodLines = linesWithRunning.filter((tx) => {
    if (fromDate && tx.transactionDate < fromDate) return false;
    if (toDate && tx.transactionDate > toDate) return false;
    if (typeFilter !== 'All' && tx.transactionType !== typeFilter) return false;
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      return (
        tx.referenceNumber.toLowerCase().includes(q) ||
        tx.description.toLowerCase().includes(q) ||
        tx.reference.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const cashInMinor = periodLines.reduce((acc, tx) => acc + tx.cashInMinor, 0);
  const cashOutMinor = periodLines.reduce((acc, tx) => acc + tx.cashOutMinor, 0);
  const closingCashMinor = openingCashMinor + cashInMinor - cashOutMinor;

  const handleSaveEntry = () => {
    setValidationMessage('');
    try {
      const amountMinor = Math.round((parseFloat(amountText) || 0) * 100);
      const saved = onCreateManualCashEntry({
        entryDate,
        entryType,
        amountMinor,
        paymentMethod,
        reference,
        description,
        notes,
      });
      if (saved) {
        setLastEntryText(
          `Saved ${saved.transactionNumber}: ${saved.transactionType} (${formatMoney(amountMinor, c)})`
        );
        setAmountText('0');
        setReference('');
        setDescription('');
        setNotes('');
      }
    } catch (err: any) {
      setValidationMessage(err?.message || 'Could not save manual cash entry.');
    }
  };

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[26px] font-semibold leading-tight">Cash Book</h1>
          <p className="text-sm text-[var(--app-muted-text)]">
            Cash in, cash out, running balance, and manual cash entries.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            className="win-btn p-2"
            title="Refresh cash book (F5)"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setShowEntryPanel(true)}
            className="win-btn-primary"
          >
            Add cash entry
          </button>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="win-panel">
          <div className="text-xs text-[var(--app-muted-text)]">Opening cash</div>
          <div className="mt-1 text-xl font-semibold">{formatMoney(openingCashMinor, c)}</div>
        </div>
        <div className="win-panel">
          <div className="text-xs text-[var(--app-muted-text)]">Cash in</div>
          <div className="mt-1 text-xl font-semibold">{formatMoney(cashInMinor, c)}</div>
        </div>
        <div className="win-panel">
          <div className="text-xs text-[var(--app-muted-text)]">Cash out</div>
          <div className="mt-1 text-xl font-semibold">{formatMoney(cashOutMinor, c)}</div>
        </div>
        <div className="win-panel">
          <div className="text-xs text-[var(--app-muted-text)]">Closing cash</div>
          <div className="mt-1 text-xl font-semibold">{formatMoney(closingCashMinor, c)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-[2fr_1.1fr]">
        {/* Cash Book Table */}
        <div className="win-panel space-y-3 overflow-x-auto">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[145px_145px_1.3fr_2fr_auto]">
            <div>
              <label className="win-label">From</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="win-input"
              />
            </div>
            <div>
              <label className="win-label">To</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="win-input"
              />
            </div>
            <div>
              <label className="win-label">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="win-input"
              >
                <option value="All">All types</option>
                <option value="CashSale">Cash sale</option>
                <option value="CustomerReceipt">Customer receipt</option>
                <option value="CashPurchase">Cash purchase</option>
                <option value="SupplierPayment">Supplier payment</option>
                <option value="GeneralExpense">General expense</option>
                <option value="OtherIncome">Other income</option>
                <option value="OwnerCapital">Owner capital</option>
                <option value="OwnerWithdrawal">Owner withdrawal</option>
                <option value="CashAdjustment">Cash adjustment</option>
              </select>
            </div>
            <div>
              <label className="win-label">Search (F2)</label>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Reference or description"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="win-input"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => {
                  setFromDate('');
                  setToDate('');
                  setTypeFilter('All');
                  setSearchText('');
                }}
                className="win-btn"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="min-w-[680px]">
            <div className="grid grid-cols-[105px_110px_125px_1fr_105px_105px_115px] gap-2 border-b border-[var(--app-border)] px-1 pb-2 text-xs font-semibold">
              <span>Date</span>
              <span>Reference</span>
              <span>Type</span>
              <span>Description</span>
              <span className="text-right">Cash in</span>
              <span className="text-right">Cash out</span>
              <span className="text-right">Balance</span>
            </div>

            <div className="divide-y divide-[var(--app-border)] text-xs">
              {periodLines.map((tx) => (
                <div
                  key={tx.id}
                  className="grid grid-cols-[105px_110px_125px_1fr_105px_105px_115px] items-center gap-2 px-1 py-2"
                >
                  <span>{formatDateDisplay(tx.transactionDate)}</span>
                  <span className="font-mono text-[11px]">{tx.referenceNumber}</span>
                  <span>{tx.transactionType}</span>
                  <span className="truncate">{tx.description}</span>
                  <span className="text-right">
                    {tx.cashInMinor > 0 ? formatMoney(tx.cashInMinor, c) : '-'}
                  </span>
                  <span className="text-right">
                    {tx.cashOutMinor > 0 ? formatMoney(tx.cashOutMinor, c) : '-'}
                  </span>
                  <span className="text-right font-semibold">
                    {formatMoney(tx.runningBalanceMinor, c)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {lastEntryText && (
            <div className="pt-1 text-xs text-[var(--app-muted-text)]">{lastEntryText}</div>
          )}
        </div>

        {/* Manual Cash Entry Panel */}
        {showEntryPanel && (
          <div className="win-panel space-y-3">
            <div>
              <h2 className="text-[17px] font-semibold">Manual cash entry</h2>
              <p className="text-xs text-[var(--app-muted-text)]">
                Posts cash movement and a balanced journal.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="win-label">Date</label>
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="win-input"
                />
              </div>
              <div>
                <label className="win-label">Entry type</label>
                <select
                  value={entryType}
                  onChange={(e) => setEntryType(e.target.value as any)}
                  className="win-input"
                >
                  <option value="GeneralExpense">General Expense (Cash Out)</option>
                  <option value="OtherIncome">Other Income (Cash In)</option>
                  <option value="OwnerCapital">Owner Capital (Cash In)</option>
                  <option value="OwnerWithdrawal">Owner Withdrawal (Cash Out)</option>
                  <option value="CashAdjustment">Cash Adjustment</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="win-label">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={amountText}
                  onChange={(e) => setAmountText(e.target.value)}
                  className="win-input"
                />
              </div>
              <div>
                <label className="win-label">Payment method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="win-input"
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Mobile">Mobile</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="win-label">Reference</label>
                <input
                  type="text"
                  placeholder="Optional"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="win-input"
                />
              </div>
              <div>
                <label className="win-label">Description *</label>
                <input
                  type="text"
                  placeholder="Required"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="win-input"
                />
              </div>
            </div>

            <div>
              <label className="win-label">Notes</label>
              <input
                type="text"
                placeholder="Optional"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="win-input"
              />
            </div>

            {validationMessage && (
              <div className="rounded border border-amber-500/40 bg-[var(--app-warning-soft)] px-3 py-2 text-xs font-medium">
                {validationMessage}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={handleSaveEntry} className="win-btn-primary">
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setAmountText('0');
                  setReference('');
                  setDescription('');
                  setNotes('');
                  setValidationMessage('');
                }}
                className="win-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
