import { useState } from 'react';
import { useFinanceStore, useFilteredTransactions, useWorkspaceSettings } from '../store/useFinanceStore';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar, Legend } from 'recharts';
import { Settings, Sparkles, BarChart2, PieChart as PieChartIcon } from 'lucide-react';
import { subMonths, format, parseISO } from 'date-fns';

export default function BudgetAnalytics() {
  const { getSmartInsights } = useFinanceStore();
  const { budgets, useGlobalBudget, globalBudgetLimit, budgetCycle } = useWorkspaceSettings();
  const transactions = useFilteredTransactions();
  const [chartType, setChartType] = useState('pie');
  const [trendDuration, setTrendDuration] = useState(6);

  const now = new Date();
  
  // Filter for current cycle
  const cycleTxs = transactions.filter(t => {
    const tDate = parseISO(t.date);
    if (budgetCycle === '1 month') {
      return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
    } else if (budgetCycle === '2 months') {
      const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return tDate >= twoMonthsAgo;
    } else if (budgetCycle === '1 year') {
      return tDate.getFullYear() === now.getFullYear();
    }
    return true; // 'never'
  });

  const totalSpent = cycleTxs.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);
  
  let pieData = [];
  if (useGlobalBudget) {
    const remaining = Math.max(globalBudgetLimit - totalSpent, 0);
    pieData = [
      { name: 'Spent', value: totalSpent },
      { name: 'Remaining', value: remaining }
    ].filter(d => d.value > 0);
  } else {
    pieData = Object.entries(budgets || {}).map(([name, b]) => ({
      name,
      value: b.spent,
      limit: b.limit,
      percentage: Math.min((b.spent / (b.limit || 1)) * 100, 100)
    })).filter(d => d.value > 0);
  }

  const COLORS = ['#7C3AED', '#10B981', '#F59E0B', '#3B82F6', '#EC4899'];

  // Stats Calculations
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();
  const avgSpentPerDay = currentDay > 0 ? totalSpent / currentDay : 0;
  
  const todayStr = format(now, 'yyyy-MM-dd');
  const yesterdayStr = format(subMonths(now, 0).setDate(now.getDate() - 1), 'yyyy-MM-dd'); // safe yesterday
  
  const todaySpent = cycleTxs
    .filter(t => t.type === 'Expense' && t.date.startsWith(todayStr))
    .reduce((sum, t) => sum + t.amount, 0);
    
  const yesterdaySpent = transactions // don't restrict yesterday to cycle just in case it crosses a boundary
    .filter(t => t.type === 'Expense' && t.date.startsWith(yesterdayStr))
    .reduce((sum, t) => sum + t.amount, 0);
    
  const diffYesterday = todaySpent - yesterdaySpent;

  // Generate trend data
  const trendData = Array.from({ length: trendDuration }).map((_, i) => {
    const targetDate = subMonths(new Date(), trendDuration - 1 - i);
    const monthLabel = trendDuration > 6 ? format(targetDate, 'MMM yy') : format(targetDate, 'MMM');
    
    const monthTxs = transactions.filter(t => {
      const d = parseISO(t.date);
      return d.getMonth() === targetDate.getMonth() && d.getFullYear() === targetDate.getFullYear();
    });

    const income = monthTxs.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
    const expense = monthTxs.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);

    return { name: monthLabel, income, expense };
  });

  const insights = getSmartInsights();

  return (
    <div className="flex flex-col gap-6 animate-[slideUp_180ms_ease-out] pb-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Budgets & Analytics</h1>
          <p className="text-[var(--text-muted)] text-sm">Deep dive into your finances.</p>
        </div>
        <div className="flex bg-[var(--bg-surface-lit)] p-1 rounded-xl">
          <button 
            onClick={() => setChartType('pie')}
            className={`p-2 rounded-lg transition-colors ${chartType === 'pie' ? 'bg-[var(--bg-surface)] text-[var(--accent-violet)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
          >
            <PieChartIcon size={20} />
          </button>
          <button 
            onClick={() => setChartType('bar')}
            className={`p-2 rounded-lg transition-colors ${chartType === 'bar' ? 'bg-[var(--bg-surface)] text-[var(--accent-violet)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
          >
            <BarChart2 size={20} />
          </button>
        </div>
      </header>

      {/* Mini Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="surface-card p-4 flex flex-col gap-1">
          <span className="text-xs font-medium text-[var(--text-muted)]">Avg Spent / Day</span>
          <span className="text-lg font-bold tabular-nums">₹{Math.round(avgSpentPerDay).toLocaleString()}</span>
        </div>
        <div className="surface-card p-4 flex flex-col gap-1">
          <span className="text-xs font-medium text-[var(--text-muted)]">Spent Today</span>
          <span className="text-lg font-bold tabular-nums">₹{todaySpent.toLocaleString()}</span>
          <span className={`text-[10px] font-medium ${diffYesterday > 0 ? 'text-[var(--status-red)]' : 'text-[var(--status-green)]'}`}>
            {diffYesterday > 0 ? '+' : ''}₹{diffYesterday.toLocaleString()} vs yesterday
          </span>
        </div>
      </div>

      {/* AI Smart Insights Card */}
      <div className="bg-gradient-to-br from-[var(--status-green)]/10 to-transparent border border-[var(--status-green)]/20 rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden">
        <div className="flex items-center gap-2 text-[var(--status-green)]">
          <Sparkles size={18} />
          <h3 className="font-bold text-sm tracking-wide">AI Recommendation</h3>
        </div>
        <div className="text-sm space-y-2 relative z-10 font-medium">
          <p className="text-[var(--text-main)] leading-relaxed">
            Based on your patterns, {insights.length > 0 ? insights[0].toLowerCase() : "you are maintaining a healthy balance."} 
            Consider moving unspent funds into an emergency savings pool.
          </p>
        </div>
        <div className="absolute -right-8 -bottom-8 opacity-10">
          <Sparkles size={100} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Analytics Chart */}
        <div className="surface-card p-6 flex flex-col items-center">
          <h2 className="text-sm font-semibold self-start mb-4">Spending Distribution</h2>
          <div className="w-full h-64 max-w-sm">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'pie' ? (
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    isAnimationActive={true}
                    animationDuration={1500}
                    animationEasing="ease-out"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--bg-surface-lit)',
                      borderColor: 'var(--bg-surface-lit)',
                      borderRadius: '8px',
                      color: 'var(--text-main)',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    itemStyle={{ color: 'var(--text-main)' }}
                    formatter={(value) => `₹${value.toLocaleString()}`}
                  />
                </PieChart>
              ) : (
                <BarChart data={pieData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-surface-lit)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} tick={{fill: 'var(--text-muted)'}} />
                  <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--bg-surface-lit)',
                      borderColor: 'var(--bg-surface-lit)',
                      borderRadius: '8px',
                      color: 'var(--text-main)',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value) => `₹${value.toLocaleString()}`}
                    cursor={{fill: 'var(--accent-glow)'}}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} isAnimationActive={true} animationDuration={1500} animationEasing="ease-out">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Historical Trend Chart */}
        <div className="surface-card p-6 flex flex-col items-center">
          <div className="w-full flex justify-between items-center mb-4">
            <h2 className="text-sm font-semibold">Spending Trend</h2>
            <select 
              value={trendDuration} 
              onChange={e => setTrendDuration(Number(e.target.value))}
              className="bg-[var(--bg-surface-lit)] text-[var(--text-main)] text-xs px-2 py-1.5 rounded-lg outline-none font-medium cursor-pointer border-none"
            >
              <option value={1}>1 Month</option>
              <option value={2}>2 Months</option>
              <option value={3}>3 Months</option>
              <option value={6}>6 Months</option>
              <option value={12}>1 Year</option>
            </select>
          </div>
          <div className="w-full h-64 max-w-md">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-surface-lit)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-surface-lit)',
                    borderColor: 'var(--bg-surface-lit)',
                    borderRadius: '8px',
                    color: 'var(--text-main)',
                  }}
                />
                <Line type="monotone" dataKey="income" stroke="var(--status-green)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} isAnimationActive={true} animationDuration={1500} />
                <Line type="monotone" dataKey="expense" stroke="var(--status-red)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} isAnimationActive={true} animationDuration={1500} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 mt-4 text-xs font-medium">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-[var(--status-green)]"></div> Income</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-[var(--status-red)]"></div> Expense</div>
          </div>
        </div>
      </div>

      {/* Budget Bars */}
      <div className="flex flex-col gap-4 mt-4">
        <h2 className="text-lg font-semibold">Monthly Allowances</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(budgets || {}).map(([category, { limit, spent }]) => {
            if (limit === 0 && spent === 0) return null;
            
            const percentage = Math.min((spent / (limit || 1)) * 100, 100);
            const isWarning = percentage > 70 && percentage <= 90;
            const isDanger = percentage > 90;
            
            return (
              <div key={category} className="surface-card p-4 flex flex-col gap-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-[var(--text-main)]">{category}</span>
                  <span className="text-[var(--text-muted)] tabular-nums">
                    <span className="text-[var(--text-main)] font-semibold">₹{spent.toLocaleString()}</span> / ₹{limit.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 w-full bg-[var(--bg-surface-lit)] rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ease-out ${
                      isDanger ? 'bg-[var(--status-red)]' : 
                      isWarning ? 'bg-[var(--status-yellow)]' : 
                      'bg-[var(--accent-violet)]'
                    }`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                {isDanger && <span className="text-[10px] text-[var(--status-red)] font-medium">Budget exceeded!</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
