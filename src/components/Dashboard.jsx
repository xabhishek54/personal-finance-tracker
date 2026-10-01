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
  PieChart,
  Calendar,
  Plus,
  TrendingDown,
} from 'lucide-react';
import { parseISO } from 'date-fns';
import { formatCurrency, formatDate, getGreeting } from '../utils/formatters';
import { getCategoryIcon } from '../utils/categories';
import CountUp from './CountUp';

export default function Dashboard() {
  const { theme, toggleTheme, getSmartInsights, hasUnreadNotifications, markNotificationsRead } =
    useFinanceStore();
  const { budgets, includeLendBorrow, useGlobalBudget, globalBudgetLimit, budgetCycle } =
    useWorkspaceSettings();
  const transactions = useFilteredTransactions();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
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
  const meaningfulInsights = insights.filter(
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
    <div className="flex flex-col gap-6 animate-[slideUp_180ms_ease-out]">
      {/* Header */}
      <header className="flex items-center justify-between relative">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {greetingText}
            {currentUser?.displayName ? `, ${currentUser.displayName.split(' ')[0]}` : ''}!
          </h1>
          <div className="flex items-center gap-2 mt-1.5 text-[var(--text-muted)] text-sm font-medium">
            <Calendar size={15} />
            <span>{todayFormatted}</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2.5 rounded-xl surface-card hover:bg-[var(--bg-surface-lit)] transition-colors text-[var(--text-main)]"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <div className="relative" ref={notificationRef}>
            <button
              onClick={handleNotificationClick}
              aria-label="Notifications"
              className="p-2.5 rounded-xl surface-card hover:bg-[var(--bg-surface-lit)] transition-colors relative text-[var(--text-main)]"
            >
              <Bell size={18} />
              {hasUnreadNotifications && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--status-yellow)] rounded-full animate-pulse"></span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute top-full right-0 mt-2 w-72 bg-[var(--bg-surface)] border border-[var(--bg-surface-lit)] rounded-2xl shadow-xl z-50 p-3 animate-[popIn_150ms_ease-out]">
                <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 px-1">
                  Notifications
                </h3>
                <div className="flex flex-col gap-1.5">
                  <div className="text-xs p-2.5 bg-[var(--bg-surface-lit)]/50 rounded-xl transition-colors">
                    <strong className="block text-[var(--text-main)]">System Active</strong>
                    <span className="text-[var(--text-muted)]">Your workspace is synced and ready.</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Card: Remaining Budget / Budget Overview */}
      <div className="surface-card p-6 rounded-2xl relative overflow-hidden bg-gradient-to-br from-[var(--bg-surface)] via-[var(--bg-surface)] to-[var(--accent-glow)]/20 border border-[var(--bg-surface-lit)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-10 relative">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Remaining Budget Allowance
            </span>
            <div className="flex items-baseline gap-2">
              <CountUp
                value={remainingBudget}
                formatter={(v) => formatCurrency(v)}
                className="text-3xl sm:text-4xl font-extrabold tabular-nums text-[var(--text-main)]"
              />
              {totalBudget > 0 && (
                <span className="text-xs text-[var(--text-muted)] font-medium">
                  of {formatCurrency(totalBudget)} total
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              {totalBudget > 0
                ? `${Math.round(budgetPercentage)}% of budget used this cycle`
                : 'Set a monthly budget in Budgets & Analytics to track remaining allowance.'}
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            {totalBudget > 0 ? (
              <div className="relative w-20 h-20 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    stroke="var(--bg-surface-lit)"
                    strokeWidth="7"
                    fill="none"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    stroke={
                      budgetPercentage > 90
                        ? 'var(--status-red)'
                        : budgetPercentage > 75
                          ? 'var(--status-yellow)'
                          : 'var(--accent-violet)'
                    }
                    strokeWidth="7"
                    fill="none"
                    strokeDasharray="201"
                    strokeDashoffset={201 - (201 * Math.min(budgetPercentage, 100)) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-500 ease-out"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-xs font-bold tabular-nums">
                    {Math.round(budgetPercentage)}%
                  </span>
                </div>
              </div>
            ) : (
              <button
                onClick={() => navigate('/budgets')}
                className="px-4 py-2 text-xs font-bold bg-[var(--accent-violet)] text-white rounded-xl shadow-sm hover:opacity-90 transition-opacity"
              >
                Set Budget
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Row: Total Spent & Net Savings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Total Expense Card */}
        <div className="surface-card p-5 rounded-2xl flex flex-col justify-between gap-3 relative overflow-hidden group">
          <div className="flex justify-between items-center z-10">
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Total Spent
            </span>
            <div className="p-2 rounded-xl bg-[var(--status-red)]/10 text-[var(--status-red)]">
              <ArrowUpRight size={18} />
            </div>
          </div>
          <div className="z-10 flex flex-col">
            <CountUp
              value={totalExpense}
              formatter={(v) => formatCurrency(v)}
              className="text-2xl font-bold tabular-nums text-[var(--text-main)]"
            />
            {lastExpense ? (
              <span className="text-xs text-[var(--text-muted)] mt-1 font-medium truncate">
                Last: <strong className="text-[var(--status-red)] tabular-nums">{formatCurrency(-lastExpense.amount)}</strong> ({lastExpense.category})
              </span>
            ) : (
              <span className="text-xs text-[var(--text-muted)] mt-1 font-medium">No expenses logged yet</span>
            )}
          </div>
        </div>

        {/* Net Savings Card */}
        <div className="surface-card p-5 rounded-2xl flex flex-col justify-between gap-3 relative overflow-hidden group">
          <div className="flex justify-between items-center z-10">
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Net Savings
            </span>
            <div className="p-2 rounded-xl bg-[var(--status-green)]/10 text-[var(--status-green)]">
              <ArrowDownRight size={18} />
            </div>
          </div>
          <div className="z-10 flex flex-col">
            {hasIncome ? (
              <CountUp
                value={savings}
                formatter={(v) => formatCurrency(v)}
                className={`text-2xl font-bold tabular-nums ${
                  savings >= 0 ? 'text-[var(--status-green)]' : 'text-[var(--status-red)]'
                }`}
              />
            ) : (
              <span className="text-2xl font-bold text-[var(--text-muted)]">—</span>
            )}

            {lastIncome ? (
              <span className="text-xs text-[var(--text-muted)] mt-1 font-medium truncate">
                Last Income: <strong className="text-[var(--status-green)] tabular-nums">{formatCurrency(lastIncome.amount)}</strong>
              </span>
            ) : (
              <span className="text-xs text-[var(--text-muted)] mt-1 font-medium">Add income to track net savings</span>
            )}
          </div>
        </div>
      </div>

      {/* Smart Insights (Only shown when meaningful insights exist) */}
      {meaningfulInsights.length > 0 && (
        <div className="bg-gradient-to-br from-[var(--accent-violet)]/10 to-transparent border border-[var(--accent-violet)]/20 rounded-2xl p-4 flex flex-col gap-2 relative overflow-hidden">
          <div className="flex items-center gap-2 text-[var(--accent-violet)]">
            <Sparkles size={16} />
            <h3 className="font-bold text-xs uppercase tracking-wider">Smart Insights</h3>
          </div>
          <ul className="text-xs space-y-1.5 relative z-10 text-[var(--text-main)]">
            {meaningfulInsights.map((insight, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-[var(--accent-violet)] mt-0.5">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recent Logs Section */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-base font-bold text-[var(--text-main)]">Recent Transactions</h2>
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
            {cycleTxs.slice(0, 5).map((tx) => {
              const IconComp = getCategoryIcon(tx.category);
              const title = tx.recipient && tx.recipient.trim() !== '' ? tx.recipient : tx.category;
              const isIncomeOrBorrow = tx.type === 'Income' || tx.type === 'Borrow';

              return (
                <div
                  key={tx.id}
                  onClick={() => navigate('/logs')}
                  className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-[var(--bg-surface-lit)]/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 overflow-hidden">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        tx.type === 'Lend'
                          ? 'bg-indigo-500/10 text-indigo-500'
                          : tx.type === 'Borrow'
                            ? 'bg-purple-500/10 text-purple-500'
                            : isIncomeOrBorrow
                              ? 'bg-[var(--status-green)]/10 text-[var(--status-green)]'
                              : 'bg-[var(--status-red)]/10 text-[var(--status-red)]'
                      }`}
                    >
                      <IconComp size={18} />
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-semibold text-sm text-[var(--text-main)] truncate">
                        {title}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] truncate">
                        {tx.category} • {formatDate(tx.date)}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`font-bold text-sm tabular-nums shrink-0 ml-3 ${
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
          <div className="surface-card p-8 rounded-2xl flex flex-col items-center justify-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[var(--bg-surface-lit)] flex items-center justify-center text-[var(--text-muted)]">
              <TrendingDown size={22} />
            </div>
            <div className="max-w-xs">
              <h3 className="font-bold text-sm text-[var(--text-main)]">No transactions yet</h3>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Add a few entries to start tracking your spending habits and budget allowances.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
