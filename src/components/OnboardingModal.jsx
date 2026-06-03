import { useState, useEffect } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function OnboardingModal({ isOpen, onClose }) {
  const { setGlobalBudgetOptions } = useFinanceStore();
  const [budgetLimit, setBudgetLimit] = useState(2000);
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      // Ensure defaults are set even if they skip
      setGlobalBudgetOptions(true, 2000);
    }
  }, [isOpen, setGlobalBudgetOptions]);

  const handleFinish = () => {
    setGlobalBudgetOptions(true, Number(budgetLimit));
    onClose();
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isOpen && !isRendered) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? 'bg-black/60 backdrop-blur-sm' : 'bg-transparent pointer-events-none'}`}
      onTransitionEnd={() => !isOpen && setIsRendered(false)}
    >
      <div className={`w-full max-w-md bg-[var(--bg-surface)] rounded-2xl p-6 shadow-2xl transition-all duration-300 transform ${isOpen ? 'scale-100 opacity-100 modal-enter' : 'scale-95 opacity-0'}`}>
        
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 bg-[var(--accent-glow)] text-[var(--accent-violet)] rounded-full flex items-center justify-center mb-2">
            <Sparkles size={32} />
          </div>
          <h2 className="text-2xl font-bold">Welcome aboard!</h2>
          <p className="text-[var(--text-muted)] text-sm">
            Let's get started by setting a monthly budget. A global limit helps you track total spending effortlessly.
          </p>

          <div className="w-full mt-6 flex flex-col gap-2 text-left">
            <label className="text-sm font-semibold">Set Global Monthly Budget (₹)</label>
            <div className="relative">
              <select 
                value={budgetLimit}
                onChange={(e) => setBudgetLimit(Number(e.target.value))}
                className="w-full p-3.5 rounded-xl bg-[var(--bg-surface-lit)] border border-transparent focus:border-[var(--accent-violet)] outline-none appearance-none font-bold"
              >
                <option value={1000}>₹1,000</option>
                <option value={2000}>₹2,000</option>
                <option value={5000}>₹5,000</option>
                <option value={10000}>₹10,000</option>
                <option value={20000}>₹20,000</option>
                <option value={50000}>₹50,000</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)]">
                ▼
              </div>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1">You can change this anytime in Settings.</p>
          </div>

          <div className="w-full flex flex-col gap-3 mt-6">
            <button 
              onClick={handleFinish}
              className="w-full py-3.5 rounded-xl bg-[var(--accent-violet)] text-white font-bold flex justify-center items-center gap-2 shadow-lg shadow-[var(--accent-glow)] active:scale-[0.98] transition-transform"
            >
              Continue <ArrowRight size={18} />
            </button>
            <button 
              onClick={handleSkip}
              className="w-full py-2.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] font-semibold transition-colors"
            >
              Skip for now
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
