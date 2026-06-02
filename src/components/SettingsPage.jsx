import { useFinanceStore } from '../store/useFinanceStore';
import { Save, SlidersHorizontal, Settings2 } from 'lucide-react';
import { useState } from 'react';

export default function SettingsPage() {
  const { budgets, updateBudget, includeLendBorrow, setIncludeLendBorrow } = useFinanceStore();
  
  const [localBudgets, setLocalBudgets] = useState(
    Object.keys(budgets).reduce((acc, cat) => {
      acc[cat] = budgets[cat].limit;
      return acc;
    }, {})
  );

  const [saved, setSaved] = useState(false);

  const handleSaveBudgets = () => {
    Object.entries(localBudgets).forEach(([category, limit]) => {
      updateBudget(category, Number(limit));
    });
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
          
          <div className="flex flex-col gap-3 mt-2">
            {Object.keys(budgets).map(category => (
              <div key={category} className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[var(--text-main)]">{category}</label>
                <div className="flex items-center bg-[var(--bg-surface-lit)] rounded-xl px-4 py-2.5 border border-transparent focus-within:border-[var(--accent-violet)] transition-colors">
                  <span className="text-[var(--text-muted)] mr-2 font-bold">₹</span>
                  <input 
                    type="number" 
                    value={localBudgets[category]}
                    onChange={(e) => setLocalBudgets({ ...localBudgets, [category]: e.target.value })}
                    className="bg-transparent w-full focus:outline-none text-sm tabular-nums font-bold"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
