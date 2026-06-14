import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Lock, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function PinSetupModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1); // 1: Enter new PIN, 2: Confirm new PIN
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { setupPin, hasPinSetup, removePin } = useAuth();

  const resetState = () => {
    setStep(1);
    setNewPin('');
    setConfirmPin('');
    setError('');
    setSuccess(false);
  };
  const handleKeyPress = (num) => {
    setError('');
    if (step === 1) {
      if (newPin.length < 4) {
        const updated = newPin + num;
        setNewPin(updated);
        if (updated.length === 4) {
          setTimeout(() => setStep(2), 200);
        }
      }
    } else {
      if (confirmPin.length < 4) {
        const updated = confirmPin + num;
        setConfirmPin(updated);
        if (updated.length === 4) {
          if (updated === newPin) {
            setupPin(updated);
            setSuccess(true);
            setTimeout(() => {
              onClose();
              resetState();
            }, 1500);
          } else {
            setError('PINs do not match. Try again.');
            setConfirmPin('');
            setNewPin('');
            setStep(1);
          }
        }
      }
    }
  };

  const handleDelete = () => {
    setError('');
    if (step === 1) {
      setNewPin((prev) => prev.slice(0, -1));
    } else {
      setConfirmPin((prev) => prev.slice(0, -1));
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (/^[0-9]$/.test(e.key)) {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, step, newPin, confirmPin]);

  const handleRemovePin = () => {
    removePin();
    onClose();
    resetState();
  };

  const renderDots = (input) => (
    <div className="flex gap-4 justify-center mb-8">
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

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-[popIn_200ms_ease-out]">
      <div className="surface-card w-full max-w-sm flex flex-col items-center p-6 relative shadow-2xl">
        <button
          onClick={() => {
            onClose();
            resetState();
          }}
          className="absolute top-4 right-4 p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors rounded-full hover:bg-[var(--bg-surface-lit)]"
        >
          <X size={20} />
        </button>

        {success ? (
          <div className="flex flex-col items-center py-8 animate-[popIn_200ms_ease-out]">
            <div className="w-16 h-16 bg-[var(--status-green)]/10 text-[var(--status-green)] rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-xl font-bold text-[var(--text-main)]">PIN Set Successfully!</h2>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 bg-[var(--accent-violet)]/10 text-[var(--accent-violet)] rounded-full flex items-center justify-center mb-4">
              <Lock size={24} />
            </div>

            <h2 className="text-xl font-bold text-[var(--text-main)] mb-1">
              {step === 1 ? 'Create New PIN' : 'Confirm PIN'}
            </h2>
            <p className="text-[var(--text-muted)] text-sm mb-6 text-center">
              {step === 1 ? 'Enter a 4-digit PIN' : 'Re-enter your PIN to confirm'}
            </p>

            {error && (
              <p className="text-[var(--status-red)] text-sm font-medium mb-4 -mt-2 animate-pulse">
                {error}
              </p>
            )}

            {renderDots(step === 1 ? newPin : confirmPin)}

            <div className="grid grid-cols-3 gap-4 max-w-[240px] w-full">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => handleKeyPress(num.toString())}
                  className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-[var(--text-main)] bg-[var(--bg-space)] hover:bg-[var(--bg-surface-lit)] active:scale-95 transition-all mx-auto"
                >
                  {num}
                </button>
              ))}
              <div /> {/* Empty space for bottom left */}
              <button
                onClick={() => handleKeyPress('0')}
                className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-[var(--text-main)] bg-[var(--bg-space)] hover:bg-[var(--bg-surface-lit)] active:scale-95 transition-all mx-auto"
              >
                0
              </button>
              <div className="flex items-center justify-center">
                <button
                  onClick={handleDelete}
                  className="w-14 h-14 rounded-full flex items-center justify-center text-sm font-bold text-[var(--text-muted)] hover:bg-[var(--bg-surface-lit)] hover:text-[var(--status-red)] active:scale-95 transition-all mx-auto"
                >
                  DEL
                </button>
              </div>
            </div>

            {hasPinSetup && (
              <button
                onClick={handleRemovePin}
                className="mt-8 text-sm font-bold text-[var(--status-red)] hover:underline"
              >
                Remove PIN Protection
              </button>
            )}
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
