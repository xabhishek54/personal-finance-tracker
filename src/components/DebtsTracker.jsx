import { useFinanceStore, useFilteredTransactions } from '../store/useFinanceStore';
import { User, CheckCircle2 } from 'lucide-react';

export default function DebtsTracker() {
  const transactions = useFilteredTransactions();
  const markAsSettled = useFinanceStore((state) => state.markAsSettled);

  // Filter only Lend and Borrow transactions
  const debtTx = transactions.filter((t) => t.type === 'Lend' || t.type === 'Borrow');

  const pendingLent = debtTx
    .filter((t) => t.type === 'Lend' && !t.settled)
    .reduce((sum, t) => sum + t.amount, 0);
  const pendingBorrowed = debtTx
    .filter((t) => t.type === 'Borrow' && !t.settled)
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="flex flex-col gap-6 animate-[slideUp_180ms_ease-out] h-full">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Lend & Borrow</h1>
        <p className="text-[var(--text-muted)] text-sm">Track money you owe or are owed.</p>
      </header>

      <div className="grid grid-cols-2 gap-4">
        <div className="surface-card p-5 flex flex-col gap-2">
          <span className="text-sm text-[var(--text-muted)] font-medium">You are owed</span>
          <span className="text-2xl font-bold tabular-nums text-[var(--status-green)]">
            ₹{pendingLent.toLocaleString()}
          </span>
        </div>
        <div className="surface-card p-5 flex flex-col gap-2">
          <span className="text-sm text-[var(--text-muted)] font-medium">You owe</span>
          <span className="text-2xl font-bold tabular-nums text-[var(--status-red)]">
            ₹{pendingBorrowed.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-[400px]">
        <h2 className="text-lg font-semibold mb-4">Active Records</h2>

        <div className="surface-card divide-y divide-[var(--bg-surface-lit)]">
          {debtTx.length > 0 ? (
            debtTx.map((tx) => (
              <div
                key={tx.id}
                className={`p-4 flex items-center justify-between transition-colors ${tx.settled ? 'opacity-50' : 'hover:bg-[var(--bg-surface-lit)]'}`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.type === 'Lend'
                        ? 'bg-[var(--status-green)]/10 text-[var(--status-green)]'
                        : 'bg-[var(--status-red)]/10 text-[var(--status-red)]'
                    }`}
                  >
                    <User size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-[var(--text-main)]">
                      {tx.type === 'Lend'
                        ? `Lent to ${tx.recipient}`
                        : `Borrowed from ${tx.recipient}`}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {new Date(tx.date).toLocaleDateString()} {tx.note && `• ${tx.note}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div
                    className={`font-bold tabular-nums ${tx.type === 'Lend' ? 'text-[var(--status-green)]' : 'text-[var(--status-red)]'}`}
                  >
                    ₹{tx.amount.toLocaleString()}
                  </div>
                  {!tx.settled ? (
                    <button
                      onClick={() => markAsSettled(tx.id)}
                      className="p-2 bg-[var(--bg-surface-lit)] rounded-full text-[var(--text-muted)] hover:text-[var(--status-green)] hover:bg-[var(--status-green)]/10 transition-colors"
                      title="Mark as Settled"
                    >
                      <CheckCircle2 size={18} />
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-[var(--status-green)] uppercase tracking-wider px-2 py-1 bg-[var(--status-green)]/10 rounded-lg">
                      Settled
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-[var(--text-muted)]">
              No lending or borrowing records.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
