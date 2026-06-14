import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFinanceStore } from '../store/useFinanceStore';
import { Sparkles, ArrowRight, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function OnboardingModal({ isOpen, onClose }) {
  const { setGlobalBudgetOptions } = useFinanceStore();
  const { setupPin } = useAuth();

  const [step, setStep] = useState(1); // 1: Budget, 2: PIN Setup, 3: Confirm PIN
  const [budgetLimit, setBudgetLimit] = useState(2000);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [isRendered, setIsRendered] = useState(false);

  const handleFinishAll = () => {
    onClose();
    setTimeout(() => {
      setStep(1);
      setNewPin('');
      setConfirmPin('');
    }, 300);
  };

  const handlePinKeyPress = (num) => {
    setPinError('');
    if (step === 2) {
      if (newPin.length < 4) {
        const updated = newPin + num;
        setNewPin(updated);
        if (updated.length === 4) {
          setTimeout(() => setStep(3), 200);
        }
      }
    } else if (step === 3) {
      if (confirmPin.length < 4) {
        const updated = confirmPin + num;
        setConfirmPin(updated);
        if (updated.length === 4) {
          if (updated === newPin) {
            setupPin(updated);
            handleFinishAll();
          } else {
            setPinError('PINs do not match. Try again.');
            setConfirmPin('');
            setNewPin('');
            setStep(2);
          }
        }
      }
    }
  };

  const handlePinDelete = () => {
    setPinError('');
    if (step === 2) {
      setNewPin((prev) => prev.slice(0, -1));
    } else if (step === 3) {
      setConfirmPin((prev) => prev.slice(0, -1));
    }
  };

  useEffect(() => {
    if (isOpen && !isRendered) {
      setIsRendered(true);
      // Ensure defaults are set even if they skip
      setGlobalBudgetOptions(true, 2000);
    }
  }, [isOpen, isRendered, setGlobalBudgetOptions]);

  useEffect(() => {
    if (!isOpen || step === 1) return;
    const handleKeyDown = (e) => {
      if (/^[0-9]$/.test(e.key)) {
        handlePinKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handlePinDelete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, step, newPin, confirmPin]);

  const handleFinishBudget = () => {
    setGlobalBudgetOptions(true, Number(budgetLimit));
    setStep(2);
  };

  const handleSkipBudget = () => {
    setStep(2);
  };

  const renderDots = (input) => (
    <div className="flex gap-4 justify-center mb-6">
      {[0, 1, 2, 3].map((index) => (
        <div
          key={index}
          className={`w-4 h-4 rounded-full transition-all duration-200 ${
            input.length > index
              ? 'bg-[var(--accent-violet)] scale-110'
              : 'bg-[var(--bg-surface-lit)]'
          }`}
        />
      ))}
    </div>
  );

  if (!isOpen && !isRendered) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? 'bg-black/60 backdrop-blur-sm' : 'bg-transparent pointer-events-none'}`}
      onTransitionEnd={() => !isOpen && setIsRendered(false)}
    >
      <div
        className={`w-full max-w-md bg-[var(--bg-surface)] rounded-2xl p-6 shadow-2xl transition-all duration-300 transform ${isOpen ? 'scale-100 opacity-100 modal-enter' : 'scale-95 opacity-0'}`}
      >
        {step === 1 ? (
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 bg-[var(--accent-glow)] text-[var(--accent-violet)] rounded-full flex items-center justify-center mb-2">
              <Sparkles size={32} />
            </div>
            <h2 className="text-2xl font-bold">Welcome aboard!</h2>
            <p className="text-[var(--text-muted)] text-sm">
              Let's get started by setting a monthly budget. A global limit helps you track total
              spending effortlessly.
            </p>

            <div className="w-full mt-6 flex flex-col gap-2 text-left">
              <label className="text-sm font-semibold">Set Global Monthly Budget (₹)</label>
              <div className="flex items-center bg-[var(--bg-surface-lit)] rounded-xl px-4 py-3.5 border border-transparent focus-within:border-[var(--accent-violet)] transition-colors">
                <span className="text-[var(--text-muted)] mr-2 font-bold">₹</span>
                <input
                  type="number"
                  value={budgetLimit || ''}
                  onChange={(e) => setBudgetLimit(e.target.value)}
                  placeholder="2000"
                  className="bg-transparent w-full focus:outline-none text-base tabular-nums font-bold text-[var(--text-main)]"
                />
              </div>
            </div>

            <div className="w-full flex flex-col gap-3 mt-6">
              <button
                onClick={handleFinishBudget}
                className="w-full py-3.5 rounded-xl bg-[var(--accent-violet)] text-white font-bold flex justify-center items-center gap-2 shadow-lg shadow-[var(--accent-glow)] active:scale-[0.98] transition-transform"
              >
                Continue <ArrowRight size={18} />
              </button>
              <button
                onClick={handleSkipBudget}
                className="w-full py-2.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] font-semibold transition-colors"
              >
                Skip for now
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center gap-4 animate-[popIn_200ms_ease-out]">
            <div className="w-16 h-16 bg-[var(--accent-violet)]/10 text-[var(--accent-violet)] rounded-full flex items-center justify-center mb-2">
              <Lock size={32} />
            </div>
            <h2 className="text-2xl font-bold">Setup PIN Protection</h2>
            <p className="text-[var(--text-muted)] text-sm mb-4">
              {step === 2 ? 'Enter a 4-digit PIN for your app.' : 'Re-enter your PIN to confirm.'}
            </p>

            {pinError && (
              <p className="text-[var(--status-red)] text-sm font-medium mb-2 -mt-2 animate-pulse">
                {pinError}
              </p>
            )}

            {renderDots(step === 2 ? newPin : confirmPin)}

            <div className="grid grid-cols-3 gap-4 max-w-[240px] w-full mb-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => handlePinKeyPress(num.toString())}
                  className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-[var(--text-main)] bg-[var(--bg-space)] hover:bg-[var(--bg-surface-lit)] active:scale-95 transition-all mx-auto"
                >
                  {num}
                </button>
              ))}
              <div />
              <button
                onClick={() => handlePinKeyPress('0')}
                className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-[var(--text-main)] bg-[var(--bg-space)] hover:bg-[var(--bg-surface-lit)] active:scale-95 transition-all mx-auto"
              >
                0
              </button>
              <div className="flex items-center justify-center">
                <button
                  onClick={handlePinDelete}
                  className="w-14 h-14 rounded-full flex items-center justify-center text-sm font-bold text-[var(--text-muted)] hover:bg-[var(--bg-surface-lit)] hover:text-[var(--status-red)] active:scale-95 transition-all mx-auto"
                >
                  DEL
                </button>
              </div>
            </div>

            <button
              onClick={handleFinishAll}
              className="w-full py-2.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] font-semibold transition-colors"
            >
              Skip PIN setup
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
