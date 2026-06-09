import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { Lock, X } from 'lucide-react';

export default function SecurityAuthModal({ isOpen, onClose, onSuccess, title, message }) {
  const { currentUser } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleVerify = async () => {
    setError('');
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsVerifying(true);
    try {
      const credential = EmailAuthProvider.credential(currentUser.email, password);
      await reauthenticateWithCredential(currentUser, credential);
      await onSuccess();
      onClose();
    } catch (err) {
      setError('Incorrect password. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[popIn_200ms_ease-out]">
      <div className="w-full max-w-md bg-[var(--bg-surface)] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <header className="flex justify-between items-center p-4 border-b border-[var(--bg-surface-lit)]">
          <h2 className="text-lg font-bold flex items-center gap-2 text-[var(--status-red)]">
            <Lock size={20} /> Security Check
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[var(--bg-surface-lit)] transition-colors"
          >
            <X size={20} />
          </button>
        </header>

        <div className="p-6 flex flex-col gap-6">
          <div className="text-center">
            <h3 className="text-xl font-bold mb-2">{title || 'Verify Identity'}</h3>
            <p className="text-sm text-[var(--text-muted)]">
              {message || 'Please verify your password to continue.'}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-sm font-semibold">Verify Password</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                <Lock size={18} />
              </div>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-[var(--bg-surface-lit)] border border-transparent focus:border-[var(--status-red)] outline-none transition-colors font-medium"
              />
            </div>
            {error && <p className="text-xs text-[var(--status-red)]">{error}</p>}
          </div>

          <button
            onClick={handleVerify}
            disabled={isVerifying}
            className="w-full py-3.5 mt-2 rounded-xl bg-[var(--status-red)] text-white font-bold flex justify-center items-center gap-2 shadow-lg shadow-[var(--status-red)]/20 active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {isVerifying ? 'Verifying...' : 'Verify & Continue'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
