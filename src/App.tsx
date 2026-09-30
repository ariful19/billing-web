import React, { useEffect, useRef, useState } from 'react';
import {
  Home,
  ShoppingCart,
  ShoppingBag,
  Package,
  Users,
  Boxes,
  Wallet,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
  User,
} from 'lucide-react';
import {
  AppDatabaseState,
  Category,
  CompanySettings,
  HeldSale,
  NavTab,
  Party,
  PartyType,
  PrintProfile,
  Product,
} from './types';
import {
  adjustStockTransaction,
  cancelTransaction,
  collectCustomerDueTransaction,
  createInitialDatabaseState,
  createManualCashEntry,
  createPurchaseTransaction,
  createSaleTransaction,
  paySupplierPayableTransaction,
  todayIsoDate,
} from './services/billingEngine';
import { DashboardPage } from './pages/DashboardPage';
import { SalesPage } from './pages/SalesPage';
import { PurchasesPage } from './pages/PurchasesPage';
import { ProductsPage } from './pages/ProductsPage';
import { PartiesPage } from './pages/PartiesPage';
import { StockPage } from './pages/StockPage';
import { CashBookPage } from './pages/CashBookPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginScreen } from './components/LoginScreen';
import { PrintPreviewModal } from './components/PrintPreviewModal';

const STORAGE_KEY = 'retail_billing_db_v1';

function loadInitialState(): AppDatabaseState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && Array.isArray(parsed.products) && Array.isArray(parsed.parties)) {
        if (parsed.settings) {
          if (!parsed.settings.adminUsername) parsed.settings.adminUsername = 'admin';
          if (!parsed.settings.adminPassword) parsed.settings.adminPassword = 'Bill1ng!0';
          if (!parsed.settings.storeTagline) parsed.settings.storeTagline = 'Quality Products at Wholesale & Retail Rates';
        }
        return parsed;
      }
    }
  } catch {
    // ignore storage read error
  }
  return createInitialDatabaseState();
}

