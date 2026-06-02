import { useFinanceStore } from '../store/useFinanceStore';
import { Search, Filter, Wallet, Download, ChevronDown, Edit3, Trash2 } from 'lucide-react';
import { useState, useMemo } from 'react';
import { exportTransactionsToExcel } from '../utils/exportExcel';
import { isWithinInterval, parseISO } from 'date-fns';
import EditTransactionModal from './EditTransactionModal';

export default function TransactionLog() {
  const transactions = useFinanceStore(state => state.transactions);
  const deleteTransaction = useFinanceStore(state => state.deleteTransaction);
  const getUniqueMerchants = useFinanceStore(state => state.getUniqueMerchants);
  
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showFilter, setShowFilter] = useState(false);
  const [filterType, setFilterType] = useState('All');
  const [filterSource, setFilterSource] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('Date (Newest)');
  
  const [editingTx, setEditingTx] = useState(null);

  const filteredTx = useMemo(() => {
    let result = transactions.filter(tx => {
      const matchesSearch = tx.recipient.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            tx.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'All' || tx.type === filterType;
      const matchesSource = filterSource === 'All' || tx.recipient === filterSource;
      
      let matchesDate = true;
      if (startDate && endDate) {
        matchesDate = isWithinInterval(parseISO(tx.date), { 
          start: new Date(startDate), 
          end: new Date(endDate) 
        });
      }

      return matchesSearch && matchesType && matchesSource && matchesDate;
    });

    if (sortBy === 'Date (Oldest)') result.sort((a, b) => new Date(a.date) - new Date(b.date));
    if (sortBy === 'Date (Newest)') result.sort((a, b) => new Date(b.date) - new Date(a.date));
    if (sortBy === 'Amount (High)') result.sort((a, b) => b.amount - a.amount);
    if (sortBy === 'Amount (Low)') result.sort((a, b) => a.amount - b.amount);

    return result;
  }, [transactions, searchTerm, filterType, filterSource, startDate, endDate, sortBy]);

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      deleteTransaction(id);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-[slideUp_180ms_ease-out] h-full pb-6">
      <header className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Transactions</h1>
          <button 
            onClick={() => exportTransactionsToExcel(transactions, useFinanceStore.getState().budgets)}
            className="flex items-center gap-2 text-sm font-medium bg-[var(--status-green)]/10 text-[var(--status-green)] hover:bg-[var(--status-green)]/20 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Download size={16} /> Export
          </button>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
            <input 
              type="text" 
              placeholder="Search merchants, categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[var(--bg-surface)] border border-[var(--bg-surface-lit)] rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:border-[var(--accent-violet)] transition-colors text-sm"
            />
          </div>
          <div className="relative z-10">
            <button 
              onClick={() => setShowFilter(!showFilter)}
              className={`surface-card px-4 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm font-medium ${showFilter ? 'bg-[var(--bg-surface-lit)] text-[var(--text-main)]' : 'hover:bg-[var(--bg-surface-lit)]'}`}
            >
              <Filter size={18} /> 
              <span className="hidden sm:inline">Filters</span>
              <ChevronDown size={14} />
            </button>
            {showFilter && (
              <div className="absolute top-full right-0 mt-2 w-72 bg-[var(--bg-surface)] border border-[var(--bg-surface-lit)] rounded-xl shadow-xl p-4 flex flex-col gap-4 animate-[popIn_150ms_ease-out]">
                
                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 block">Sort By</label>
                  <select 
                    value={sortBy} 
                    onChange={e => setSortBy(e.target.value)}
                    className="w-full bg-[var(--bg-surface-lit)] text-sm p-2 rounded-lg outline-none"
                  >
                    <option>Date (Newest)</option>
                    <option>Date (Oldest)</option>
                    <option>Amount (High)</option>
                    <option>Amount (Low)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 block">Type</label>
                  <select 
                    value={filterType} 
                    onChange={e => setFilterType(e.target.value)}
                    className="w-full bg-[var(--bg-surface-lit)] text-sm p-2 rounded-lg outline-none"
                  >
                    {['All', 'Expense', 'Income', 'Lend', 'Borrow'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 block">Source / Merchant</label>
                  <select 
                    value={filterSource} 
                    onChange={e => setFilterSource(e.target.value)}
                    className="w-full bg-[var(--bg-surface-lit)] text-sm p-2 rounded-lg outline-none"
                  >
                    <option value="All">All Sources</option>
                    {getUniqueMerchants().map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1 block">From</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-[var(--bg-surface-lit)] text-xs p-2 rounded-lg outline-none" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1 block">To</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-[var(--bg-surface-lit)] text-xs p-2 rounded-lg outline-none" />
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto min-h-[400px]">
        <div className="surface-card divide-y divide-[var(--bg-surface-lit)]">
          {filteredTx.length > 0 ? filteredTx.map((tx) => (
            <div 
              key={tx.id} 
              onDoubleClick={() => setEditingTx(tx)}
              className="p-4 flex items-center justify-between hover:bg-[var(--bg-surface-lit)] transition-colors cursor-pointer group select-none"
              title="Double click to edit"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  tx.category === 'Food & Dining' ? 'bg-orange-500/10 text-orange-500' :
                  tx.category === 'Transport' ? 'bg-blue-500/10 text-blue-500' :
                  tx.category === 'Income' ? 'bg-[var(--status-green)]/10 text-[var(--status-green)]' :
                  'bg-[var(--accent-violet)]/10 text-[var(--accent-violet)]'
                }`}>
                  <Wallet size={20} />
                </div>
                <div>
                  <p className="font-medium text-[var(--text-main)] group-hover:text-[var(--accent-violet)] transition-colors">{tx.recipient}</p>
                  <p className="text-xs text-[var(--text-muted)]">{tx.category} • {tx.method}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-right">
                <div className="flex flex-col items-end mr-2">
                  <div className={`font-bold tabular-nums ${
                    tx.type === 'Income' || tx.type === 'Borrow' ? 'text-[var(--status-green)]' : 
                    tx.type === 'Lend' ? 'text-[var(--status-yellow)]' : 'text-[var(--text-main)]'
                  }`}>
                    {tx.type === 'Income' || tx.type === 'Borrow' ? '+' : ''}₹{tx.amount.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] mt-1 flex flex-col items-end">
                    <span>{new Date(tx.date).toLocaleDateString()}</span>
                    {tx.note && <span className="opacity-70 mt-0.5 max-w-[120px] truncate" title={tx.note}>{tx.note}</span>}
                  </div>
                </div>
                
                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); setEditingTx(tx); }} className="p-1.5 rounded bg-[var(--bg-surface-lit)] text-[var(--text-muted)] hover:text-[var(--accent-violet)] transition-colors">
                    <Edit3 size={14} />
                  </button>
                  <button onClick={(e) => handleDelete(e, tx.id)} className="p-1.5 rounded bg-[var(--bg-surface-lit)] text-[var(--text-muted)] hover:text-[var(--status-red)] transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          )) : (
            <div className="p-8 text-center text-[var(--text-muted)]">
              No transactions found.
            </div>
          )}
        </div>
      </div>
      
      <EditTransactionModal 
        isOpen={!!editingTx} 
        transaction={editingTx} 
        onClose={() => setEditingTx(null)} 
      />
    </div>
  );
}
