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
  Trash2,
  LogOut,
} from 'lucide-react';
import ClearDataModal from './ClearDataModal';
import SecurityAuthModal from './SecurityAuthModal';
import ChangePasswordModal from './ChangePasswordModal';
import PinSetupModal from './Auth/PinSetupModal';
import ConfirmModal from './ConfirmModal';
import { exportToCSV } from '../utils/exportCsv';
import { formatRelativeTime } from '../utils/formatters';

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

  const { hasPinSetup, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('sync');

  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [showDisableSecurityAuth, setShowDisableSecurityAuth] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [showPinAuth, setShowPinAuth] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleSecurityToggle = (checked) => {
    if (!checked && requirePasswordForDelete) {
      setShowDisableSecurityAuth(true);
    } else {
      setRequirePasswordForDelete(true);
    }
  };

  return (
    <div className="flex flex-col gap-5 animate-[slideUp_180ms_ease-out] h-full pb-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-main)] flex items-center gap-2">
          <Settings2 size={24} className="text-[var(--accent-violet)]" /> Settings
        </h1>
        <p className="text-[var(--text-muted)] text-xs sm:text-sm">
          Manage cloud sync, general preferences, security, and data backup.
        </p>
      </header>

      {/* Exactly 3 Navigation Tabs (Fits on 1 line without scrolling or clipping) */}
      <div className="grid grid-cols-3 gap-1 bg-[var(--bg-surface-lit)] p-1 rounded-2xl">
        {[
          { id: 'sync', label: 'Sync & Export', icon: RefreshCw },
          { id: 'preferences', label: 'Preferences', icon: SlidersHorizontal },
          { id: 'security', label: 'Security & Data', icon: Lock },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-2 px-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-[var(--bg-surface)] text-[var(--text-main)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <tab.icon size={14} />
            <span className="truncate">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: SYNC & DATA EXPORT */}
      {activeTab === 'sync' && (
        <div className="flex flex-col gap-5 animate-[slideUp_150ms_ease-out]">
          <div className="surface-card p-4 sm:p-5 rounded-2xl flex flex-col gap-4 border border-[var(--bg-surface-lit)]">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--bg-surface-lit)] pb-3">
              <div>
                <h2 className="text-sm font-bold text-[var(--text-main)]">Cloud Sync Engine</h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Synchronize financial data safely with your private cloud account.
                </p>
              </div>

              <button
                onClick={() => syncWithSupabase(true)}
                disabled={isSyncing}
                className="px-3.5 py-2 rounded-xl bg-[var(--accent-violet)] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm hover:opacity-95 active:scale-95 transition-all disabled:opacity-50 shrink-0"
              >
                <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
              </button>
            </div>

            {/* Compressed Mobile Sync Status Row */}
            <div className="p-3 rounded-xl bg-[var(--bg-surface-lit)]/50 border border-[var(--bg-surface-lit)] flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 overflow-hidden text-[var(--text-main)] font-semibold">
                {navigator.onLine ? (
                  <Cloud size={16} className="text-[var(--status-green)] shrink-0" />
                ) : (
                  <CloudOff size={16} className="text-[var(--status-red)] shrink-0" />
                )}
                <span className="truncate">
                  {navigator.onLine ? 'Connected' : 'Offline'} • Synced {formatRelativeTime(lastSyncedAt)} • {pendingSyncCount} pending
                </span>
              </div>
            </div>

            {/* High-Contrast Auto-Sync Toggle (Defaults to ON) */}
            <div className="flex items-center justify-between pt-2 border-t border-[var(--bg-surface-lit)]">
              <div>
                <span className="font-bold text-xs sm:text-sm text-[var(--text-main)]">Automatic Background Sync</span>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Sync edits automatically whenever connected.
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
          <div className="surface-card p-4 sm:p-5 rounded-2xl flex flex-col gap-3 border border-[var(--bg-surface-lit)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-[var(--text-main)]">Data Backup & Export (CSV)</h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Export transactions into standard CSV spreadsheet format.
                </p>
              </div>
              <button
                onClick={() => exportToCSV(transactions, `personal_finance_export_${Date.now()}.csv`)}
                className="px-3.5 py-2 rounded-xl bg-[var(--status-green)] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm hover:opacity-95 active:scale-95 transition-all shrink-0"
              >
                <Download size={14} />
                <span>Export CSV</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PREFERENCES */}
      {activeTab === 'preferences' && (
        <div className="surface-card p-4 sm:p-5 rounded-2xl flex flex-col gap-5 border border-[var(--bg-surface-lit)] animate-[slideUp_150ms_ease-out]">
          <h2 className="text-sm font-bold text-[var(--text-main)] border-b border-[var(--bg-surface-lit)] pb-3">
            General Preferences
          </h2>

          <div className="flex items-center justify-between gap-4">
            <div className="max-w-md">
              <span className="font-bold text-xs sm:text-sm text-[var(--text-main)]">Include Lend / Borrow in Totals</span>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Money lent counts as Expense, and money borrowed as Income.
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

          <div className="flex flex-col gap-2 pt-3 border-t border-[var(--bg-surface-lit)] max-w-sm">
            <span className="font-bold text-xs sm:text-sm text-[var(--text-main)]">Dashboard Stats Reset Cycle</span>
            <p className="text-[11px] text-[var(--text-muted)]">
              Specify how frequently monthly totals reset.
            </p>
            <select
              value={budgetCycle || '1 month'}
              onChange={(e) => setBudgetCycle(e.target.value)}
              className="mt-1 p-2.5 rounded-xl bg-[var(--bg-surface-lit)] border border-transparent focus:border-[var(--accent-violet)] font-bold text-xs text-[var(--text-main)] outline-none"
            >
              <option value="1 month">Every Month</option>
              <option value="2 months">Every 2 Months</option>
              <option value="1 year">Every Year</option>
              <option value="never">Never Reset (All Time)</option>
            </select>
          </div>
        </div>
      )}

      {/* TAB 3: SECURITY & DATA (Includes Password, PIN, Biometrics, Danger Zone, and Account Logout) */}
      {activeTab === 'security' && (
        <div className="flex flex-col gap-5 animate-[slideUp_150ms_ease-out]">
          {/* Account & Password Section */}
          <div className="surface-card p-4 sm:p-5 rounded-2xl flex flex-col gap-4 border border-[var(--bg-surface-lit)]">
            <h2 className="text-sm font-bold text-[var(--text-main)] border-b border-[var(--bg-surface-lit)] pb-3 flex items-center gap-2">
              <ShieldCheck size={16} className="text-[var(--accent-violet)]" /> Account Security
            </h2>

            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="font-bold text-xs sm:text-sm text-[var(--text-main)]">Account Password</span>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Update your cloud sign-in password.
                </p>
              </div>
              <button
                onClick={() => setIsPasswordModalOpen(true)}
                className="px-3.5 py-2 text-xs font-bold bg-[var(--bg-surface-lit)] hover:bg-[var(--accent-violet)] hover:text-white rounded-xl transition-colors shrink-0"
              >
                Change Password
              </button>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[var(--bg-surface-lit)]">
              <div>
                <span className="font-bold text-xs sm:text-sm text-[var(--text-main)]">Require Password on Delete</span>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Prompt for password before erasing any transaction.
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

          {/* PIN Security & Biometrics */}
          <div className="surface-card p-4 sm:p-5 rounded-2xl flex flex-col gap-4 border border-[var(--bg-surface-lit)]">
            <h2 className="text-sm font-bold text-[var(--text-main)] border-b border-[var(--bg-surface-lit)] pb-3">
              PIN Lock & Biometrics
            </h2>

            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="font-bold text-xs sm:text-sm text-[var(--text-main)]">4-Digit App PIN</span>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Require PIN code to open app.
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
                className="px-3.5 py-2 text-xs font-bold bg-[var(--bg-surface-lit)] hover:bg-[var(--accent-violet)] hover:text-white rounded-xl transition-colors shrink-0"
              >
                {hasPinSetup ? 'Change PIN' : 'Setup PIN'}
              </button>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[var(--bg-surface-lit)]">
              <div>
                <span className="font-bold text-xs sm:text-sm text-[var(--text-main)] flex items-center gap-1.5">
                  <Smartphone size={15} /> Fingerprint Sensor
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-500">
                    Mobile App Only
                  </span>
                </span>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Disabled on web browsers.
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

          {/* Danger Zone (Erasing Data) */}
          <div className="surface-card p-4 sm:p-5 rounded-2xl flex flex-col gap-3 border border-[var(--status-red)]/30 bg-gradient-to-br from-[var(--status-red)]/5 to-transparent">
            <h2 className="text-sm font-bold text-[var(--status-red)] flex items-center gap-1.5">
              <Trash2 size={16} /> Danger Zone
            </h2>
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="font-bold text-xs sm:text-sm text-[var(--text-main)]">Erase Transaction History</span>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Permanently delete records from local and cloud storage.
                </p>
              </div>
              <button
                onClick={() => setIsClearModalOpen(true)}
                className="px-3.5 py-2 text-xs font-bold bg-[var(--status-red)] text-white rounded-xl shadow-sm hover:opacity-95 transition-opacity shrink-0"
              >
                Clear Data...
              </button>
            </div>
          </div>

          {/* Log Out Button in Account Section */}
          <div className="surface-card p-4 rounded-2xl border border-[var(--bg-surface-lit)] flex items-center justify-between">
            <div>
              <span className="font-bold text-xs sm:text-sm text-[var(--text-main)]">Account Sign Out</span>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Sign out of your active session safely.
              </p>
            </div>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="px-4 py-2 text-xs font-bold bg-[var(--status-red)]/10 text-[var(--status-red)] hover:bg-[var(--status-red)] hover:text-white rounded-xl transition-colors flex items-center gap-1.5 shrink-0"
            >
              <LogOut size={14} /> Log Out
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
      <ConfirmModal
        isOpen={showLogoutConfirm}
        title="Log Out of Account?"
        description="Are you sure you want to log out of your finance tracker account?"
        confirmText="Log Out"
        confirmStyle="danger"
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={logout}
      />
    </div>
  );
}
