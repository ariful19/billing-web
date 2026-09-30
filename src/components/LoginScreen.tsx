import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, ShieldCheck, Store, Database, ArrowRight, AlertCircle, KeyRound } from 'lucide-react';
import { CompanySettings } from '../types';

interface LoginScreenProps {
  settings: CompanySettings;
  onLoginSuccess: (username: string) => void;
  isDark?: boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  settings,
  onLoginSuccess,
  isDark = false,
}) => {
  const defaultAdminUser = settings.adminUsername?.trim() || 'admin';
  const expectedPassword = settings.adminPassword || 'Bill1ng!0';

  const [username, setUsername] = useState(defaultAdminUser);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    const trimmedUser = username.trim();
    if (!trimmedUser) {
      setError('Please enter your username.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);

    // Validate credentials
    setTimeout(() => {
      const validUser = (settings.adminUsername || 'admin').trim().toLowerCase();
      const currentPassword = settings.adminPassword || 'Bill1ng!0';

      if (trimmedUser.toLowerCase() === validUser && password === currentPassword) {
        if (rememberMe) {
          localStorage.setItem('pos_auth_user', trimmedUser);
        } else {
          sessionStorage.setItem('pos_auth_user', trimmedUser);
        }
        onLoginSuccess(trimmedUser);
      } else {
        setError('Incorrect username or password. Default password is Bill1ng!0');
        setIsSubmitting(false);
      }
    }, 200);
  };

  const handleUseDefaultCredentials = () => {
    setUsername(settings.adminUsername || 'admin');
    setPassword(settings.adminPassword || 'Bill1ng!0');
    setError('');
  };

  return (
    <div className={`flex min-h-screen flex-col items-center justify-center p-4 select-none ${isDark ? 'dark-theme bg-[var(--app-surface)] text-[var(--app-text)]' : 'bg-slate-100 text-slate-800'}`}>
      {/* Background ambient pattern */}
      <div className="w-full max-w-md">
        {/* Top Branding Card */}
        <div className="mb-4 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
            <Store className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--app-text)]">
            {settings.companyName || 'Retail Billing Mart'}
          </h1>
          <p className="mt-1 text-xs text-[var(--app-muted-text)] font-medium">
            {settings.storeTagline || 'Retail Point of Sale & Inventory Management'}
          </p>
          {settings.address && (
            <p className="mt-0.5 text-[11px] text-[var(--app-muted-text)] line-clamp-1">
              {settings.address}
            </p>
          )}
        </div>

        {/* Login Box */}
        <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-panel)] p-6 shadow-xl shadow-black/5">
          <div className="mb-5 flex items-center justify-between border-b border-[var(--app-border)] pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <span className="text-sm font-semibold">Admin Authentication</span>
            </div>
            <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              Authorized Access
            </span>
          </div>

          {/* Default password onboarding helper banner */}
          <div className="mb-4 rounded-lg border border-blue-500/30 bg-blue-50 dark:bg-blue-950/30 p-2.5 text-xs text-blue-800 dark:text-blue-300">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <KeyRound className="h-4 w-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                <div>
                  <div className="font-semibold">System Default Login</div>
                  <div className="text-[11px] opacity-90">
                    Username: <code className="font-mono font-bold bg-blue-100 dark:bg-blue-900/60 px-1 py-0.5 rounded">{defaultAdminUser}</code> &nbsp;|&nbsp;
                    Password: <code className="font-mono font-bold bg-blue-100 dark:bg-blue-900/60 px-1 py-0.5 rounded">{expectedPassword}</code>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleUseDefaultCredentials}
                className="shrink-0 rounded bg-blue-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-blue-700 transition"
              >
                Auto Fill
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-50 dark:bg-rose-950/30 p-2.5 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-medium mb-1.5 text-[var(--app-muted-text)]">
                Admin Username
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--app-muted-text)]">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="admin"
                  className="w-full rounded-md border border-[var(--app-border)] bg-[var(--app-surface)] py-2 pl-9 pr-3 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-[var(--app-muted-text)]">
                  Password
                </label>
                <span className="text-[10px] text-[var(--app-muted-text)]">
                  Default: Bill1ng!0
                </span>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--app-muted-text)]">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Enter admin password"
                  className="w-full rounded-md border border-[var(--app-border)] bg-[var(--app-surface)] py-2 pl-9 pr-10 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--app-muted-text)] hover:text-[var(--app-text)]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs font-medium text-[var(--app-muted-text)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-[var(--app-border)] text-emerald-600 focus:ring-emerald-500"
                />
                <span>Remember on this terminal</span>
              </label>
              <span className="text-[11px] text-[var(--app-muted-text)]">
                Local Admin
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 active:scale-[0.99] transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Verifying credentials...</span>
              ) : (
                <>
                  <span>Sign In to POS</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* System & SQLite Info Bar */}
        <div className="mt-4 flex items-center justify-between px-2 text-[11px] text-[var(--app-muted-text)]">
          <div className="flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5 text-emerald-600" />
            <span>SQLite 3 (WAL Storage)</span>
          </div>
          <span>Retail Billing POS v1.0.0</span>
        </div>
      </div>
    </div>
  );
};
