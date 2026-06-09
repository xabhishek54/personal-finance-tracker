import { createPortal } from 'react-dom';
import { X, Check, AlertTriangle } from 'lucide-react';

export default function ConfirmModal({ isOpen, title, description, confirmText = 'Confirm', confirmStyle = 'danger', onClose, onConfirm }) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[popIn_200ms_ease-out]">
      <div className="w-full max-w-sm bg-[var(--bg-surface)] rounded-2xl shadow-2xl overflow-hidden flex flex-col text-center items-center p-6 gap-4">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${confirmStyle === 'danger' ? 'bg-[var(--status-red)]/10 text-[var(--status-red)]' : 'bg-[var(--accent-violet)]/10 text-[var(--accent-violet)]'}`}>
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-xl font-bold">{title}</h2>
        {description && <p className="text-sm text-[var(--text-muted)]">{description}</p>}
        
        <div className="flex gap-3 w-full mt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-[var(--bg-surface-lit)] font-bold transition-colors active:scale-95"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => { onConfirm(); onClose(); }}
            className={`flex-1 py-3 rounded-xl text-white font-bold flex justify-center items-center gap-2 shadow-lg active:scale-95 transition-transform ${confirmStyle === 'danger' ? 'bg-[var(--status-red)] shadow-[var(--status-red)]/20' : 'bg-[var(--accent-violet)] shadow-[var(--accent-glow)]'}`}
          >
            <Check size={18} />
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