export function App() {
  const [state, setState] = useState<AppDatabaseState>(loadInitialState);
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [paneExpanded, setPaneExpanded] = useState(true);
  const [infoMessage, setInfoMessage] = useState<{ text: string; type: 'info' | 'success' | 'warning' } | null>(null);
  const [sqliteStatus, setSqliteStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');

  // Authenticated user state (session or local)
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    return localStorage.getItem('pos_auth_user') || sessionStorage.getItem('pos_auth_user') || null;
  });

  const handleLogout = () => {
    localStorage.removeItem('pos_auth_user');
    sessionStorage.removeItem('pos_auth_user');
    setCurrentUser(null);
    setInfoMessage({ text: 'Terminal locked. Please sign in again.', type: 'info' });
  };

  // Print preview state
  const [printModal, setPrintModal] = useState<{
    isOpen: boolean;
    title: string;
    render: (profile: PrintProfile) => string;
  }>({
    isOpen: false,
    title: '',
    render: () => '',
  });

  // Keyboard shortcut refs
  const productSearchRef = useRef<HTMLInputElement | null>(null);
  const customerSearchRef = useRef<HTMLInputElement | null>(null);
  const paidAmountRef = useRef<HTMLInputElement | null>(null);

  // Load from SQLite backend on startup
  useEffect(() => {
    fetch('/api/state')
      .then((res) => (res.ok ? res.json() : null))
      .then((serverState) => {
        if (serverState && Array.isArray(serverState.products) && serverState.products.length > 0) {
          if (serverState.settings) {
            if (!serverState.settings.adminUsername) serverState.settings.adminUsername = 'admin';
            if (!serverState.settings.adminPassword) serverState.settings.adminPassword = 'Bill1ng!0';
            if (!serverState.settings.storeTagline) serverState.settings.storeTagline = 'Quality Products at Wholesale & Retail Rates';
          }
          setState(serverState);
        }
        setSqliteStatus('connected');
      })
      .catch((e) => {
        console.warn('Initial SQLite state fetch failed:', e);
        setSqliteStatus('error');
      });
  }, []);

  // Persist to localStorage & sync to SQLite backend
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore quota error
    }
    fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    })
      .then(() => setSqliteStatus('connected'))
      .catch(() => setSqliteStatus('error'));
  }, [state]);

  // Global keyboard shortcuts matching MainWindow.xaml
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        productSearchRef.current?.focus();
      } else if (e.key === 'F3') {
        e.preventDefault();
        customerSearchRef.current?.focus();
      } else if (e.key === 'F4') {
        e.preventDefault();
        setActiveTab('sales');
      } else if (e.key === 'F5') {
        e.preventDefault();
        showBanner('Refreshed view.', 'info');
      } else if (e.key === 'F6') {
        e.preventDefault();
        paidAmountRef.current?.focus();
      } else if (e.key === 'Escape') {
        if (printModal.isOpen) {
          setPrintModal((prev) => ({ ...prev, isOpen: false }));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [printModal.isOpen]);

  const showBanner = (text: string, type: 'info' | 'success' | 'warning' = 'success') => {
    setInfoMessage({ text, type });
    setTimeout(() => {
      setInfoMessage((curr) => (curr?.text === text ? null : curr));
    }, 4500);
  };

  const openPrintPreview = (title: string, render: (profile: PrintProfile) => string) => {
    setPrintModal({
      isOpen: true,
      title,
      render,
    });
  };

  const isDark =
    state.settings.theme === 'Dark' ||
    (state.settings.theme === 'System' &&
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-color-scheme: dark)').matches);

  const navItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home className="h-4 w-4" /> },
    { id: 'sales', label: 'Sales', icon: <ShoppingCart className="h-4 w-4" /> },
    { id: 'purchases', label: 'Purchases', icon: <ShoppingBag className="h-4 w-4" /> },
    { id: 'products', label: 'Products', icon: <Package className="h-4 w-4" /> },
    { id: 'parties', label: 'Parties', icon: <Users className="h-4 w-4" /> },
    { id: 'stock', label: 'Stock', icon: <Boxes className="h-4 w-4" /> },
    { id: 'cashbook', label: 'Cash Book', icon: <Wallet className="h-4 w-4" /> },
    { id: 'reports', label: 'Reports', icon: <BarChart3 className="h-4 w-4" /> },
  ];

  if (!currentUser) {
    return (
      <LoginScreen
        settings={state.settings}
        isDark={isDark}
        onLoginSuccess={(username) => {
          setCurrentUser(username);
          showBanner(`Signed in as ${username}. POS terminal ready.`);
        }}
      />
    );
  }

  return (
    <div className={isDark ? 'dark-theme min-h-screen bg-[var(--app-surface)] text-[var(--app-text)]' : 'min-h-screen bg-[var(--app-surface)] text-[var(--app-text)]'}>
      {/* Window TitleBar matching MainWindow.xaml */}
      <header className="flex h-12 items-center justify-between border-b border-[var(--app-border)] bg-[var(--app-panel)] px-3 select-none">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setPaneExpanded((prev) => !prev)}
            className="rounded p-1.5 hover:bg-[var(--app-muted-panel)]"
            title="Toggle navigation pane"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="flex h-6 w-6 items-center justify-center rounded bg-emerald-600 text-xs font-bold text-white">
            RB
          </div>
          <span className="text-sm font-semibold">Retail Billing</span>
          <span className="hidden text-xs text-[var(--app-muted-text)] sm:inline">
            — {state.settings.companyName}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 text-[11px] text-[var(--app-muted-text)] md:flex">
            <span className="rounded border border-[var(--app-border)] bg-[var(--app-surface)] px-1.5 py-0.5">
              F2 Search
            </span>
            <span className="rounded border border-[var(--app-border)] bg-[var(--app-surface)] px-1.5 py-0.5">
              F3 Customer
            </span>
            <span className="rounded border border-[var(--app-border)] bg-[var(--app-surface)] px-1.5 py-0.5">
              F4 New Sale
            </span>
            <span className="rounded border border-[var(--app-border)] bg-[var(--app-surface)] px-1.5 py-0.5">
              F6 Payment
            </span>
          </div>

          <div className="flex items-center gap-1.5 border-l border-[var(--app-border)] pl-2 sm:pl-3">
            <div className="flex items-center gap-1.5 rounded bg-[var(--app-muted-panel)] px-2 py-1 text-xs font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-[var(--app-muted-text)] hidden sm:inline">Admin:</span>
              <span className="font-semibold text-[var(--app-text)]">{currentUser || state.settings.adminUsername || 'admin'}</span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title="Lock terminal and sign out"
              className="win-btn inline-flex items-center gap-1 px-2 py-1 text-xs hover:text-rose-600 dark:hover:text-rose-400"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Lock</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main NavigationView Layout */}
      <div className="flex min-h-[calc(100vh-48px)]">
        {/* Left NavigationView Pane */}
        <aside
          className={`flex flex-col justify-between border-r border-[var(--app-border)] bg-[var(--app-panel)] transition-all ${
            paneExpanded ? 'w-48' : 'w-14'
          }`}
        >
          <nav className="space-y-1 p-2">
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  title={item.label}
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition ${
                    active
                      ? 'bg-[var(--app-accent-soft)] font-semibold text-[var(--app-text)]'
                      : 'text-[var(--app-muted-text)] hover:bg-[var(--app-muted-panel)] hover:text-[var(--app-text)]'
                  }`}
                >
                  <span className="shrink-0">{item.icon}</span>
                  {paneExpanded && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {/* Settings Item at bottom of NavigationView */}
          <div className="border-t border-[var(--app-border)] p-2">
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              title="Settings"
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition ${
                activeTab === 'settings'
                  ? 'bg-[var(--app-accent-soft)] font-semibold text-[var(--app-text)]'
                  : 'text-[var(--app-muted-text)] hover:bg-[var(--app-muted-panel)] hover:text-[var(--app-text)]'
              }`}
            >
              <Settings className="h-4 w-4 shrink-0" />
              {paneExpanded && <span className="truncate">Settings</span>}
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex flex-1 flex-col overflow-x-hidden">
          {/* ShellInfoBar notification */}
          {infoMessage && (
            <div className="mx-5 mt-3.5 flex items-center justify-between rounded-md border border-[var(--app-border)] bg-[var(--app-accent-soft)] px-4 py-2 text-xs font-medium">
              <span>{infoMessage.text}</span>
              <button
                type="button"
                onClick={() => setInfoMessage(null)}
                className="rounded p-0.5 hover:bg-black/10"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Status Bar matching MainWindow.xaml Row 1 with SQLite status */}
          <div className="mx-5 mt-3 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[var(--app-border)] bg-[var(--app-panel)] px-3.5 py-2 text-xs">
            <div className="flex items-center gap-2">
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  sqliteStatus === 'connected'
                    ? 'bg-emerald-500 animate-pulse'
                    : sqliteStatus === 'connecting'
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
              />
              <span className="font-semibold text-[var(--app-text)]">
                SQLite Storage:
              </span>
              <span className="text-[var(--app-muted-text)]">
                {state.products.length} products, {state.parties.length} parties, {state.sales.length} sales, {state.purchases.length} purchases, {state.stockMovements.length} stock ledger records, {state.journalEntries.length} journals
              </span>
            </div>
            <div className="flex items-center gap-4 text-[var(--app-muted-text)]">
              <span>Date: {todayIsoDate()}</span>
              <span>Operator: {currentUser || state.settings.adminUsername || 'admin'}</span>
              <span>DB: retail_billing.sqlite</span>
            </div>
          </div>

          {/* Active Page Frame */}
          <main className="flex-1 px-5 py-4">
            {activeTab === 'dashboard' && (
              <DashboardPage
                state={state}
                onNavigate={setActiveTab}
                onRefresh={() => showBanner('Dashboard refreshed.')}
              />
            )}

            {activeTab === 'sales' && (
              <SalesPage
                state={state}
                productSearchRef={productSearchRef}
                customerSearchRef={customerSearchRef}
                paidAmountRef={paidAmountRef}
                onCreateSale={(input) => {
                  const clone: AppDatabaseState = structuredClone(state);
                  const saved = createSaleTransaction(clone, input);
                  setState(clone);
                  showBanner(`Saved sale invoice ${saved.invoiceNumber}.`);
                  return saved;
                }}
                onAddCustomer={(partyInput) => {
                  const clone: AppDatabaseState = structuredClone(state);
                  const nextId = clone.parties.reduce((m, p) => Math.max(m, p.id), 0) + 1;
                  const now = new Date().toISOString();
                  const newParty: Party = {
                    id: nextId,
                    partyType: 'Customer',
                    name: partyInput.name,
                    phone: partyInput.phone,
                    address: partyInput.address,
                    openingBalanceMinor: partyInput.openingBalanceMinor,
                    isActive: true,
                    createdAt: now,
                    updatedAt: now,
                  };
                  clone.parties.push(newParty);
                  setState(clone);
                  showBanner(`Customer "${newParty.name}" added.`);
                  return newParty;
                }}
                onHoldSale={(held: HeldSale) => {
                  setState((prev) => ({
                    ...prev,
                    heldSales: [held, ...prev.heldSales],
                  }));
                  showBanner(`Sale held: ${held.displayName}.`);
                }}
                onRemoveHeldSale={(id: string) => {
                  setState((prev) => ({
                    ...prev,
                    heldSales: prev.heldSales.filter((h) => h.id !== id),
                  }));
                }}
                onCancelSale={(saleId, reason) => {
                  try {
                    const clone: AppDatabaseState = structuredClone(state);
                    cancelTransaction(clone, {
                      referenceType: 'Sale',
                      referenceId: saleId,
                      reason,
                    });
                    setState(clone);
                    showBanner('Sale invoice cancelled and reversed.');
                  } catch (err: any) {
                    showBanner(err?.message || 'Cancel failed', 'warning');
                  }
                }}
                onOpenPrintPreview={openPrintPreview}
                onRefresh={() => showBanner('Sales data refreshed.')}
              />
            )}

            {activeTab === 'purchases' && (
              <PurchasesPage
                state={state}
                productSearchRef={productSearchRef}
                onCreatePurchase={(input) => {
                  const clone: AppDatabaseState = structuredClone(state);
                  const saved = createPurchaseTransaction(clone, input);
                  setState(clone);
                  showBanner(`Saved purchase ${saved.purchaseNumber}.`);
                  return saved;
                }}
                onAddSupplier={(partyInput) => {
                  const clone: AppDatabaseState = structuredClone(state);
                  const nextId = clone.parties.reduce((m, p) => Math.max(m, p.id), 0) + 1;
                  const now = new Date().toISOString();
                  const newParty: Party = {
                    id: nextId,
                    partyType: 'Supplier',
                    name: partyInput.name,
                    phone: partyInput.phone,
                    address: partyInput.address,
                    openingBalanceMinor: partyInput.openingBalanceMinor,
                    isActive: true,
                    createdAt: now,
                    updatedAt: now,
                  };
                  clone.parties.push(newParty);
                  setState(clone);
                  showBanner(`Supplier "${newParty.name}" added.`);
                  return newParty;
                }}
                onCancelPurchase={(purchaseId, reason) => {
                  try {
                    const clone: AppDatabaseState = structuredClone(state);
                    cancelTransaction(clone, {
                      referenceType: 'Purchase',
                      referenceId: purchaseId,
                      reason,
                    });
                    setState(clone);
                    showBanner('Purchase cancelled and reversed.');
                  } catch (err: any) {
                    showBanner(err?.message || 'Cancel failed', 'warning');
                  }
                }}
                onOpenPrintPreview={openPrintPreview}
                onRefresh={() => showBanner('Purchases data refreshed.')}
              />
            )}

            {activeTab === 'products' && (
              <ProductsPage
                state={state}
                productSearchRef={productSearchRef}
                onSaveProduct={(prodInput) => {
                  const clone: AppDatabaseState = structuredClone(state);
                  const now = new Date().toISOString();
                  if (prodInput.id) {
                    const existing = clone.products.find((p) => p.id === prodInput.id);
                    if (!existing) throw new Error('Product not found.');
                    const dupSku = clone.products.find(
                      (p) =>
                        p.id !== prodInput.id &&
                        p.sku.toLowerCase() === prodInput.sku.toLowerCase()
                    );
                    if (dupSku) throw new Error('Another product already uses this SKU.');
                    existing.name = prodInput.name;
                    existing.sku = prodInput.sku;
                    existing.barcode = prodInput.barcode;
                    existing.categoryId = prodInput.categoryId;
                    existing.unitId = prodInput.unitId;
                    existing.purchasePriceMinor = prodInput.purchasePriceMinor;
                    existing.sellingPriceMinor = prodInput.sellingPriceMinor;
                    existing.reorderLevel = prodInput.reorderLevel;
                    existing.notes = prodInput.notes;
                    existing.isActive = prodInput.isActive;
                    existing.updatedAt = now;
                    setState(clone);
                    showBanner(`Updated product "${existing.name}".`);
                  } else {
                    const dupSku = clone.products.find(
                      (p) => p.sku.toLowerCase() === prodInput.sku.toLowerCase()
                    );
                    if (dupSku) throw new Error('A product with this SKU already exists.');
                    const nextId = clone.products.reduce((m, p) => Math.max(m, p.id), 0) + 1;
                    const created: Product = {
                      id: nextId,
                      name: prodInput.name,
                      sku: prodInput.sku,
                      barcode: prodInput.barcode,
                      categoryId: prodInput.categoryId,
                      unitId: prodInput.unitId,
                      purchasePriceMinor: prodInput.purchasePriceMinor,
                      sellingPriceMinor: prodInput.sellingPriceMinor,
                      currentStock: prodInput.openingStock,
                      reorderLevel: prodInput.reorderLevel,
                      notes: prodInput.notes,
                      isActive: prodInput.isActive,
                      createdAt: now,
                      updatedAt: now,
                    };
                    clone.products.push(created);
                    if (prodInput.openingStock > 0) {
                      const movId =
                        clone.stockMovements.reduce((m, mov) => Math.max(m, mov.id), 0) + 1;
                      clone.stockMovements.push({
                        id: movId,
                        productId: created.id,
                        movementDate: todayIsoDate(),
                        movementType: 'OpeningStock',
                        referenceType: 'Product',
                        referenceId: created.id,
                        referenceNumber: `OPEN-${String(created.id).padStart(6, '0')}`,
                        quantity: prodInput.openingStock,
                        direction: 'In',
                        unitCostMinor: created.purchasePriceMinor,
                        description: 'Opening stock entry',
                        notes: created.notes,
                        createdAt: now,
                      });
                    }
                    setState(clone);
                    showBanner(`Added product "${created.name}".`);
                  }
                }}
                onSaveCategory={(catInput) => {
                  const clone: AppDatabaseState = structuredClone(state);
                  if (catInput.id) {
                    const existing = clone.categories.find((c) => c.id === catInput.id);
                    if (existing) {
                      existing.name = catInput.name;
                      existing.description = catInput.description;
                      setState(clone);
                      showBanner(`Updated category "${existing.name}".`);
                      return existing;
                    }
                  }
                  const nextId = clone.categories.reduce((m, c) => Math.max(m, c.id), 0) + 1;
                  const newCat: Category = {
                    id: nextId,
                    name: catInput.name,
                    description: catInput.description,
                    isActive: true,
                  };
                  clone.categories.push(newCat);
                  setState(clone);
                  showBanner(`Added category "${newCat.name}".`);
                  return newCat;
                }}
                onRefresh={() => showBanner('Product catalog refreshed.')}
              />
            )}

            {activeTab === 'parties' && (
              <PartiesPage
                state={state}
                customerSearchRef={customerSearchRef}
                onCollectCustomerDue={(input) => {
                  const clone: AppDatabaseState = structuredClone(state);
                  const receipt = collectCustomerDueTransaction(clone, input);
                  setState(clone);
                  showBanner(`Saved customer receipt ${receipt.receiptNumber}.`);
                  return receipt;
                }}
                onPaySupplierPayable={(input) => {
                  const clone: AppDatabaseState = structuredClone(state);
                  const payment = paySupplierPayableTransaction(clone, input);
                  setState(clone);
                  showBanner(`Saved supplier payment ${payment.paymentNumber}.`);
                  return payment;
                }}
                onSaveParty={(partyInput: {
                  id?: number;
                  partyType: PartyType;
                  name: string;
                  phone: string;
                  address: string;
                  openingBalanceMinor: number;
                }) => {
                  const clone: AppDatabaseState = structuredClone(state);
                  const nextId = clone.parties.reduce((m, p) => Math.max(m, p.id), 0) + 1;
                  const now = new Date().toISOString();
                  const newParty: Party = {
                    id: nextId,
                    partyType: partyInput.partyType,
                    name: partyInput.name,
                    phone: partyInput.phone,
                    address: partyInput.address,
                    openingBalanceMinor: partyInput.openingBalanceMinor,
                    isActive: true,
                    createdAt: now,
                    updatedAt: now,
                  };
                  clone.parties.push(newParty);
                  setState(clone);
                  showBanner(`Saved party "${newParty.name}".`);
                  return newParty;
                }}
                onCancelTransaction={(refType, refId, reason) => {
                  try {
                    const clone: AppDatabaseState = structuredClone(state);
                    cancelTransaction(clone, {
                      referenceType: refType,
                      referenceId: refId,
                      reason,
                    });
                    setState(clone);
                    showBanner(`${refType} cancelled and reversed.`);
                  } catch (err: any) {
                    showBanner(err?.message || 'Cancellation failed', 'warning');
                  }
                }}
                onOpenPrintPreview={openPrintPreview}
                onRefresh={() => showBanner('Parties & ledgers refreshed.')}
              />
            )}

            {activeTab === 'stock' && (
              <StockPage
                state={state}
                productSearchRef={productSearchRef}
                onAdjustStock={(input) => {
                  const clone: AppDatabaseState = structuredClone(state);
                  const mov = adjustStockTransaction(clone, input);
                  setState(clone);
                  showBanner(`Saved stock adjustment ${mov.referenceNumber}.`);
                  return mov;
                }}
                onRefresh={() => showBanner('Stock balances refreshed.')}
              />
            )}

            {activeTab === 'cashbook' && (
              <CashBookPage
                state={state}
                searchInputRef={productSearchRef}
                onCreateManualCashEntry={(input) => {
                  const clone: AppDatabaseState = structuredClone(state);
                  const tx = createManualCashEntry(clone, input);
                  setState(clone);
                  showBanner(`Saved manual cash entry ${tx.transactionNumber}.`);
                  return tx;
                }}
                onRefresh={() => showBanner('Cash book refreshed.')}
              />
            )}

            {activeTab === 'reports' && (
              <ReportsPage
                state={state}
                onOpenPrintPreview={openPrintPreview}
                onRefresh={() => showBanner('Daily report recalculated.')}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsPage
                state={state}
                onLockTerminal={handleLogout}
                onSaveSettings={(settings: CompanySettings) => {
                  setState((prev) => ({
                    ...prev,
                    settings,
                  }));
                  showBanner('Store settings and admin credentials saved.');
                }}
                onExportBackup={() => {
                  const blob = new Blob([JSON.stringify(state, null, 2)], {
                    type: 'application/json',
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `retail-billing-backup-${todayIsoDate()}.json`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  showBanner('Database backup exported.');
                }}
                onRestoreBackup={(restored: AppDatabaseState) => {
                  setState(restored);
                  showBanner('Backup restored.');
                }}
                onResetDemoData={async () => {
                  try {
                    const res = await fetch('/api/reset', { method: 'POST' });
                    if (res.ok) {
                      const data = await res.json();
                      if (data.state) {
                        setState(data.state);
                        showBanner('Reset SQLite database to default initial shop dataset.');
                        return;
                      }
                    }
                  } catch (e) {
                    console.error('Failed to reset SQLite backend:', e);
                  }
                  const fresh = createInitialDatabaseState();
                  setState(fresh);
                  showBanner('Reset to initial shop dataset.');
                }}
              />
            )}
          </main>
        </div>
      </div>

      <PrintPreviewModal
        isOpen={printModal.isOpen}
        title={printModal.title}
        defaultProfile={state.settings.defaultPrintProfile}
        renderHtml={printModal.render}
        onClose={() => setPrintModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
export default App;
