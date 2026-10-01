import { useState } from 'react';
import { useFinanceStore, useFilteredTransactions } from '../store/useFinanceStore';
import { User, CheckCircle2, RotateCcw, HandCoins } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';

const capitalizeName = (str) => {
  if (!str) return 'Unknown';
  return str
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export default function DebtsTracker() {
  const transactions = useFilteredTransactions();
  const markAsSettled = useFinanceStore((state) => state.markAsSettled);
  const [activeTab, setActiveTab] = useState('all');

  // Filter only Lend and Borrow transactions
  const debtTx = transactions.filter((t) => t.type === 'Lend' || t.type === 'Borrow');

  const pendingLent = debtTx
    .filter((t) => t.type === 'Lend' && !t.settled)
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const pendingBorrowed = debtTx
    .filter((t) => t.type === 'Borrow' && !t.settled)
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const filteredList = debtTx.filter((t) => {
    if (activeTab === 'owed_to_me') return t.type === 'Lend' && !t.settled;
    if (activeTab === 'i_owe') return t.type === 'Borrow' && !t.settled;
    if (activeTab === 'settled') return t.settled;
    return true; // 'all'
  });

  return (
    <div className="flex flex-col gap-6 animate-[slideUp_180ms_ease-out] h-full pb-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-main)]">
          Lend & Borrow
        </h1>
        <p className="text-[var(--text-muted)] text-sm">
          Track loans, split bills, and settle outstanding balances.
        </p>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="surface-card p-5 rounded-2xl flex flex-col gap-1.5 border border-[var(--bg-surface-lit)]">
          <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
            Owed to You (Lent)
          </span>
          <span className="text-2xl font-extrabold tabular-nums text-indigo-500">
            {formatCurrency(pendingLent)}
          </span>
        </div>
        <div className="surface-card p-5 rounded-2xl flex flex-col gap-1.5 border border-[var(--bg-surface-lit)]">
          <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
            You Owe (Borrowed)
          </span>
          <span className="text-2xl font-extrabold tabular-nums text-purple-500">
            {formatCurrency(pendingBorrowed)}
          </span>
        </div>
      </div>

      {/* Filter Tabs & History Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-1.5 bg-[var(--bg-surface-lit)] p-1 rounded-2xl overflow-x-auto">
          {[
            { id: 'all', label: 'All Records' },
            { id: 'owed_to_me', label: 'Owed to Me' },
            { id: 'i_owe', label: 'I Owe' },
            { id: 'settled', label: 'Settled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[var(--bg-surface)] text-[var(--text-main)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="surface-card rounded-2xl divide-y divide-[var(--bg-surface-lit)] overflow-hidden">
          {filteredList.length > 0 ? (
            filteredList.map((tx) => {
              const personName = capitalizeName(tx.recipient);
              const isLend = tx.type === 'Lend';

              return (
                <div
                  key={tx.id}
                  className={`p-4 flex items-center justify-between transition-colors ${
                    tx.settled ? 'opacity-60 bg-[var(--bg-surface-lit)]/20' : 'hover:bg-[var(--bg-surface-lit)]/40'
                  }`}
                >
                  <div className="flex items-center gap-3.5 overflow-hidden">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isLend ? 'bg-indigo-500/10 text-indigo-500' : 'bg-purple-500/10 text-purple-500'
                      }`}
                    >
                      <User size={18} />
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold text-sm text-[var(--text-main)] truncate">
                        {isLend ? `Lent to ${personName}` : `Borrowed from ${personName}`}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] truncate">
                        {formatDate(tx.date)} {tx.note ? `• ${tx.note}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <div
                      className={`font-extrabold text-sm tabular-nums ${
                        isLend ? 'text-indigo-500' : 'text-purple-500'
                      }`}
                    >
                      {formatCurrency(tx.amount)}
                    </div>
                    {!tx.settled ? (
                      <button
                        onClick={() => markAsSettled(tx.id)}
                        className="p-2 bg-[var(--bg-surface-lit)] rounded-xl text-[var(--text-muted)] hover:text-[var(--status-green)] hover:bg-[var(--status-green)]/10 transition-colors"
                        title="Mark as Settled"
                        aria-label="Mark as Settled"
                      >
                        <CheckCircle2 size={18} />
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold text-[var(--status-green)] uppercase tracking-wider px-2 py-1 bg-[var(--status-green)]/10 rounded-lg flex items-center gap-1">
                        <CheckCircle2 size={12} /> Settled
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center flex flex-col items-center gap-2 text-[var(--text-muted)]">
              <HandCoins size={28} className="opacity-40" />
              <p className="text-xs font-medium">No records found for this view filter.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
