import { useState, useEffect } from 'react';
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
import { Sparkles, BarChart2, PieChart as PieChartIcon, Save, CheckCircle2, Sliders } from 'lucide-react';
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

  // Editable Budget State
  const [isEditingBudgets, setIsEditingBudgets] = useState(false);
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
    setTimeout(() => setSavedSuccess(false), 2500);
    setIsEditingBudgets(false);
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
          <p className="text-[var(--text-muted)] text-sm mt-0.5">
            Manage your monthly spending limits and view analytical trends.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditingBudgets(!isEditingBudgets)}
            className="px-3.5 py-2 text-xs font-bold bg-[var(--accent-violet)] text-white rounded-xl shadow-sm hover:opacity-90 transition-opacity flex items-center gap-1.5"
          >
            <Sliders size={14} />
            <span>{isEditingBudgets ? 'Close Limits Editor' : 'Edit Allowances'}</span>
          </button>
        </div>
      </header>

      {/* Budget Allowance Setting Drawer / Card */}
      <div className="surface-card p-5 rounded-2xl border border-[var(--bg-surface-lit)] flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-[var(--bg-surface-lit)] pb-3">
          <h2 className="text-base font-bold text-[var(--text-main)]">Monthly Budget Allowances</h2>
          {savedSuccess && (
            <span className="text-xs font-bold text-[var(--status-green)] flex items-center gap-1">
              <CheckCircle2 size={14} /> Saved!
            </span>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4 p-3 bg-[var(--bg-surface-lit)]/40 rounded-xl">
            <div>
              <span className="font-semibold text-sm text-[var(--text-main)]">Use Overall Global Budget</span>
              <p className="text-xs text-[var(--text-muted)]">Set one cap for all expenses instead of individual categories.</p>
            </div>
            <input
              type="checkbox"
              checked={useGlobalBudget}
              onChange={(e) => setUseGlobalBudget(e.target.checked)}
              className="w-5 h-5 accent-[var(--accent-violet)] cursor-pointer"
            />
          </div>

          {useGlobalBudget ? (
            <div className="flex flex-col gap-1.5 max-w-xs">
              <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Overall Limit (₹)
              </label>
              <input
                type="number"
                value={globalLimit}
                onChange={(e) => setGlobalLimit(e.target.value)}
                className="bg-[var(--bg-surface-lit)] border border-transparent focus:border-[var(--accent-violet)] rounded-xl px-4 py-2.5 text-sm font-bold tabular-nums text-[var(--text-main)] focus:outline-none"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {EXPENSE_CATEGORIES.map((cat) => (
                <div key={cat} className="flex flex-col gap-1 bg-[var(--bg-surface-lit)]/30 p-2.5 rounded-xl border border-[var(--bg-surface-lit)]">
                  <label className="text-xs font-medium text-[var(--text-muted)] truncate">{cat}</label>
                  <div className="flex items-center text-sm font-bold tabular-nums text-[var(--text-main)]">
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
                      className="w-full bg-transparent focus:outline-none tabular-nums font-bold"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveBudgets}
              className="px-5 py-2.5 bg-[var(--accent-violet)] text-white text-xs font-bold rounded-xl shadow-md hover:opacity-95 transition-opacity flex items-center gap-2"
            >
              <Save size={15} />
              <span>Save Budget Allowances</span>
            </button>
          </div>
        </div>
      </div>

      {/* AI Recommendation */}
      <div className="bg-gradient-to-br from-[var(--status-green)]/10 to-transparent border border-[var(--status-green)]/20 rounded-2xl p-4 sm:p-5 flex flex-col gap-2 relative overflow-hidden">
        <div className="flex items-center gap-2 text-[var(--status-green)]">
          <Sparkles size={16} />
          <h3 className="font-bold text-xs uppercase tracking-wider">Financial Insights</h3>
        </div>
        <p className="text-xs sm:text-sm text-[var(--text-main)] leading-relaxed relative z-10 font-medium">
          {meaningfulInsight
            ? `${meaningfulInsight}. Consider allocating leftover budget into an emergency savings pool.`
            : 'Add a few more transactions to receive tailored budget recommendations.'}
        </p>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution Chart */}
        <div className="surface-card p-5 rounded-2xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[var(--text-main)] uppercase tracking-wider">
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
        <div className="surface-card p-5 rounded-2xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[var(--text-main)] uppercase tracking-wider">
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

      {/* Category Allowance Progress Bars Grid */}
      <div className="flex flex-col gap-3">
        <h2 className="text-base font-bold text-[var(--text-main)]">Active Category Allowances</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <div key={cat} className="surface-card p-4 rounded-2xl flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <span className="font-bold text-[var(--text-main)]">{cat}</span>
                  <span className="tabular-nums font-medium text-[var(--text-muted)]">
                    <strong className="text-[var(--text-main)]">{formatCurrency(spent)}</strong> / {formatCurrency(limit)}
                  </span>
                </div>

                {/* Progress Track */}
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
                  {isWarning && <span className="text-[var(--status-yellow)]">Near Limit</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
