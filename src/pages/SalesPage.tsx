import React, { useState } from 'react';
import { RefreshCw, Trash2, Printer, XCircle, ShoppingCart, ChevronRight } from 'lucide-react';
import { AppDatabaseState, HeldSale, Party, PrintProfile, Sale } from '../types';
import { getCustomerSummary, todayIsoDate } from '../services/billingEngine';
import { formatDateDisplay, formatMoney, formatQty, renderSalesInvoiceHtml } from '../utils/htmlPrintRenderer';

interface CartLineDraft {
  id: string;
  productId: number;
  productName: string;
  unitCode: string;
  stock: number;
  quantityText: string;
  unitPriceText: string;
}

interface SalesPageProps {
  state: AppDatabaseState;
  productSearchRef: React.RefObject<HTMLInputElement | null>;
  customerSearchRef: React.RefObject<HTMLInputElement | null>;
  paidAmountRef: React.RefObject<HTMLInputElement | null>;
  onCreateSale: (input: {
    customerId: number | null;
    saleDate: string;
    paidAmountMinor: number;
    notes: string;
    lines: { productId: number; quantity: number; unitPriceMinor: number }[];
  }) => Sale | null;
  onAddCustomer: (party: { name: string; phone: string; address: string; openingBalanceMinor: number }) => Party;
  onHoldSale: (held: HeldSale) => void;
  onRemoveHeldSale: (id: string) => void;
  onCancelSale: (saleId: number, reason: string) => void;
  onOpenPrintPreview: (title: string, render: (profile: PrintProfile) => string) => void;
  onRefresh: () => void;
}

