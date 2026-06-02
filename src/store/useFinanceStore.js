import { create } from 'zustand';
import { subMonths, isSameMonth, parseISO } from 'date-fns';
import { db, auth } from '../firebase';
import { collection, doc, setDoc, addDoc, onSnapshot, query, where, orderBy, updateDoc, getDoc, deleteDoc } from 'firebase/firestore';

export const useFinanceStore = create((set, get) => ({
  transactions: [],
  budgets: {
    'Food & Dining': { limit: 5000, spent: 0 },
    'Transport': { limit: 2000, spent: 0 },
    'Shopping': { limit: 4000, spent: 0 },
    'Entertainment': { limit: 3000, spent: 0 },
    'Rent & Utilities': { limit: 15000, spent: 0 },
  },
  theme: 'dark',
  includeLendBorrow: false,
  isInitialized: false,
  
  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
  setIncludeLendBorrow: (val) => set({ includeLendBorrow: val }),
  
  // Call this when the user logs in to start real-time sync
  initializeUserSync: (uid) => {
    if (get().isInitialized) return;
    set({ isInitialized: true });

    // Sync Budgets & Settings
    const userDocRef = doc(db, 'users', uid);
    const unsubUser = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.budgets) set({ budgets: data.budgets });
        if (data.theme) set({ theme: data.theme });
        if (data.includeLendBorrow !== undefined) set({ includeLendBorrow: data.includeLendBorrow });
      } else {
        // Create initial document
        setDoc(userDocRef, {
          budgets: get().budgets,
          theme: get().theme,
          includeLendBorrow: get().includeLendBorrow
        });
      }
    });

    // Sync Transactions
    const txQuery = query(collection(db, 'users', uid, 'transactions'), orderBy('date', 'desc'));
    const unsubTx = onSnapshot(txQuery, (snapshot) => {
      const txs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      set({ transactions: txs });
      
      // Recalculate budgets spent on the fly
      const newBudgets = JSON.parse(JSON.stringify(get().budgets));
      Object.keys(newBudgets).forEach(k => newBudgets[k].spent = 0);
      txs.forEach(t => {
        if (t.type === 'Expense' && newBudgets[t.category]) {
          newBudgets[t.category].spent += Number(t.amount);
        }
      });
      set({ budgets: newBudgets });
    });

    return () => {
      unsubUser();
      unsubTx();
      set({ isInitialized: false, transactions: [] });
    };
  },
  
  addTransaction: async (tx) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    
    const newTx = { ...tx, settled: false, createdAt: new Date().toISOString() };
    await addDoc(collection(db, 'users', uid, 'transactions'), newTx);
  },

  updateTransaction: async (id, updatedTx) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    await updateDoc(doc(db, 'users', uid, 'transactions', id), updatedTx);
  },

  updateBudget: async (category, limit) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const currentBudgets = get().budgets;
    const newBudgets = {
      ...currentBudgets,
      [category]: {
        ...currentBudgets[category],
        limit
      }
    };
    
    await updateDoc(doc(db, 'users', uid), { budgets: newBudgets });
  },

  deleteTransaction: async (id) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await deleteDoc(doc(db, 'users', uid, 'transactions', id));
  },

  markAsSettled: async (id) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const tx = get().transactions.find(t => t.id === id);
    if (!tx || tx.settled) return;

    // Mark original as settled
    await updateDoc(doc(db, 'users', uid, 'transactions', id), { settled: true });

    // Create counter transaction
    const counterTx = {
      amount: tx.amount,
      type: tx.type === 'Lend' ? 'Income' : 'Expense',
      category: 'Lend / Borrow',
      recipient: `Settlement: ${tx.recipient}`,
      method: tx.method,
      note: `Settled ${tx.type === 'Lend' ? 'Lent' : 'Borrowed'} money`,
      date: new Date().toISOString(),
      settled: true,
      createdAt: new Date().toISOString()
    };
    
    await addDoc(collection(db, 'users', uid, 'transactions'), counterTx);
  },

  getUniqueMerchants: () => {
    const { transactions } = get();
    const merchants = transactions.map(t => t.recipient).filter(Boolean);
    return [...new Set(merchants)];
  },

  getSmartInsights: () => {
    const { transactions, budgets } = get();
    const now = new Date();
    const lastMonth = subMonths(now, 1);

    const thisMonthTx = transactions.filter(t => isSameMonth(parseISO(t.date), now));
    const lastMonthTx = transactions.filter(t => isSameMonth(parseISO(t.date), lastMonth));

    const thisMonthExpense = thisMonthTx.filter(t => t.type === 'Expense').reduce((acc, t) => acc + t.amount, 0);
    const lastMonthExpense = lastMonthTx.filter(t => t.type === 'Expense').reduce((acc, t) => acc + t.amount, 0);

    const insights = [];

    if (lastMonthExpense > 0) {
      const diff = ((thisMonthExpense - lastMonthExpense) / lastMonthExpense) * 100;
      if (diff > 0) {
        insights.push(`You have spent ${diff.toFixed(1)}% more this month compared to last month.`);
      } else {
        insights.push(`Great job! You have spent ${Math.abs(diff).toFixed(1)}% less this month.`);
      }
    }

    const exceededBudgets = Object.entries(budgets).filter(([_, b]) => b.spent >= b.limit * 0.9 && b.limit > 0);
    if (exceededBudgets.length > 0) {
      insights.push(`Watch out! You are near or over your budget limit for: ${exceededBudgets.map(e => e[0]).join(', ')}.`);
    }

    const pendingLent = transactions.filter(t => t.type === 'Lend' && !t.settled).reduce((acc, t) => acc + t.amount, 0);
    if (pendingLent > 0) {
      insights.push(`You have lent ₹${pendingLent.toLocaleString()} that hasn't been returned yet.`);
    }

    if (insights.length === 0) {
      insights.push("Everything looks stable! Keep tracking your transactions.");
    }

    return insights;
  }
}));
