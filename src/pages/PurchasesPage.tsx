import React, { useState } from 'react';
import { PackagePlus, ChevronRight } from 'lucide-react';
import { AppDatabaseState, Party, PrintProfile, Purchase } from '../types';
import { getSupplierSummary, todayIsoDate } from '../services/billingEngine';
import { formatDateDisplay, formatMoney, formatQty, renderPurchaseReceiptHtml } from '../utils/htmlPrintRenderer';

interface PurchaseCartLine {
  id: string;
  productId: number;
  productName: string;
  unitCode: string;
  quantityText: string;
  unitPurchasePriceText: string;
}

interface PurchasesPageProps {
  state: AppDatabaseState;
  productSearchRef: React.RefObject<HTMLInputElement | null>;
  onCreatePurchase: (input: {
    supplierId: number;
    supplierInvoiceNumber: string;
    purchaseDate: string;
    paidAmountMinor: number;
    notes: string;
    lines: { productId: number; quantity: number; unitPurchasePriceMinor: number }[];
  }) => Purchase | null;
  onAddSupplier: (party: { name: string; phone: string; address: string; openingBalanceMinor: number }) => Party;
  onCancelPurchase: (purchaseId: number, reason: string) => void;
  onOpenPrintPreview: (title: string, render: (profile: PrintProfile) => string) => void;
  onRefresh: () => void;
}

