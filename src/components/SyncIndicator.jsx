import { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

export default function SyncIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setIsSyncing(true);
      // Firebase handles sync automatically when online. We just show a brief "Syncing..." message.
      setTimeout(() => setIsSyncing(false), 2500);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setIsSyncing(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !isSyncing) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center justify-center animate-[popIn_300ms_ease-out]">
      <div
        className={`px-4 py-2 rounded-full shadow-lg text-xs font-bold flex items-center gap-2 backdrop-blur-md transition-colors ${
          !isOnline
            ? 'bg-[var(--status-red)]/90 text-white'
            : 'bg-[var(--accent-violet)]/90 text-white'
        }`}
      >
        {!isOnline ? (
          <>
            <WifiOff size={14} />
            <span>Offline - Saved Locally</span>
          </>
        ) : (
          <>
            <RefreshCw size={14} className="animate-spin" />
            <span>Syncing...</span>
          </>
        )}
      </div>
    </div>
  );
}
