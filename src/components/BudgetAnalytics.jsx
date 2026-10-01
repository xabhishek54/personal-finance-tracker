import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  useFinanceStore,
  useFilteredTransactions,
  useWorkspaceSettings,
} from '../store/useFinanceStore';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Sparkles, BarChart2, PieChart as PieChartIcon, Save, Sliders, X, CheckCircle2 } from 'lucide-react';
import { subMonths, format, parseISO } from 'date-fns';
import { formatCurrency } from '../utils/formatters';
import { EXPENSE_CATEGORIES } from '../utils/categories';

export default function BudgetAnalytics() {
  const { getSmartInsights, updateWorkspaceSettings } = useFinanceStore();
  const workspaceSettings = useWorkspaceSettings();
  const { budgets: savedBudgets, useGlobalBudget: savedUseGlobal, globalBudgetLimit: savedGlobalLimit, budgetCycle } = workspaceSettings;

  const transactions = useFilteredTransactions();
  const [chartType, setChartType] = useState('pie');
  const [trendDuration, setTrendDuration] = useState(6);

  // Edit Allowances Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [useGlobalBudget, setUseGlobalBudget] = useState(savedUseGlobal || false);
  const [globalLimit, setGlobalLimit] = useState(savedGlobalLimit || 50000);
  const [categoryLimits, setCategoryLimits] = useState({});
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setUseGlobalBudget(savedUseGlobal || false);
    setGlobalLimit(savedGlobalLimit || 50000);

    const initialCat = {};
    EXPENSE_CATEGORIES.forEach((cat) => {
      initialCat[cat] = savedBudgets?.[cat]?.limit ?? 5000;
    });
    setCategoryLimits(initialCat);
  }, [savedUseGlobal, savedGlobalLimit, savedBudgets]);

  const handleSaveBudgets = () => {
    const updatedBudgets = { ...(savedBudgets || {}) };
    Object.entries(categoryLimits).forEach(([cat, limit]) => {
      updatedBudgets[cat] = {
        limit: Number(limit) || 0,
        spent: updatedBudgets[cat]?.spent || 0,
      };
    });

    updateWorkspaceSettings({
      useGlobalBudget,
      globalBudgetLimit: Number(globalLimit) || 0,
      budgets: updatedBudgets,
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
    setIsEditModalOpen(false);
  };

  const now = new Date();

  // Filter for current cycle
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

  const totalSpent = cycleTxs
    .filter((t) => t.type === 'Expense')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  let pieData = [];
  if (useGlobalBudget) {
    const remaining = Math.max(globalLimit - totalSpent, 0);
    pieData = [
      { name: 'Spent', value: totalSpent },
      { name: 'Remaining', value: remaining },
    ].filter((d) => d.value > 0);
  } else {
    pieData = EXPENSE_CATEGORIES.map((cat) => {
      const spentCat = cycleTxs
        .filter((t) => t.type === 'Expense' && t.category === cat)
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);
      const limitCat = categoryLimits[cat] || 0;
      return {
        name: cat,
        value: spentCat,
        limit: limitCat,
      };
    }).filter((d) => d.value > 0);
  }

  const COLORS = ['#7C3AED', '#10B981', '#F59E0B', '#3B82F6', '#EC4899', '#8B5CF6', '#06B6D4', '#F43F5E'];

  // Trend Data Generation (Monthly Bar Chart)
  const trendData = Array.from({ length: trendDuration }).map((_, i) => {
    const targetDate = subMonths(new Date(), trendDuration - 1 - i);
    const monthLabel = trendDuration > 6 ? format(targetDate, 'MMM yy') : format(targetDate, 'MMM');

    const monthTxs = transactions.filter((t) => {
      if (!t.date) return false;
      const d = parseISO(t.date);
      return d.getMonth() === targetDate.getMonth() && d.getFullYear() === targetDate.getFullYear();
    });

    const income = monthTxs
      .filter((t) => t.type === 'Income')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const expense = monthTxs
      .filter((t) => t.type === 'Expense')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    return { name: monthLabel, Income: income, Expense: expense };
  });

  const insights = getSmartInsights();
  const meaningfulInsight = insights.find(
    (i) => !i.toLowerCase().includes('everything looks stable') && !i.toLowerCase().includes('no spending data')
  );

  return (
    <div className="flex flex-col gap-6 animate-[slideUp_180ms_ease-out] pb-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-main)]">
            Budgets & Analytics
          </h1>
          <p className="text-[var(--text-muted)] text-xs sm:text-sm mt-0.5">
            Track monthly spending caps versus actual limits.
          </p>
        </div>
        <button
          onClick={() => setIsEditModalOpen(true)}
          className="px-4 py-2.5 text-xs font-bold bg-[var(--accent-violet)] text-white rounded-xl shadow-sm hover:opacity-95 active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
        >
          <Sliders size={14} />
          <span>Edit Allowances</span>
        </button>
      </header>

      {/* SECTION 1: Active Category Allowance Progress Bars (ON TOP) */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">
          Category Spending vs Limits
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {EXPENSE_CATEGORIES.map((cat) => {
            const limit = categoryLimits[cat] || 0;
            const spent = cycleTxs
              .filter((t) => t.type === 'Expense' && t.category === cat)
              .reduce((sum, t) => sum + Number(t.amount || 0), 0);

            if (limit === 0 && spent === 0) return null;

            const percentage = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
            const isWarning = percentage >= 80 && percentage < 100;
            const isOver = percentage >= 100;

            return (
              <div key={cat} className="surface-card p-4 rounded-2xl flex flex-col gap-2 border border-[var(--bg-surface-lit)]">
                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <span className="font-bold text-[var(--text-main)]">{cat}</span>
                  <span className="tabular-nums font-medium text-[var(--text-muted)]">
                    <strong className="text-[var(--text-main)]">{formatCurrency(spent)}</strong> / {formatCurrency(limit)}
                  </span>
                </div>

                {/* Progress Track: Amber at 80%, Red at 100% */}
                <div className="h-2.5 w-full bg-[var(--bg-surface-lit)] rounded-full overflow-hidden relative">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${
                      isOver
                        ? 'bg-[var(--status-red)]'
                        : isWarning
                          ? 'bg-[var(--status-yellow)]'
                          : 'bg-[var(--accent-violet)]'
                    }`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>

                <div className="flex justify-between items-center text-[10px] font-semibold text-[var(--text-muted)]">
                  <span>{Math.round(percentage)}% used</span>
                  {isOver && <span className="text-[var(--status-red)]">Limit Exceeded</span>}
                  {isWarning && <span className="text-[var(--status-yellow)]">Near Limit (80%+)</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Recommendation Banner */}
      {meaningfulInsight && (
        <div className="bg-gradient-to-br from-[var(--status-green)]/10 to-transparent border border-[var(--status-green)]/20 rounded-2xl p-4 flex flex-col gap-2 relative overflow-hidden">
          <div className="flex items-center gap-2 text-[var(--status-green)]">
            <Sparkles size={15} />
            <h3 className="font-bold text-xs uppercase tracking-wider">Financial Insights</h3>
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-main)] leading-relaxed relative z-10 font-medium">
            {meaningfulInsight}. Consider allocating leftover budget into an emergency savings pool.
          </p>
        </div>
      )}

      {/* SECTION 2: Analytics Charts (BELOW PROGRESS BARS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution Chart */}
        <div className="surface-card p-5 rounded-2xl flex flex-col gap-4 border border-[var(--bg-surface-lit)]">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Spending Distribution
            </h2>
            <div className="flex bg-[var(--bg-surface-lit)] p-1 rounded-xl">
              <button
                onClick={() => setChartType('pie')}
                aria-label="Donut Chart View"
                title="Donut Chart View"
                className={`p-1.5 rounded-lg transition-colors ${
                  chartType === 'pie' ? 'bg-[var(--bg-surface)] text-[var(--accent-violet)] shadow-sm' : 'text-[var(--text-muted)]'
                }`}
              >
                <PieChartIcon size={16} />
              </button>
              <button
                onClick={() => setChartType('bar')}
                aria-label="Bar Chart View"
                title="Bar Chart View"
                className={`p-1.5 rounded-lg transition-colors ${
                  chartType === 'bar' ? 'bg-[var(--bg-surface)] text-[var(--accent-violet)] shadow-sm' : 'text-[var(--text-muted)]'
                }`}
              >
                <BarChart2 size={16} />
              </button>
            </div>
          </div>

          <div className="w-full h-64 flex items-center justify-center relative">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'pie' ? (
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--bg-surface-lit)',
                        borderRadius: '12px',
                        color: 'var(--text-main)',
                      }}
                      formatter={(val) => formatCurrency(val)}
                    />
                    <Legend />
                  </PieChart>
                ) : (
                  <BarChart data={pieData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-surface-lit)" vertical={false} />
                    <XAxis dataKey="name" fontSize={11} stroke="var(--text-muted)" tickLine={false} />
                    <YAxis fontSize={11} stroke="var(--text-muted)" tickFormatter={(v) => `₹${v}`} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--bg-surface-lit)',
                        borderRadius: '12px',
                      }}
                      formatter={(val) => formatCurrency(val)}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-xs text-[var(--text-muted)]">No expense data logged for this cycle.</div>
            )}
          </div>
        </div>

        {/* Historical Monthly Trend Bar Chart */}
        <div className="surface-card p-5 rounded-2xl flex flex-col gap-4 border border-[var(--bg-surface-lit)]">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Monthly Trend
            </h2>
            <select
              value={trendDuration}
              onChange={(e) => setTrendDuration(Number(e.target.value))}
              aria-label="Select trend duration"
              className="bg-[var(--bg-surface-lit)] text-[var(--text-main)] text-xs px-2.5 py-1.5 rounded-xl font-medium outline-none cursor-pointer border-none"
            >
              <option value={3}>3 Months</option>
              <option value={6}>6 Months</option>
              <option value={12}>12 Months</option>
            </select>
          </div>

          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-surface-lit)" vertical={false} />
                <XAxis dataKey="name" fontSize={11} stroke="var(--text-muted)" tickLine={false} />
                <YAxis fontSize={11} stroke="var(--text-muted)" tickFormatter={(v) => `₹${v}`} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--bg-surface-lit)',
                    borderRadius: '12px',
                  }}
                  formatter={(val) => formatCurrency(val)}
                />
                <Legend />
                <Bar dataKey="Income" fill="#10B981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Expense" fill="#EF4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Edit Allowances Modal Drawer */}
      {isEditModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-md animate-[popIn_150ms_ease-out]"
            onClick={() => setIsEditModalOpen(false)}
          >
            <div
              className="bg-[var(--bg-surface)] w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 px-6 flex justify-between items-center border-b border-[var(--bg-surface-lit)] shrink-0">
                <h2 className="text-base font-bold text-[var(--text-main)]">Edit Monthly Allowances</h2>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  aria-label="Close"
                  className="p-1.5 rounded-xl hover:bg-[var(--bg-surface-lit)] text-[var(--text-muted)]"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex flex-col gap-5">
                {/* Global Budget Toggle */}
                <div className="flex items-center justify-between gap-4 p-3 bg-[var(--bg-surface-lit)]/40 rounded-2xl border border-[var(--bg-surface-lit)]">
                  <div>
                    <span className="font-bold text-xs sm:text-sm text-[var(--text-main)]">Use Overall Global Budget Cap</span>
                    <p className="text-[11px] text-[var(--text-muted)]">Set one overall limit instead of category limits.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUseGlobalBudget(!useGlobalBudget)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      useGlobalBudget ? 'bg-[var(--accent-violet)]' : 'bg-zinc-600 dark:bg-zinc-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        useGlobalBudget ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {useGlobalBudget ? (
                  <div className="flex flex-col gap-1.5 max-w-xs">
                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                      Overall Monthly Cap (₹)
                    </label>
                    <input
                      type="number"
                      value={globalLimit}
                      onChange={(e) => setGlobalLimit(e.target.value)}
                      className="bg-[var(--bg-surface-lit)] border border-transparent focus:border-[var(--accent-violet)] rounded-xl px-4 py-2.5 text-sm font-extrabold tabular-nums text-[var(--text-main)] outline-none"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <div key={cat} className="flex flex-col gap-1 bg-[var(--bg-surface-lit)]/40 p-2.5 rounded-xl border border-[var(--bg-surface-lit)]">
                        <label className="text-xs font-semibold text-[var(--text-muted)] truncate">{cat}</label>
                        <div className="flex items-center text-sm font-extrabold tabular-nums text-[var(--text-main)]">
                          <span className="text-[var(--text-muted)] mr-1">₹</span>
                          <input
                            type="number"
                            value={categoryLimits[cat] ?? 5000}
                            onChange={(e) =>
                              setCategoryLimits({
                                ...categoryLimits,
                                [cat]: e.target.value,
                              })
                            }
                            className="w-full bg-transparent focus:outline-none tabular-nums font-extrabold text-sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 px-6 border-t border-[var(--bg-surface-lit)] bg-[var(--bg-surface)] shrink-0 flex justify-end">
                <button
                  onClick={handleSaveBudgets}
                  className="w-full sm:w-auto px-6 py-3 bg-[var(--accent-violet)] text-white text-xs font-bold rounded-xl shadow-md hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Save size={15} />
                  <span>Save Allowances</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
