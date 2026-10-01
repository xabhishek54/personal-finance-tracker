import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, HandCoins } from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';
import { formatCurrency } from '../utils/formatters';

export default function PartialSettleModal({ isOpen, onClose, transaction }) {
  const settlePartialAmount = useFinanceStore((state) => state.settlePartialAmount);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !transaction) return null;

  const total = Number(transaction.amount || 0);
  const settledAlready = Number(transaction.settledAmount || 0);
  const remaining = Math.max(0, total - settledAlready);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const val = Number(amount);
    if (!val || val <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    if (val > remaining) {
      setError(`Amount cannot exceed the remaining balance (${formatCurrency(remaining)}).`);
      return;
    }

    settlePartialAmount(transaction.id, val, note);
    onClose();
    setAmount('');
    setNote('');
  };

  const handleQuickPreset = (pct) => {
    const calculated = Math.round((remaining * pct) / 100);
    setAmount(calculated.toString());
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-2 sm:p-4 pb-20 sm:pb-4 bg-black/50 backdrop-blur-md animate-[popIn_150ms_ease-out]"
      onClick={onClose}
    >
      <div
        className="bg-[var(--bg-surface)] w-full max-w-md rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80dvh] sm:max-h-[85vh] border border-[var(--bg-surface-lit)]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-4 px-6 flex justify-between items-center border-b border-[var(--bg-surface-lit)] shrink-0 bg-[var(--bg-surface)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[var(--accent-violet)]/10 text-[var(--accent-violet)] flex items-center justify-center">
              <HandCoins size={18} />
            </div>
            <h2 className="text-base font-bold text-[var(--text-main)]">Settle Partial Amount</h2>
          </div>
          <button
            onClick={onClose}
            type="button"
            aria-label="Close"
            className="p-1.5 rounded-xl hover:bg-[var(--bg-surface-lit)] text-[var(--text-muted)]"
          >
            <X size={18} />
          </button>
        </header>

        <form id="partial-settle-form" onSubmit={handleSubmit} className="p-6 overflow-y-auto flex flex-col gap-5">
          {/* Target Transaction Context Info */}
          <div className="bg-[var(--bg-surface-lit)]/40 p-4 rounded-2xl border border-[var(--bg-surface-lit)] flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-[var(--text-muted)]">Person / Recipient</span>
              <span className="font-bold text-[var(--text-main)]">{transaction.recipient || 'Unknown'}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-[var(--text-muted)]">Total Record Amount</span>
              <span className="font-bold tabular-nums text-[var(--text-main)]">{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-[var(--text-muted)]">Already Settled</span>
              <span className="font-bold tabular-nums text-[var(--status-green)]">{formatCurrency(settledAlready)}</span>
            </div>
            <div className="flex justify-between items-center text-xs pt-2 border-t border-[var(--bg-surface-lit)]">
              <span className="font-bold text-[var(--text-main)]">Remaining Balance</span>
              <span className="font-extrabold text-sm tabular-nums text-[var(--accent-violet)]">
                {formatCurrency(remaining)}
              </span>
            </div>
          </div>

          {/* Amount Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Settlement Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-extrabold text-lg text-[var(--text-muted)]">
                ₹
              </span>
              <input
                type="number"
                step="any"
                placeholder={remaining.toString()}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-4 py-3 bg-[var(--bg-surface-lit)] border border-transparent focus:border-[var(--accent-violet)] rounded-xl font-extrabold text-lg tabular-nums text-[var(--text-main)] focus:outline-none transition-colors"
                autoFocus
              />
            </div>
            {error && <p className="text-xs font-semibold text-[var(--status-red)] mt-0.5">{error}</p>}
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleQuickPreset(25)}
              className="flex-1 py-1.5 text-xs font-bold bg-[var(--bg-surface-lit)]/60 hover:bg-[var(--bg-surface-lit)] rounded-lg text-[var(--text-muted)] transition-colors"
            >
              25%
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset(50)}
              className="flex-1 py-1.5 text-xs font-bold bg-[var(--bg-surface-lit)]/60 hover:bg-[var(--bg-surface-lit)] rounded-lg text-[var(--text-muted)] transition-colors"
            >
              50%
            </button>
            <button
              type="button"
              onClick={() => setAmount(remaining.toString())}
              className="flex-1 py-1.5 text-xs font-bold bg-[var(--accent-violet)]/10 text-[var(--accent-violet)] hover:bg-[var(--accent-violet)]/20 rounded-lg transition-colors"
            >
              Full (100%)
            </button>
          </div>

          {/* Note Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Settlement Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Paid ₹30 via UPI / Cash"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-[var(--bg-surface-lit)] border border-transparent focus:border-[var(--accent-violet)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-main)] focus:outline-none transition-colors"
            />
          </div>
        </form>

        <footer className="p-4 px-6 border-t border-[var(--bg-surface-lit)] bg-[var(--bg-surface)] shrink-0 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-[var(--bg-surface-lit)] text-[var(--text-main)] font-bold text-xs rounded-xl hover:opacity-90 active:scale-95 transition-all"
          >
            Cancel
          </button>
          <button
            form="partial-settle-form"
            type="submit"
            className="flex-1 py-3 bg-[var(--accent-violet)] text-white font-bold text-xs rounded-xl shadow-lg shadow-[var(--accent-glow)] hover:opacity-95 active:scale-95 transition-all flex justify-center items-center gap-2 cursor-pointer"
          >
            <Check size={16} />
            <span>Record Settlement</span>
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}
