import { useState } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { useAuth } from '../context/AuthContext';
import {
  Settings2,
  RefreshCw,
  Cloud,
  CloudOff,
  SlidersHorizontal,
  Lock,
  Download,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import ClearDataModal from './ClearDataModal';
import SecurityAuthModal from './SecurityAuthModal';
import ChangePasswordModal from './ChangePasswordModal';
import PinSetupModal from './Auth/PinSetupModal';
import { exportToCSV } from '../utils/exportCsv';
import { formatDate } from '../utils/formatters';

export default function SettingsPage() {
  const {
    setIncludeLendBorrow,
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
    transactions,
  } = useFinanceStore();

  const workspaceSettings = useFinanceStore((state) => state.workspaceSettings);
  const activeWorkspaceId = useFinanceStore((state) => state.activeWorkspaceId);
  const { includeLendBorrow, budgetCycle } = workspaceSettings?.[activeWorkspaceId] || {};

  const { hasPinSetup } = useAuth();
  const [activeTab, setActiveTab] = useState('sync');

  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [showDisableSecurityAuth, setShowDisableSecurityAuth] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [showPinAuth, setShowPinAuth] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(
    () => localStorage.getItem('finance_biometric_enabled') === 'true'
  );

  const handleSecurityToggle = (checked) => {
    if (!checked && requirePasswordForDelete) {
      setShowDisableSecurityAuth(true);
    } else {
      setRequirePasswordForDelete(true);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-[slideUp_180ms_ease-out] h-full pb-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-main)] flex items-center gap-2.5">
          <Settings2 size={26} className="text-[var(--accent-violet)]" /> Settings
        </h1>
        <p className="text-[var(--text-muted)] text-sm">
          Manage cloud synchronization, app preferences, security, and data backups.
        </p>
      </header>

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-1.5 bg-[var(--bg-surface-lit)] p-1 rounded-2xl overflow-x-auto">
        {[
          { id: 'sync', label: 'Sync & Data Export', icon: RefreshCw },
          { id: 'preferences', label: 'App Preferences', icon: SlidersHorizontal },
          { id: 'security', label: 'Security & PIN', icon: Lock },
          { id: 'danger', label: 'Danger Zone', icon: Trash2 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-[var(--bg-surface)] text-[var(--text-main)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <tab.icon size={15} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: SYNC & DATA EXPORT */}
      {activeTab === 'sync' && (
        <div className="flex flex-col gap-6 animate-[slideUp_150ms_ease-out]">
          <div className="surface-card p-6 rounded-2xl flex flex-col gap-6 border border-[var(--bg-surface-lit)]">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--bg-surface-lit)] pb-4">
              <div>
                <h2 className="text-base font-bold text-[var(--text-main)]">Cloud Sync Engine</h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Synchronize your financial data safely with your private Supabase database.
                </p>
              </div>

              <button
                onClick={() => syncWithSupabase()}
                disabled={isSyncing}
                className="px-4 py-2.5 rounded-xl bg-[var(--accent-violet)] text-white text-xs font-bold flex items-center gap-2 shadow-md hover:opacity-95 active:scale-95 transition-all disabled:opacity-50"
              >
                <RefreshCw size={15} className={isSyncing ? 'animate-spin' : ''} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
              </button>
            </div>

            {/* Sync Status Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-[var(--bg-surface-lit)]/50 border border-[var(--bg-surface-lit)] flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold">Network Connection</span>
                <div className="flex items-center gap-2 font-bold text-xs mt-1">
                  {navigator.onLine ? (
                    <>
                      <Cloud size={16} className="text-[var(--status-green)]" />
                      <span className="text-[var(--status-green)]">Connected & Live</span>
                    </>
                  ) : (
                    <>
                      <CloudOff size={16} className="text-[var(--status-red)]" />
                      <span className="text-[var(--status-red)]">Offline Mode</span>
                    </>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg-surface-lit)]/50 border border-[var(--bg-surface-lit)] flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold">Last Successful Sync</span>
                <span className="text-xs font-bold mt-1 text-[var(--text-main)]">
                  {lastSyncedAt ? formatDate(lastSyncedAt) : 'Not synced yet'}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg-surface-lit)]/50 border border-[var(--bg-surface-lit)] flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold">Pending Sync Changes</span>
                <span className="text-xs font-bold mt-1 text-[var(--accent-violet)]">
                  {pendingSyncCount === 0 ? 'All synced' : `${pendingSyncCount} pending change(s)`}
                </span>
              </div>
            </div>

            {/* High-Contrast Auto-Sync Toggle */}
            <div className="flex items-center justify-between pt-3 border-t border-[var(--bg-surface-lit)]">
              <div>
                <span className="font-bold text-sm text-[var(--text-main)]">Automatic Background Sync</span>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Automatically sync local edits whenever your network connects.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setAutoSyncEnabled(!autoSyncEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  autoSyncEnabled ? 'bg-[var(--accent-violet)]' : 'bg-zinc-600 dark:bg-zinc-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    autoSyncEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Data Export (CSV Backup) */}
          <div className="surface-card p-6 rounded-2xl flex flex-col gap-4 border border-[var(--bg-surface-lit)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--bg-surface-lit)] pb-4">
              <div>
                <h2 className="text-base font-bold text-[var(--text-main)]">Data Backup & Export (CSV)</h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Export all your transactions, categories, and payment notes into standard CSV spreadsheet format.
                </p>
              </div>
              <button
                onClick={() => exportToCSV(transactions, `personal_finance_export_${Date.now()}.csv`)}
                className="px-4 py-2.5 rounded-xl bg-[var(--status-green)] text-white text-xs font-bold flex items-center gap-2 shadow-md hover:opacity-95 active:scale-95 transition-all shrink-0"
              >
                <Download size={15} />
                <span>Export CSV File</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: APP PREFERENCES */}
      {activeTab === 'preferences' && (
        <div className="surface-card p-6 rounded-2xl flex flex-col gap-6 border border-[var(--bg-surface-lit)] animate-[slideUp_150ms_ease-out]">
          <h2 className="text-base font-bold text-[var(--text-main)] border-b border-[var(--bg-surface-lit)] pb-3">
            General App Preferences
          </h2>

          {/* Include Lend / Borrow Toggle */}
          <div className="flex items-center justify-between gap-4">
            <div className="max-w-md">
              <span className="font-bold text-sm text-[var(--text-main)]">Include Lend / Borrow in Totals</span>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                When enabled, money lent will count towards Expenses, and money borrowed will count as Income on Dashboard totals.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIncludeLendBorrow(!includeLendBorrow)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                includeLendBorrow ? 'bg-[var(--accent-violet)]' : 'bg-zinc-600 dark:bg-zinc-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  includeLendBorrow ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Budget Reset Cycle */}
          <div className="flex flex-col gap-2 max-w-sm pt-4 border-t border-[var(--bg-surface-lit)]">
            <span className="font-bold text-sm text-[var(--text-main)]">Dashboard Stats Reset Cycle</span>
            <p className="text-xs text-[var(--text-muted)]">
              Specify how frequently your monthly spending totals reset.
            </p>
            <select
              value={budgetCycle || '1 month'}
              onChange={(e) => setBudgetCycle(e.target.value)}
              className="mt-1 p-3 rounded-xl bg-[var(--bg-surface-lit)] border border-transparent focus:border-[var(--accent-violet)] font-bold text-xs text-[var(--text-main)] outline-none"
            >
              <option value="1 month">Every Month</option>
              <option value="2 months">Every 2 Months</option>
              <option value="1 year">Every Year</option>
              <option value="never">Never Reset (All Time)</option>
            </select>
          </div>
        </div>
      )}

      {/* TAB 3: SECURITY & PIN */}
      {activeTab === 'security' && (
        <div className="flex flex-col gap-6 animate-[slideUp_150ms_ease-out]">
          <div className="surface-card p-6 rounded-2xl flex flex-col gap-6 border border-[var(--bg-surface-lit)]">
            <h2 className="text-base font-bold text-[var(--text-main)] border-b border-[var(--bg-surface-lit)] pb-3 flex items-center gap-2">
              <ShieldCheck size={18} className="text-[var(--accent-violet)]" /> Account Password & Deletion Lock
            </h2>

            {/* Change Password */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="font-bold text-sm text-[var(--text-main)]">Account Password</span>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Update your Supabase authentication password.
                </p>
              </div>
              <button
                onClick={() => setIsPasswordModalOpen(true)}
                className="px-4 py-2 text-xs font-bold bg-[var(--bg-surface-lit)] hover:bg-[var(--accent-violet)] hover:text-white rounded-xl transition-colors shrink-0"
              >
                Change Password
              </button>
            </div>

            {/* Require Password for Deletion Toggle */}
            <div className="flex items-center justify-between pt-4 border-t border-[var(--bg-surface-lit)]">
              <div>
                <span className="font-bold text-sm text-[var(--text-main)]">Require Password on Transaction Delete</span>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Prompts for account password before deleting any transaction log.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleSecurityToggle(!requirePasswordForDelete)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  requirePasswordForDelete ? 'bg-[var(--status-green)]' : 'bg-zinc-600 dark:bg-zinc-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    requirePasswordForDelete ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* App Login PIN Security */}
          <div className="surface-card p-6 rounded-2xl flex flex-col gap-6 border border-[var(--bg-surface-lit)]">
            <h2 className="text-base font-bold text-[var(--text-main)] border-b border-[var(--bg-surface-lit)] pb-3">
              App PIN Lock
            </h2>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="font-bold text-sm text-[var(--text-main)]">4-Digit PIN Security</span>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Require a security PIN to unlock your financial data.
                </p>
              </div>
              <button
                onClick={() => {
                  if (hasPinSetup) {
                    setShowPinAuth(true);
                  } else {
                    setIsPinModalOpen(true);
                  }
                }}
                className="px-4 py-2 text-xs font-bold bg-[var(--bg-surface-lit)] hover:bg-[var(--accent-violet)] hover:text-white rounded-xl transition-colors shrink-0"
              >
                {hasPinSetup ? 'Change / Remove PIN' : 'Setup PIN'}
              </button>
            </div>

            {/* Fingerprint Toggle with Mobile Badge */}
            <div className="flex items-center justify-between pt-4 border-t border-[var(--bg-surface-lit)]">
              <div>
                <span className="font-bold text-sm text-[var(--text-main)] flex items-center gap-2">
                  <Smartphone size={16} /> Fingerprint / Biometrics
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500">
                    Mobile App Only
                  </span>
                </span>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Use native mobile biometric sensor to unlock. (Disabled on desktop web browsers).
                </p>
              </div>

              <button
                type="button"
                disabled
                className="relative inline-flex h-6 w-11 shrink-0 cursor-not-allowed rounded-full border-2 border-transparent bg-zinc-700 opacity-50"
              >
                <span className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white translate-x-0" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DANGER ZONE */}
      {activeTab === 'danger' && (
        <div className="surface-card p-6 rounded-2xl flex flex-col gap-6 border border-[var(--status-red)]/30 bg-gradient-to-br from-[var(--status-red)]/5 to-transparent animate-[slideUp_150ms_ease-out]">
          <h2 className="text-base font-bold text-[var(--status-red)] border-b border-[var(--status-red)]/20 pb-3 flex items-center gap-2">
            <Trash2 size={18} /> Danger Zone
          </h2>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="max-w-md">
              <span className="font-bold text-sm text-[var(--text-main)]">Erase Transaction History</span>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Permanently erase selected transaction records from local storage and Supabase cloud database.
              </p>
            </div>
            <button
              onClick={() => setIsClearModalOpen(true)}
              className="px-4 py-2.5 text-xs font-bold bg-[var(--status-red)] text-white rounded-xl shadow-md hover:opacity-95 transition-opacity shrink-0"
            >
              Clear Data...
            </button>
          </div>
        </div>
      )}

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
