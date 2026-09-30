import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { AppDatabaseState, Category, Product } from '../types';
import { formatMoney, formatQty } from '../utils/htmlPrintRenderer';

interface ProductsPageProps {
  state: AppDatabaseState;
  productSearchRef: React.RefObject<HTMLInputElement | null>;
  onSaveProduct: (
    product: {
      id?: number;
      name: string;
      sku: string;
      barcode: string;
      categoryId: number | null;
      unitId: number;
      purchasePriceMinor: number;
      sellingPriceMinor: number;
      openingStock: number;
      reorderLevel: number;
      notes: string;
      isActive: boolean;
    }
  ) => void;
  onSaveCategory: (cat: { id?: number; name: string; description: string }) => Category;
  onRefresh: () => void;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({
  state,
  productSearchRef,
  onSaveProduct,
  onSaveCategory,
  onRefresh,
}) => {
  const c = state.settings.currencyCode;
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | ''>('');
  const [stockFilter, setStockFilter] = useState<'All' | 'InStock' | 'LowStock' | 'OutOfStock'>('All');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [editorOpen, setEditorOpen] = useState(true);
  const [isAddMode, setIsAddMode] = useState(true);

  // Editor fields
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>(state.categories[0]?.id ?? '');
  const [unitId, setUnitId] = useState<number>(state.units[0]?.id ?? 1);
  const [purchasePriceText, setPurchasePriceText] = useState('0.00');
  const [sellingPriceText, setSellingPriceText] = useState('0.00');
  const [openingStockText, setOpeningStockText] = useState('0');
  const [currentStockText, setCurrentStockText] = useState('0');
  const [reorderLevelText, setReorderLevelText] = useState('5');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [validationMessage, setValidationMessage] = useState('');

  // Category modal
  const [catModalMode, setCatModalMode] = useState<'add' | 'edit' | null>(null);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');

  const openAddProduct = () => {
    setIsAddMode(true);
    setSelectedProductId(null);
    setName('');
    setSku(`PRD-${String(state.products.length + 1).padStart(3, '0')}`);
    setBarcode('');
    setCategoryId(state.categories[0]?.id ?? '');
    setUnitId(state.units[0]?.id ?? 1);
    setPurchasePriceText('0.00');
    setSellingPriceText('0.00');
    setOpeningStockText('0');
    setCurrentStockText('0');
    setReorderLevelText('5');
    setNotes('');
    setIsActive(true);
    setValidationMessage('');
    setEditorOpen(true);
  };

  const selectProductForEdit = (prod: Product) => {
    setIsAddMode(false);
    setSelectedProductId(prod.id);
    setName(prod.name);
    setSku(prod.sku);
    setBarcode(prod.barcode);
    setCategoryId(prod.categoryId ?? '');
    setUnitId(prod.unitId);
    setPurchasePriceText((prod.purchasePriceMinor / 100).toFixed(2));
    setSellingPriceText((prod.sellingPriceMinor / 100).toFixed(2));
    setCurrentStockText(formatQty(prod.currentStock));
    setReorderLevelText(formatQty(prod.reorderLevel));
    setNotes(prod.notes);
    setIsActive(prod.isActive);
    setValidationMessage('');
    setEditorOpen(true);
  };

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
      const cat = state.categories.find((catItem) => catItem.id === prod.categoryId);
      const match =
        prod.name.toLowerCase().includes(q) ||
        prod.sku.toLowerCase().includes(q) ||
        prod.barcode.toLowerCase().includes(q) ||
        (cat?.name.toLowerCase().includes(q) ?? false);
      if (!match) return false;
    }
    return true;
  });

  const handleSave = () => {
    setValidationMessage('');
    if (!name.trim()) {
      setValidationMessage('Product name is required.');
      return;
    }
    if (!sku.trim()) {
      setValidationMessage('SKU/code is required.');
      return;
    }
    const purchasePriceMinor = Math.round((parseFloat(purchasePriceText) || 0) * 100);
    const sellingPriceMinor = Math.round((parseFloat(sellingPriceText) || 0) * 100);
    if (purchasePriceMinor < 0 || sellingPriceMinor < 0) {
      setValidationMessage('Prices cannot be negative.');
      return;
    }

    try {
      onSaveProduct({
        id: isAddMode ? undefined : selectedProductId ?? undefined,
        name: name.trim(),
        sku: sku.trim(),
        barcode: barcode.trim(),
        categoryId: categoryId === '' ? null : Number(categoryId),
        unitId,
        purchasePriceMinor,
        sellingPriceMinor,
        openingStock: parseFloat(openingStockText) || 0,
        reorderLevel: parseFloat(reorderLevelText) || 0,
        notes: notes.trim(),
        isActive,
      });
      if (isAddMode) {
        openAddProduct();
      }
    } catch (err: any) {
      setValidationMessage(err?.message || 'Could not save product.');
    }
  };

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[26px] font-semibold leading-tight">Products</h1>
          <p className="text-sm text-[var(--app-muted-text)]">
            Product master, barcode lookup, prices, stock status, and active/inactive control.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            className="win-btn p-2"
            title="Refresh products (F5)"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button type="button" onClick={openAddProduct} className="win-btn-primary">
            Add product
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="win-panel grid grid-cols-1 gap-3 sm:grid-cols-[2fr_1fr_1fr_1fr]">
        <div>
          <label className="win-label">Search (F2)</label>
          <input
            ref={productSearchRef}
            type="text"
            placeholder="Search by name, SKU, barcode, or category (F2)"
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
            <option value="All">All stock statuses</option>
            <option value="InStock">In stock</option>
            <option value="LowStock">Low stock</option>
            <option value="OutOfStock">Out of stock</option>
          </select>
        </div>
        <div>
          <label className="win-label">Status</label>
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value as any)}
            className="win-input"
          >
            <option value="All">All products</option>
            <option value="Active">Active only</option>
            <option value="Inactive">Inactive only</option>
          </select>
        </div>
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-[1fr_390px]">
        <div className="win-panel overflow-x-auto">
          <div className="min-w-[680px]">
            <div className="grid grid-cols-[110px_2fr_1.2fr_115px_95px_100px_70px] gap-3 border-b border-[var(--app-border)] px-2 pb-2 text-xs font-semibold">
              <span>SKU</span>
              <span>Product</span>
              <span>Category</span>
              <span>Price</span>
              <span>Stock</span>
              <span>Stock status</span>
              <span>Active</span>
            </div>

            <div className="divide-y divide-[var(--app-border)] text-xs">
              {filteredProducts.map((prod) => {
                const cat = state.categories.find((cItem) => cItem.id === prod.categoryId);
                const unit = state.units.find((u) => u.id === prod.unitId);
                const status = getStockStatus(prod);
                return (
                  <div
                    key={prod.id}
                    onClick={() => selectProductForEdit(prod)}
                    className={`grid cursor-pointer grid-cols-[110px_2fr_1.2fr_115px_95px_100px_70px] items-center gap-3 px-2 py-2.5 transition ${
                      selectedProductId === prod.id
                        ? 'bg-[var(--app-muted-panel)]'
                        : 'hover:bg-[var(--app-muted-panel)]/50'
                    }`}
                  >
                    <span className="truncate font-mono text-[11px]">{prod.sku}</span>
                    <div className="truncate">
                      <div className="truncate font-semibold">{prod.name}</div>
                      {prod.barcode && (
                        <div className="truncate text-[11px] text-[var(--app-muted-text)]">
                          {prod.barcode}
                        </div>
                      )}
                    </div>
                    <span className="truncate">{cat?.name || 'Uncategorized'}</span>
                    <span>{formatMoney(prod.sellingPriceMinor, c)}</span>
                    <span>
                      {formatQty(prod.currentStock)} {unit?.code}
                    </span>
                    <span>
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-[11px] font-semibold ${
                          status === 'Out of stock'
                            ? 'bg-[var(--app-danger-soft)]'
                            : status === 'Low stock'
                            ? 'bg-[var(--app-warning-soft)]'
                            : 'bg-[var(--app-accent-soft)]'
                        }`}
                      >
                        {status}
                      </span>
                    </span>
                    <span>{prod.isActive ? 'Yes' : 'No'}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Editor Panel */}
        {editorOpen && (
          <div className="win-panel space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[17px] font-semibold">
                {isAddMode ? 'Add product' : 'Edit product'}
              </h2>
              <button
                type="button"
                onClick={openAddProduct}
                className="win-btn text-xs"
              >
                Reset
              </button>
            </div>

            {validationMessage && (
              <div className="rounded border border-amber-500/40 bg-[var(--app-warning-soft)] px-3 py-2 text-xs font-medium">
                {validationMessage}
              </div>
            )}

            <div>
              <label className="win-label">Product name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="win-input"
              />
            </div>

            <div>
              <label className="win-label">SKU/code</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="win-input"
              />
            </div>

            <div>
              <label className="win-label">Barcode</label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="win-input"
              />
            </div>

            <div className="grid grid-cols-[1fr_auto_auto] gap-2">
              <div>
                <label className="win-label">Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
                  className="win-input"
                >
                  <option value="">No category</option>
                  {state.categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => {
                    setCatName('');
                    setCatDesc('');
                    setCatModalMode('add');
                  }}
                  className="win-btn"
                >
                  Add
                </button>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  disabled={categoryId === ''}
                  onClick={() => {
                    const cat = state.categories.find((cItem) => cItem.id === Number(categoryId));
                    if (!cat) return;
                    setCatName(cat.name);
                    setCatDesc(cat.description);
                    setCatModalMode('edit');
                  }}
                  className="win-btn disabled:opacity-50"
                >
                  Edit
                </button>
              </div>
            </div>

            <div>
              <label className="win-label">Unit</label>
              <select
                value={unitId}
                onChange={(e) => setUnitId(Number(e.target.value))}
                className="win-input"
              >
                {state.units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="win-label">Purchase price</label>
                <input
                  type="number"
                  step="0.01"
                  value={purchasePriceText}
                  onChange={(e) => setPurchasePriceText(e.target.value)}
                  className="win-input"
                />
              </div>
              <div>
                <label className="win-label">Selling price</label>
                <input
                  type="number"
                  step="0.01"
                  value={sellingPriceText}
                  onChange={(e) => setSellingPriceText(e.target.value)}
                  className="win-input"
                />
              </div>
            </div>

            {isAddMode ? (
              <div>
                <label className="win-label">Opening stock</label>
                <input
                  type="number"
                  step="any"
                  value={openingStockText}
                  onChange={(e) => setOpeningStockText(e.target.value)}
                  className="win-input"
                />
              </div>
            ) : (
              <div>
                <label className="win-label">Current stock</label>
                <input
                  type="text"
                  readOnly
                  value={currentStockText}
                  className="win-input opacity-75"
                />
              </div>
            )}

            <div>
              <label className="win-label">Reorder level</label>
              <input
                type="number"
                step="any"
                value={reorderLevelText}
                onChange={(e) => setReorderLevelText(e.target.value)}
                className="win-input"
              />
            </div>

            <div>
              <label className="win-label">Notes</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="win-input"
              />
            </div>

            <label className="flex items-center gap-2 text-xs font-medium">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              Active
            </label>

            <div className="flex gap-2 pt-1">
              <button type="button" onClick={handleSave} className="win-btn-primary">
                Save
              </button>
              {!isAddMode && (
                <button
                  type="button"
                  onClick={() => {
                    setIsActive((prev) => !prev);
                  }}
                  className="win-btn"
                >
                  {isActive ? 'Deactivate' : 'Activate'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Category Modal */}
      {catModalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="win-panel w-full max-w-sm space-y-3 shadow-xl">
            <h3 className="text-base font-semibold">
              {catModalMode === 'add' ? 'Add Category' : 'Edit Category'}
            </h3>
            <div>
              <label className="win-label">Category name *</label>
              <input
                type="text"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                className="win-input"
              />
            </div>
            <div>
              <label className="win-label">Description</label>
              <input
                type="text"
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
                className="win-input"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCatModalMode(null)}
                className="win-btn"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!catName.trim()) return;
                  const savedCat = onSaveCategory({
                    id: catModalMode === 'edit' && categoryId !== '' ? Number(categoryId) : undefined,
                    name: catName.trim(),
                    description: catDesc.trim(),
                  });
                  setCategoryId(savedCat.id);
                  setCatModalMode(null);
                }}
                className="win-btn-primary"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
