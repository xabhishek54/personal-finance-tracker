import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useFinanceStore,
  useFilteredTransactions,
  useWorkspaceSettings,
} from '../store/useFinanceStore';
import { useAuth } from '../context/AuthContext';
import {
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  Sun,
  Moon,
  Sparkles,
  Calendar,
  TrendingDown,
  X,
} from 'lucide-react';
import { parseISO } from 'date-fns';
import { formatCurrency, formatDate, getGreeting } from '../utils/formatters';
import { getCategoryIcon } from '../utils/categories';
import CountUp from './CountUp';
import SyncIndicator from './SyncIndicator';

export default function Dashboard() {
  const { theme, toggleTheme, getSmartInsights, hasUnreadNotifications, markNotificationsRead } =
    useFinanceStore();
  const { budgets, includeLendBorrow, useGlobalBudget, globalBudgetLimit, budgetCycle } =
    useWorkspaceSettings();
  const transactions = useFilteredTransactions();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [hideInsightStrip, setHideInsightStrip] = useState(false);
  const notificationRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const now = new Date();
  const greetingText = getGreeting(now);
  const todayFormatted = formatDate(now);

  const cycleTxs = transactions.filter((t) => {
    if (!t.date) return false;
    const tDate = parseISO(t.date);
    if (isNaN(tDate.getTime())) return false;

    if (budgetCycle === '1 month') {
      return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
    } else if (budgetCycle === '2 months') {
      const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return tDate >= twoMonthsAgo;
    } else if (budgetCycle === '1 year') {
      return tDate.getFullYear() === now.getFullYear();
    }
    return true;
  });

  const totalExpense = cycleTxs
    .filter((t) => t.type === 'Expense' || (includeLendBorrow && t.type === 'Lend'))
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalIncome = cycleTxs
    .filter((t) => t.type === 'Income' || (includeLendBorrow && t.type === 'Borrow'))
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const hasIncome = totalIncome > 0;
  const savings = totalIncome - totalExpense;

  const totalBudget = useGlobalBudget
    ? globalBudgetLimit
    : Object.values(budgets || {}).reduce((sum, b) => sum + (Number(b?.limit) || 0), 0);

  const totalBudgetUsed = useGlobalBudget
    ? totalExpense
    : cycleTxs
        .filter((t) => t.type === 'Expense' && budgets?.[t.category])
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const budgetPercentage = totalBudget > 0 ? (totalBudgetUsed / totalBudget) * 100 : 0;
  const remainingBudget = totalBudget > 0 ? Math.max(totalBudget - totalBudgetUsed, 0) : 0;

  const insights = getSmartInsights();
  const meaningfulInsight = insights.find(
    (i) => !i.toLowerCase().includes('everything looks stable') && !i.toLowerCase().includes('no spending data')
  );

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    if (hasUnreadNotifications) {
      markNotificationsRead();
    }
  };

  const lastExpense = cycleTxs.find((t) => t.type === 'Expense');
  const lastIncome = cycleTxs.find((t) => t.type === 'Income');

  return (
    <div className="flex flex-col gap-4 animate-[slideUp_180ms_ease-out]">
      {/* Header */}
      <header className="flex items-center justify-between relative">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-main)]">
            {greetingText}
            {currentUser?.displayName ? `, ${currentUser.displayName.split(' ')[0]}` : ''}!
          </h1>
          <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-xs font-medium mt-0.5">
            <Calendar size={13} />
            <span>{todayFormatted}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <SyncIndicator />
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-xl surface-card hover:bg-[var(--bg-surface-lit)] transition-colors text-[var(--text-main)]"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <div className="relative" ref={notificationRef}>
            <button
              onClick={handleNotificationClick}
              aria-label="Notifications"
              className="p-2 rounded-xl surface-card hover:bg-[var(--bg-surface-lit)] transition-colors relative text-[var(--text-main)]"
            >
              <Bell size={16} />
              {hasUnreadNotifications && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--status-yellow)] rounded-full animate-pulse"></span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-[var(--bg-surface)] border border-[var(--bg-surface-lit)] rounded-2xl shadow-xl z-50 p-2.5 animate-[popIn_150ms_ease-out]">
                <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 px-1">
                  Notifications
                </h3>
                <div className="text-xs p-2 bg-[var(--bg-surface-lit)]/50 rounded-xl">
                  <strong className="block text-[var(--text-main)]">System Ready</strong>
                  <span className="text-[var(--text-muted)] text-[11px]">Sync engine active.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 1-Line Dismissible Smart Insight Strip */}
      {meaningfulInsight && !hideInsightStrip && (
        <div className="flex items-center justify-between gap-2 p-2.5 px-3 rounded-xl bg-[var(--accent-violet)]/10 border border-[var(--accent-violet)]/20 text-xs font-medium text-[var(--text-main)]">
          <div className="flex items-center gap-2 overflow-hidden">
            <Sparkles size={14} className="text-[var(--accent-violet)] shrink-0" />
            <span className="truncate">{meaningfulInsight}</span>
          </div>
          <button
            onClick={() => setHideInsightStrip(true)}
            aria-label="Dismiss insight"
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-lg shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Single-Row Compact Hero Budget Card */}
      <div className="surface-card p-4 rounded-2xl border border-[var(--bg-surface-lit)] bg-gradient-to-r from-[var(--bg-surface)] via-[var(--bg-surface)] to-[var(--accent-glow)]/15">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5 overflow-hidden">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Remaining Budget
            </span>
            <CountUp
              value={remainingBudget}
              formatter={(v) => formatCurrency(v)}
              className="text-2xl sm:text-3xl font-extrabold tabular-nums text-[var(--text-main)] truncate"
            />
            <span className="text-[11px] text-[var(--text-muted)]">
              {totalBudget > 0
                ? `${Math.round(budgetPercentage)}% of ${formatCurrency(totalBudget)} used`
                : 'Set budget in Budgets tab'}
            </span>
          </div>

          <div className="shrink-0">
            {totalBudget > 0 ? (
              <div className="relative w-14 h-14 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="28" cy="28" r="22" stroke="var(--bg-surface-lit)" strokeWidth="5" fill="none" />
                  <circle
                    cx="28"
                    cy="28"
                    r="22"
                    stroke={
                      budgetPercentage > 90
                        ? 'var(--status-red)'
                        : budgetPercentage > 75
                          ? 'var(--status-yellow)'
                          : 'var(--accent-violet)'
                    }
                    strokeWidth="5"
                    fill="none"
                    strokeDasharray="138"
                    strokeDashoffset={138 - (138 * Math.min(budgetPercentage, 100)) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-500 ease-out"
                  />
                </svg>
                <span className="absolute text-[10px] font-bold tabular-nums">
                  {Math.round(budgetPercentage)}%
                </span>
              </div>
            ) : (
              <button
                onClick={() => navigate('/budgets')}
                className="px-3 py-1.5 text-xs font-bold bg-[var(--accent-violet)] text-white rounded-xl shadow-sm"
              >
                Set
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2-Column Grid: Total Spent & Net Savings */}
      <div className="grid grid-cols-2 gap-3">
        {/* Total Spent */}
        <div className="surface-card p-3.5 rounded-2xl flex flex-col justify-between gap-1 border border-[var(--bg-surface-lit)]">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Spent
            </span>
            <div className="p-1 rounded-lg bg-[var(--status-red)]/10 text-[var(--status-red)]">
              <ArrowUpRight size={14} />
            </div>
          </div>
          <CountUp
            value={totalExpense}
            formatter={(v) => formatCurrency(v)}
            className="text-lg sm:text-xl font-bold tabular-nums text-[var(--text-main)] truncate"
          />
          <span className="text-[10px] text-[var(--text-muted)] truncate">
            {lastExpense ? `${lastExpense.category}` : 'No expenses'}
          </span>
        </div>

        {/* Net Savings */}
        <div className="surface-card p-3.5 rounded-2xl flex flex-col justify-between gap-1 border border-[var(--bg-surface-lit)]">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Savings
            </span>
            <div className="p-1 rounded-lg bg-[var(--status-green)]/10 text-[var(--status-green)]">
              <ArrowDownRight size={14} />
            </div>
          </div>
          {hasIncome ? (
            <CountUp
              value={savings}
              formatter={(v) => formatCurrency(v)}
              className={`text-lg sm:text-xl font-bold tabular-nums truncate ${
                savings >= 0 ? 'text-[var(--status-green)]' : 'text-[var(--status-red)]'
              }`}
            />
          ) : (
            <span className="text-lg sm:text-xl font-bold text-[var(--text-muted)]">—</span>
          )}
          <span className="text-[10px] text-[var(--text-muted)] truncate">
            {hasIncome ? 'Income active' : 'Add income'}
          </span>
        </div>
      </div>

      {/* Compact Recent Transactions */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Recent Transactions
          </h2>
          {cycleTxs.length > 0 && (
            <button
              onClick={() => navigate('/logs')}
              className="text-xs text-[var(--accent-violet)] font-bold hover:underline cursor-pointer"
            >
              View All
            </button>
          )}
        </div>

        {cycleTxs.length > 0 ? (
          <div className="surface-card rounded-2xl divide-y divide-[var(--bg-surface-lit)] overflow-hidden">
            {cycleTxs.slice(0, 3).map((tx) => {
              const IconComp = getCategoryIcon(tx.category);
              const title = tx.recipient && tx.recipient.trim() !== '' ? tx.recipient : tx.category;
              const isIncomeOrBorrow = tx.type === 'Income' || tx.type === 'Borrow';

              return (
                <div
                  key={tx.id}
                  onClick={() => navigate('/logs')}
                  className="p-3 flex items-center justify-between hover:bg-[var(--bg-surface-lit)]/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        tx.type === 'Lend'
                          ? 'bg-indigo-500/10 text-indigo-500'
                          : tx.type === 'Borrow'
                            ? 'bg-purple-500/10 text-purple-500'
                            : isIncomeOrBorrow
                              ? 'bg-[var(--status-green)]/10 text-[var(--status-green)]'
                              : 'bg-[var(--status-red)]/10 text-[var(--status-red)]'
                      }`}
                    >
                      <IconComp size={15} />
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold text-xs text-[var(--text-main)] truncate">
                        {title}
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)] truncate">
                        {tx.category} • {formatDate(tx.date)}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`font-bold text-xs tabular-nums shrink-0 ml-2 ${
                      isIncomeOrBorrow
                        ? 'text-[var(--status-green)]'
                        : tx.type === 'Lend'
                          ? 'text-indigo-500'
                          : 'text-[var(--text-main)]'
                    }`}
                  >
                    {formatCurrency(isIncomeOrBorrow ? tx.amount : -tx.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="surface-card p-6 rounded-2xl flex flex-col items-center justify-center text-center gap-2">
            <div className="w-10 h-10 rounded-full bg-[var(--bg-surface-lit)] flex items-center justify-center text-[var(--text-muted)]">
              <TrendingDown size={18} />
            </div>
            <p className="text-xs text-[var(--text-muted)]">No transactions logged yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
