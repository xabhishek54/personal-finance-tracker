import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinanceStore } from '../store/useFinanceStore';
import { useAuth } from '../context/AuthContext';
import { ArrowUpRight, ArrowDownRight, Wallet, Bell, Sun, Moon, Sparkles, PieChart, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';

import CountUp from './CountUp';

export default function Dashboard() {
  const { transactions, budgets, theme, toggleTheme, getSmartInsights, includeLendBorrow, useGlobalBudget, globalBudgetLimit, budgetCycle } = useFinanceStore();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);

  const now = new Date();
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

  const totalExpense = cycleTxs
    .filter(t => t.type === 'Expense' || (includeLendBorrow && t.type === 'Lend'))
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = cycleTxs
    .filter(t => t.type === 'Income' || (includeLendBorrow && t.type === 'Borrow'))
    .reduce((sum, t) => sum + t.amount, 0);
    
  const savings = totalIncome - totalExpense;

  const totalBudget = useGlobalBudget ? globalBudgetLimit : Object.values(budgets || {}).reduce((sum, b) => sum + (b.limit || 0), 0);
  const totalBudgetUsed = Object.values(budgets || {}).reduce((sum, b) => sum + (b.spent || 0), 0);
  const budgetPercentage = totalBudget > 0 ? (totalBudgetUsed / totalBudget) * 100 : 0;
  
  const remainingBudget = Math.max(totalBudget - totalBudgetUsed, 0);

  const insights = getSmartInsights();
  
  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    setHasUnreadNotifications(false);
  };

  const today = new Date();

  return (
    <div className="flex flex-col gap-6 animate-[slideUp_180ms_ease-out]">
      <header className="flex items-center justify-between relative">
        <div>
          <h1 className="text-2xl font-bold">Good Evening{currentUser?.displayName ? `, ${currentUser.displayName.split(' ')[0]}` : ''}!</h1>
          <p className="text-[var(--text-muted)] text-sm">Here's your financial summary.</p>
          <div className="flex items-center gap-2 mt-3 text-[var(--accent-violet)] bg-[var(--accent-glow)] w-fit px-3 py-1.5 rounded-lg text-sm font-medium">
            <Calendar size={16} />
            <span>{format(today, 'EEEE, MMMM do')}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full surface-card hover:bg-[var(--bg-surface-lit)] transition-colors"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button 
            onClick={handleNotificationClick}
            className="p-2 rounded-full surface-card hover:bg-[var(--bg-surface-lit)] transition-colors relative"
          >
            <Bell size={20} />
            {hasUnreadNotifications && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--status-yellow)] rounded-full animate-pulse"></span>
            )}
          </button>
        </div>
        
        {/* Notifications Dropdown */}
        {showNotifications && (
          <div className="absolute top-full right-0 mt-2 w-64 bg-[var(--bg-surface)] border border-[var(--bg-surface-lit)] rounded-xl shadow-xl z-30 p-2 animate-[popIn_200ms_ease-out]">
            <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 px-2">Notifications</h3>
            <div className="flex flex-col gap-1">
              <div className="text-sm p-2 hover:bg-[var(--bg-surface-lit)] rounded-lg transition-colors cursor-pointer">
                <strong>New Feature:</strong> Lend & Borrow tracker is now live!
              </div>
              <div className="text-sm p-2 hover:bg-[var(--bg-surface-lit)] rounded-lg transition-colors cursor-pointer text-[var(--status-yellow)]">
                <strong>Budget Warning:</strong> You're nearing your limit for Food & Dining.
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Smart Insights Section */}
      <div className="bg-gradient-to-br from-[var(--accent-violet)]/10 to-transparent border border-[var(--accent-violet)]/20 rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden">
        <div className="flex items-center gap-2 text-[var(--accent-violet)]">
          <Sparkles size={18} />
          <h3 className="font-bold text-sm">Smart Insights</h3>
        </div>
        <ul className="text-sm space-y-2 relative z-10">
          {insights.map((insight, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-[var(--accent-violet)] mt-0.5">•</span>
              <span className="text-[var(--text-main)] opacity-90">{insight}</span>
            </li>
          ))}
        </ul>
        <div className="absolute -right-10 -bottom-10 opacity-10">
          <Sparkles size={120} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Expense */}
        <div className="surface-card p-5 flex flex-col gap-3 relative overflow-hidden group">
          <div className="flex justify-between items-center z-10">
            <span className="text-sm text-[var(--text-muted)] font-medium">Total Spent</span>
            <div className="p-2 rounded-lg bg-[var(--status-red)]/10 text-[var(--status-red)]">
              <ArrowUpRight size={18} />
            </div>
          </div>
          <div className="z-10 flex flex-col">
            <CountUp 
              value={totalExpense} 
              formatter={(v) => `₹${Math.round(v).toLocaleString()}`} 
              className="text-3xl font-bold tabular-nums" 
            />
            {cycleTxs.length > 0 && cycleTxs.some(t => t.type === 'Expense') && (
              <span className="text-[10px] text-[var(--status-red)] mt-1 font-medium">
                Last: - ₹{Number(cycleTxs.find(t => t.type === 'Expense')?.amount || 0).toLocaleString()} ({cycleTxs.find(t => t.type === 'Expense')?.category || ''})
              </span>
            )}
          </div>
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-[var(--status-red)]/5 rounded-full blur-2xl group-hover:bg-[var(--status-red)]/10 transition-colors"></div>
        </div>

        {/* Savings */}
        <div className="surface-card p-5 flex flex-col gap-3 relative overflow-hidden group">
          <div className="flex justify-between items-center z-10">
            <span className="text-sm text-[var(--text-muted)] font-medium">Net Savings</span>
            <div className="p-2 rounded-lg bg-[var(--status-green)]/10 text-[var(--status-green)]">
              <ArrowDownRight size={18} />
            </div>
          </div>
          <div className="z-10 flex flex-col">
            <CountUp 
              value={savings} 
              formatter={(v) => `₹${Math.round(v).toLocaleString()}`} 
              className="text-3xl font-bold tabular-nums" 
            />
            {cycleTxs.length > 0 && cycleTxs.some(t => t.type === 'Income') && (
              <span className="text-[10px] text-[var(--status-green)] mt-1 font-medium">
                Last: + ₹{Number(cycleTxs.find(t => t.type === 'Income')?.amount || 0).toLocaleString()} ({cycleTxs.find(t => t.type === 'Income')?.category || ''})
              </span>
            )}
          </div>
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-[var(--status-green)]/5 rounded-full blur-2xl group-hover:bg-[var(--status-green)]/10 transition-colors"></div>
        </div>

        {/* Budget Status Tracker */}
        <div className="surface-card p-5 flex flex-col items-center justify-center relative gap-2 group overflow-hidden">
          <div className="flex justify-between items-center w-full z-10 mb-2">
            <span className="text-sm text-[var(--text-muted)] font-medium">Total Monthly Budget</span>
            <div className="p-2 rounded-lg bg-[var(--accent-violet)]/10 text-[var(--accent-violet)]">
              <PieChart size={18} />
            </div>
          </div>
          <div className="relative w-24 h-24 flex items-center justify-center z-10 mt-2">
            <svg className="absolute w-full h-full transform -rotate-90">
              <circle cx="48" cy="48" r="40" stroke="var(--bg-surface-lit)" strokeWidth="8" fill="none" />
              <circle 
                cx="48" cy="48" r="40" 
                stroke={budgetPercentage > 90 ? 'var(--status-red)' : budgetPercentage > 70 ? 'var(--status-yellow)' : 'var(--accent-violet)'} 
                strokeWidth="8" fill="none" 
                strokeDasharray="251.2" 
                strokeDashoffset={251.2 - (251.2 * Math.min(budgetPercentage, 100)) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="flex flex-col items-center text-center">
              <CountUp 
                value={budgetPercentage} 
                formatter={(v) => `${Math.round(v)}%`} 
                className="text-lg font-bold tabular-nums" 
              />
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Used</span>
            </div>
          </div>
          <div className="flex flex-col items-center mt-2 z-10">
            <CountUp 
              value={remainingBudget} 
              formatter={(v) => `₹${Math.round(v).toLocaleString()}`} 
              className="text-lg font-bold tabular-nums" 
            />
            <span className="text-xs text-[var(--text-muted)]">Remaining to spend</span>
          </div>
          <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-[var(--accent-violet)]/5 rounded-full blur-3xl group-hover:bg-[var(--accent-violet)]/10 transition-colors"></div>
        </div>
      </div>
      
      {/* Recent Transactions Preview */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Recent Logs</h2>
          <button 
            onClick={() => navigate('/logs')}
            className="text-sm text-[var(--accent-violet)] font-medium hover:underline cursor-pointer"
          >
            View All
          </button>
        </div>
        <div className="surface-card divide-y divide-[var(--bg-surface-lit)]">
          {cycleTxs.slice(0, 3).map((tx) => (
            <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-[var(--bg-surface-lit)] transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  tx.type === 'Lend' ? 'bg-purple-500/10 text-purple-500' :
                  tx.type === 'Borrow' ? 'bg-pink-500/10 text-pink-500' :
                  tx.category === 'Food & Dining' ? 'bg-orange-500/10 text-orange-500' :
                  tx.category === 'Transport' ? 'bg-blue-500/10 text-blue-500' :
                  tx.category === 'Income' ? 'bg-[var(--status-green)]/10 text-[var(--status-green)]' :
                  'bg-[var(--accent-violet)]/10 text-[var(--accent-violet)]'
                }`}>
                  <Wallet size={20} />
                </div>
                <div>
                  <p className="font-medium text-[var(--text-main)]">{tx.recipient}</p>
                  <p className="text-xs text-[var(--text-muted)]">{tx.category} • {tx.method}</p>
                </div>
              </div>
              <div className={`font-bold tabular-nums ${
                tx.type === 'Income' || tx.type === 'Borrow' ? 'text-[var(--status-green)]' : 
                tx.type === 'Lend' ? 'text-[var(--status-yellow)]' : 'text-[var(--text-main)]'
              }`}>
                {tx.type === 'Income' || tx.type === 'Borrow' ? '+' : ''}₹{tx.amount.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
