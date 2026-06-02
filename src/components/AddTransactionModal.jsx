import { useState, useRef, useEffect } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { X, Check } from 'lucide-react';

export default function AddTransactionModal({ isOpen, onClose }) {
  const addTransaction = useFinanceStore(state => state.addTransaction);
  const getUniqueMerchants = useFinanceStore(state => state.getUniqueMerchants);
  
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('Expense');
  const [category, setCategory] = useState('Food & Dining');
  const [recipient, setRecipient] = useState('');
  const [method, setMethod] = useState('UPI');
  const [note, setNote] = useState('');
  
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  const modalRef = useRef();

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setRecipient('');
      setNote('');
      setType('Expense');
      setCategory('Food & Dining');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || !recipient) return;
    
    addTransaction({
      amount: Number(amount),
      type,
      category,
      recipient,
      method,
      note,
      date: new Date().toISOString(),
    });
    
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  const categories = [
    'Food & Dining', 'Transport', 'Shopping', 'Entertainment', 'Rent & Utilities', 'Income', 'Miscellaneous', 'Lend / Borrow'
  ];

  const types = ['Expense', 'Income', 'Lend', 'Borrow'];
  
  const merchants = getUniqueMerchants().filter(m => m.toLowerCase().includes(recipient.toLowerCase()) && m !== recipient);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0 bg-black/40 backdrop-blur-md"
      style={{ backdropFilter: 'blur(8px)' }}
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className="bg-[var(--bg-surface)] w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden modal-enter max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        <div className="p-4 flex justify-between items-center border-b border-[var(--bg-surface-lit)] sticky top-0 bg-[var(--bg-surface)] z-20">
          <h2 className="text-lg font-bold">New Transaction</h2>
          <button onClick={onClose} type="button" className="p-2 rounded-full hover:bg-[var(--bg-surface-lit)] text-[var(--text-muted)]">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          {/* Amount Field */}
          <div className="flex flex-col items-center">
            <span className="text-[var(--text-muted)] text-sm mb-2">Amount</span>
            <div className="flex items-center text-4xl font-bold tabular-nums text-[var(--accent-violet)]">
              <span>₹</span>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
                className="w-32 bg-transparent text-center focus:outline-none placeholder-[var(--text-muted)]/30"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Type Switcher */}
          <div className="flex flex-wrap gap-2 bg-[var(--bg-surface-lit)] p-1 rounded-xl">
            {types.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 min-w-[70px] py-2 text-xs font-medium rounded-lg transition-all ${
                  type === t ? 'bg-[var(--bg-surface)] shadow text-[var(--text-main)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Recipient / Merchant */}
          <div className="flex flex-col gap-1.5 relative">
            <label className="text-xs text-[var(--text-muted)] font-medium">Merchant / Source / Person</label>
            <input 
              type="text"
              value={recipient}
              onChange={(e) => {
                setRecipient(e.target.value);
                setShowAutocomplete(true);
              }}
              onFocus={() => setShowAutocomplete(true)}
              onBlur={() => setTimeout(() => setShowAutocomplete(false), 200)}
              placeholder="e.g. Zomato, Salary, Rahul..."
              className="w-full bg-[var(--bg-surface-lit)] border border-transparent focus:border-[var(--accent-violet)] rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors"
            />
            {/* Autocomplete Dropdown */}
            {showAutocomplete && merchants.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-surface)] border border-[var(--bg-surface-lit)] rounded-xl shadow-lg z-30 max-h-40 overflow-y-auto">
                {merchants.map(m => (
                  <div 
                    key={m}
                    className="px-4 py-2 text-sm hover:bg-[var(--bg-surface-lit)] cursor-pointer"
                    onClick={() => {
                      setRecipient(m);
                      setShowAutocomplete(false);
                    }}
                  >
                    {m}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Categories Grid */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-[var(--text-muted)] font-medium">Category</label>
            <div className="flex flex-wrap gap-2">
              {categories.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                    category === c 
                      ? 'bg-[var(--accent-violet)]/10 border-[var(--accent-violet)] text-[var(--accent-violet)]' 
                      : 'bg-transparent border-[var(--bg-surface-lit)] text-[var(--text-muted)] hover:border-[var(--text-muted)]'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          
          {/* Note Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-[var(--text-muted)] font-medium">Note (Optional)</label>
            <textarea 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What did you buy?"
              rows="2"
              className="w-full bg-[var(--bg-surface-lit)] border border-transparent focus:border-[var(--accent-violet)] rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors resize-none"
            />
          </div>

          <button 
            type="submit" 
            className="mt-2 w-full py-3.5 rounded-xl bg-[var(--accent-violet)] text-white font-bold flex justify-center items-center gap-2 shadow-lg shadow-[var(--accent-glow)] active:scale-[0.98] transition-transform"
          >
            <Check size={20} />
            Save Transaction
          </button>
        </form>
      </div>
    </div>
  );
}
