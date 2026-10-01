import { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';

export default function SyncIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const isStoreSyncing = useFinanceStore((state) => state.isSyncing);
  const pendingSyncCount = useFinanceStore((state) => state.pendingSyncCount);
  const syncWithSupabase = useFinanceStore((state) => state.syncWithSupabase);
  const [justSynced, setJustSynced] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncWithSupabase();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleManualSync = () => {
      setIsOnline(navigator.onLine);
      if (navigator.onLine) {
        syncWithSupabase(true).then(() => {
          setJustSynced(true);
          setTimeout(() => setJustSynced(false), 2000);
        });
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('manual-sync', handleManualSync);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('manual-sync', handleManualSync);
    };
  }, [syncWithSupabase]);

  if (isOnline && !isStoreSyncing && !justSynced && pendingSyncCount === 0) return null;

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-[100] flex items-center justify-center animate-[popIn_300ms_ease-out]"
      style={{ top: 'calc(1rem + env(safe-area-inset-top))' }}
    >
      <div
        className={`px-4 py-2 rounded-full shadow-lg text-xs font-bold flex items-center gap-2 backdrop-blur-md transition-colors ${
          !isOnline
            ? 'bg-[var(--status-red)]/90 text-white'
            : isStoreSyncing
              ? 'bg-[var(--accent-violet)]/90 text-white'
              : justSynced
                ? 'bg-emerald-600/90 text-white'
                : 'bg-amber-600/90 text-white'
        }`}
      >
        {!isOnline ? (
          <>
            <WifiOff size={14} />
            <span>Offline - Saved Locally</span>
          </>
        ) : isStoreSyncing ? (
          <>
            <RefreshCw size={14} className="animate-spin" />
            <span>Syncing with Supabase...</span>
          </>
        ) : justSynced ? (
          <>
            <CheckCircle2 size={14} />
            <span>Synced!</span>
          </>
        ) : (
          <>
            <RefreshCw size={14} />
            <span>{pendingSyncCount} pending change{pendingSyncCount > 1 ? 's' : ''}</span>
          </>
        )}
      </div>
    </div>
  );
}