export const SalesPage: React.FC<SalesPageProps> = ({
  state,
  productSearchRef,
  customerSearchRef,
  paidAmountRef,
  onCreateSale,
  onAddCustomer,
  onHoldSale,
  onRemoveHeldSale,
  onCancelSale,
  onOpenPrintPreview,
  onRefresh,
}) => {
  const c = state.settings.currencyCode;
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [saleDate, setSaleDate] = useState(todayIsoDate());
  const [paidAmountText, setPaidAmountText] = useState('0');
  const [paidTouched, setPaidTouched] = useState(false);
  const [notes, setNotes] = useState('');

  const [productSearch, setProductSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [newLineQtyText, setNewLineQtyText] = useState('1');
  const [newLinePriceText, setNewLinePriceText] = useState('');

  const [lines, setLines] = useState<CartLineDraft[]>([]);
  const [validationMessage, setValidationMessage] = useState('');
  const [lastSavedSale, setLastSavedSale] = useState<Sale | null>(null);
  const [selectedRecentSaleId, setSelectedRecentSaleId] = useState<number | null>(
    state.sales[0]?.id ?? null
  );
  const [selectedHeldId, setSelectedHeldId] = useState<string | null>(null);

  // Modals
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');

  const [cancelTargetSale, setCancelTargetSale] = useState<Sale | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [showAllInvoicesModal, setShowAllInvoicesModal] = useState(false);

  const customers = state.parties.filter(
    (p) =>
      p.isActive &&
      (p.partyType === 'Customer' || p.partyType === 'Both') &&
      (!customerSearch.trim() ||
        p.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        p.phone.toLowerCase().includes(customerSearch.toLowerCase()))
  );

  const activeProducts = state.products.filter((p) => {
    if (!p.isActive) return false;
    if (!productSearch.trim()) return true;
    const q = productSearch.toLowerCase();
    const cat = state.categories.find((catItem) => catItem.id === p.categoryId);
    return (
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.barcode.toLowerCase().includes(q) ||
      (cat?.name.toLowerCase().includes(q) ?? false)
    );
  });

  const handleSelectProduct = (prodId: number | '') => {
    setSelectedProductId(prodId);
    if (prodId !== '') {
      const p = state.products.find((item) => item.id === prodId);
      if (p) {
        setNewLinePriceText((p.sellingPriceMinor / 100).toFixed(2));
      }
    } else {
      setNewLinePriceText('');
    }
  };

  const addProductToCart = (productId: number, qty: number, priceMinor: number) => {
    const prod = state.products.find((p) => p.id === productId);
    if (!prod) return;
    const unit = state.units.find((u) => u.id === prod.unitId);

    setLines((prev) => {
      const existingIdx = prev.findIndex((l) => l.productId === productId);
      let updated: CartLineDraft[];
      if (existingIdx >= 0) {
        updated = prev.map((l, idx) => {
          if (idx !== existingIdx) return l;
          const nextQty = (parseFloat(l.quantityText) || 0) + qty;
          return {
            ...l,
            quantityText: String(nextQty),
            unitPriceText: (priceMinor / 100).toFixed(2),
          };
        });
      } else {
        updated = [
          ...prev,
          {
            id: `${productId}-${Date.now()}`,
            productId: prod.id,
            productName: prod.name,
            unitCode: unit?.code || 'pcs',
            stock: prod.currentStock,
            quantityText: String(qty),
            unitPriceText: (priceMinor / 100).toFixed(2),
          },
        ];
      }

      if (!paidTouched) {
        const newGross = updated.reduce((sum, l) => {
          const q = parseFloat(l.quantityText) || 0;
          const pr = Math.round((parseFloat(l.unitPriceText) || 0) * 100);
          return sum + Math.round(q * pr);
        }, 0);
        setPaidAmountText((newGross / 100).toFixed(2));
      }
      return updated;
    });
  };

  const handleAddLine = () => {
    setValidationMessage('');
    let targetProd = state.products.find((p) => p.id === Number(selectedProductId));
    if (!targetProd && productSearch.trim()) {
      const exactBarcode = state.products.find(
        (p) => p.isActive && (p.barcode === productSearch.trim() || p.sku.toLowerCase() === productSearch.trim().toLowerCase())
      );
      targetProd = exactBarcode || activeProducts[0];
    }

    if (!targetProd) {
      setValidationMessage('Select a product or scan a valid barcode first.');
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
        : targetProd.sellingPriceMinor;

    if (Number.isNaN(priceMinor) || priceMinor < 0) {
      setValidationMessage('Enter a valid non-negative sale price.');
      return;
    }

    addProductToCart(targetProd.id, qty, priceMinor);
    setProductSearch('');
    setSelectedProductId('');
    setNewLineQtyText('1');
    setNewLinePriceText('');
  };

  const handleProductSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddLine();
    }
  };

  const totalQuantity = lines.reduce((acc, l) => acc + (parseFloat(l.quantityText) || 0), 0);
  const grossTotalMinor = lines.reduce((acc, l) => {
    const q = parseFloat(l.quantityText) || 0;
    const pr = Math.round((parseFloat(l.unitPriceText) || 0) * 100);
    return acc + Math.round(q * pr);
  }, 0);
  const paidMinor = Math.round((parseFloat(paidAmountText) || 0) * 100);
  const dueMinor = Math.max(0, grossTotalMinor - paidMinor);

  const prevReceivableMinor = selectedCustomerId
    ? getCustomerSummary(state, selectedCustomerId).currentDueMinor
    : 0;
  const updatedReceivableMinor = selectedCustomerId ? prevReceivableMinor + dueMinor : 0;

  const clearEntry = () => {
    setLines([]);
    setSelectedCustomerId(null);
    setCustomerSearch('');
    setPaidAmountText('0');
    setPaidTouched(false);
    setNotes('');
    setValidationMessage('');
  };

  const executeSave = (printAfter: boolean) => {
    setValidationMessage('');
    try {
      const parsedLines = lines.map((l) => ({
        productId: l.productId,
        quantity: parseFloat(l.quantityText) || 0,
        unitPriceMinor: Math.round((parseFloat(l.unitPriceText) || 0) * 100),
      }));

      const saved = onCreateSale({
        customerId: selectedCustomerId,
        saleDate,
        paidAmountMinor: paidMinor,
        notes,
        lines: parsedLines,
      });

      if (saved) {
        setLastSavedSale(saved);
        setSelectedRecentSaleId(saved.id);
        clearEntry();
        if (printAfter) {
          const customer = saved.customerId
            ? state.parties.find((p) => p.id === saved.customerId) ?? null
            : null;
          onOpenPrintPreview(`Sales Invoice ${saved.invoiceNumber}`, (profile) =>
            renderSalesInvoiceHtml(saved, customer, state.settings, profile)
          );
        }
      }
    } catch (err: any) {
      setValidationMessage(err?.message || 'Unable to save sale.');
    }
  };

  const handleHoldSale = () => {
    if (lines.length === 0) {
      setValidationMessage('Add at least one item before holding a sale.');
      return;
    }
    const customerName = selectedCustomerId
      ? state.parties.find((p) => p.id === selectedCustomerId)?.name || 'Customer'
      : 'Walk-in customer';
    const held: HeldSale = {
      id: `HOLD-${Date.now()}`,
      displayName: `${customerName} (${lines.length} items)`,
      customerId: selectedCustomerId,
      saleDate,
      paidAmountText,
      notes,
      lines: lines.map((l) => ({
        productId: l.productId,
        quantityText: l.quantityText,
        unitPriceText: l.unitPriceText,
      })),
      createdAt: new Date().toISOString(),
    };
    onHoldSale(held);
    setSelectedHeldId(held.id);
    clearEntry();
  };

  const handleResumeHeldSale = () => {
    const held =
      state.heldSales.find((h) => h.id === selectedHeldId) || state.heldSales[0];
    if (!held) return;
    setSelectedCustomerId(held.customerId);
    setSaleDate(held.saleDate);
    setPaidAmountText(held.paidAmountText);
    setPaidTouched(true);
    setNotes(held.notes);
    setLines(
      held.lines
        .map((hl) => {
          const prod = state.products.find((p) => p.id === hl.productId);
          if (!prod) return null;
          const unit = state.units.find((u) => u.id === prod.unitId);
          return {
            id: `${prod.id}-${Date.now()}-${Math.random()}`,
            productId: prod.id,
            productName: prod.name,
            unitCode: unit?.code || 'pcs',
            stock: prod.currentStock,
            quantityText: hl.quantityText,
            unitPriceText: hl.unitPriceText,
          };
        })
        .filter(Boolean) as CartLineDraft[]
    );
    onRemoveHeldSale(held.id);
    setSelectedHeldId(null);
  };

  const handlePrintSale = (sale: Sale | null) => {
    const target =
      sale ||
      state.sales.find((s) => s.id === selectedRecentSaleId) ||
      lastSavedSale ||
      state.sales[0];
    if (!target) return;
    const customer = target.customerId
      ? state.parties.find((p) => p.id === target.customerId) ?? null
      : null;
    onOpenPrintPreview(`Sales Invoice ${target.invoiceNumber}`, (profile) =>
      renderSalesInvoiceHtml(target, customer, state.settings, profile)
    );
  };

  return (
    <div className="space-y-3.5">
      <div>
        <h1 className="text-[26px] font-semibold leading-tight">Sales</h1>
        <p className="text-sm text-[var(--app-muted-text)]">
          Fast POS billing, stock reduction, customer due, cash, and automatic journal posting.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-[1fr_340px]">
        {/* Left Column */}
        <div className="space-y-3.5">
          {/* Customer & Sale Details Panel */}
          <div className="win-panel space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[2fr_auto_1fr_1fr_auto]">
              <div>
                <label className="win-label">Customer search (F3)</label>
                <input
                  ref={customerSearchRef}
                  type="text"
                  placeholder="Search by name or phone"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="win-input"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(true)}
                  className="win-btn whitespace-nowrap"
                >
                  Add customer
                </button>
              </div>
              <div>
                <label className="win-label">Sale date</label>
                <input
                  type="date"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  className="win-input"
                />
              </div>
              <div>
                <label className="win-label">Paid amount (F6)</label>
                <input
                  ref={paidAmountRef}
                  type="number"
                  step="0.01"
                  value={paidAmountText}
                  onChange={(e) => {
                    setPaidTouched(true);
                    setPaidAmountText(e.target.value);
                  }}
                  className="win-input"
                />
              </div>
              <div className="flex items-end">
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
                <label className="win-label">Customer</label>
                <select
                  value={selectedCustomerId ?? ''}
                  onChange={(e) =>
                    setSelectedCustomerId(e.target.value ? Number(e.target.value) : null)
                  }
                  className="win-input"
                >
                  <option value="">Walk-in customer</option>
                  {customers.map((cust) => (
                    <option key={cust.id} value={cust.id}>
                      {cust.name} {cust.phone ? `(${cust.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="win-label">Notes</label>
                <input
                  type="text"
                  placeholder="Optional sale note"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="win-input"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onRefresh}
                className="win-btn px-2.5"
                title="Refresh sales data (F5)"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
              <button type="button" onClick={handleHoldSale} className="win-btn">
                Hold sale
              </button>
              <button type="button" onClick={() => executeSave(false)} className="win-btn-primary">
                Save sale
              </button>
            </div>
          </div>

          {/* Product Entry & List Panel */}
          <div className="win-panel flex min-h-[420px] flex-col space-y-3">
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[2fr_2fr_100px_120px_auto]">
              <div>
                <label className="win-label">Product search or barcode (F2)</label>
                <input
                  ref={productSearchRef}
                  type="text"
                  placeholder="Scan barcode or search by name, SKU, or category"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  onKeyDown={handleProductSearchKeyDown}
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
                      {p.name} ({formatQty(p.currentStock)} in stock) - {formatMoney(p.sellingPriceMinor, c)}
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
                <label className="win-label">Sale price</label>
                <input
                  type="number"
                  step="0.01"
                  disabled={!state.settings.allowSalePriceEditing}
                  value={newLinePriceText}
                  onChange={(e) => setNewLinePriceText(e.target.value)}
                  placeholder="Auto"
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
                <strong className="mr-1.5">Check sale details:</strong>
                {validationMessage}
              </div>
            )}

            <div className="grid grid-cols-[2fr_80px_90px_110px_110px_36px] gap-2 border-b border-[var(--app-border)] px-1 pb-2 text-xs font-semibold">
              <span>Product</span>
              <span>Stock</span>
              <span>Quantity</span>
              <span>Price</span>
              <span>Line total</span>
              <span />
            </div>

            {lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--app-muted-panel)] text-[var(--app-muted-text)]">
                  <ShoppingCart className="h-7 w-7" />
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
                  const priceMinor = Math.round((parseFloat(line.unitPriceText) || 0) * 100);
                  const lineTotalMinor = Math.round(qty * priceMinor);
                  return (
                    <div
                      key={line.id}
                      className="grid grid-cols-[2fr_80px_90px_110px_110px_36px] items-center gap-2 px-1 py-2 text-xs"
                    >
                      <div>
                        <div className="font-semibold">{line.productName}</div>
                        <div className="text-[11px] text-[var(--app-muted-text)]">{line.unitCode}</div>
                      </div>
                      <div>{formatQty(line.stock)}</div>
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
                        disabled={!state.settings.allowSalePriceEditing}
                        value={line.unitPriceText}
                        onChange={(e) => {
                          const val = e.target.value;
                          setLines((prev) =>
                            prev.map((item) =>
                              item.id === line.id ? { ...item, unitPriceText: val } : item
                            )
                          );
                        }}
                        className="win-input py-1 text-xs"
                      />
                      <div className="font-semibold">{formatMoney(lineTotalMinor, c)}</div>
                      <button
                        type="button"
                        onClick={() => setLines((prev) => prev.filter((i) => i.id !== line.id))}
                        className="win-btn p-1.5 text-rose-600"
                        title="Remove item"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
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
          {/* Payment Summary Panel */}
          <div className="win-panel space-y-3">
            <h2 className="text-[17px] font-semibold">Payment summary</h2>

            {lastSavedSale && (
              <div className="flex items-center justify-between gap-2 rounded bg-[var(--app-accent-soft)] px-3 py-2 text-xs">
                <span>
                  Saved <strong>{lastSavedSale.invoiceNumber}</strong> ({formatMoney(lastSavedSale.totalAmountMinor, c)})
                </span>
                <button
                  type="button"
                  onClick={() => handlePrintSale(lastSavedSale)}
                  className="win-btn py-1 text-xs"
                >
                  Reprint
                </button>
              </div>
            )}

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span>Items</span>
                <span>{lines.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Total quantity</span>
                <span>{formatQty(totalQuantity)}</span>
              </div>
              <div className="flex justify-between">
                <span>Gross total</span>
                <span className="font-semibold">{formatMoney(grossTotalMinor, c)}</span>
              </div>
              <div className="flex justify-between">
                <span>Net total</span>
                <span className="font-semibold">{formatMoney(grossTotalMinor, c)}</span>
              </div>
              <div className="flex justify-between">
                <span>Paid</span>
                <span>{formatMoney(paidMinor, c)}</span>
              </div>
              <div className="flex justify-between">
                <span>Due</span>
                <span className="font-semibold">{formatMoney(dueMinor, c)}</span>
              </div>
              <div className="flex justify-between">
                <span>Previous receivable</span>
                <span>{formatMoney(prevReceivableMinor, c)}</span>
              </div>
              <div className="flex justify-between">
                <span>Updated receivable</span>
                <span className="font-semibold">{formatMoney(updatedReceivableMinor, c)}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button type="button" onClick={() => executeSave(false)} className="win-btn-primary">
                Complete sale
              </button>
              <button type="button" onClick={() => handlePrintSale(null)} className="win-btn">
                Print selected
              </button>
              <button type="button" onClick={clearEntry} className="win-btn">
                Clear
              </button>
            </div>
          </div>

          {/* Recent Invoices Panel */}
          <div className="win-panel flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[17px] font-semibold">Recent invoices</h2>
              <button type="button" onClick={onRefresh} className="win-btn p-1.5" title="Refresh recent invoices">
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="max-h-72 divide-y divide-[var(--app-border)] overflow-y-auto">
              {state.sales.slice(0, 8).map((sale) => (
                <div
                  key={sale.id}
                  onClick={() => setSelectedRecentSaleId(sale.id)}
                  className={`cursor-pointer rounded px-2 py-2 text-xs transition ${
                    selectedRecentSaleId === sale.id ? 'bg-[var(--app-muted-panel)]' : 'hover:bg-[var(--app-muted-panel)]/50'
                  }`}
                >
                  <div className="flex justify-between font-semibold">
                    <span>{sale.invoiceNumber}</span>
                    <span>{formatMoney(sale.totalAmountMinor, c)}</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-[var(--app-muted-text)]">
                    <span className="truncate">{sale.customerName}</span>
                    <span className="font-semibold">{sale.status}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-[11px] text-[var(--app-muted-text)]">
                      {formatDateDisplay(sale.saleDate)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePrintSale(sale);
                        }}
                        className="win-btn px-2 py-1"
                        title="Print invoice"
                      >
                        <Printer className="h-3.5 w-3.5" />
                      </button>
                      {sale.status === 'Posted' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCancelTargetSale(sale);
                            setCancelReason('');
                          }}
                          className="win-btn px-2 py-1 text-rose-600"
                          title="Cancel invoice"
                        >
                          <XCircle className="h-3.5 w-3.5" />
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
                onClick={() => setShowAllInvoicesModal(true)}
                className="flex w-full items-center justify-between text-xs font-medium hover:underline"
              >
                <span>View all invoices ({state.sales.length})</span>
                <ChevronRight className="h-3.5 w-3.5 text-[var(--app-muted-text)]" />
              </button>
            </div>
          </div>

          {/* Held Sales Panel */}
          <div className="win-panel space-y-2.5">
            <h2 className="text-[17px] font-semibold">Held sales</h2>
            <div className="flex gap-2">
              <button type="button" onClick={handleHoldSale} className="win-btn">
                Hold
              </button>
              <button
                type="button"
                onClick={handleResumeHeldSale}
                disabled={state.heldSales.length === 0}
                className="win-btn disabled:opacity-50"
              >
                Resume
              </button>
            </div>
            {state.heldSales.length === 0 ? (
              <div className="py-2 text-xs text-[var(--app-muted-text)]">No held sales.</div>
            ) : (
              <div className="max-h-28 divide-y divide-[var(--app-border)] overflow-y-auto text-xs">
                {state.heldSales.map((h) => (
                  <div
                    key={h.id}
                    onClick={() => setSelectedHeldId(h.id)}
                    className={`cursor-pointer rounded px-2 py-1.5 ${
                      selectedHeldId === h.id ? 'bg-[var(--app-muted-panel)]' : ''
                    }`}
                  >
                    <div className="font-semibold">{h.displayName}</div>
                    <div className="text-[11px] text-[var(--app-muted-text)]">
                      Date: {h.saleDate}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="win-panel w-full max-w-md space-y-3 shadow-xl">
            <h3 className="text-base font-semibold">Add Customer</h3>
            <div>
              <label className="win-label">Customer name *</label>
              <input
                type="text"
                value={newCustName}
                onChange={(e) => setNewCustName(e.target.value)}
                className="win-input"
                placeholder="Full name or shop name"
              />
            </div>
            <div>
              <label className="win-label">Phone</label>
              <input
                type="text"
                value={newCustPhone}
                onChange={(e) => setNewCustPhone(e.target.value)}
                className="win-input"
                placeholder="01XXXXXXXXX"
              />
            </div>
            <div>
              <label className="win-label">Address</label>
              <input
                type="text"
                value={newCustAddress}
                onChange={(e) => setNewCustAddress(e.target.value)}
                className="win-input"
                placeholder="Address"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddCustomerModal(false)}
                className="win-btn"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!newCustName.trim()) return;
                  const created = onAddCustomer({
                    name: newCustName.trim(),
                    phone: newCustPhone.trim(),
                    address: newCustAddress.trim(),
                    openingBalanceMinor: 0,
                  });
                  setSelectedCustomerId(created.id);
                  setNewCustName('');
                  setNewCustPhone('');
                  setNewCustAddress('');
                  setShowAddCustomerModal(false);
                }}
                className="win-btn-primary"
              >
                Save Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Sale Modal */}
      {cancelTargetSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="win-panel w-full max-w-md space-y-3 shadow-xl">
            <h3 className="text-base font-semibold">
              Cancel Invoice {cancelTargetSale.invoiceNumber}
            </h3>
            <p className="text-xs text-[var(--app-muted-text)]">
              Cancelling this invoice will automatically restore product stock, reverse cash/due balances, and post a reversing journal entry.
            </p>
            <div>
              <label className="win-label">Cancellation reason *</label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g., Customer returned items / Billing error"
                className="win-input"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelTargetSale(null)}
                className="win-btn"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  onCancelSale(cancelTargetSale.id, cancelReason || 'Cancelled by operator');
                  setCancelTargetSale(null);
                }}
                className="rounded bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View All Invoices Modal */}
      {showAllInvoicesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="win-panel flex max-h-[82vh] w-full max-w-3xl flex-col space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">All Sales Invoices</h3>
              <button
                type="button"
                onClick={() => setShowAllInvoicesModal(false)}
                className="win-btn"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-[var(--app-border)] text-xs">
              {state.sales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <div className="font-semibold">
                      {sale.invoiceNumber} — {sale.customerName} ({sale.status})
                    </div>
                    <div className="text-[var(--app-muted-text)]">
                      Date: {formatDateDisplay(sale.saleDate)} | Total: {formatMoney(sale.totalAmountMinor, c)} | Paid: {formatMoney(sale.paidAmountMinor, c)} | Due: {formatMoney(sale.dueAmountMinor, c)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handlePrintSale(sale)}
                      className="win-btn"
                    >
                      Print
                    </button>
                    {sale.status === 'Posted' && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowAllInvoicesModal(false);
                          setCancelTargetSale(sale);
                        }}
                        className="win-btn text-rose-600"
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
      )}
    </div>
  );
};
