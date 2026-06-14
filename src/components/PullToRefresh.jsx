import { useState, useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';

export default function PullToRefresh({ onRefresh, children }) {
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const containerRef = useRef(null);

  const pullDistance = Math.max(0, currentY - startY);
  const maxPull = 80;

  // Calculate visual pull distance (with resistance)
  const visualPull = Math.min(pullDistance * 0.4, maxPull);
  const isPulling = pullDistance > 0 && startY > 0;
  const progress = Math.min(visualPull / maxPull, 1);

  useEffect(() => {
    const handleTouchStart = (e) => {
      if (containerRef.current?.scrollTop === 0) {
        setStartY(e.touches[0].clientY);
        setCurrentY(e.touches[0].clientY);
      }
    };

    const handleTouchMove = (e) => {
      if (startY > 0) {
        setCurrentY(e.touches[0].clientY);
      }
    };

    const handleTouchEnd = async () => {
      if (isPulling && visualPull >= maxPull && !refreshing) {
        setRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setRefreshing(false);
        }
      }
      setStartY(0);
      setCurrentY(0);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('touchstart', handleTouchStart, { passive: true });
      container.addEventListener('touchmove', handleTouchMove, { passive: true });
      container.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      if (container) {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [startY, currentY, isPulling, visualPull, refreshing, onRefresh]);

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto relative h-full w-full">
      {/* Pull to refresh indicator */}
      <div
        className="absolute w-full flex justify-center z-50 pointer-events-none"
        style={{
          top: 0,
          transform: `translateY(${refreshing ? 16 : visualPull - 40}px)`,
          opacity: refreshing ? 1 : progress,
          transition:
            refreshing || startY === 0 ? 'transform 0.3s ease, opacity 0.3s ease' : 'none',
        }}
      >
        <div className="bg-[var(--bg-surface)] p-2 rounded-full shadow-md border border-[var(--bg-surface-lit)]">
          <RefreshCw
            size={20}
            className={`text-[var(--accent-violet)] ${refreshing ? 'animate-spin' : ''}`}
            style={{ transform: !refreshing ? `rotate(${progress * 180}deg)` : undefined }}
          />
        </div>
      </div>

      {/* Content wrapper that shifts down slightly when pulling */}
      <div
        style={{
          transform: `translateY(${refreshing ? 60 : visualPull}px)`,
          transition: refreshing || startY === 0 ? 'transform 0.3s ease' : 'none',
        }}
        className="min-h-full"
      >
        {children}
      </div>
    </div>
  );
}
