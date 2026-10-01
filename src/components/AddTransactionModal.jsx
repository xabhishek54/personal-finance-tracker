import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFinanceStore } from '../store/useFinanceStore';
import { X, Check, Calendar } from 'lucide-react';
import { getCategoriesForType } from '../utils/categories';

export default function AddTransactionModal({ isOpen, onClose }) {
  const addTransaction = useFinanceStore((state) => state.addTransaction);
  const getUniqueMerchants = useFinanceStore((state) => state.getUniqueMerchants);

  const [amount, setAmount] = useState('');
  const [type, setType] = useState('Expense');
  const [category, setCategory] = useState('Food & Dining');
  const [recipient, setRecipient] = useState('');
  const [method, setMethod] = useState('UPI');
  const [note, setNote] = useState('');
  const [date, setDate] = useState('');

  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const modalRef = useRef();

  const categories = getCategoriesForType(type);

  // Update default category when type changes
  useEffect(() => {
    const available = getCategoriesForType(type);
    if (!available.includes(category)) {
      setCategory(available[0] || 'Miscellaneous');
    }
  }, [type]);

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setRecipient('');
      setNote('');
      setType('Expense');
      setCategory('Food & Dining');
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      setDate(now.toISOString().slice(0, 16));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    addTransaction({
      amount: Number(amount),
      type,
      category,
      recipient: recipient.trim() || category,
      method,
      note,
      date: date ? new Date(date).toISOString() : new Date().toISOString(),
    });

    onClose();
  };

  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  const types = ['Expense', 'Income', 'Lend', 'Borrow'];

  const getRecipientLabel = () => {
    switch (type) {
      case 'Income':
        return 'Received from / Source';
      case 'Lend':
        return 'Lent to (Person / Entity)';
      case 'Borrow':
        return 'Borrowed from (Person / Entity)';
      case 'Expense':
      default:
        return 'Paid to / Merchant';
    }
  };

  const getTypeStyle = (t) => {
    if (type !== t) {
      return 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-lit)]';
    }
    switch (t) {
      case 'Expense':
        return 'bg-[var(--status-red)] text-white shadow-sm font-bold';
      case 'Income':
        return 'bg-[var(--status-green)] text-white shadow-sm font-bold';
      case 'Lend':
        return 'bg-indigo-600 text-white shadow-sm font-bold';
      case 'Borrow':
        return 'bg-purple-600 text-white shadow-sm font-bold';
      default:
        return 'bg-[var(--accent-violet)] text-white shadow-sm font-bold';
    }
  };

  const merchants = getUniqueMerchants().filter(
    (m) => m.toLowerCase().includes(recipient.toLowerCase()) && m !== recipient
  );

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-md"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-[var(--bg-surface)] w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden modal-enter flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="p-4 px-6 flex justify-between items-center border-b border-[var(--bg-surface-lit)] shrink-0 bg-[var(--bg-surface)] z-20">
          <h2 className="text-lg font-bold text-[var(--text-main)]">Add Transaction</h2>
          <button
            onClick={onClose}
            type="button"
            aria-label="Close"
            className="p-2 rounded-xl hover:bg-[var(--bg-surface-lit)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <div className="overflow-y-auto p-6 flex flex-col gap-5">
          <form id="add-tx-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Amount Input */}
            <div className="flex flex-col items-center py-2">
              <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                Amount
              </span>
              <div className="flex items-center text-4xl sm:text-5xl font-extrabold tabular-nums text-[var(--text-main)]">
                <span className="text-[var(--text-muted)] mr-1">₹</span>
                <input
                  type="number"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  autoFocus
                  required
                  className="w-44 bg-transparent text-center focus:outline-none placeholder-[var(--text-muted)]/30 font-extrabold tabular-nums"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Color-Coded Type Switcher */}
            <div className="flex gap-1.5 bg-[var(--bg-surface-lit)] p-1 rounded-2xl">
              {types.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all ${getTypeStyle(t)}`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Recipient / Merchant Field */}
            <div className="flex flex-col gap-1.5 relative">
              <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                {getRecipientLabel()}
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => {
                  setRecipient(e.target.value);
                  setShowAutocomplete(true);
                }}
                onFocus={() => setShowAutocomplete(true)}
                onBlur={() => setTimeout(() => setShowAutocomplete(false), 200)}
                placeholder="e.g. Swiggy, Salary, Alex..."
                className="w-full bg-[var(--bg-surface-lit)] border border-transparent focus:border-[var(--accent-violet)] rounded-xl px-4 py-3 text-sm text-[var(--text-main)] focus:outline-none transition-colors"
              />

              {/* Autocomplete Suggestions */}
              {showAutocomplete && merchants.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1 mt-1">
                  {merchants.map((m) => (
                    <button
                      key={m}
                      type="button"
                      className="whitespace-nowrap px-3 py-1.5 text-xs font-medium bg-[var(--bg-surface-lit)] hover:bg-[var(--accent-violet)] hover:text-white rounded-lg transition-colors border border-[var(--bg-surface-lit)]"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setRecipient(m);
                        setShowAutocomplete(false);
                      }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Category Chips */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Category
              </label>
              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1 bg-[var(--bg-surface-lit)]/30 rounded-xl border border-[var(--bg-surface-lit)]">
                {categories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      category === c
                        ? 'bg-[var(--accent-violet)] text-white shadow-sm font-semibold'
                        : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--bg-surface-lit)]'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Date & Time Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={13} />
                Date & Time
              </label>
              <input
                type="datetime-local"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[var(--bg-surface-lit)] border border-transparent focus:border-[var(--accent-violet)] rounded-xl px-4 py-3 text-xs text-[var(--text-main)] focus:outline-none transition-colors dark:[color-scheme:dark]"
              />
            </div>

            {/* Payment Method */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Payment Method
              </label>
              <div className="flex gap-2">
                {['UPI', 'Card', 'Cash', 'Net Banking'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMethod(m)}
                    className={`flex-1 py-2 text-xs font-medium rounded-xl border transition-all ${
                      method === m
                        ? 'border-[var(--accent-violet)] bg-[var(--accent-violet)]/10 text-[var(--accent-violet)] font-bold'
                        : 'border-[var(--bg-surface-lit)] bg-[var(--bg-surface-lit)]/40 text-[var(--text-muted)]'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Note Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Note (Optional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add details or context..."
                rows="2"
                className="w-full bg-[var(--bg-surface-lit)] border border-transparent focus:border-[var(--accent-violet)] rounded-xl px-4 py-3 text-sm text-[var(--text-main)] focus:outline-none transition-colors resize-none"
              />
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 border-t border-[var(--bg-surface-lit)] bg-[var(--bg-surface)] shrink-0">
          <button
            form="add-tx-form"
            type="submit"
            className="w-full py-3.5 rounded-xl bg-[var(--accent-violet)] text-white font-bold flex justify-center items-center gap-2 shadow-lg shadow-[var(--accent-glow)] hover:opacity-95 active:scale-[0.98] transition-all text-sm"
          >
            <Check size={18} />
            <span>Save Transaction</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
