import { useState, useEffect } from 'react';
import { CloudOff, RefreshCw, CheckCircle2, Cloud } from 'lucide-react';
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
      syncWithSupabase(false);
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

  const handleIconClick = () => {
    if (navigator.onLine && !isStoreSyncing) {
      syncWithSupabase(true).then(() => {
        setJustSynced(true);
        setTimeout(() => setJustSynced(false), 2000);
      });
    }
  };

  const getTooltipTitle = () => {
    if (!isOnline) return 'Offline mode (saved locally)';
    if (isStoreSyncing) return 'Syncing with cloud...';
    if (justSynced) return 'Synced!';
    if (pendingSyncCount > 0) return `${pendingSyncCount} pending change${pendingSyncCount > 1 ? 's' : ''}`;
    return 'Cloud synced';
  };

  return (
    <button
      onClick={handleIconClick}
      title={getTooltipTitle()}
      aria-label={getTooltipTitle()}
      className="p-2 sm:p-2.5 rounded-xl surface-card hover:bg-[var(--bg-surface-lit)] transition-colors relative flex items-center justify-center text-[var(--text-main)] cursor-pointer shrink-0"
    >
      {!isOnline ? (
        <CloudOff size={16} className="text-[var(--text-muted)] opacity-60" />
      ) : isStoreSyncing ? (
        <RefreshCw size={16} className="animate-spin text-[var(--accent-violet)]" />
      ) : justSynced ? (
        <CheckCircle2 size={16} className="text-[var(--status-green)]" />
      ) : pendingSyncCount > 0 ? (
        <div className="relative flex items-center justify-center">
          <Cloud size={16} className="text-[var(--text-muted)] opacity-70" />
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-amber-500 rounded-full" />
        </div>
      ) : (
        <Cloud size={16} className="text-[var(--text-muted)] opacity-50" />
      )}
    </button>
  );
}
