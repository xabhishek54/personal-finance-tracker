import { useState, useEffect } from 'react';
import { Lock, Fingerprint, Delete } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';
import { Capacitor } from '@capacitor/core';
import { auth } from '../../firebase';
import { signOut, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import PinSetupModal from './PinSetupModal';

export default function PinLoginScreen() {
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState(false);
  const { verifyPin, setIsPinVerified } = useAuth();
  const isBiometricEnabled = localStorage.getItem('finance_biometric_enabled') === 'true';

  const [isForgotPin, setIsForgotPin] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSetupOpen, setIsSetupOpen] = useState(false);

  const handleKeyPress = (num) => {
    if (pinInput.length < 4) {
      const newPin = pinInput + num;
      setPinInput(newPin);
      setError(false);

      if (newPin.length === 4) {
        // Auto-verify when 4 digits are entered
        const isValid = verifyPin(newPin);
        if (!isValid) {
          setError(true);
          setTimeout(() => setPinInput(''), 400); // Clear after a brief error display
        }
      }
    }
  };

  const handleDelete = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setError(false);
  };

  const handleBiometricAuth = async () => {
    try {
      const result = await NativeBiometric.verifyIdentity({
        reason: 'For easy login',
        title: 'Unlock Finance Tracker',
        subtitle: 'Use your biometric to unlock',
      });
      if (result.verified) {
        setIsPinVerified(true);
      }
    } catch (err) {
      console.log('Biometric failed or cancelled', err);
    }
  };

  useEffect(() => {
    if (isBiometricEnabled && Capacitor.isNativePlatform()) {
      handleBiometricAuth();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isForgotPin || isSetupOpen) return;
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
  }, [pinInput, error, isForgotPin, isSetupOpen]);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleReauth = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!auth.currentUser?.email) return;
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, password);
      await reauthenticateWithCredential(auth.currentUser, credential);
      setIsForgotPin(false);
      setPassword('');
      setIsSetupOpen(true);
    } catch (err) {
      setAuthError('Incorrect password. Please try again.');
    }
  };

  if (isForgotPin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-space)] p-4 flex-col">
        <div className="surface-card w-full max-w-sm p-6 flex flex-col items-center">
          <div className="w-12 h-12 bg-[var(--accent-violet)]/10 text-[var(--accent-violet)] rounded-full flex items-center justify-center mb-4">
            <Lock size={24} />
          </div>
          <h2 className="text-xl font-bold mb-2">Reset PIN</h2>
          <p className="text-[var(--text-muted)] text-sm text-center mb-6">
            Enter your account password to verify your identity before changing your PIN.
          </p>

          <form onSubmit={handleReauth} className="w-full flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 rounded-xl bg-[var(--bg-surface-lit)] outline-none focus:ring-2 focus:ring-[var(--accent-violet)]"
                placeholder="Enter password"
                required
              />
              {authError && <p className="text-[var(--status-red)] text-xs mt-1">{authError}</p>}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[var(--accent-violet)] text-white font-bold rounded-xl active:scale-[0.98] transition-transform"
            >
              Verify Password
            </button>
            <button
              type="button"
              onClick={() => {
                setIsForgotPin(false);
                setPassword('');
                setAuthError('');
              }}
              className="w-full py-2 text-[var(--text-muted)] hover:text-[var(--text-main)] font-semibold transition-colors"
            >
              Cancel
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-space)] p-4 flex-col">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-[var(--accent-violet)] rounded-full mx-auto flex items-center justify-center mb-4 shadow-lg shadow-[var(--accent-glow)]">
          <Lock className="text-white" size={32} />
        </div>
        <h1 className="text-2xl font-bold text-[var(--text-main)]">Enter PIN</h1>
        <p className="text-[var(--text-muted)] text-sm mt-2">Unlock your dashboard</p>
      </div>

      <div className="flex gap-4 justify-center mb-10">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={`w-4 h-4 rounded-full transition-all duration-200 ${
              pinInput.length > index
                ? 'bg-[var(--accent-violet)] scale-110'
                : 'bg-[var(--bg-surface-lit)]'
            } ${error ? 'bg-[var(--status-red)] animate-ping' : ''}`}
          />
        ))}
      </div>

      {error && (
        <p className="text-[var(--status-red)] text-sm font-medium mb-4 -mt-4 animate-pulse">
          Incorrect PIN
        </p>
      )}

      <div className="grid grid-cols-3 gap-6 max-w-[280px] w-full">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleKeyPress(num.toString())}
            className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-[var(--text-main)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-lit)] shadow-sm active:scale-95 transition-all mx-auto"
          >
            {num}
          </button>
        ))}

        <div className="flex items-center justify-center">
          {isBiometricEnabled && Capacitor.isNativePlatform() && (
            <button
              onClick={handleBiometricAuth}
              className="w-16 h-16 rounded-full flex items-center justify-center text-[var(--accent-violet)] hover:bg-[var(--bg-surface-lit)] active:scale-95 transition-all mx-auto"
            >
              <Fingerprint size={28} />
            </button>
          )}
        </div>

        <button
          onClick={() => handleKeyPress('0')}
          className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-[var(--text-main)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-lit)] shadow-sm active:scale-95 transition-all mx-auto"
        >
          0
        </button>

        <div className="flex items-center justify-center">
          <button
            onClick={handleDelete}
            className="w-16 h-16 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-surface-lit)] hover:text-[var(--status-red)] active:scale-95 transition-all mx-auto"
          >
            <Delete size={24} />
          </button>
        </div>
      </div>

      <div className="mt-12 flex flex-col items-center gap-4">
        <button
          onClick={() => setIsForgotPin(true)}
          className="text-sm font-bold text-[var(--text-muted)] hover:text-[var(--accent-violet)] transition-colors"
        >
          Forgot PIN?
        </button>
        <button
          onClick={handleLogout}
          className="text-sm text-[var(--text-muted)] hover:text-[var(--status-red)] transition-colors"
        >
          Log out instead
        </button>
      </div>

      <PinSetupModal isOpen={isSetupOpen} onClose={() => setIsSetupOpen(false)} />
    </div>
  );
}
