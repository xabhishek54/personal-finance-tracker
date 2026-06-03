import { useFinanceStore } from '../store/useFinanceStore';
import { Save, SlidersHorizontal, Settings2 } from 'lucide-react';
import { useState } from 'react';
import ClearDataModal from './ClearDataModal';
import SecurityAuthModal from './SecurityAuthModal';

export default function SettingsPage() {
  const { budgets, updateBudget, includeLendBorrow, setIncludeLendBorrow, useGlobalBudget, globalBudgetLimit, setGlobalBudgetOptions, budgetCycle, setBudgetCycle, requirePasswordForDelete, setRequirePasswordForDelete } = useFinanceStore();
  
  const [localBudgets, setLocalBudgets] = useState(
    Object.keys(budgets).reduce((acc, cat) => {
      acc[cat] = budgets[cat].limit;
      return acc;
    }, {})
  );

  const [localUseGlobal, setLocalUseGlobal] = useState(useGlobalBudget);
  const [localGlobalLimit, setLocalGlobalLimit] = useState(globalBudgetLimit);
  const [saved, setSaved] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [showDisableSecurityAuth, setShowDisableSecurityAuth] = useState(false);

  const handleSecurityToggle = (checked) => {
    if (!checked && requirePasswordForDelete) {
      setShowDisableSecurityAuth(true);
    } else {
      setRequirePasswordForDelete(true);
    }
  };

  const handleSaveBudgets = () => {
    if (localUseGlobal) {
      setGlobalBudgetOptions(localUseGlobal, Number(localGlobalLimit));
    } else {
      setGlobalBudgetOptions(localUseGlobal, Number(localGlobalLimit));
      Object.entries(localBudgets).forEach(([category, limit]) => {
        updateBudget(category, Number(limit));
      });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6 animate-[slideUp_180ms_ease-out] h-full pb-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings2 size={24} /> Settings
        </h1>
        <p className="text-[var(--text-muted)] text-sm">Configure your app preferences and budgets.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* App Preferences */}
        <div className="surface-card p-6 flex flex-col gap-6 h-fit">
          <div className="flex items-center gap-2 border-b border-[var(--bg-surface-lit)] pb-4">
            <SlidersHorizontal size={20} className="text-[var(--accent-violet)]" />
            <h2 className="text-lg font-semibold">General Preferences</h2>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex flex-col max-w-[70%]">
              <span className="font-medium">Include Lend/Borrow in Totals</span>
              <span className="text-xs text-[var(--text-muted)] mt-1">
                If enabled, money lent will be treated as an Expense, and money borrowed as Income in the Dashboard totals.
              </span>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={includeLendBorrow}
                onChange={(e) => setIncludeLendBorrow(e.target.checked)}
              />
              <div className="w-11 h-6 bg-[var(--bg-surface-lit)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent-violet)]"></div>
            </label>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col">
              <span className="font-medium">Budget & Stats Reset Cycle</span>
              <span className="text-xs text-[var(--text-muted)] mt-1">
                How often should your dashboard totals and budgets reset?
              </span>
            </div>
            <select
              value={budgetCycle}
              onChange={(e) => setBudgetCycle(e.target.value)}
              className="w-full p-3 rounded-xl bg-[var(--bg-surface-lit)] border border-transparent focus:border-[var(--accent-violet)] outline-none font-medium"
            >
              <option value="1 month">Every Month</option>
              <option value="2 months">Every 2 Months</option>
              <option value="1 year">Every Year</option>
              <option value="never">Never Reset (All Time)</option>
            </select>
          </div>
        </div>

        {/* Budget Configurations */}
        <div className="surface-card p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[var(--bg-surface-lit)] pb-4">
            <h2 className="text-lg font-semibold">Monthly Allowances</h2>
            <button 
              onClick={handleSaveBudgets}
              className="px-4 py-2 text-sm font-bold bg-[var(--accent-violet)] text-white rounded-xl shadow-lg shadow-[var(--accent-glow)] flex items-center gap-2 transition-transform active:scale-95"
            >
              {saved ? 'Saved!' : 'Save Limits'}
            </button>
          </div>

          <p className="text-xs text-[var(--text-muted)]">Set the maximum amount you want to spend per category each month.</p>
          
          <div className="flex items-center justify-between mt-2 p-3 bg-[var(--bg-surface-lit)] rounded-xl">
            <span className="text-sm font-medium">Use Global Budget limit</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={localUseGlobal}
                onChange={(e) => setLocalUseGlobal(e.target.checked)}
              />
              <div className="w-9 h-5 bg-[var(--bg-surface)] border border-[var(--text-muted)]/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--accent-violet)] peer-checked:border-[var(--accent-violet)]"></div>
            </label>
          </div>

          <div className="flex flex-col gap-3 mt-2">
            {localUseGlobal ? (
              <div className="flex flex-col gap-1.5 animate-[slideUp_150ms_ease-out]">
                <label className="text-sm font-medium text-[var(--text-main)]">Total Monthly Budget</label>
                <div className="flex items-center bg-[var(--bg-surface-lit)] rounded-xl px-4 py-2.5 border border-transparent focus-within:border-[var(--accent-violet)] transition-colors">
                  <span className="text-[var(--text-muted)] mr-2 font-bold">₹</span>
                  <input 
                    type="number" 
                    value={localGlobalLimit}
                    onChange={(e) => setLocalGlobalLimit(e.target.value)}
                    className="bg-transparent w-full focus:outline-none text-sm tabular-nums font-bold"
                  />
                </div>
              </div>
            ) : (
              Object.keys(budgets).map(category => (
                <div key={category} className="flex flex-col gap-1.5 animate-[slideUp_150ms_ease-out]">
                  <label className="text-sm font-medium text-[var(--text-main)]">
                    {category} <span className="text-[10px] text-[var(--text-muted)] font-normal ml-1">(Optional)</span>
                  </label>
                  <div className="flex items-center bg-[var(--bg-surface-lit)] rounded-xl px-4 py-2.5 border border-transparent focus-within:border-[var(--accent-violet)] transition-colors">
                    <span className="text-[var(--text-muted)] mr-2 font-bold">₹</span>
                    <input 
                      type="number" 
                      value={localBudgets[category] || ''}
                      onChange={(e) => setLocalBudgets({ ...localBudgets, [category]: e.target.value })}
                      placeholder="0"
                      className="bg-transparent w-full focus:outline-none text-sm tabular-nums font-bold"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="surface-card p-6 flex flex-col gap-4 lg:col-span-2 border border-[var(--status-red)]/20 bg-gradient-to-br from-[var(--status-red)]/5 to-transparent">
          <div className="flex items-center gap-2 border-b border-[var(--status-red)]/10 pb-4">
            <h2 className="text-lg font-semibold text-[var(--status-red)]">Danger Zone</h2>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-col">
              <span className="font-medium">Require Password on Delete</span>
              <span className="text-xs text-[var(--text-muted)] mt-1">
                If enabled, deleting any transaction will prompt for your password.
              </span>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={requirePasswordForDelete}
                onChange={(e) => handleSecurityToggle(e.target.checked)}
              />
              <div className="w-11 h-6 bg-[var(--bg-surface-lit)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--status-red)]"></div>
            </label>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-[var(--status-red)]/10">
            <div className="flex flex-col">
              <span className="font-medium">Clear Transaction Data</span>
              <span className="text-xs text-[var(--text-muted)] mt-1">
                Permanently delete all or some of your transactions. This requires password verification.
              </span>
            </div>
            <button 
              onClick={() => setIsClearModalOpen(true)}
              className="px-4 py-2 text-sm font-bold bg-[var(--status-red)]/10 text-[var(--status-red)] hover:bg-[var(--status-red)] hover:text-white rounded-xl transition-colors whitespace-nowrap shrink-0"
            >
              Clear Data...
            </button>
          </div>
        </div>

      </div>

      <ClearDataModal isOpen={isClearModalOpen} onClose={() => setIsClearModalOpen(false)} />
      <SecurityAuthModal 
        isOpen={showDisableSecurityAuth} 
        onClose={() => setShowDisableSecurityAuth(false)} 
        onSuccess={() => setRequirePasswordForDelete(false)}
        title="Disable Security Feature"
        message="Please enter your password to disable transaction deletion security."
      />
    </div>
  );
}
