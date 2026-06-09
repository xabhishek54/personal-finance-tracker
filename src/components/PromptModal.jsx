import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Check } from 'lucide-react';

export default function PromptModal({ isOpen, title, description, initialValue, placeholder, onClose, onSubmit }) {
  const [value, setValue] = useState(initialValue || '');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setValue(initialValue || '');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit(value.trim());
      onClose();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[popIn_200ms_ease-out]">
      <div className="w-full max-w-sm bg-[var(--bg-surface)] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-[var(--bg-surface-lit)] flex justify-between items-center">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} type="button" className="p-2 rounded-full hover:bg-[var(--bg-surface-lit)] text-[var(--text-muted)] transition-colors">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {description && <p className="text-sm text-[var(--text-muted)]">{description}</p>}
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-[var(--bg-surface-lit)] border border-transparent focus:border-[var(--accent-violet)] rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors"
          />
          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-transparent font-bold text-[var(--text-muted)] hover:bg-[var(--bg-surface-lit)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!value.trim()}
              className="flex-1 py-3 rounded-xl bg-[var(--accent-violet)] text-white font-bold disabled:opacity-50 flex justify-center items-center gap-2 shadow-lg shadow-[var(--accent-glow)] active:scale-95 transition-transform"
            >
              <Check size={18} />
              Save
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
