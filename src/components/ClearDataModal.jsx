import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { useFinanceStore, useFilteredTransactions } from '../store/useFinanceStore';
import { db } from '../firebase';
import { collection, query, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { AlertTriangle, Lock, Trash2, X, ArrowRight } from 'lucide-react';
import { subHours, subMonths, parseISO } from 'date-fns';

export default function ClearDataModal({ isOpen, onClose }) {
  const { currentUser } = useAuth();
  const transactions = useFilteredTransactions();
  const [clearType, setClearType] = useState('24h'); // '24h', 'month', 'all'
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [step, setStep] = useState(1);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOpen) return null;

  const handleReauthenticate = async () => {
    setError('');
    if (!password) {
      setError('Please enter your password.');
      return;
    }
    
    try {
      const credential = EmailAuthProvider.credential(currentUser.email, password);
      await reauthenticateWithCredential(currentUser, credential);
      setStep(2);
    } catch (err) {
      setError('Incorrect password. Please try again.');
    }
  };

  const handleClearData = async () => {
    setIsDeleting(true);
    try {
      const txsRef = collection(db, 'users', currentUser.uid, 'transactions');
      let txsToDelete = [];
      const now = new Date();

      if (clearType === 'all') {
        const q = query(txsRef);
        const snapshot = await getDocs(q);
        txsToDelete = snapshot.docs;
      } else if (clearType === '24h') {
        const cutoff = subHours(now, 24);
        txsToDelete = transactions.filter(t => parseISO(t.date) >= cutoff).map(t => ({ id: t.id }));
      } else if (clearType === 'month') {
        const cutoff = subMonths(now, 1);
        txsToDelete = transactions.filter(t => parseISO(t.date) >= cutoff).map(t => ({ id: t.id }));
      }

      // Batch delete
      const batch = writeBatch(db);
      txsToDelete.forEach(tx => {
        batch.delete(doc(db, 'users', currentUser.uid, 'transactions', tx.id));
      });
      await batch.commit();

      // We do not delete user settings here, just transactions
      onClose();
    } catch (err) {
      setError('Failed to clear data.');
      console.error(err);
    }
    setIsDeleting(false);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[popIn_200ms_ease-out]">
      <div className="w-full max-w-md bg-[var(--bg-surface)] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        <header className="flex justify-between items-center p-4 border-b border-[var(--bg-surface-lit)]">
          <h2 className="text-lg font-bold flex items-center gap-2 text-[var(--status-red)]">
            <AlertTriangle size={20} /> Danger Zone
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-[var(--bg-surface-lit)] transition-colors">
            <X size={20} />
          </button>
        </header>

        <div className="p-6 flex flex-col gap-6">
          {!isOnline ? (
            <div className="flex flex-col items-center gap-3 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-[var(--status-red)]/10 text-[var(--status-red)] flex items-center justify-center">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold">Offline Mode</h3>
              <p className="text-sm text-[var(--text-muted)]">
                You cannot delete data while offline to prevent synchronization conflicts. Please connect to the internet.
              </p>
              <button onClick={onClose} className="w-full py-3.5 mt-4 rounded-xl bg-[var(--bg-surface-lit)] font-bold active:scale-[0.98]">
                Close
              </button>
            </div>
          ) : step === 1 ? (
            <>
              <p className="text-sm text-[var(--text-muted)]">
                You are about to permanently delete your transaction data. Please select what you want to delete and verify your password to continue.
              </p>

              <div className="flex flex-col gap-3">
                <label className="text-sm font-semibold">What to delete?</label>
                <div className="flex flex-col gap-2">
                  {[
                    { id: '24h', label: 'Previous 24 Hours' },
                    { id: 'month', label: 'Previous 1 Month' },
                    { id: 'all', label: 'All Transactions' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setClearType(opt.id)}
                      className={`w-full p-3.5 rounded-xl border text-left font-medium transition-all ${
                        clearType === opt.id 
                          ? 'bg-[var(--status-red)]/10 border-[var(--status-red)] text-[var(--status-red)]' 
                          : 'bg-[var(--bg-surface-lit)] border-transparent text-[var(--text-main)] hover:border-[var(--text-muted)]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
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
                onClick={handleReauthenticate}
                className="w-full py-3.5 mt-2 rounded-xl bg-[var(--status-red)] text-white font-bold flex justify-center items-center gap-2 shadow-lg shadow-[var(--status-red)]/20 active:scale-[0.98] transition-transform"
              >
                Verify & Continue <ArrowRight size={18} />
              </button>
            </>
          ) : (
            <>
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-16 h-16 rounded-full bg-[var(--status-red)]/10 text-[var(--status-red)] flex items-center justify-center">
                  <Trash2 size={32} />
                </div>
                <h3 className="text-xl font-bold">Are you absolutely sure?</h3>
                <p className="text-sm text-[var(--text-muted)]">
                  This action cannot be undone. All selected transactions will be permanently deleted from our servers.
                </p>
              </div>
              
              <div className="flex gap-3 mt-4">
                <button 
                  onClick={onClose}
                  className="flex-1 py-3.5 rounded-xl bg-[var(--bg-surface-lit)] font-bold active:scale-[0.98] transition-transform"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleClearData}
                  disabled={isDeleting}
                  className="flex-1 py-3.5 rounded-xl bg-[var(--status-red)] text-white font-bold flex justify-center items-center shadow-lg shadow-[var(--status-red)]/20 active:scale-[0.98] transition-transform disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>,
    document.body
  );
}
