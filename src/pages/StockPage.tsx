import React, { useRef, useState } from 'react';
import { AppDatabaseState, Product, StockMovement } from '../types';
import { todayIsoDate } from '../services/billingEngine';
import { formatDateDisplay, formatMoney, formatQty } from '../utils/htmlPrintRenderer';

interface StockPageProps {
  state: AppDatabaseState;
  productSearchRef: React.RefObject<HTMLInputElement | null>;
  onAdjustStock: (input: {
    productId: number;
    adjustmentDate: string;
    direction: 'Increase' | 'Decrease';
    quantity: number;
    reason: string;
    notes: string;
  }) => StockMovement | null;
  onRefresh: () => void;
}

export const StockPage: React.FC<StockPageProps> = ({
  state,
  productSearchRef,
  onAdjustStock,
  onRefresh,
}) => {
  const c = state.settings.currencyCode;
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | ''>('');
  const [stockFilter, setStockFilter] = useState<'All' | 'InStock' | 'LowStock' | 'OutOfStock'>('All');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

  const [selectedProductId, setSelectedProductId] = useState<number>(state.products[0]?.id ?? 1);
  const [showAdjustmentPanel, setShowAdjustmentPanel] = useState(true);

  const [adjustmentDate, setAdjustmentDate] = useState(todayIsoDate());
  const [direction, setDirection] = useState<'Increase' | 'Decrease'>('Increase');
  const [adjustmentQtyText, setAdjustmentQtyText] = useState('1');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [validationMessage, setValidationMessage] = useState('');
  const [lastAdjustmentText, setLastAdjustmentText] = useState('');

  const qtyInputRef = useRef<HTMLInputElement>(null);

  const getStockStatus = (prod: Product): 'In stock' | 'Low stock' | 'Out of stock' => {
    if (prod.currentStock <= 0) return 'Out of stock';
    if (prod.currentStock <= prod.reorderLevel) return 'Low stock';
    return 'In stock';
  };

  const filteredProducts = state.products.filter((prod) => {
    if (categoryFilter !== '' && prod.categoryId !== Number(categoryFilter)) return false;
    const status = getStockStatus(prod);
    if (stockFilter === 'InStock' && status !== 'In stock') return false;
    if (stockFilter === 'LowStock' && status !== 'Low stock') return false;
    if (stockFilter === 'OutOfStock' && status !== 'Out of stock') return false;
    if (activeFilter === 'Active' && !prod.isActive) return false;
    if (activeFilter === 'Inactive' && prod.isActive) return false;

    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      const cat = state.categories.find((cItem) => cItem.id === prod.categoryId);
      const match =
        prod.name.toLowerCase().includes(q) ||
        prod.sku.toLowerCase().includes(q) ||
        prod.barcode.toLowerCase().includes(q) ||
        (cat?.name.toLowerCase().includes(q) ?? false);
      if (!match) return false;
    }
    return true;
  });

  const totalProducts = state.products.length;
  const totalQuantity = state.products.reduce((acc, p) => acc + p.currentStock, 0);
  const lowStockCount = state.products.filter((p) => p.currentStock > 0 && p.currentStock <= p.reorderLevel).length;
  const outOfStockCount = state.products.filter((p) => p.currentStock <= 0).length;
  const inventoryValueMinor = state.products.reduce(
    (acc, p) => acc + Math.round(Math.max(0, p.currentStock) * p.purchasePriceMinor),
    0
  );

  const selectedProduct = state.products.find((p) => p.id === selectedProductId) || state.products[0];
  const selectedUnit = selectedProduct
    ? state.units.find((u) => u.id === selectedProduct.unitId)
    : undefined;

  const productMovements = (() => {
    if (!selectedProduct) return [];
    const raw = state.stockMovements.filter((m) => m.productId === selectedProduct.id);
    let running = 0;
    return raw.map((m) => {
      if (m.direction === 'In') running = Number((running + m.quantity).toFixed(4));
      else running = Number((running - m.quantity).toFixed(4));
      return {
        ...m,
        quantityIn: m.direction === 'In' ? formatQty(m.quantity) : '-',
        quantityOut: m.direction === 'Out' ? formatQty(m.quantity) : '-',
        runningQuantity: formatQty(running),
      };
    });
  })();

  const handleSaveAdjustment = () => {
    setValidationMessage('');
    if (!selectedProduct) return;
    try {
      const qty = parseFloat(adjustmentQtyText) || 0;
      const saved = onAdjustStock({
        productId: selectedProduct.id,
        adjustmentDate,
        direction,
        quantity: qty,
        reason,
        notes,
      });
      if (saved) {
        setLastAdjustmentText(
          `Saved ${saved.referenceNumber}: ${direction} ${formatQty(qty)} ${selectedUnit?.code || ''} for ${selectedProduct.name}`
        );
        setAdjustmentQtyText('1');
        setReason('');
        setNotes('');
      }
    } catch (err: any) {
      setValidationMessage(err?.message || 'Unable to save stock adjustment.');
    }
  };

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[26px] font-semibold leading-tight">Stock</h1>
          <p className="text-sm text-[var(--app-muted-text)]">
            Current stock, movement history, and adjustment audit.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onRefresh} className="win-btn">
            Refresh
          </button>
          <button
            type="button"
            onClick={() => {
              setShowAdjustmentPanel(true);
              setTimeout(() => qtyInputRef.current?.focus(), 50);
            }}
            className="win-btn-primary"
          >
            Adjust stock
          </button>
        </div>
      </div>

      {/* Summary KPI Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="win-panel">
          <div className="text-xs text-[var(--app-muted-text)]">Products</div>
          <div className="mt-1 text-xl font-semibold">{totalProducts}</div>
        </div>
        <div className="win-panel">
          <div className="text-xs text-[var(--app-muted-text)]">Total quantity</div>
          <div className="mt-1 text-xl font-semibold">{formatQty(totalQuantity)}</div>
        </div>
        <div className="win-panel">
          <div className="text-xs text-[var(--app-muted-text)]">Low stock</div>
          <div className="mt-1 text-xl font-semibold">{lowStockCount}</div>
        </div>
        <div className="win-panel">
          <div className="text-xs text-[var(--app-muted-text)]">Out of stock</div>
          <div className="mt-1 text-xl font-semibold">{outOfStockCount}</div>
        </div>
        <div className="win-panel">
          <div className="text-xs text-[var(--app-muted-text)]">Inventory value</div>
          <div className="mt-1 text-xl font-semibold">{formatMoney(inventoryValueMinor, c)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-[1.5fr_1fr]">
        {/* Left Stock Items List */}
        <div className="win-panel space-y-3 overflow-x-auto">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[2fr_1.2fr_1.2fr_1fr_auto]">
            <div>
              <label className="win-label">Search (F2)</label>
              <input
                ref={productSearchRef}
                type="text"
                placeholder="SKU, product, barcode, or category"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="win-input"
              />
            </div>
            <div>
              <label className="win-label">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value ? Number(e.target.value) : '')}
                className="win-input"
              >
                <option value="">All categories</option>
                {state.categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="win-label">Stock</label>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value as any)}
                className="win-input"
              >
                <option value="All">All</option>
                <option value="InStock">In stock</option>
                <option value="LowStock">Low stock</option>
                <option value="OutOfStock">Out of stock</option>
              </select>
            </div>
            <div>
              <label className="win-label">Active</label>
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value as any)}
                className="win-input"
              >
                <option value="All">All</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="flex items-end gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setSearchText('');
                  setCategoryFilter('');
                  setStockFilter('All');
                  setActiveFilter('All');
                }}
                className="win-btn whitespace-nowrap"
              >
                Clear all
              </button>
            </div>
          </div>

          <div className="min-w-[740px]">
            <div className="grid grid-cols-[90px_1.5fr_110px_50px_90px_90px_65px_95px_65px_90px] gap-2 border-b border-[var(--app-border)] px-1 pb-2 text-xs font-semibold">
              <span>SKU</span>
              <span>Product</span>
              <span>Category</span>
              <span>Unit</span>
              <span>Cost</span>
              <span>Selling</span>
              <span>Qty</span>
              <span>Value</span>
              <span>Reorder</span>
              <span>Status</span>
            </div>

            <div className="divide-y divide-[var(--app-border)] text-xs">
              {filteredProducts.map((prod) => {
                const cat = state.categories.find((cItem) => cItem.id === prod.categoryId);
                const unit = state.units.find((u) => u.id === prod.unitId);
                const status = getStockStatus(prod);
                const stockVal = Math.round(Math.max(0, prod.currentStock) * prod.purchasePriceMinor);
                return (
                  <div
                    key={prod.id}
                    onClick={() => setSelectedProductId(prod.id)}
                    className={`grid cursor-pointer grid-cols-[90px_1.5fr_110px_50px_90px_90px_65px_95px_65px_90px] items-center gap-2 px-1 py-2.5 transition ${
                      selectedProduct?.id === prod.id
                        ? 'bg-[var(--app-muted-panel)]'
                        : 'hover:bg-[var(--app-muted-panel)]/50'
                    }`}
                  >
                    <span className="truncate font-mono text-[11px]">{prod.sku}</span>
                    <span className="truncate font-semibold">{prod.name}</span>
                    <span className="truncate">{cat?.name || '-'}</span>
                    <span>{unit?.code}</span>
                    <span>{formatMoney(prod.purchasePriceMinor, c)}</span>
                    <span>{formatMoney(prod.sellingPriceMinor, c)}</span>
                    <span className="font-semibold">{formatQty(prod.currentStock)}</span>
                    <span>{formatMoney(stockVal, c)}</span>
                    <span>{formatQty(prod.reorderLevel)}</span>
                    <span className="font-semibold">{status}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Stock Adjustment + Movement History */}
        <div className="space-y-3.5">
          {showAdjustmentPanel && selectedProduct && (
            <div className="win-panel space-y-3">
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[1fr_135px_135px]">
                <div>
                  <h2 className="text-[17px] font-semibold">Stock adjustment</h2>
                  <div className="truncate text-xs font-semibold">{selectedProduct.name}</div>
                  <div className="text-xs text-[var(--app-muted-text)]">
                    Current: {formatQty(selectedProduct.currentStock)} {selectedUnit?.code}
                  </div>
                </div>
                <div>
                  <label className="win-label">Date</label>
                  <input
                    type="date"
                    value={adjustmentDate}
                    onChange={(e) => setAdjustmentDate(e.target.value)}
                    className="win-input"
                  />
                </div>
                <div>
                  <label className="win-label">Direction</label>
                  <select
                    value={direction}
                    onChange={(e) => setDirection(e.target.value as 'Increase' | 'Decrease')}
                    className="win-input"
                  >
                    <option value="Increase">Increase (+)</option>
                    <option value="Decrease">Decrease (-)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-[1fr_auto_auto] items-end gap-2">
                <div>
                  <label className="win-label">Quantity</label>
                  <input
                    ref={qtyInputRef}
                    type="number"
                    step="any"
                    value={adjustmentQtyText}
                    onChange={(e) => setAdjustmentQtyText(e.target.value)}
                    className="win-input"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => qtyInputRef.current?.focus()}
                  className="win-btn"
                >
                  Edit qty
                </button>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={handleSaveAdjustment}
                    className="win-btn-primary"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReason('');
                      setNotes('');
                      setValidationMessage('');
                    }}
                    className="win-btn"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              <div>
                <label className="win-label">Reason *</label>
                <input
                  type="text"
                  placeholder="Required (e.g., Physical recount, Damaged goods)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="win-input"
                />
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
            </div>
          )}

          <div className="win-panel space-y-2.5 overflow-x-auto">
            <div>
              <h2 className="text-[17px] font-semibold">Movement history</h2>
              <p className="text-xs text-[var(--app-muted-text)]">
                {selectedProduct?.name || 'Select a product'}
              </p>
            </div>

            <div className="min-w-[520px]">
              <div className="grid grid-cols-[95px_115px_95px_1fr_55px_55px_65px] gap-2 border-b border-[var(--app-border)] px-1 pb-2 text-xs font-semibold">
                <span>Date</span>
                <span>Type</span>
                <span>Reference</span>
                <span>Description</span>
                <span className="text-right">In</span>
                <span className="text-right">Out</span>
                <span className="text-right">Balance</span>
              </div>

              <div className="divide-y divide-[var(--app-border)] text-xs">
                {productMovements.map((mov) => (
                  <div
                    key={mov.id}
                    className="grid grid-cols-[95px_115px_95px_1fr_55px_55px_65px] items-center gap-2 px-1 py-2"
                  >
                    <span>{formatDateDisplay(mov.movementDate)}</span>
                    <span className="truncate">{mov.movementType}</span>
                    <span className="truncate font-mono text-[11px]">{mov.referenceNumber}</span>
                    <span className="truncate">{mov.description}</span>
                    <span className="text-right">{mov.quantityIn}</span>
                    <span className="text-right">{mov.quantityOut}</span>
                    <span className="text-right font-semibold">{mov.runningQuantity}</span>
                  </div>
                ))}
              </div>
            </div>

            {lastAdjustmentText && (
              <div className="pt-1 text-xs text-[var(--app-muted-text)]">{lastAdjustmentText}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
