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
  useGlobalBudget: false,
  globalBudgetLimit: 50000,
  budgetCycle: '1 month', // options: '1 month', '2 months', '1 year', 'never'
  theme: 'dark', // 'dark' or 'light'
  includeLendBorrow: false, // if true, lends count as expenses, borrows count as income
  hasCompletedOnboarding: true,
  hasUnreadNotifications: true,
  requirePasswordForDelete: false,
  isDeleteModeUnlocked: false,
  isInitialized: false,
  
  completeOnboarding: async () => {
    set({ hasCompletedOnboarding: true });
    const uid = auth.currentUser?.uid;
    if (uid) {
      await updateDoc(doc(db, 'users', uid), { hasCompletedOnboarding: true });
    }
  },

  toggleTheme: () => {
    const newTheme = get().theme === 'dark' ? 'light' : 'dark';
    set({ theme: newTheme });
    const uid = auth.currentUser?.uid;
    if (uid) {
      updateDoc(doc(db, 'users', uid), { theme: newTheme });
    }
  },
  setIncludeLendBorrow: (val) => {
    set({ includeLendBorrow: val });
    const uid = auth.currentUser?.uid;
    if (uid) {
      updateDoc(doc(db, 'users', uid), { includeLendBorrow: val });
    }
  },
  setBudgetCycle: async (cycle) => {
    set({ budgetCycle: cycle });
    const uid = auth.currentUser?.uid;
    if (uid) {
      await updateDoc(doc(db, 'users', uid), { budgetCycle: cycle });
    }
  },
  setGlobalBudgetOptions: async (useGlobal, limit) => {
    set({ useGlobalBudget: useGlobal, globalBudgetLimit: limit });
    const uid = auth.currentUser?.uid;
    if (uid) {
      await updateDoc(doc(db, 'users', uid), { 
        useGlobalBudget: useGlobal, 
        globalBudgetLimit: limit 
      });
    }
  },
  
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
        if (data.useGlobalBudget !== undefined) set({ useGlobalBudget: data.useGlobalBudget });
        if (data.globalBudgetLimit !== undefined) set({ globalBudgetLimit: data.globalBudgetLimit });
        if (data.budgetCycle !== undefined) set({ budgetCycle: data.budgetCycle });
        if (data.hasUnreadNotifications !== undefined) set({ hasUnreadNotifications: data.hasUnreadNotifications });
        if (data.requirePasswordForDelete !== undefined) set({ requirePasswordForDelete: data.requirePasswordForDelete });
        // If data exists but hasCompletedOnboarding is missing (legacy user), assume true.
        if (data.hasCompletedOnboarding !== undefined) {
          set({ hasCompletedOnboarding: data.hasCompletedOnboarding });
        } else {
          set({ hasCompletedOnboarding: true });
        }
      } else {
        // Create initial document for brand new user
        set({ hasCompletedOnboarding: false, hasUnreadNotifications: true, requirePasswordForDelete: false });
        setDoc(userDocRef, {
          budgets: get().budgets,
          theme: get().theme,
          includeLendBorrow: get().includeLendBorrow,
          useGlobalBudget: get().useGlobalBudget,
          globalBudgetLimit: get().globalBudgetLimit,
          budgetCycle: get().budgetCycle,
          hasCompletedOnboarding: false,
          hasUnreadNotifications: true,
          requirePasswordForDelete: false
        });
      }
    });

    // Sync Transactions
    const txQuery = query(collection(db, 'users', uid, 'transactions'), orderBy('date', 'desc'));
    const unsubTx = onSnapshot(txQuery, (snapshot) => {
      const txs = snapshot.docs.map(d => ({ id: d.id, ...d.data() })).filter(t => typeof t.date === 'string');
      set({ transactions: txs });
      
      // Recalculate budgets spent on the fly
      const cycle = get().budgetCycle;
      const now = new Date();
      
      const newBudgets = JSON.parse(JSON.stringify(get().budgets));
      Object.keys(newBudgets).forEach(k => newBudgets[k].spent = 0);
      
      txs.forEach(t => {
        if (t.type === 'Expense' && newBudgets[t.category]) {
          const tDate = parseISO(t.date);
          let include = true;
          
          if (cycle === '1 month') {
            include = tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
          } else if (cycle === '2 months') {
            const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            include = tDate >= twoMonthsAgo;
          } else if (cycle === '1 year') {
            include = tDate.getFullYear() === now.getFullYear();
          }
          
          if (include) {
            newBudgets[t.category].spent += Number(t.amount);
          }
        }
      });
      set({ budgets: newBudgets });
    });

    return () => {
      if (unsubUser) unsubUser();
      if (unsubTx) unsubTx();
      set({ 
        isInitialized: false, 
        transactions: [],
        budgets: {
          'Food & Dining': { limit: 5000, spent: 0 },
          'Transport': { limit: 2000, spent: 0 },
          'Shopping': { limit: 4000, spent: 0 },
          'Entertainment': { limit: 3000, spent: 0 },
          'Rent & Utilities': { limit: 15000, spent: 0 },
        },
        useGlobalBudget: false,
        globalBudgetLimit: 50000,
        budgetCycle: '1 month',
        theme: 'dark',
        includeLendBorrow: false,
        hasCompletedOnboarding: true,
        hasUnreadNotifications: true,
        requirePasswordForDelete: false
      });
    };
  },
  
  markNotificationsRead: async () => {
    set({ hasUnreadNotifications: false });
    const uid = auth.currentUser?.uid;
    if (uid) {
      await updateDoc(doc(db, 'users', uid), { hasUnreadNotifications: false });
    }
  },
  
  setRequirePasswordForDelete: async (requirePw) => {
    set({ requirePasswordForDelete: requirePw });
    // When re-enabling security, immediately lock the session again
    if (requirePw) {
      set({ isDeleteModeUnlocked: false });
    }
    const uid = auth.currentUser?.uid;
    if (uid) {
      await updateDoc(doc(db, 'users', uid), { requirePasswordForDelete: requirePw });
    }
  },

  setDeleteModeUnlocked: (unlocked) => {
    set({ isDeleteModeUnlocked: unlocked });
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
