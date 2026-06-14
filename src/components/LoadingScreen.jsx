import React from 'react';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-[var(--bg-space)] flex flex-col items-center justify-center z-[9999] transition-opacity duration-500">
      <div className="relative w-24 h-24 mb-8">
        {/* Outer glowing ring */}
        <div className="absolute inset-0 border-4 border-[var(--accent-glow)] rounded-full animate-ping"></div>
        {/* Inner spinning gradient ring */}
        <div className="absolute inset-0 border-4 border-transparent border-t-[var(--accent-violet)] border-r-[var(--accent-violet)] rounded-full animate-spin"></div>
        {/* Logo or Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <img src="/favicon.png" alt="Logo" className="w-12 h-12 object-contain animate-pulse" />
        </div>
      </div>
      <h2 className="text-xl font-bold text-[var(--text-main)] tracking-wider animate-pulse">
        Finance Tracker
      </h2>
      <p className="text-sm text-[var(--text-muted)] mt-2">Securely loading your data...</p>
    </div>
  );
}
