import { useFinanceStore, useWorkspaceSettings } from '../store/useFinanceStore';
import { SlidersHorizontal, Settings2, Database, RefreshCw, Cloud, CloudOff, CheckCircle2, AlertCircle, Key, Globe } from 'lucide-react';
import { useState } from 'react';
import ClearDataModal from './ClearDataModal';
import SecurityAuthModal from './SecurityAuthModal';
import ChangePasswordModal from './ChangePasswordModal';
import PinSetupModal from './Auth/PinSetupModal';
import { useAuth } from '../context/AuthContext';
import { getSupabaseConfig } from '../supabase';
import { format, parseISO } from 'date-fns';

export default function SettingsPage() {
  const {
    updateBudget,
    setIncludeLendBorrow,
    setGlobalBudgetOptions,
    setBudgetCycle,
    requirePasswordForDelete,
    setRequirePasswordForDelete,
    pinPlatforms,
    setPinPlatforms,
    autoSyncEnabled,
    setAutoSyncEnabled,
    syncWithSupabase,
    isSyncing,
    lastSyncedAt,
    pendingSyncCount,
    syncError,
  } = useFinanceStore();

  const { budgets, includeLendBorrow, useGlobalBudget, globalBudgetLimit, budgetCycle } =
    useWorkspaceSettings();
  const { hasPinSetup } = useAuth();

  const [localBudgets, setLocalBudgets] = useState(
    Object.keys(budgets).reduce((acc, cat) => {
      acc[cat] = budgets[cat].limit;
      return acc;
    }, {})
  );

  const [localUseGlobal, setLocalUseGlobal] = useState(useGlobalBudget);
  const [localGlobalLimit, setLocalGlobalLimit] = useState(globalBudgetLimit);
  const [saved, setSaved] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [showDisableSecurityAuth, setShowDisableSecurityAuth] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [showPinAuth, setShowPinAuth] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(
    () => localStorage.getItem('finance_biometric_enabled') === 'true'
  );

  // Supabase Custom Credentials State
  const [showConfig, setShowConfig] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState(() => localStorage.getItem('finance_supabase_url') || '');
  const [supabaseKey, setSupabaseKey] = useState(() => localStorage.getItem('finance_supabase_key') || '');
  const [configSavedMsg, setConfigSavedMsg] = useState('');

  const handleSecurityToggle = (checked) => {
    if (!checked && requirePasswordForDelete) {
      setShowDisableSecurityAuth(true);
    } else {
      setRequirePasswordForDelete(true);
    }
  };

  const handleSaveBudgets = () => {
    if (localUseGlobal) {
      setGlobalBudgetOptions(localUseGlobal, Number(localGlobalLimit));
    } else {
      setGlobalBudgetOptions(localUseGlobal, Number(localGlobalLimit));
      Object.entries(localBudgets).forEach(([category, limit]) => {
        updateBudget(category, Number(limit));
      });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveSupabaseConfig = (e) => {
    e.preventDefault();
    if (supabaseUrl && supabaseKey) {
      localStorage.setItem('finance_supabase_url', supabaseUrl.trim());
      localStorage.setItem('finance_supabase_key', supabaseKey.trim());
    } else {
      localStorage.removeItem('finance_supabase_url');
      localStorage.removeItem('finance_supabase_key');
    }
    setConfigSavedMsg('Supabase configuration updated!');
    setTimeout(() => {
      setConfigSavedMsg('');
      setShowConfig(false);
      window.location.reload();
    }, 1500);
  };

  const currentSupabase = getSupabaseConfig();

  return (
    <div className="flex flex-col gap-6 animate-[slideUp_180ms_ease-out] h-full pb-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings2 size={24} /> Settings
        </h1>
        <p className="text-[var(--text-muted)] text-sm">
          Configure offline storage, database sync preferences, and budget rules.
        </p>
      </header>

      {/* Database & Cloud Sync Section */}
      <div className="surface-card p-6 flex flex-col gap-6 border border-[var(--accent-violet)]/30 bg-gradient-to-br from-[var(--accent-violet)]/5 to-transparent shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--bg-surface-lit)] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[var(--accent-violet)]/10 text-[var(--accent-violet)]">
              <Database size={22} />
            </div>
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                Supabase Sync & Offline Database
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Use the app 100% offline on mobile, and sync to Supabase whenever online.
              </p>
            </div>
          </div>

          <button
            onClick={() => syncWithSupabase()}
            disabled={isSyncing}
            className="px-5 py-2.5 rounded-xl bg-[var(--accent-violet)] text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-[var(--accent-glow)] active:scale-95 transition-all disabled:opacity-50"
          >
            <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>

        {/* Sync Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[var(--bg-surface-lit)] flex flex-col gap-1 border border-transparent hover:border-[var(--accent-violet)]/20 transition-all">
            <span className="text-xs text-[var(--text-muted)] font-medium">Connection Status</span>
            <div className="flex items-center gap-2 font-bold text-sm mt-1">
              {navigator.onLine ? (
                <>
                  <Cloud size={18} className="text-emerald-500" />
                  <span className="text-emerald-500">Online & Active</span>
                </>
              ) : (
                <>
                  <CloudOff size={18} className="text-[var(--status-red)]" />
                  <span className="text-[var(--status-red)]">Offline Mode</span>
                </>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[var(--bg-surface-lit)] flex flex-col gap-1 border border-transparent hover:border-[var(--accent-violet)]/20 transition-all">
            <span className="text-xs text-[var(--text-muted)] font-medium">Last Synced</span>
            <span className="text-sm font-bold mt-1 text-[var(--text-main)]">
              {lastSyncedAt
                ? format(parseISO(lastSyncedAt), 'MMM dd, yyyy • hh:mm a')
                : 'Not synced yet'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[var(--bg-surface-lit)] flex flex-col gap-1 border border-transparent hover:border-[var(--accent-violet)]/20 transition-all">
            <span className="text-xs text-[var(--text-muted)] font-medium">Pending Local Changes</span>
            <span className="text-sm font-bold mt-1 text-[var(--accent-violet)]">
              {pendingSyncCount === 0 ? 'All synced' : `${pendingSyncCount} change(s) waiting`}
            </span>
          </div>
        </div>

        {/* Toggles */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--bg-surface-lit)]">
          <div className="flex flex-col">
            <span className="font-medium text-sm">Automatic Background Sync</span>
            <span className="text-xs text-[var(--text-muted)] mt-0.5">
              Automatically sync local mutations to Supabase whenever an internet connection is available.
            </span>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={autoSyncEnabled}
              onChange={(e) => setAutoSyncEnabled(e.target.checked)}
            />
            <div className="w-11 h-6 bg-[var(--bg-surface-lit)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent-violet)]"></div>
          </label>
        </div>

        {syncError && (
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 text-xs font-medium border border-amber-500/20 flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{syncError}</span>
          </div>
        )}

        {/* Supabase Custom Credentials Accordion */}
        <div className="pt-2 border-t border-[var(--bg-surface-lit)] flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Key size={16} className="text-[var(--accent-violet)]" />
              <span className="text-sm font-semibold">Supabase Credentials</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-surface-lit)] text-[var(--text-muted)] font-medium">
                {currentSupabase.isConfigured ? 'Connected' : 'Using Local Storage'}
              </span>
            </div>
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="text-xs font-bold text-[var(--accent-violet)] hover:underline"
            >
              {showConfig ? 'Hide Config' : 'Configure Custom Supabase'}
            </button>
          </div>

          {showConfig && (
            <form
              onSubmit={handleSaveSupabaseConfig}
              className="p-4 rounded-xl bg-[var(--bg-surface-lit)] flex flex-col gap-4 animate-[slideUp_150ms_ease-out]"
            >
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[var(--text-muted)] flex items-center gap-1">
                  <Globe size={14} /> Supabase URL
                </label>
                <input
                  type="url"
                  placeholder="https://your-project.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--bg-surface)] border border-transparent focus:border-[var(--accent-violet)] text-xs outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[var(--text-muted)] flex items-center gap-1">
                  <Key size={14} /> Supabase Anon Key
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5..."
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--bg-surface)] border border-transparent focus:border-[var(--accent-violet)] text-xs outline-none transition-colors"
                />
              </div>

              {configSavedMsg && (
                <span className="text-xs text-emerald-500 font-bold flex items-center gap-1">
                  <CheckCircle2 size={14} /> {configSavedMsg}
                </span>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('finance_supabase_url');
                    localStorage.removeItem('finance_supabase_key');
                    setSupabaseUrl('');
                    setSupabaseKey('');
                    setConfigSavedMsg('Reset to environment variables.');
                    setTimeout(() => setConfigSavedMsg(''), 2000);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] text-xs font-medium hover:bg-red-500/10 hover:text-red-500 transition-colors"
                >
                  Reset Defaults
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[var(--accent-violet)] text-white text-xs font-bold shadow-md hover:opacity-90 active:scale-95 transition-all"
                >
                  Save Credentials
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* App Preferences */}
        <div className="surface-card p-6 flex flex-col gap-6 h-fit">
          <div className="flex items-center gap-2 border-b border-[var(--bg-surface-lit)] pb-4">
            <SlidersHorizontal size={20} className="text-[var(--accent-violet)]" />
            <h2 className="text-lg font-semibold">General Preferences</h2>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-col max-w-[70%]">
              <span className="font-medium">Include Lend/Borrow in Totals</span>
              <span className="text-xs text-[var(--text-muted)] mt-1">
                If enabled, money lent will be treated as an Expense, and money borrowed as Income
                in the Dashboard totals.
              </span>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={includeLendBorrow}
                onChange={(e) => setIncludeLendBorrow(e.target.checked)}
              />
              <div className="w-11 h-6 bg-[var(--bg-surface-lit)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent-violet)]"></div>
            </label>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col">
              <span className="font-medium">Budget & Stats Reset Cycle</span>
              <span className="text-xs text-[var(--text-muted)] mt-1">
                How often should your dashboard totals and budgets reset?
              </span>
            </div>
            <select
              value={budgetCycle}
              onChange={(e) => setBudgetCycle(e.target.value)}
              className="w-full p-3 rounded-xl bg-[var(--bg-surface-lit)] border border-transparent focus:border-[var(--accent-violet)] outline-none font-medium text-sm"
            >
              <option value="1 month">Every Month</option>
              <option value="2 months">Every 2 Months</option>
              <option value="1 year">Every Year</option>
              <option value="never">Never Reset (All Time)</option>
            </select>
          </div>
        </div>

        {/* Budget Configurations */}
        <div className="surface-card p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[var(--bg-surface-lit)] pb-4">
            <h2 className="text-lg font-semibold">Monthly Allowances</h2>
            <button
              onClick={handleSaveBudgets}
              className="px-4 py-2 text-sm font-bold bg-[var(--accent-violet)] text-white rounded-xl shadow-lg shadow-[var(--accent-glow)] flex items-center gap-2 transition-transform active:scale-95"
            >
              {saved ? 'Saved!' : 'Save Limits'}
            </button>
          </div>

          <p className="text-xs text-[var(--text-muted)]">
            Set the maximum amount you want to spend per category each month.
          </p>

          <div className="flex items-center justify-between mt-2 p-3 bg-[var(--bg-surface-lit)] rounded-xl">
            <span className="text-sm font-medium">Use Global Budget limit</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={localUseGlobal}
                onChange={(e) => setLocalUseGlobal(e.target.checked)}
              />
              <div className="w-9 h-5 bg-[var(--bg-surface)] border border-[var(--text-muted)]/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--accent-violet)] peer-checked:border-[var(--accent-violet)]"></div>
            </label>
          </div>

          <div className="flex flex-col gap-3 mt-2">
            {localUseGlobal ? (
              <div className="flex flex-col gap-1.5 animate-[slideUp_150ms_ease-out]">
                <label className="text-sm font-medium text-[var(--text-main)]">
                  Total Monthly Budget
                </label>
                <div className="flex items-center bg-[var(--bg-surface-lit)] rounded-xl px-4 py-2.5 border border-transparent focus-within:border-[var(--accent-violet)] transition-colors">
                  <span className="text-[var(--text-muted)] mr-2 font-bold">₹</span>
                  <input
                    type="number"
                    value={localGlobalLimit}
                    onChange={(e) => setLocalGlobalLimit(e.target.value)}
                    className="bg-transparent w-full focus:outline-none text-sm tabular-nums font-bold"
                  />
                </div>
              </div>
            ) : (
              Object.keys(budgets).map((category) => (
                <div
                  key={category}
                  className="flex flex-col gap-1.5 animate-[slideUp_150ms_ease-out]"
                >
                  <label className="text-sm font-medium text-[var(--text-main)]">
                    {category}{' '}
                    <span className="text-[10px] text-[var(--text-muted)] font-normal ml-1">
                      (Optional)
                    </span>
                  </label>
                  <div className="flex items-center bg-[var(--bg-surface-lit)] rounded-xl px-4 py-2.5 border border-transparent focus-within:border-[var(--accent-violet)] transition-colors">
                    <span className="text-[var(--text-muted)] mr-2 font-bold">₹</span>
                    <input
                      type="number"
                      value={localBudgets[category] || ''}
                      onChange={(e) =>
                        setLocalBudgets({ ...localBudgets, [category]: e.target.value })
                      }
                      placeholder="0"
                      className="bg-transparent w-full focus:outline-none text-sm tabular-nums font-bold"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Security & Danger Zone */}
        <div className="surface-card p-6 flex flex-col gap-4 lg:col-span-2 border border-[var(--status-red)]/20 bg-gradient-to-br from-[var(--status-red)]/5 to-transparent">
          <div className="flex items-center gap-2 border-b border-[var(--status-red)]/10 pb-4">
            <h2 className="text-lg font-semibold text-[var(--status-red)]">
              Security & Danger Zone
            </h2>
          </div>

          {/* Change Password */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-col">
              <span className="font-medium text-[var(--text-main)]">Change Password</span>
              <span className="text-xs text-[var(--text-muted)] mt-1">
                Update your account password securely.
              </span>
            </div>
            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="px-4 py-2 text-sm font-bold bg-[var(--bg-surface-lit)] hover:bg-[var(--accent-violet)] hover:text-white rounded-xl transition-colors whitespace-nowrap shrink-0"
            >
              Update Password
            </button>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-[var(--status-red)]/10">
            <div className="flex flex-col">
              <span className="font-medium">Require Password on Delete</span>
              <span className="text-xs text-[var(--text-muted)] mt-1">
                If enabled, deleting any transaction will prompt for your password.
              </span>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={requirePasswordForDelete}
                onChange={(e) => handleSecurityToggle(e.target.checked)}
              />
              <div className="w-11 h-6 bg-[var(--bg-surface-lit)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--status-red)]"></div>
            </label>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-[var(--status-red)]/10">
            <div className="flex flex-col">
              <span className="font-medium">Clear Transaction Data</span>
              <span className="text-xs text-[var(--text-muted)] mt-1">
                Permanently delete all or some of your transactions from local and cloud storage.
              </span>
            </div>
            <button
              onClick={() => setIsClearModalOpen(true)}
              className="px-4 py-2 text-sm font-bold bg-[var(--status-red)]/10 text-[var(--status-red)] hover:bg-[var(--status-red)] hover:text-white rounded-xl transition-colors whitespace-nowrap shrink-0"
            >
              Clear Data...
            </button>
          </div>
        </div>

        {/* App Login Security */}
        <div className="surface-card p-6 flex flex-col gap-4 lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-[var(--bg-surface-lit)] pb-4">
            <h2 className="text-lg font-semibold text-[var(--accent-violet)]">
              App Login Security
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-col">
              <span className="font-medium text-[var(--text-main)]">PIN Protection</span>
              <span className="text-xs text-[var(--text-muted)] mt-1">
                Require a 4-digit PIN when opening the app.
              </span>
            </div>
            <button
              onClick={() => {
                if (hasPinSetup) {
                  setShowPinAuth(true);
                } else {
                  setIsPinModalOpen(true);
                }
              }}
              className="px-4 py-2 text-sm font-bold bg-[var(--bg-surface-lit)] hover:bg-[var(--accent-violet)] hover:text-white rounded-xl transition-colors whitespace-nowrap shrink-0"
            >
              {hasPinSetup ? 'Change / Remove PIN' : 'Setup PIN'}
            </button>
          </div>

          {hasPinSetup && (
            <div className="flex flex-col gap-3 pt-4 border-t border-[var(--bg-surface-lit)] animate-[slideUp_150ms_ease-out]">
              <span className="font-medium text-[var(--text-main)] text-sm">Require PIN on:</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'app', label: 'Mobile App' },
                  { id: 'mobileWeb', label: 'Mobile Web' },
                  { id: 'desktopWeb', label: 'Desktop Web' },
                ].map((platform) => (
                  <label
                    key={platform.id}
                    className="flex items-center gap-2 p-3 bg-[var(--bg-surface-lit)] rounded-xl cursor-pointer hover:bg-[var(--accent-glow)] transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={pinPlatforms?.[platform.id] ?? true}
                      onChange={(e) => {
                        const newPlatforms = { ...pinPlatforms, [platform.id]: e.target.checked };
                        setPinPlatforms(newPlatforms);
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-[var(--accent-violet)] focus:ring-[var(--accent-violet)]"
                    />
                    <span className="text-sm font-medium">{platform.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-[var(--bg-surface-lit)]">
            <div className="flex flex-col">
              <span className="font-medium">Fingerprint / Biometric Login</span>
              <span className="text-xs text-[var(--text-muted)] mt-1">
                Use your device's biometrics to unlock (Mobile Only).
              </span>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={isBiometricEnabled}
                onChange={(e) => {
                  setIsBiometricEnabled(e.target.checked);
                  localStorage.setItem('finance_biometric_enabled', e.target.checked);
                }}
              />
              <div className="w-11 h-6 bg-[var(--bg-surface-lit)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent-violet)]"></div>
            </label>
          </div>
        </div>
      </div>

      <PinSetupModal isOpen={isPinModalOpen} onClose={() => setIsPinModalOpen(false)} />
      <ClearDataModal isOpen={isClearModalOpen} onClose={() => setIsClearModalOpen(false)} />
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
      <SecurityAuthModal
        isOpen={showDisableSecurityAuth}
        onClose={() => setShowDisableSecurityAuth(false)}
        onSuccess={() => setRequirePasswordForDelete(false)}
        title="Disable Security Feature"
        message="Please enter your password to disable transaction deletion security."
      />
      <SecurityAuthModal
        isOpen={showPinAuth}
        onClose={() => setShowPinAuth(false)}
        onSuccess={() => setIsPinModalOpen(true)}
        title="Verify Identity"
        message="Please enter your password to change or remove your PIN."
      />
    </div>
  );
}