export const PurchasesPage: React.FC<PurchasesPageProps> = ({
  state,
  productSearchRef,
  onCreatePurchase,
  onAddSupplier,
  onCancelPurchase,
  onOpenPrintPreview,
  onRefresh,
}) => {
  const c = state.settings.currencyCode;
  const [supplierSearch, setSupplierSearch] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | ''>(
    state.parties.find((p) => p.partyType === 'Supplier' || p.partyType === 'Both')?.id ?? ''
  );
  const [purchaseDate, setPurchaseDate] = useState(todayIsoDate());
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState('');
  const [paidAmountText, setPaidAmountText] = useState('0');
  const [notes, setNotes] = useState('');

  const [productSearch, setProductSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [newLineQtyText, setNewLineQtyText] = useState('1');
  const [newLinePriceText, setNewLinePriceText] = useState('');

  const [lines, setLines] = useState<PurchaseCartLine[]>([]);
  const [validationMessage, setValidationMessage] = useState('');
  const [lastSavedPurchase, setLastSavedPurchase] = useState<Purchase | null>(null);

  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [newSupName, setNewSupName] = useState('');
  const [newSupPhone, setNewSupPhone] = useState('');
  const [newSupAddress, setNewSupAddress] = useState('');

  const [cancelTargetPurchase, setCancelTargetPurchase] = useState<Purchase | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [showAllPurchasesModal, setShowAllPurchasesModal] = useState(false);

  const suppliers = state.parties.filter(
    (p) =>
      p.isActive &&
      (p.partyType === 'Supplier' || p.partyType === 'Both') &&
      (!supplierSearch.trim() ||
        p.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
        p.phone.toLowerCase().includes(supplierSearch.toLowerCase()))
  );

  const activeProducts = state.products.filter((p) => {
    if (!p.isActive) return false;
    if (!productSearch.trim()) return true;
    const q = productSearch.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.barcode.toLowerCase().includes(q)
    );
  });

  const handleSelectProduct = (prodId: number | '') => {
    setSelectedProductId(prodId);
    if (prodId !== '') {
      const p = state.products.find((item) => item.id === prodId);
      if (p) {
        setNewLinePriceText((p.purchasePriceMinor / 100).toFixed(2));
      }
    } else {
      setNewLinePriceText('');
    }
  };

  const handleAddLine = () => {
    setValidationMessage('');
    const prod =
      state.products.find((p) => p.id === Number(selectedProductId)) ||
      (productSearch.trim() ? activeProducts[0] : undefined);

    if (!prod) {
      setValidationMessage('Select a product to add.');
      return;
    }

    const qty = parseFloat(newLineQtyText);
    if (Number.isNaN(qty) || qty <= 0) {
      setValidationMessage('Enter a valid quantity greater than zero.');
      return;
    }

    const priceMinor =
      newLinePriceText.trim() !== ''
        ? Math.round(parseFloat(newLinePriceText) * 100)
        : prod.purchasePriceMinor;

    if (Number.isNaN(priceMinor) || priceMinor < 0) {
      setValidationMessage('Enter a valid non-negative purchase price.');
      return;
    }

    const unit = state.units.find((u) => u.id === prod.unitId);

    setLines((prev) => [
      ...prev,
      {
        id: `${prod.id}-${Date.now()}`,
        productId: prod.id,
        productName: prod.name,
        unitCode: unit?.code || 'pcs',
        quantityText: String(qty),
        unitPurchasePriceText: (priceMinor / 100).toFixed(2),
      },
    ]);
    setProductSearch('');
    setSelectedProductId('');
    setNewLineQtyText('1');
    setNewLinePriceText('');
  };

  const grossTotalMinor = lines.reduce((acc, l) => {
    const q = parseFloat(l.quantityText) || 0;
    const pr = Math.round((parseFloat(l.unitPurchasePriceText) || 0) * 100);
    return acc + Math.round(q * pr);
  }, 0);
  const paidMinor = Math.round((parseFloat(paidAmountText) || 0) * 100);
  const dueMinor = Math.max(0, grossTotalMinor - paidMinor);

  const prevPayableMinor =
    selectedSupplierId !== ''
      ? getSupplierSummary(state, Number(selectedSupplierId)).currentPayableMinor
      : 0;
  const updatedPayableMinor =
    selectedSupplierId !== '' ? prevPayableMinor + dueMinor : 0;

  const clearEntry = () => {
    setLines([]);
    setSupplierInvoiceNumber('');
    setPaidAmountText('0');
    setNotes('');
    setValidationMessage('');
  };

  const executeSave = (printAfter: boolean) => {
    setValidationMessage('');
    try {
      const parsedLines = lines.map((l) => ({
        productId: l.productId,
        quantity: parseFloat(l.quantityText) || 0,
        unitPurchasePriceMinor: Math.round((parseFloat(l.unitPurchasePriceText) || 0) * 100),
      }));

      const saved = onCreatePurchase({
        supplierId: Number(selectedSupplierId),
        supplierInvoiceNumber,
        purchaseDate,
        paidAmountMinor: paidMinor,
        notes,
        lines: parsedLines,
      });

      if (saved) {
        setLastSavedPurchase(saved);
        clearEntry();
        if (printAfter) {
          const sup = state.parties.find((p) => p.id === saved.supplierId) ?? null;
          onOpenPrintPreview(`Purchase Receipt ${saved.purchaseNumber}`, (profile) =>
            renderPurchaseReceiptHtml(saved, sup, state.settings, profile)
          );
        }
      }
    } catch (err: any) {
      setValidationMessage(err?.message || 'Unable to save purchase.');
    }
  };

  const handlePrintPurchase = (purchase: Purchase) => {
    const sup = state.parties.find((p) => p.id === purchase.supplierId) ?? null;
    onOpenPrintPreview(`Purchase Receipt ${purchase.purchaseNumber}`, (profile) =>
      renderPurchaseReceiptHtml(purchase, sup, state.settings, profile)
    );
  };

  return (
    <div className="space-y-3.5">
      <div>
        <h1 className="text-[26px] font-semibold leading-tight">Purchases</h1>
        <p className="text-sm text-[var(--app-muted-text)]">
          Supplier purchase entry, stock increase, payable creation, and automatic journal posting.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-[1fr_340px]">
        {/* Left Column */}
        <div className="space-y-3.5">
          <div className="win-panel space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[2fr_auto_1fr_1fr_1.5fr]">
              <div>
                <label className="win-label">Supplier search</label>
                <input
                  type="text"
                  placeholder="Search by name or phone"
                  value={supplierSearch}
                  onChange={(e) => setSupplierSearch(e.target.value)}
                  className="win-input"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => setShowAddSupplierModal(true)}
                  className="win-btn whitespace-nowrap"
                >
                  Add supplier
                </button>
              </div>
              <div>
                <label className="win-label">Purchase date</label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="win-input"
                />
              </div>
              <div>
                <label className="win-label">Supplier invoice</label>
                <input
                  type="text"
                  placeholder="Optional"
                  value={supplierInvoiceNumber}
                  onChange={(e) => setSupplierInvoiceNumber(e.target.value)}
                  className="win-input"
                />
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="win-label">Paid amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={paidAmountText}
                    onChange={(e) => setPaidAmountText(e.target.value)}
                    className="win-input"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => executeSave(true)}
                  className="win-btn-primary whitespace-nowrap"
                >
                  Save and print
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[2fr_3fr]">
              <div>
                <label className="win-label">Supplier</label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) =>
                    setSelectedSupplierId(e.target.value ? Number(e.target.value) : '')
                  }
                  className="win-input"
                >
                  <option value="">Select supplier</option>
                  {suppliers.map((sup) => (
                    <option key={sup.id} value={sup.id}>
                      {sup.name} {sup.phone ? `(${sup.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="win-label">Notes</label>
                <input
                  type="text"
                  placeholder="Optional purchase note"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="win-input"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button type="button" onClick={onRefresh} className="win-btn">
                Refresh
              </button>
              <button type="button" onClick={() => executeSave(false)} className="win-btn-primary">
                Save purchase
              </button>
            </div>
          </div>

          <div className="win-panel flex min-h-[400px] flex-col space-y-3">
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[2fr_2fr_110px_130px_auto]">
              <div>
                <label className="win-label">Product search (F2)</label>
                <input
                  ref={productSearchRef}
                  type="text"
                  placeholder="Search by name, SKU, barcode, or category"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="win-input"
                />
              </div>
              <div>
                <label className="win-label">Product</label>
                <select
                  value={selectedProductId}
                  onChange={(e) =>
                    handleSelectProduct(e.target.value ? Number(e.target.value) : '')
                  }
                  className="win-input"
                >
                  <option value="">Select product</option>
                  {activeProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Cost: {formatMoney(p.purchasePriceMinor, c)})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="win-label">Quantity</label>
                <input
                  type="number"
                  step="any"
                  value={newLineQtyText}
                  onChange={(e) => setNewLineQtyText(e.target.value)}
                  className="win-input"
                />
              </div>
              <div>
                <label className="win-label">Purchase price</label>
                <input
                  type="number"
                  step="0.01"
                  value={newLinePriceText}
                  onChange={(e) => setNewLinePriceText(e.target.value)}
                  placeholder="Cost"
                  className="win-input"
                />
              </div>
              <div className="flex items-end">
                <button type="button" onClick={handleAddLine} className="win-btn whitespace-nowrap">
                  Add item
                </button>
              </div>
            </div>

            {validationMessage && (
              <div className="rounded border border-amber-500/40 bg-[var(--app-warning-soft)] px-3 py-2 text-xs font-medium">
                <strong className="mr-1.5">Check purchase details:</strong>
                {validationMessage}
              </div>
            )}

            <div className="grid grid-cols-[2fr_100px_120px_120px_auto] gap-2 border-b border-[var(--app-border)] px-1 pb-2 text-xs font-semibold">
              <span>Product</span>
              <span>Quantity</span>
              <span>Price</span>
              <span>Line total</span>
              <span />
            </div>

            {lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--app-muted-panel)] text-[var(--app-muted-text)]">
                  <PackagePlus className="h-7 w-7" />
                </div>
                <div className="mt-3 text-base font-semibold">No items added</div>
                <div className="text-xs text-[var(--app-muted-text)]">
                  Search and add a product to get started.
                </div>
              </div>
            ) : (
              <div className="divide-y divide-[var(--app-border)]">
                {lines.map((line) => {
                  const qty = parseFloat(line.quantityText) || 0;
                  const priceMinor = Math.round((parseFloat(line.unitPurchasePriceText) || 0) * 100);
                  const lineTotalMinor = Math.round(qty * priceMinor);
                  return (
                    <div
                      key={line.id}
                      className="grid grid-cols-[2fr_100px_120px_120px_auto] items-center gap-2 px-1 py-2 text-xs"
                    >
                      <div>
                        <div className="font-semibold">{line.productName}</div>
                        <div className="text-[11px] text-[var(--app-muted-text)]">{line.unitCode}</div>
                      </div>
                      <input
                        type="number"
                        step="any"
                        value={line.quantityText}
                        onChange={(e) => {
                          const val = e.target.value;
                          setLines((prev) =>
                            prev.map((item) =>
                              item.id === line.id ? { ...item, quantityText: val } : item
                            )
                          );
                        }}
                        className="win-input py-1 text-xs"
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={line.unitPurchasePriceText}
                        onChange={(e) => {
                          const val = e.target.value;
                          setLines((prev) =>
                            prev.map((item) =>
                              item.id === line.id ? { ...item, unitPurchasePriceText: val } : item
                            )
                          );
                        }}
                        className="win-input py-1 text-xs"
                      />
                      <div className="font-semibold">{formatMoney(lineTotalMinor, c)}</div>
                      <button
                        type="button"
                        onClick={() => setLines((prev) => prev.filter((i) => i.id !== line.id))}
                        className="win-btn px-2 py-1 text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-3.5">
          <div className="win-panel space-y-3">
            <h2 className="text-[17px] font-semibold">Payment summary</h2>
            {lastSavedPurchase && (
              <div className="rounded bg-[var(--app-accent-soft)] px-3 py-2 text-xs">
                Saved <strong>{lastSavedPurchase.purchaseNumber}</strong> ({formatMoney(lastSavedPurchase.totalAmountMinor, c)})
              </div>
            )}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span>Gross total</span>
                <span className="font-semibold">{formatMoney(grossTotalMinor, c)}</span>
              </div>
              <div className="flex justify-between">
                <span>Paid</span>
                <span>{formatMoney(paidMinor, c)}</span>
              </div>
              <div className="flex justify-between">
                <span>Supplier due</span>
                <span className="font-semibold">{formatMoney(dueMinor, c)}</span>
              </div>
              <div className="flex justify-between">
                <span>Previous payable</span>
                <span>{formatMoney(prevPayableMinor, c)}</span>
              </div>
              <div className="flex justify-between">
                <span>Updated payable</span>
                <span className="font-semibold">{formatMoney(updatedPayableMinor, c)}</span>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => executeSave(false)} className="win-btn-primary">
                Save purchase
              </button>
              <button type="button" onClick={clearEntry} className="win-btn">
                Clear
              </button>
            </div>
          </div>

          <div className="win-panel flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[17px] font-semibold">Recent purchases</h2>
              <button type="button" onClick={onRefresh} className="win-btn text-xs">
                Refresh
              </button>
            </div>
            <div className="max-h-80 divide-y divide-[var(--app-border)] overflow-y-auto">
              {state.purchases.slice(0, 8).map((pur) => (
                <div key={pur.id} className="py-2 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span>{pur.purchaseNumber}</span>
                    <span>{formatMoney(pur.totalAmountMinor, c)}</span>
                  </div>
                  <div className="mt-0.5 flex gap-2 text-[var(--app-muted-text)]">
                    <span className="truncate">{pur.supplierName}</span>
                    <span className="font-semibold">{pur.status}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-[11px] text-[var(--app-muted-text)]">
                      {formatDateDisplay(pur.purchaseDate)}
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => handlePrintPurchase(pur)}
                        className="win-btn px-2 py-1 text-xs"
                      >
                        Print
                      </button>
                      {pur.status === 'Posted' && (
                        <button
                          type="button"
                          onClick={() => {
                            setCancelTargetPurchase(pur);
                            setCancelReason('');
                          }}
                          className="win-btn px-2 py-1 text-xs text-rose-600"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="-mx-[18px] -mb-[18px] border-t border-[var(--app-border)] px-[18px] py-2.5">
              <button
                type="button"
                onClick={() => setShowAllPurchasesModal(true)}
                className="flex w-full items-center justify-between text-xs font-medium hover:underline"
              >
                <span>View all purchases ({state.purchases.length})</span>
                <ChevronRight className="h-3.5 w-3.5 text-[var(--app-muted-text)]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Supplier Modal */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="win-panel w-full max-w-md space-y-3 shadow-xl">
            <h3 className="text-base font-semibold">Add Supplier</h3>
            <div>
              <label className="win-label">Supplier name *</label>
              <input
                type="text"
                value={newSupName}
                onChange={(e) => setNewSupName(e.target.value)}
                className="win-input"
              />
            </div>
            <div>
              <label className="win-label">Phone</label>
              <input
                type="text"
                value={newSupPhone}
                onChange={(e) => setNewSupPhone(e.target.value)}
                className="win-input"
              />
            </div>
            <div>
              <label className="win-label">Address</label>
              <input
                type="text"
                value={newSupAddress}
                onChange={(e) => setNewSupAddress(e.target.value)}
                className="win-input"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddSupplierModal(false)}
                className="win-btn"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!newSupName.trim()) return;
                  const created = onAddSupplier({
                    name: newSupName.trim(),
                    phone: newSupPhone.trim(),
                    address: newSupAddress.trim(),
                    openingBalanceMinor: 0,
                  });
                  setSelectedSupplierId(created.id);
                  setNewSupName('');
                  setNewSupPhone('');
                  setNewSupAddress('');
                  setShowAddSupplierModal(false);
                }}
                className="win-btn-primary"
              >
                Save Supplier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Purchase Modal */}
      {cancelTargetPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="win-panel w-full max-w-md space-y-3 shadow-xl">
            <h3 className="text-base font-semibold">
              Cancel Purchase {cancelTargetPurchase.purchaseNumber}
            </h3>
            <p className="text-xs text-[var(--app-muted-text)]">
              Cancelling this purchase will reverse the stock increase, supplier payable, cash out, and journal entry.
            </p>
            <div>
              <label className="win-label">Reason *</label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason for reversal"
                className="win-input"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelTargetPurchase(null)}
                className="win-btn"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  onCancelPurchase(cancelTargetPurchase.id, cancelReason || 'Cancelled by operator');
                  setCancelTargetPurchase(null);
                }}
                className="rounded bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View All Purchases Modal */}
      {showAllPurchasesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="win-panel flex max-h-[82vh] w-full max-w-3xl flex-col space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">All Purchases</h3>
              <button
                type="button"
                onClick={() => setShowAllPurchasesModal(false)}
                className="win-btn"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-[var(--app-border)] text-xs">
              {state.purchases.map((pur) => (
                <div key={pur.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <div className="font-semibold">
                      {pur.purchaseNumber} — {pur.supplierName} ({pur.status})
                    </div>
                    <div className="text-[var(--app-muted-text)]">
                      Date: {formatDateDisplay(pur.purchaseDate)} | Total: {formatMoney(pur.totalAmountMinor, c)} | Paid: {formatMoney(pur.paidAmountMinor, c)} | Payable: {formatMoney(pur.dueAmountMinor, c)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handlePrintPurchase(pur)}
                      className="win-btn"
                    >
                      Print
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
