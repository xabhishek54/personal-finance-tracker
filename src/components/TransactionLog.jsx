import {
  useFinanceStore,
  useFilteredTransactions,
  useWorkspaceSettings,
} from '../store/useFinanceStore';
import {
  Search,
  Filter,
  Download,
  ChevronDown,
  Edit3,
  Trash2,
  CheckSquare,
  Square,
  FolderInput,
  ReceiptText,
} from 'lucide-react';
import { useState, useMemo, useEffect, useRef } from 'react';
import { exportTransactionsToExcel } from '../utils/exportExcel';
import { isWithinInterval, parseISO } from 'date-fns';
import { formatCurrency, formatDate } from '../utils/formatters';
import { getCategoryIcon } from '../utils/categories';
import EditTransactionModal from './EditTransactionModal';
import DeleteAuthModal from './DeleteAuthModal';
import ConfirmModal from './ConfirmModal';

export default function TransactionLog() {
  const transactions = useFilteredTransactions();
  const { budgets } = useWorkspaceSettings();
  const deleteTransaction = useFinanceStore((state) => state.deleteTransaction);
  const getUniqueMerchants = useFinanceStore((state) => state.getUniqueMerchants);
  const requirePasswordForDelete = useFinanceStore((state) => state.requirePasswordForDelete);
  const isDeleteModeUnlocked = useFinanceStore((state) => state.isDeleteModeUnlocked);
  const workspaces = useFinanceStore((state) => state.workspaces);
  const activeWorkspaceId = useFinanceStore((state) => state.activeWorkspaceId);
  const moveTransactionsToWorkspace = useFinanceStore((state) => state.moveTransactionsToWorkspace);

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const filterRef = useRef(null);
  const [selectedTxIds, setSelectedTxIds] = useState(new Set());

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilter(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [filterType, setFilterType] = useState('All');
  const [filterSource, setFilterSource] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('Date (Newest)');

  const [editingTx, setEditingTx] = useState(null);
  const [pendingDeleteTx, setPendingDeleteTx] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState(null);

  const filteredTx = useMemo(() => {
    let result = transactions.filter((tx) => {
      const recipientStr = tx.recipient || '';
      const categoryStr = tx.category || '';
      const matchesSearch =
        recipientStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
        categoryStr.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'All' || tx.type === filterType;
      const matchesSource = filterSource === 'All' || tx.recipient === filterSource;

      let matchesDate = true;
      if (startDate && endDate && tx.date) {
        matchesDate = isWithinInterval(parseISO(tx.date), {
          start: new Date(startDate),
          end: new Date(endDate),
        });
      }

      return matchesSearch && matchesType && matchesSource && matchesDate;
    });

    if (sortBy === 'Date (Oldest)') result.sort((a, b) => new Date(a.date) - new Date(b.date));
    if (sortBy === 'Date (Newest)') result.sort((a, b) => new Date(b.date) - new Date(a.date));
    if (sortBy === 'Amount (High)') result.sort((a, b) => (b.amount || 0) - (a.amount || 0));
    if (sortBy === 'Amount (Low)') result.sort((a, b) => (a.amount || 0) - (b.amount || 0));

    return result;
  }, [transactions, searchTerm, filterType, filterSource, startDate, endDate, sortBy]);

  const handleDelete = (e, tx) => {
    e.stopPropagation();
    if (requirePasswordForDelete && !isDeleteModeUnlocked) {
      setPendingDeleteTx({ isBulk: false, ids: [tx.id], amount: tx.amount });
    } else {
      setConfirmConfig({
        title: 'Delete Transaction?',
        description: 'Are you sure you want to delete this transaction?',
        onConfirm: () => deleteTransaction(tx.id),
      });
    }
  };

  const handleToggleSelect = (e, id) => {
    e.stopPropagation();
    const newSet = new Set(selectedTxIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedTxIds(newSet);
  };

  const handleDeleteSelected = () => {
    if (requirePasswordForDelete && !isDeleteModeUnlocked) {
      setPendingDeleteTx({ isBulk: true, ids: Array.from(selectedTxIds) });
    } else {
      setConfirmConfig({
        title: 'Delete Transactions?',
        description: `Are you sure you want to delete ${selectedTxIds.size} transactions?`,
        onConfirm: () => {
          selectedTxIds.forEach((id) => deleteTransaction(id));
          setSelectedTxIds(new Set());
        },
      });
    }
  };

  const handleMoveSelected = (e) => {
    const newWorkspaceId = e.target.value;
    if (!newWorkspaceId) return;
    setConfirmConfig({
      title: 'Move Transactions?',
      description: `Are you sure you want to move ${selectedTxIds.size} transactions?`,
      confirmText: 'Move',
      confirmStyle: 'primary',
      onConfirm: () => {
        moveTransactionsToWorkspace(Array.from(selectedTxIds), newWorkspaceId);
        setSelectedTxIds(new Set());
      },
    });
    e.target.value = '';
  };

  return (
    <div className="flex flex-col gap-5 animate-[slideUp_180ms_ease-out] h-full pb-8">
      <header className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-main)]">
              Transactions
            </h1>
            <p className="text-[var(--text-muted)] text-xs sm:text-sm mt-0.5">
              Full transaction ledger. Tap any row to edit details.
            </p>
          </div>
          <button
            onClick={() => exportTransactionsToExcel(filteredTx, budgets)}
            className="flex items-center gap-1.5 text-xs font-bold bg-[var(--status-green)]/10 text-[var(--status-green)] hover:bg-[var(--status-green)]/20 px-3.5 py-2 rounded-xl transition-colors shadow-sm shrink-0"
          >
            <Download size={14} /> Export
          </button>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              size={16}
            />
            <input
              type="text"
              placeholder="Search merchants, categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[var(--bg-surface)] border border-[var(--bg-surface-lit)] rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:border-[var(--accent-violet)] transition-colors text-xs sm:text-sm text-[var(--text-main)]"
            />
          </div>
          <div className="relative z-10" ref={filterRef}>
            <button
              onClick={() => setShowFilter(!showFilter)}
              className={`surface-card px-3.5 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 text-xs font-bold ${
                showFilter ? 'bg-[var(--bg-surface-lit)] text-[var(--text-main)]' : 'hover:bg-[var(--bg-surface-lit)]'
              }`}
            >
              <Filter size={15} />
              <span className="hidden sm:inline">Filters</span>
              <ChevronDown size={14} />
            </button>
            {showFilter && (
              <div className="absolute top-full right-0 mt-2 w-72 bg-[var(--bg-surface)] border border-[var(--bg-surface-lit)] rounded-2xl shadow-xl p-4 flex flex-col gap-4 animate-[popIn_150ms_ease-out]">
                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1 block">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full bg-[var(--bg-surface-lit)] text-xs font-bold p-2 rounded-xl outline-none text-[var(--text-main)]"
                  >
                    <option>Date (Newest)</option>
                    <option>Date (Oldest)</option>
                    <option>Amount (High)</option>
                    <option>Amount (Low)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1 block">
                    Type
                  </label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full bg-[var(--bg-surface-lit)] text-xs font-bold p-2 rounded-xl outline-none text-[var(--text-main)]"
                  >
                    {['All', 'Expense', 'Income', 'Lend', 'Borrow'].map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1 block">
                    Source / Merchant
                  </label>
                  <select
                    value={filterSource}
                    onChange={(e) => setFilterSource(e.target.value)}
                    className="w-full bg-[var(--bg-surface-lit)] text-xs font-bold p-2 rounded-xl outline-none text-[var(--text-main)]"
                  >
                    <option value="All">All Sources</option>
                    {getUniqueMerchants().map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1 block">
                      From
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-[var(--bg-surface-lit)] text-xs p-2 rounded-xl outline-none text-[var(--text-main)] dark:[color-scheme:dark]"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1 block">
                      To
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-[var(--bg-surface-lit)] text-xs p-2 rounded-xl outline-none text-[var(--text-main)] dark:[color-scheme:dark]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto min-h-[400px]">
        {selectedTxIds.size > 0 && (
          <div className="flex justify-between items-center bg-[var(--accent-violet)]/10 text-[var(--accent-violet)] p-3 rounded-2xl mb-3 animate-[popIn_150ms_ease-out]">
            <span className="text-xs font-bold ml-2">
              {selectedTxIds.size} transaction{selectedTxIds.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <div className="relative flex items-center">
                <FolderInput
                  size={14}
                  className="absolute left-2.5 text-white z-10 pointer-events-none"
                />
                <select
                  onChange={handleMoveSelected}
                  defaultValue=""
                  className="appearance-none bg-[var(--accent-violet)] text-white text-xs font-bold pl-7 pr-6 py-1.5 rounded-xl cursor-pointer hover:opacity-90 active:scale-95 transition-all shadow-sm outline-none border-none"
                >
                  <option value="" disabled>
                    Move Mode...
                  </option>
                  {workspaces
                    .filter((w) => w.id !== activeWorkspaceId)
                    .map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                </select>
                <ChevronDown
                  size={12}
                  className="absolute right-2 text-white pointer-events-none"
                />
              </div>
              <button
                onClick={handleDeleteSelected}
                className="flex items-center gap-1 text-xs font-bold bg-[var(--status-red)] text-white px-3 py-1.5 rounded-xl active:scale-95 transition-transform shadow-sm"
              >
                <Trash2 size={14} /> <span>Delete</span>
              </button>
            </div>
          </div>
        )}

        <div className="surface-card rounded-2xl divide-y divide-[var(--bg-surface-lit)] overflow-hidden">
          {filteredTx.length > 0 ? (
            filteredTx.map((tx) => {
              const IconComp = getCategoryIcon(tx.category);
              const title = tx.recipient && tx.recipient.trim() !== '' && tx.recipient !== 'Unknown' ? tx.recipient : tx.category;
              const isIncomeOrBorrow = tx.type === 'Income' || tx.type === 'Borrow';

              return (
                <div
                  key={tx.id}
                  onClick={(e) => {
                    if (selectedTxIds.size > 0) {
                      handleToggleSelect(e, tx.id);
                    } else {
                      setEditingTx(tx);
                    }
                  }}
                  className={`p-3.5 flex items-center justify-between hover:bg-[var(--bg-surface-lit)]/50 transition-colors cursor-pointer group select-none ${
                    selectedTxIds.has(tx.id) ? 'bg-[var(--accent-violet)]/10' : ''
                  }`}
                  title="Tap to edit"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <button
                      onClick={(e) => handleToggleSelect(e, tx.id)}
                      aria-label="Select transaction"
                      className="text-[var(--text-muted)] hover:text-[var(--accent-violet)] transition-colors focus:outline-none p-1 shrink-0"
                    >
                      {selectedTxIds.has(tx.id) ? (
                        <CheckSquare size={18} className="text-[var(--accent-violet)]" />
                      ) : (
                        <Square size={18} />
                      )}
                    </button>
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        tx.type === 'Lend'
                          ? 'bg-indigo-500/10 text-indigo-500'
                          : tx.type === 'Borrow'
                            ? 'bg-purple-500/10 text-purple-500'
                            : isIncomeOrBorrow
                              ? 'bg-[var(--status-green)]/10 text-[var(--status-green)]'
                              : 'bg-[var(--status-red)]/10 text-[var(--status-red)]'
                      }`}
                    >
                      <IconComp size={17} />
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold text-xs sm:text-sm text-[var(--text-main)] group-hover:text-[var(--accent-violet)] transition-colors truncate">
                        {title}
                      </p>
                      <p className="text-[11px] text-[var(--text-muted)] truncate">
                        {tx.category} • {tx.method}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-3 text-right">
                    <div className="flex flex-col items-end">
                      <div
                        className={`font-bold text-xs sm:text-sm tabular-nums ${
                          isIncomeOrBorrow
                            ? 'text-[var(--status-green)]'
                            : tx.type === 'Lend'
                              ? 'text-indigo-500'
                              : 'text-[var(--text-main)]'
                        }`}
                      >
                        {formatCurrency(isIncomeOrBorrow ? tx.amount : -tx.amount)}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] mt-0.5 flex flex-col items-end">
                        <span>{formatDate(tx.date)}</span>
                        {tx.note && (
                          <span className="opacity-80 max-w-[120px] truncate" title={tx.note}>
                            {tx.note}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTx(tx);
                        }}
                        title="Edit"
                        aria-label="Edit"
                        className="p-1.5 rounded-lg bg-[var(--bg-surface-lit)] text-[var(--text-muted)] hover:text-[var(--accent-violet)] transition-colors"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, tx)}
                        title="Delete"
                        aria-label="Delete"
                        className="p-1.5 rounded-lg bg-[var(--bg-surface-lit)] text-[var(--text-muted)] hover:text-[var(--status-red)] transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-[var(--text-muted)] flex flex-col items-center gap-2">
              <ReceiptText size={26} className="opacity-40" />
              <span>No transactions match your current search or filters.</span>
            </div>
          )}
        </div>
      </div>

      <EditTransactionModal
        isOpen={!!editingTx}
        transaction={editingTx}
        onClose={() => setEditingTx(null)}
      />
      <DeleteAuthModal
        isOpen={!!pendingDeleteTx}
        transaction={pendingDeleteTx}
        onClose={() => setPendingDeleteTx(null)}
        onConfirm={(id) => deleteTransaction(id)}
      />
      <ConfirmModal
        isOpen={!!confirmConfig}
        title={confirmConfig?.title}
        description={confirmConfig?.description}
        confirmText={confirmConfig?.confirmText || 'Delete'}
        confirmStyle={confirmConfig?.confirmStyle || 'danger'}
        onClose={() => setConfirmConfig(null)}
        onConfirm={confirmConfig?.onConfirm}
      />
    </div>
  );
}
