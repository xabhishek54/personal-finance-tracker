import { useState } from 'react';
import { useFinanceStore, useFilteredTransactions } from '../store/useFinanceStore';
import { User, CheckCircle2, HandCoins, ChevronDown, ChevronUp, Layers, List } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';
import PartialSettleModal from './PartialSettleModal';

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
  const [viewMode, setViewMode] = useState('by_person'); // 'by_person' | 'individual'
  const [selectedPartialTx, setSelectedPartialTx] = useState(null);
  const [expandedPerson, setExpandedPerson] = useState(null);

  // Filter only Lend and Borrow transactions
  const debtTx = transactions.filter((t) => t.type === 'Lend' || t.type === 'Borrow');

  // Calculate remaining balances accurately
  const getRemainingAmount = (t) => {
    if (t.settled) return 0;
    const total = Number(t.amount || 0);
    const settled = Number(t.settledAmount || 0);
    return Math.max(0, total - settled);
  };

  const getSettledAmount = (t) => {
    if (t.settled) return Number(t.amount || 0);
    return Number(t.settledAmount || 0);
  };

  const pendingLent = debtTx
    .filter((t) => t.type === 'Lend' && !t.settled)
    .reduce((sum, t) => sum + getRemainingAmount(t), 0);

  const pendingBorrowed = debtTx
    .filter((t) => t.type === 'Borrow' && !t.settled)
    .reduce((sum, t) => sum + getRemainingAmount(t), 0);

  const filteredList = debtTx.filter((t) => {
    if (activeTab === 'owed_to_me') return t.type === 'Lend' && !t.settled;
    if (activeTab === 'i_owe') return t.type === 'Borrow' && !t.settled;
    if (activeTab === 'settled') return t.settled;
    return true; // 'all'
  });

  // Group by Person
  const personGroups = debtTx.reduce((acc, t) => {
    const key = (t.recipient || 'Unknown').trim().toLowerCase();
    if (!acc[key]) {
      acc[key] = {
        name: capitalizeName(t.recipient),
        records: [],
        totalLent: 0,
        totalBorrowed: 0,
        settledLent: 0,
        settledBorrowed: 0,
        remainingLent: 0,
        remainingBorrowed: 0,
      };
    }
    acc[key].records.push(t);
    const total = Number(t.amount || 0);
    const settled = getSettledAmount(t);
    const remaining = getRemainingAmount(t);

    if (t.type === 'Lend') {
      acc[key].totalLent += total;
      acc[key].settledLent += settled;
      acc[key].remainingLent += remaining;
    } else {
      acc[key].totalBorrowed += total;
      acc[key].settledBorrowed += settled;
      acc[key].remainingBorrowed += remaining;
    }
    return acc;
  }, {});

  const personGroupList = Object.values(personGroups).filter((group) => {
    if (activeTab === 'owed_to_me') return group.remainingLent > 0;
    if (activeTab === 'i_owe') return group.remainingBorrowed > 0;
    if (activeTab === 'settled') return group.remainingLent === 0 && group.remainingBorrowed === 0;
    return true;
  });

  return (
    <div className="flex flex-col gap-5 animate-[slideUp_180ms_ease-out] h-full pb-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-main)]">
            Lend & Borrow
          </h1>
          <p className="text-[var(--text-muted)] text-sm">
            Track loans, split bills, and manage partial or full settlements.
          </p>
        </div>

        {/* View Switcher: By Person vs Individual Records */}
        <div className="flex items-center gap-1 bg-[var(--bg-surface-lit)] p-1 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('by_person')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              viewMode === 'by_person'
                ? 'bg-[var(--bg-surface)] text-[var(--text-main)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <Layers size={14} />
            <span>By Person</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('individual')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              viewMode === 'individual'
                ? 'bg-[var(--bg-surface)] text-[var(--text-main)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <List size={14} />
            <span>All Records</span>
          </button>
        </div>
      </header>

      {/* Summary Cards: Green for Owed to You, Red for You Owe */}
      <div className="grid grid-cols-2 gap-3.5">
        <div className="surface-card p-4 rounded-2xl flex flex-col gap-1 border border-[var(--bg-surface-lit)]">
          <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
            Owed to You (Lent)
          </span>
          <span className="text-xl sm:text-2xl font-extrabold tabular-nums text-[var(--status-green)]">
            {formatCurrency(pendingLent)}
          </span>
        </div>
        <div className="surface-card p-4 rounded-2xl flex flex-col gap-1 border border-[var(--bg-surface-lit)]">
          <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
            You Owe (Borrowed)
          </span>
          <span className="text-xl sm:text-2xl font-extrabold tabular-nums text-[var(--status-red)]">
            {formatCurrency(pendingBorrowed)}
          </span>
        </div>
      </div>

      {/* Filter Tabs & History Section */}
      <div className="flex flex-col gap-3">
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
              className={`px-3 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[var(--bg-surface)] text-[var(--text-main)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {viewMode === 'by_person' ? (
          <div className="flex flex-col gap-3">
            {personGroupList.length > 0 ? (
              personGroupList.map((group) => {
                const isExpanded = expandedPerson === group.name;
                const netBalance = group.remainingLent - group.remainingBorrowed;

                return (
                  <div
                    key={group.name}
                    className="surface-card rounded-2xl border border-[var(--bg-surface-lit)] overflow-hidden flex flex-col transition-all"
                  >
                    {/* Person Summary Header Card */}
                    <div
                      onClick={() => setExpandedPerson(isExpanded ? null : group.name)}
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-[var(--bg-surface-lit)]/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-xl bg-[var(--accent-violet)]/10 text-[var(--accent-violet)] flex items-center justify-center shrink-0 font-bold">
                          <User size={18} />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-[var(--text-main)]">{group.name}</h3>
                          <p className="text-xs text-[var(--text-muted)]">
                            {group.records.length} {group.records.length === 1 ? 'record' : 'records'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          {netBalance > 0 ? (
                            <div className="text-sm font-extrabold tabular-nums text-[var(--status-green)]">
                              Owes you {formatCurrency(netBalance)}
                            </div>
                          ) : netBalance < 0 ? (
                            <div className="text-sm font-extrabold tabular-nums text-[var(--status-red)]">
                              You owe {formatCurrency(Math.abs(netBalance))}
                            </div>
                          ) : (
                            <div className="text-xs font-bold text-[var(--status-green)] uppercase tracking-wider">
                              All Settled
                            </div>
                          )}
                        </div>

                        <div className="p-1 rounded-lg text-[var(--text-muted)]">
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Person Records */}
                    {isExpanded && (
                      <div className="border-t border-[var(--bg-surface-lit)] bg-[var(--bg-surface-lit)]/20 p-3 flex flex-col gap-2.5">
                        {group.records.map((tx) => (
                          <RecordCard
                            key={tx.id}
                            tx={tx}
                            onSettleFull={() => markAsSettled(tx.id)}
                            onSettlePartial={() => setSelectedPartialTx(tx)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="surface-card rounded-2xl p-8 text-center flex flex-col items-center gap-2 text-[var(--text-muted)]">
                <HandCoins size={28} className="opacity-40" />
                <p className="text-xs font-medium">No person records found for this view filter.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="surface-card rounded-2xl divide-y divide-[var(--bg-surface-lit)] overflow-hidden">
            {filteredList.length > 0 ? (
              filteredList.map((tx) => (
                <RecordCard
                  key={tx.id}
                  tx={tx}
                  onSettleFull={() => markAsSettled(tx.id)}
                  onSettlePartial={() => setSelectedPartialTx(tx)}
                />
              ))
            ) : (
              <div className="p-8 text-center flex flex-col items-center gap-2 text-[var(--text-muted)]">
                <HandCoins size={28} className="opacity-40" />
                <p className="text-xs font-medium">No records found for this view filter.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <PartialSettleModal
        isOpen={!!selectedPartialTx}
        onClose={() => setSelectedPartialTx(null)}
        transaction={selectedPartialTx}
      />
    </div>
  );
}

function RecordCard({ tx, onSettleFull, onSettlePartial }) {
  const isLend = tx.type === 'Lend';
  const personName = capitalizeName(tx.recipient);
  const total = Number(tx.amount || 0);
  const settled = tx.settled ? total : Number(tx.settledAmount || 0);
  const remaining = Math.max(0, total - settled);
  const isPartial = settled > 0 && !tx.settled;
  const progressPct = Math.min(100, Math.round((settled / total) * 100));

  return (
    <div
      className={`p-3.5 sm:p-4 rounded-xl flex flex-col gap-2.5 transition-colors border border-transparent ${
        tx.settled
          ? 'opacity-60 bg-[var(--bg-surface-lit)]/30'
          : 'bg-[var(--bg-surface)] border-[var(--bg-surface-lit)] hover:border-[var(--accent-violet)]/30'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 overflow-hidden">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isLend
                ? 'bg-[var(--status-green)]/10 text-[var(--status-green)]'
                : 'bg-[var(--status-red)]/10 text-[var(--status-red)]'
            }`}
          >
            <User size={17} />
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

        <div className="flex flex-col items-end shrink-0 ml-2">
          <div
            className={`font-extrabold text-sm tabular-nums ${
              isLend ? 'text-[var(--status-green)]' : 'text-[var(--status-red)]'
            }`}
          >
            {formatCurrency(total)}
          </div>

          {tx.settled ? (
            <span className="text-[10px] font-bold text-[var(--status-green)] uppercase tracking-wider px-2 py-0.5 bg-[var(--status-green)]/10 rounded-md flex items-center gap-1 mt-0.5">
              <CheckCircle2 size={11} /> Settled
            </span>
          ) : isPartial ? (
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider px-2 py-0.5 bg-amber-400/10 rounded-md mt-0.5">
              Partially Settled
            </span>
          ) : null}
        </div>
      </div>

      {/* Partial Progress Bar if not fully settled */}
      {!tx.settled && (
        <div className="flex flex-col gap-1.5 pt-1 border-t border-[var(--bg-surface-lit)]/50">
          {settled > 0 && (
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-[var(--status-green)] font-semibold">
                {formatCurrency(settled)} settled ({progressPct}%)
              </span>
              <span className="text-[var(--accent-violet)] font-bold">
                {formatCurrency(remaining)} remaining
              </span>
            </div>
          )}

          {settled > 0 && (
            <div className="w-full bg-[var(--bg-surface-lit)] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[var(--status-green)] h-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 mt-1">
            <button
              type="button"
              onClick={onSettlePartial}
              className="px-2.5 py-1 text-xs font-bold text-[var(--accent-violet)] bg-[var(--accent-violet)]/10 hover:bg-[var(--accent-violet)]/20 rounded-lg transition-colors flex items-center gap-1"
            >
              <HandCoins size={13} />
              <span>Settle Partial...</span>
            </button>
            <button
              type="button"
              onClick={onSettleFull}
              className="px-2.5 py-1 text-xs font-bold text-[var(--status-green)] bg-[var(--status-green)]/10 hover:bg-[var(--status-green)]/20 rounded-lg transition-colors flex items-center gap-1"
            >
              <CheckCircle2 size={13} />
              <span>Settle Full</span>
            </button>
          </div>
        </div>
      )}

      {/* History of Partial Payments if any */}
      {Array.isArray(tx.settlements) && tx.settlements.length > 0 && (
        <div className="mt-1 bg-[var(--bg-surface-lit)]/40 p-2 rounded-lg text-[11px] flex flex-col gap-1">
          <span className="font-semibold text-[var(--text-muted)]">Payment Log:</span>
          {tx.settlements.map((s, idx) => (
            <div key={s.id || idx} className="flex justify-between items-center text-[var(--text-main)]">
              <span>
                {formatDate(s.date)} {s.note ? `(${s.note})` : ''}
              </span>
              <span className="font-bold tabular-nums text-[var(--status-green)]">
                +{formatCurrency(s.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
