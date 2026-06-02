import { useState, useRef } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { X, Save } from 'lucide-react';

export default function BudgetSettingsModal({ isOpen, onClose }) {
  const budgets = useFinanceStore(state => state.budgets);
  const updateBudget = useFinanceStore(state => state.updateBudget);
  
  const [localBudgets, setLocalBudgets] = useState(
    Object.keys(budgets).reduce((acc, cat) => {
      acc[cat] = budgets[cat].limit;
      return acc;
    }, {})
  );

  const modalRef = useRef();

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  const handleSave = () => {
    Object.entries(localBudgets).forEach(([category, limit]) => {
      updateBudget(category, Number(limit));
    });
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className="bg-[var(--bg-surface)] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden modal-enter max-h-[90vh] flex flex-col"
      >
        <div className="p-4 flex justify-between items-center border-b border-[var(--bg-surface-lit)] sticky top-0 bg-[var(--bg-surface)] z-20">
          <h2 className="text-lg font-bold">Edit Budgets</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-[var(--bg-surface-lit)] text-[var(--text-muted)]">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
          <p className="text-sm text-[var(--text-muted)] mb-2">Set your monthly spending limits for each category.</p>
          
          {Object.keys(budgets).map(category => (
            <div key={category} className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--text-main)]">{category}</label>
              <div className="flex items-center bg-[var(--bg-surface-lit)] rounded-xl px-4 py-2 border border-transparent focus-within:border-[var(--accent-violet)] transition-colors">
                <span className="text-[var(--text-muted)] mr-2">₹</span>
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

        <div className="p-4 border-t border-[var(--bg-surface-lit)]">
          <button 
            onClick={handleSave}
            className="w-full py-3.5 rounded-xl bg-[var(--accent-violet)] text-white font-bold flex justify-center items-center gap-2 shadow-lg shadow-[var(--accent-glow)] active:scale-[0.98] transition-transform"
          >
            <Save size={20} />
            Save Budgets
          </button>
        </div>
      </div>
    </div>
  );
}
