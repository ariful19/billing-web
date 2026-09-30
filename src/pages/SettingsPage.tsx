import React, { useRef, useState } from 'react';
import {
  Store,
  Shield,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Lock,
  Printer,
  Sliders,
  Database,
  Building2,
  Save,
  LogOut,
  RefreshCw,
  Download,
  FileUp,
} from 'lucide-react';
import { AppDatabaseState, CompanySettings } from '../types';

interface SettingsPageProps {
  state: AppDatabaseState;
  onSaveSettings: (settings: CompanySettings) => void;
  onExportBackup: () => void;
  onRestoreBackup: (data: AppDatabaseState) => void;
  onResetDemoData: () => void;
  onLockTerminal?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  state,
  onSaveSettings,
  onExportBackup,
  onRestoreBackup,
  onResetDemoData,
  onLockTerminal,
}) => {
  const [form, setForm] = useState<CompanySettings>(() => ({
    ...state.settings,
    adminUsername: state.settings.adminUsername || 'admin',
    adminPassword: state.settings.adminPassword || 'Bill1ng!0',
  }));

  const [savedNotice, setSavedNotice] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'store' | 'security' | 'business' | 'print' | 'database'>('store');

  // Password change state
  const [adminUsernameInput, setAdminUsernameInput] = useState(form.adminUsername || 'admin');
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ text: string; isError: boolean } | null>(null);

  // SQLite stats state
  const [sqliteStats, setSqliteStats] = useState<any>(null);
  const [checkingSqlite, setCheckingSqlite] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const checkSqliteDb = async () => {
    setCheckingSqlite(true);
    try {
      const res = await fetch('/api/sqlite/info');
      if (res.ok) {
        const data = await res.json();
        setSqliteStats(data);
      }
    } catch {
      // ignore
    } finally {
      setCheckingSqlite(false);
    }
  };

  React.useEffect(() => {
    checkSqliteDb();
  }, []);

  // Save all general settings
  const handleSave = () => {
    const updated = {
      ...form,
      adminUsername: adminUsernameInput.trim() || form.adminUsername || 'admin',
    };
    setForm(updated);
    onSaveSettings(updated);
    setSavedNotice('Store details and settings saved successfully to SQLite database.');
    setTimeout(() => setSavedNotice(''), 4000);
  };

  // Password & username change handler
  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    const actualCurrentPass = form.adminPassword || 'Bill1ng!0';
    const trimmedUser = adminUsernameInput.trim();

    if (!trimmedUser) {
      setPasswordFeedback({ text: 'Admin username cannot be blank.', isError: true });
      return;
    }

    if (!currentPasswordInput) {
      setPasswordFeedback({ text: 'Please enter your current password to authorize changes.', isError: true });
      return;
    }

    if (currentPasswordInput !== actualCurrentPass) {
      setPasswordFeedback({ text: 'Current password does not match. Default is Bill1ng!0', isError: true });
      return;
    }

    if (!newPasswordInput) {
      setPasswordFeedback({ text: 'Please enter a new password.', isError: true });
      return;
    }

    if (newPasswordInput.length < 4) {
      setPasswordFeedback({ text: 'New password must be at least 4 characters.', isError: true });
      return;
    }

    if (newPasswordInput !== confirmPasswordInput) {
      setPasswordFeedback({ text: 'New password and confirmation do not match.', isError: true });
      return;
    }

    // Apply change
    const updated: CompanySettings = {
      ...form,
      adminUsername: trimmedUser,
      adminPassword: newPasswordInput,
    };

    setForm(updated);
    onSaveSettings(updated);

    setCurrentPasswordInput('');
    setNewPasswordInput('');
    setConfirmPasswordInput('');
    setPasswordFeedback({
      text: `Admin credentials updated successfully! Username: "${trimmedUser}". Password has been saved to the SQLite database.`,
      isError: false,
    });
  };

  const handleRestoreFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (parsed && Array.isArray(parsed.products) && Array.isArray(parsed.parties)) {
          onRestoreBackup(parsed);
          setForm(parsed.settings);
          setSavedNotice('Database backup restored successfully.');
        } else {
          setSavedNotice('Invalid backup file format.');
        }
      } catch {
        setSavedNotice('Failed to read backup file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[26px] font-semibold leading-tight">Settings & Administration</h1>
          <p className="text-sm text-[var(--app-muted-text)]">
            Store identity, basic configuration, admin security credentials, and SQLite database.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onLockTerminal && (
            <button
              type="button"
              onClick={onLockTerminal}
              className="win-btn inline-flex items-center gap-1.5 text-xs"
              title="Lock terminal and show login screen"
            >
              <LogOut className="h-3.5 w-3.5" />
              Lock Terminal
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            className="win-btn-primary inline-flex items-center gap-1.5 px-4 py-1.5 text-xs shadow-sm"
          >
            <Save className="h-3.5 w-3.5" />
            Save Changes
          </button>
        </div>
      </div>

      {savedNotice && (
        <div className="flex items-center gap-2 rounded border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{savedNotice}</span>
        </div>
      )}

      {/* Settings Navigation Tabs */}
      <div className="flex border-b border-[var(--app-border)] overflow-x-auto text-xs font-medium gap-1">
        <button
          type="button"
          onClick={() => setActiveSubTab('store')}
          className={`flex items-center gap-2 px-3.5 py-2.5 border-b-2 transition ${
            activeSubTab === 'store'
              ? 'border-emerald-600 font-semibold text-[var(--app-text)]'
              : 'border-transparent text-[var(--app-muted-text)] hover:text-[var(--app-text)]'
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Store & Basic Info</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('security')}
          className={`flex items-center gap-2 px-3.5 py-2.5 border-b-2 transition ${
            activeSubTab === 'security'
              ? 'border-emerald-600 font-semibold text-[var(--app-text)]'
              : 'border-transparent text-[var(--app-muted-text)] hover:text-[var(--app-text)]'
          }`}
        >
          <KeyRound className="h-4 w-4" />
          <span>Admin & Password</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('business')}
          className={`flex items-center gap-2 px-3.5 py-2.5 border-b-2 transition ${
            activeSubTab === 'business'
              ? 'border-emerald-600 font-semibold text-[var(--app-text)]'
              : 'border-transparent text-[var(--app-muted-text)] hover:text-[var(--app-text)]'
          }`}
        >
          <Sliders className="h-4 w-4" />
          <span>Business Rules</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('print')}
          className={`flex items-center gap-2 px-3.5 py-2.5 border-b-2 transition ${
            activeSubTab === 'print'
              ? 'border-emerald-600 font-semibold text-[var(--app-text)]'
              : 'border-transparent text-[var(--app-muted-text)] hover:text-[var(--app-text)]'
          }`}
        >
          <Printer className="h-4 w-4" />
          <span>Printing & Theme</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('database')}
          className={`flex items-center gap-2 px-3.5 py-2.5 border-b-2 transition ${
            activeSubTab === 'database'
              ? 'border-emerald-600 font-semibold text-[var(--app-text)]'
              : 'border-transparent text-[var(--app-muted-text)] hover:text-[var(--app-text)]'
          }`}
        >
          <Database className="h-4 w-4" />
          <span>SQLite Database</span>
        </button>
      </div>

      {/* TAB 1: Store & Basic Things */}
      {activeSubTab === 'store' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Main Store Form */}
          <div className="lg:col-span-2 space-y-4">
            <div className="win-panel space-y-3.5">
              <div className="flex items-center gap-2 border-b border-[var(--app-border)] pb-2.5">
                <Store className="h-5 w-5 text-emerald-600" />
                <h2 className="text-[17px] font-semibold">Store & Company Profile</h2>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="win-label">Store / Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bismillah Retail & Mart"
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                    className="win-input font-medium"
                  />
                  <p className="mt-1 text-[11px] text-[var(--app-muted-text)]">
                    Appears on sales invoices, thermal POS receipts, and window title.
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label className="win-label">Store Tagline / Slogan</label>
                  <input
                    type="text"
                    placeholder="e.g. Quality Products at Wholesale & Retail Rates"
                    value={form.storeTagline || ''}
                    onChange={(e) => setForm({ ...form, storeTagline: e.target.value })}
                    className="win-input"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="win-label">Store Address *</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. House 24, Road 7, Dhanmondi, Dhaka-1205"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="win-input text-xs"
                  />
                  <p className="mt-1 text-[11px] text-[var(--app-muted-text)]">
                    Physical location printed on cash slips and official invoices.
                  </p>
                </div>

                <div>
                  <label className="win-label">Phone / Mobile *</label>
                  <input
                    type="text"
                    placeholder="e.g. 01700-112233"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="win-input"
                  />
                </div>

                <div>
                  <label className="win-label">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. store@retailmart.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="win-input"
                  />
                </div>

                <div>
                  <label className="win-label">Tax / VAT / BIN / Trade License No.</label>
                  <input
                    type="text"
                    placeholder="e.g. BIN-002849102-01"
                    value={form.taxNumber || ''}
                    onChange={(e) => setForm({ ...form, taxNumber: e.target.value })}
                    className="win-input font-mono"
                  />
                </div>

                <div>
                  <label className="win-label">Currency Symbol / Code *</label>
                  <input
                    type="text"
                    placeholder="e.g. BDT, $, €, £"
                    value={form.currencyCode}
                    onChange={(e) => setForm({ ...form, currencyCode: e.target.value })}
                    className="win-input font-bold"
                  />
                </div>

                <div>
                  <label className="win-label">Invoice Number Prefix</label>
                  <input
                    type="text"
                    placeholder="INV-"
                    value={form.invoicePrefix}
                    onChange={(e) => setForm({ ...form, invoicePrefix: e.target.value })}
                    className="win-input font-mono"
                  />
                </div>

                <div>
                  <label className="win-label">Purchase Bill Prefix</label>
                  <input
                    type="text"
                    placeholder="PO-"
                    value={form.purchasePrefix}
                    onChange={(e) => setForm({ ...form, purchasePrefix: e.target.value })}
                    className="win-input font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="win-label">Receipt Footer Note</label>
                  <textarea
                    rows={2}
                    placeholder="Thank you for shopping with us! Please come again."
                    value={form.footerNote}
                    onChange={(e) => setForm({ ...form, footerNote: e.target.value })}
                    className="win-input text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSave}
                  className="win-btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs"
                >
                  <Save className="h-3.5 w-3.5" />
                  Save Store Details
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Live Header Preview */}
          <div className="space-y-4">
            <div className="win-panel space-y-3">
              <h2 className="text-[15px] font-semibold">Live Receipt Header Preview</h2>
              <p className="text-xs text-[var(--app-muted-text)]">
                This is how your store identity appears on printed customer receipts and invoices.
              </p>

              {/* Receipt Preview Paper Card */}
              <div className="rounded border border-dashed border-[var(--app-border)] bg-[var(--app-surface)] p-4 text-center font-mono text-xs shadow-inner space-y-1">
                <div className="text-base font-bold uppercase tracking-wide text-[var(--app-text)]">
                  {form.companyName || 'STORE NAME'}
                </div>
                {form.storeTagline && (
                  <div className="text-[11px] text-[var(--app-muted-text)] italic">
                    {form.storeTagline}
                  </div>
                )}
                <div className="text-[11px] text-[var(--app-muted-text)]">
                  {form.address || 'Store Address'}
                </div>
                <div className="text-[11px] text-[var(--app-muted-text)]">
                  Tel: {form.phone || 'Phone Number'} {form.email ? `| ${form.email}` : ''}
                </div>
                {form.taxNumber && (
                  <div className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                    VAT/BIN: {form.taxNumber}
                  </div>
                )}
                <div className="my-2 border-b border-dashed border-[var(--app-border)]"></div>
                <div className="flex justify-between text-[11px] text-[var(--app-muted-text)]">
                  <span>Invoice: {form.invoicePrefix}000104</span>
                  <span>Currency: {form.currencyCode}</span>
                </div>
                <div className="my-2 border-b border-dashed border-[var(--app-border)]"></div>
                <div className="text-[10px] text-[var(--app-muted-text)] italic pt-1">
                  "{form.footerNote || 'Thank you for your visit!'}"
                </div>
              </div>

              <div className="rounded bg-[var(--app-muted-panel)] p-2.5 text-xs text-[var(--app-muted-text)]">
                💡 <strong>Tip:</strong> Changes made here update throughout the POS immediately, including invoices, cash register, and printouts.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Admin Username & Password Change Box */}
      {activeSubTab === 'security' && (
        <div className="max-w-2xl space-y-4">
          <div className="win-panel space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--app-border)] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-600">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-[17px] font-semibold">Admin Credentials & Security</h2>
                  <p className="text-xs text-[var(--app-muted-text)]">
                    Update the administrator login username and password.
                  </p>
                </div>
              </div>
              <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                Local Admin
              </span>
            </div>

            {/* Current status banner */}
            <div className="rounded-lg border border-[var(--app-border)] bg-[var(--app-muted-panel)] p-3 text-xs flex items-center justify-between">
              <div>
                <span className="text-[var(--app-muted-text)]">Current Admin User: </span>
                <span className="font-semibold font-mono text-[var(--app-text)]">
                  {form.adminUsername || 'admin'}
                </span>
              </div>
              <div className="text-[11px] text-[var(--app-muted-text)]">
                Default Password was: <code className="font-mono bg-[var(--app-surface)] px-1 rounded">Bill1ng!0</code>
              </div>
            </div>

            {/* Feedback alert */}
            {passwordFeedback && (
              <div
                className={`flex items-start gap-2 rounded-lg border p-3 text-xs ${
                  passwordFeedback.isError
                    ? 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300'
                    : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                }`}
              >
                {passwordFeedback.isError ? (
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                )}
                <span>{passwordFeedback.text}</span>
              </div>
            )}

            {/* Password Change Form */}
            <form onSubmit={handlePasswordChange} className="space-y-4">
              {/* Admin Username Field */}
              <div>
                <label className="win-label">Admin Username</label>
                <input
                  type="text"
                  required
                  value={adminUsernameInput}
                  onChange={(e) => setAdminUsernameInput(e.target.value)}
                  placeholder="admin"
                  className="win-input font-medium max-w-sm"
                />
                <p className="mt-1 text-[11px] text-[var(--app-muted-text)]">
                  The login ID used to sign in to the POS system.
                </p>
              </div>

              <div className="border-t border-[var(--app-border)] pt-3">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                  <Lock className="h-4 w-4 text-[var(--app-muted-text)]" />
                  Change Password Box
                </h3>

                <div className="space-y-3 max-w-sm">
                  {/* Current Password */}
                  <div>
                    <label className="win-label">Current Password *</label>
                    <div className="relative">
                      <input
                        type={showCurrentPass ? 'text' : 'password'}
                        required
                        value={currentPasswordInput}
                        onChange={(e) => setCurrentPasswordInput(e.target.value)}
                        placeholder="Enter current password (e.g. Bill1ng!0)"
                        className="win-input pr-9"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                        tabIndex={-1}
                        className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-[var(--app-muted-text)] hover:text-[var(--app-text)]"
                      >
                        {showCurrentPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="win-label">New Password *</label>
                    <div className="relative">
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        required
                        value={newPasswordInput}
                        onChange={(e) => setNewPasswordInput(e.target.value)}
                        placeholder="At least 4 characters"
                        className="win-input pr-9"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        tabIndex={-1}
                        className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-[var(--app-muted-text)] hover:text-[var(--app-text)]"
                      >
                        {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label className="win-label">Confirm New Password *</label>
                    <div className="relative">
                      <input
                        type={showConfirmPass ? 'text' : 'password'}
                        required
                        value={confirmPasswordInput}
                        onChange={(e) => setConfirmPasswordInput(e.target.value)}
                        placeholder="Re-enter new password"
                        className="win-input pr-9"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        tabIndex={-1}
                        className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-[var(--app-muted-text)] hover:text-[var(--app-text)]"
                      >
                        {showConfirmPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="win-btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs shadow-sm"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  Update Admin Username & Password
                </button>

                {onLockTerminal && (
                  <button
                    type="button"
                    onClick={onLockTerminal}
                    className="win-btn inline-flex items-center gap-1.5 px-3 py-2 text-xs"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Lock Terminal to Test New Password
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: Business Rules */}
      {activeSubTab === 'business' && (
        <div className="max-w-2xl win-panel space-y-3.5">
          <div className="flex items-center gap-2 border-b border-[var(--app-border)] pb-2.5">
            <Sliders className="h-5 w-5 text-emerald-600" />
            <h2 className="text-[17px] font-semibold">Business & POS Rules</h2>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-2 rounded border border-[var(--app-border)] text-xs font-medium cursor-pointer hover:bg-[var(--app-muted-panel)]">
              <div>
                <span className="text-[var(--app-text)] font-semibold block">Allow Negative Stock</span>
                <span className="text-[var(--app-muted-text)] text-[11px]">
                  Permit sales even if the stock counter drops below 0.
                </span>
              </div>
              <input
                type="checkbox"
                checked={form.allowNegativeStock}
                onChange={(e) => setForm({ ...form, allowNegativeStock: e.target.checked })}
                className="h-4 w-4 text-emerald-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded border border-[var(--app-border)] text-xs font-medium cursor-pointer hover:bg-[var(--app-muted-panel)]">
              <div>
                <span className="text-[var(--app-text)] font-semibold block">Allow Sale Price Editing in Cart</span>
                <span className="text-[var(--app-muted-text)] text-[11px]">
                  Allow cashiers to adjust selling rates manually during billing.
                </span>
              </div>
              <input
                type="checkbox"
                checked={form.allowSalePriceEditing}
                onChange={(e) => setForm({ ...form, allowSalePriceEditing: e.target.checked })}
                className="h-4 w-4 text-emerald-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded border border-[var(--app-border)] text-xs font-medium cursor-pointer hover:bg-[var(--app-muted-panel)]">
              <div>
                <span className="text-[var(--app-text)] font-semibold block">Require Customer for Credit Sale</span>
                <span className="text-[var(--app-muted-text)] text-[11px]">
                  Prevent credit / due sales without selecting a registered party.
                </span>
              </div>
              <input
                type="checkbox"
                checked={form.requireCustomerForCreditSale}
                onChange={(e) =>
                  setForm({ ...form, requireCustomerForCreditSale: e.target.checked })
                }
                className="h-4 w-4 text-emerald-600 rounded"
              />
            </label>

            <div>
              <label className="win-label">Default Payment Method</label>
              <select
                value={form.defaultPaymentMethod}
                onChange={(e) =>
                  setForm({ ...form, defaultPaymentMethod: e.target.value as any })
                }
                className="win-input max-w-sm"
              >
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="Mobile">Mobile Banking (bKash / Nagad / UPI)</option>
              </select>
            </div>

            <div>
              <label className="win-label">Inventory Costing Method</label>
              <select disabled value={form.costingMethod} className="win-input max-w-sm opacity-70">
                <option value="WeightedAverage">Weighted Average (Standard)</option>
              </select>
              <p className="mt-1 text-xs text-[var(--app-muted-text)]">
                Cost of goods sold is computed using standard Weighted Average.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleSave}
              className="win-btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs"
            >
              <Save className="h-3.5 w-3.5" />
              Save Rules
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: Printing & Theme */}
      {activeSubTab === 'print' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Printing Options */}
          <div className="win-panel space-y-3.5">
            <div className="flex items-center gap-2 border-b border-[var(--app-border)] pb-2.5">
              <Printer className="h-5 w-5 text-emerald-600" />
              <h2 className="text-[17px] font-semibold">Printing Configuration</h2>
            </div>

            <div>
              <label className="win-label">Default Print Profile</label>
              <select
                value={form.defaultPrintProfile}
                onChange={(e) =>
                  setForm({ ...form, defaultPrintProfile: e.target.value as any })
                }
                className="win-input"
              >
                <option value="A4">A4 Full Sheet</option>
                <option value="A5">A5 Half Sheet</option>
                <option value="Thermal80">80mm Thermal Receipt (Standard POS)</option>
                <option value="Thermal58">58mm Thermal Receipt (Mini POS)</option>
              </select>
            </div>

            <div>
              <label className="win-label">Logo Image Path / URL</label>
              <input
                type="text"
                placeholder="Optional logo URL or file path"
                value={form.logoPath}
                onChange={(e) => setForm({ ...form, logoPath: e.target.value })}
                className="win-input"
              />
            </div>

            <div>
              <label className="win-label">Default Invoice Footer</label>
              <input
                type="text"
                placeholder="Thank you for your business."
                value={form.footerNote}
                onChange={(e) => setForm({ ...form, footerNote: e.target.value })}
                className="win-input"
              />
            </div>

            <label className="flex items-center justify-between text-xs font-medium cursor-pointer">
              <span>Show previous balance / due on customer invoice</span>
              <input
                type="checkbox"
                checked={form.showPreviousDueOnSalesInvoice}
                onChange={(e) =>
                  setForm({ ...form, showPreviousDueOnSalesInvoice: e.target.checked })
                }
                className="h-4 w-4 text-emerald-600 rounded"
              />
            </label>
          </div>

          {/* Theme & Display */}
          <div className="win-panel space-y-3.5">
            <h2 className="text-[17px] font-semibold">Display & Theme</h2>
            <div>
              <label className="win-label">Color Theme</label>
              <select
                value={form.theme}
                onChange={(e) => {
                  const nextTheme = e.target.value as any;
                  const next = { ...form, theme: nextTheme };
                  setForm(next);
                  onSaveSettings(next);
                }}
                className="win-input"
              >
                <option value="System">System Default</option>
                <option value="Light">Light Mode</option>
                <option value="Dark">Dark Mode</option>
              </select>
            </div>

            <div className="pt-3 border-t border-[var(--app-border)] text-xs text-[var(--app-muted-text)] space-y-1.5">
              <div className="font-semibold text-[var(--app-text)]">Windows Desktop Ergonomics</div>
              <p>
                Clean font metrics, compact tables, high-contrast borders, and instant keyboard shortcuts (F2 Search, F3 Customer, F4 New Sale, F6 Payment).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SQLite Database & Backup */}
      {activeSubTab === 'database' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* SQLite Engine */}
          <div className="win-panel space-y-3.5">
            <div className="flex items-center justify-between border-b border-[var(--app-border)] pb-2.5">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-emerald-600" />
                <h2 className="text-[17px] font-semibold">SQLite Database</h2>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Active WAL
              </span>
            </div>

            <p className="text-xs text-[var(--app-muted-text)]">
              All transactions, invoices, products, stock ledger, cash book, and admin credentials are persistently stored in the local SQLite engine.
            </p>

            <div className="rounded border border-[var(--app-border)] bg-[var(--app-muted-panel)] p-3 text-xs space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-[var(--app-muted-text)]">Engine:</span>
                <span className="font-semibold text-[var(--app-text)]">SQLite 3 (WAL mode)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--app-muted-text)]">DB File:</span>
                <span className="font-semibold text-[var(--app-text)] truncate max-w-[220px]">
                  {sqliteStats?.dbPath || 'data/retail_billing.sqlite'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--app-muted-text)]">Tables:</span>
                <span className="text-[var(--app-text)]">
                  {sqliteStats?.totalTables ?? 13} tables initialized
                </span>
              </div>
              {sqliteStats?.counts && (
                <div className="pt-2 border-t border-[var(--app-border)] grid grid-cols-2 gap-1.5 text-[11px]">
                  <div>Products: <b>{sqliteStats.counts.products}</b></div>
                  <div>Sales Invoices: <b>{sqliteStats.counts.sales}</b></div>
                  <div>Parties: <b>{sqliteStats.counts.parties}</b></div>
                  <div>Stock Movements: <b>{sqliteStats.counts.stock_movements}</b></div>
                  <div>Journal Entries: <b>{sqliteStats.counts.journal_entries}</b></div>
                  <div>Cash Transactions: <b>{sqliteStats.counts.cash_transactions}</b></div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <a
                href="/api/sqlite/download"
                download="retail_billing.sqlite"
                className="win-btn inline-flex items-center gap-1.5 text-xs"
              >
                <Download className="h-3.5 w-3.5" />
                Download .sqlite File
              </a>
              <button
                type="button"
                onClick={checkSqliteDb}
                disabled={checkingSqlite}
                className="win-btn inline-flex items-center gap-1.5 text-xs"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${checkingSqlite ? 'animate-spin' : ''}`} />
                {checkingSqlite ? 'Checking...' : 'Verify Status'}
              </button>
            </div>
          </div>

          {/* Backup & Data Reset */}
          <div className="win-panel space-y-3.5">
            <h2 className="text-[17px] font-semibold">Backup & Recovery</h2>
            <p className="text-xs text-[var(--app-muted-text)]">
              Export or restore complete JSON snapshots of the store database.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={onExportBackup}
                className="win-btn inline-flex items-center gap-1.5 text-xs"
              >
                <Download className="h-3.5 w-3.5" />
                Export JSON Backup
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="win-btn inline-flex items-center gap-1.5 text-xs"
              >
                <FileUp className="h-3.5 w-3.5" />
                Restore JSON Backup...
              </button>
              <button
                type="button"
                onClick={onResetDemoData}
                className="win-btn text-rose-600 hover:text-rose-700 text-xs"
              >
                Reset Database
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleRestoreFileChange}
                className="hidden"
              />
            </div>

            <div className="border-t border-[var(--app-border)] pt-3 text-xs">
              <div className="font-semibold">Retail Billing System v1.0.0</div>
              <div className="text-[var(--app-muted-text)]">
                Local POS with persistent SQLite & Multi-Account Ledger.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
