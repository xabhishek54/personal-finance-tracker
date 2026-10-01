import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useFinanceStore, useFilteredTransactions } from '../store/useFinanceStore';
import { AlertTriangle, Lock, Trash2, X, Download } from 'lucide-react';
import { supabase } from '../supabase';
import { exportToCSV } from '../utils/exportCsv';

export default function ClearDataModal({ isOpen, onClose }) {
  const clearLocalData = useFinanceStore((state) => state.clearLocalData);
  const transactions = useFilteredTransactions();
  const [clearType, setClearType] = useState('24h'); // '24h', 'month', 'all'
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [step, setStep] = useState(1);

  if (!isOpen) return null;

  const handleVerify = async () => {
    setError('');
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    try {
      if (navigator.onLine) {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user?.email) {
          const { error: signInErr } = await supabase.auth.signInWithPassword({
            email: authData.user.email,
            password,
          });
          if (signInErr) throw signInErr;
        }
      }
      setStep(2);
    } catch (err) {
      setError('Incorrect password. Please try again.');
    }
  };

  const handleClearData = async () => {
    if (confirmText.trim() !== 'DELETE') return;
    setIsDeleting(true);
    try {
      await clearLocalData(clearType);
      onClose();
    } catch (err) {
      setError('Failed to clear data.');
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pb-20 sm:pb-4 bg-black/60 backdrop-blur-md animate-[popIn_200ms_ease-out]">
      <div className="w-full max-w-md bg-[var(--bg-surface)] rounded-2xl shadow-2xl border border-[var(--bg-surface-lit)] overflow-hidden flex flex-col max-h-[80dvh] sm:max-h-[85vh]">
        <header className="flex justify-between items-center p-4 px-6 border-b border-[var(--bg-surface-lit)] bg-[var(--bg-surface)]">
          <h2 className="text-lg font-bold flex items-center gap-2 text-[var(--status-red)]">
            <AlertTriangle size={20} /> Clear Data
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-xl hover:bg-[var(--bg-surface-lit)] transition-colors text-[var(--text-muted)]"
          >
            <X size={18} />
          </button>
        </header>

        <div className="p-6 flex flex-col gap-5">
          {step === 1 ? (
            <>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Select the time range of transactions you wish to permanently erase.
              </p>

              {/* Data Export Banner */}
              <div className="p-3.5 rounded-xl bg-[var(--bg-surface-lit)]/60 border border-[var(--bg-surface-lit)] flex items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-xs text-[var(--text-main)] block">Back up your data first</span>
                  <span className="text-[10px] text-[var(--text-muted)]">Download CSV file before deleting.</span>
                </div>
                <button
                  type="button"
                  onClick={() => exportToCSV(transactions, `backup_finance_${Date.now()}.csv`)}
                  className="px-3 py-1.5 bg-[var(--accent-violet)] text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 shrink-0"
                >
                  <Download size={13} /> Export CSV
                </button>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  Range to delete
                </label>
                <div className="flex flex-col gap-2">
                  {[
                    { id: '24h', label: 'Previous 24 Hours' },
                    { id: 'month', label: 'Previous 30 Days' },
                    { id: 'all', label: 'All Transactions (Complete Reset)' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setClearType(opt.id)}
                      className={`w-full p-3 rounded-xl border text-left text-xs font-bold transition-all ${
                        clearType === opt.id
                          ? 'bg-[var(--status-red)]/10 border-[var(--status-red)] text-[var(--status-red)]'
                          : 'bg-[var(--bg-surface-lit)]/40 border-transparent text-[var(--text-main)] hover:bg-[var(--bg-surface-lit)]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  Verify Account Password
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                    <Lock size={16} />
                  </div>
                  <input
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-surface-lit)] border border-transparent focus:border-[var(--status-red)] text-sm text-[var(--text-main)] outline-none transition-colors"
                  />
                </div>
                {error && <p className="text-xs text-[var(--status-red)] font-semibold">{error}</p>}
              </div>

              <button
                onClick={handleVerify}
                className="w-full py-3 rounded-xl bg-[var(--status-red)] text-white font-bold text-xs uppercase tracking-wider flex justify-center items-center gap-2 shadow-md hover:opacity-95 active:scale-[0.98] transition-all"
              >
                Continue to Final Confirmation
              </button>
            </>
          ) : (
            <>
              <div className="flex flex-col items-center gap-2 text-center py-2">
                <div className="w-12 h-12 rounded-2xl bg-[var(--status-red)]/10 text-[var(--status-red)] flex items-center justify-center mb-1">
                  <Trash2 size={24} />
                </div>
                <h3 className="text-base font-bold text-[var(--text-main)]">Final Confirmation</h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-xs">
                  This action is permanent and cannot be undone. Type <strong className="text-[var(--status-red)] font-mono">DELETE</strong> below to confirm.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <input
                  type="text"
                  placeholder='Type "DELETE"'
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="w-full text-center py-2.5 rounded-xl bg-[var(--bg-surface-lit)] border border-transparent focus:border-[var(--status-red)] text-sm font-mono font-bold text-[var(--text-main)] outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl bg-[var(--bg-surface-lit)] font-bold text-xs text-[var(--text-main)] active:scale-[0.98] transition-transform"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearData}
                  disabled={isDeleting || confirmText.trim() !== 'DELETE'}
                  className="flex-1 py-3 rounded-xl bg-[var(--status-red)] text-white font-bold text-xs flex justify-center items-center shadow-md active:scale-[0.98] transition-transform disabled:opacity-40"
                >
                  {isDeleting ? 'Erasing...' : 'Confirm Erase'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
