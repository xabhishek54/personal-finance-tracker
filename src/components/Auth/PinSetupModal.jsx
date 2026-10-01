import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Lock, CheckCircle2, ShieldOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function PinSetupModal({ isOpen, onClose }) {
  const { setupPin, hasPinSetup, removePin, verifyPin } = useAuth();

  const [step, setStep] = useState(() => (hasPinSetup ? 0 : 1)); // 0: Verify current, 1: Enter new, 2: Confirm new
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [successText, setSuccessText] = useState('');

  // Reset modal state on open/close
  useEffect(() => {
    if (isOpen) {
      setStep(hasPinSetup ? 0 : 1);
      setCurrentPinInput('');
      setNewPin('');
      setConfirmPin('');
      setError('');
      setSuccessText('');
    }
  }, [isOpen, hasPinSetup]);

  const resetState = () => {
    setStep(hasPinSetup ? 0 : 1);
    setCurrentPinInput('');
    setNewPin('');
    setConfirmPin('');
    setError('');
    setSuccessText('');
  };

  const handleKeyPress = (num) => {
    setError('');
    if (step === 0) {
      if (currentPinInput.length < 4) {
        const updated = currentPinInput + num;
        setCurrentPinInput(updated);
        if (updated.length === 4) {
          if (verifyPin(updated)) {
            setTimeout(() => {
              setStep(1);
              setCurrentPinInput('');
              setError('');
            }, 150);
          } else {
            setTimeout(() => {
              setError('Incorrect current PIN. Try again.');
              setCurrentPinInput('');
            }, 150);
          }
        }
      }
    } else if (step === 1) {
      if (newPin.length < 4) {
        const updated = newPin + num;
        setNewPin(updated);
        if (updated.length === 4) {
          setTimeout(() => setStep(2), 150);
        }
      }
    } else if (step === 2) {
      if (confirmPin.length < 4) {
        const updated = confirmPin + num;
        setConfirmPin(updated);
        if (updated.length === 4) {
          if (updated === newPin) {
            setupPin(updated);
            setSuccessText(hasPinSetup ? 'PIN Changed Successfully!' : 'PIN Set Successfully!');
            setTimeout(() => {
              onClose();
              resetState();
            }, 1200);
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
    if (step === 0) {
      setCurrentPinInput((prev) => prev.slice(0, -1));
    } else if (step === 1) {
      setNewPin((prev) => prev.slice(0, -1));
    } else {
      setConfirmPin((prev) => prev.slice(0, -1));
    }
  };

  useEffect(() => {
    if (!isOpen || successText) return;
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
  }, [isOpen, step, currentPinInput, newPin, confirmPin, successText]);

  const handleRemovePin = () => {
    removePin();
    setSuccessText('PIN Protection Disabled');
    setTimeout(() => {
      onClose();
      resetState();
    }, 1200);
  };

  const renderDots = (input) => (
    <div className="flex gap-4 justify-center mb-6">
      {[0, 1, 2, 3].map((index) => (
        <div
          key={index}
          className={`w-4 h-4 rounded-full transition-all duration-200 ${
            input.length > index
              ? 'bg-[var(--accent-violet)] scale-110 shadow-sm'
              : 'bg-[var(--bg-surface-lit)] border border-[var(--bg-surface-lit)]'
          }`}
        />
      ))}
    </div>
  );

  if (!isOpen) return null;

  const currentInput = step === 0 ? currentPinInput : step === 1 ? newPin : confirmPin;

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 pb-20 sm:pb-4 animate-[popIn_200ms_ease-out]">
      <div className="surface-card w-full max-w-sm flex flex-col items-center p-6 relative shadow-2xl rounded-2xl border border-[var(--bg-surface-lit)]">
        <button
          onClick={() => {
            onClose();
            resetState();
          }}
          className="absolute top-4 right-4 p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors rounded-full hover:bg-[var(--bg-surface-lit)]"
        >
          <X size={20} />
        </button>

        {successText ? (
          <div className="flex flex-col items-center py-8 animate-[popIn_200ms_ease-out]">
            <div className="w-16 h-16 bg-[var(--status-green)]/10 text-[var(--status-green)] rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-xl font-bold text-[var(--text-main)]">{successText}</h2>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 bg-[var(--accent-violet)]/10 text-[var(--accent-violet)] rounded-full flex items-center justify-center mb-3">
              <Lock size={24} />
            </div>

            <h2 className="text-lg font-bold text-[var(--text-main)] mb-1">
              {step === 0
                ? 'Enter Current PIN'
                : step === 1
                ? hasPinSetup
                  ? 'Enter New PIN'
                  : 'Create App PIN'
                : 'Confirm New PIN'}
            </h2>
            <p className="text-[var(--text-muted)] text-xs mb-6 text-center">
              {step === 0
                ? 'Verify your current 4-digit PIN to continue'
                : step === 1
                ? 'Enter a 4-digit PIN code'
                : 'Re-enter your new PIN to confirm'}
            </p>

            {error && (
              <p className="text-[var(--status-red)] text-xs font-semibold mb-4 -mt-2 animate-pulse text-center">
                {error}
              </p>
            )}

            {renderDots(currentInput)}

            <div className="grid grid-cols-3 gap-3 max-w-[240px] w-full">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeyPress(num.toString())}
                  className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-[var(--text-main)] bg-[var(--bg-surface-lit)]/60 hover:bg-[var(--bg-surface-lit)] active:scale-95 transition-all mx-auto shadow-sm"
                >
                  {num}
                </button>
              ))}
              <div />
              <button
                type="button"
                onClick={() => handleKeyPress('0')}
                className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-[var(--text-main)] bg-[var(--bg-surface-lit)]/60 hover:bg-[var(--bg-surface-lit)] active:scale-95 transition-all mx-auto shadow-sm"
              >
                0
              </button>
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="w-14 h-14 rounded-full flex items-center justify-center text-xs font-extrabold text-[var(--text-muted)] hover:bg-[var(--bg-surface-lit)] hover:text-[var(--status-red)] active:scale-95 transition-all mx-auto"
                >
                  DEL
                </button>
              </div>
            </div>

            {hasPinSetup && (
              <button
                type="button"
                onClick={handleRemovePin}
                className="mt-6 text-xs font-bold text-[var(--status-red)] hover:underline flex items-center gap-1 py-1"
              >
                <ShieldOff size={14} />
                <span>Disable PIN Protection</span>
              </button>
            )}
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
