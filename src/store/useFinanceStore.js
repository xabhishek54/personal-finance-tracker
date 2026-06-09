import * as React from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { subMonths, isSameMonth, parseISO } from 'date-fns';
import { db, auth } from '../firebase';
import { collection, doc, setDoc, addDoc, onSnapshot, query, where, orderBy, updateDoc, getDoc, deleteDoc } from 'firebase/firestore';

export const useFinanceStore = create(
  persist(
    (set, get) => ({
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
      requirePasswordForDelete: false,
      isDeleteModeUnlocked: false,
      isInitialized: false,
      
      workspaces: [{ id: 'personal', name: 'Personal' }],
      activeWorkspaceId: 'personal',

      addWorkspace: async (name) => {
        const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const newWorkspaces = [...get().workspaces, { id, name }];
        set({ workspaces: newWorkspaces, activeWorkspaceId: id });
        const uid = auth.currentUser?.uid;
        if (uid) {
          await updateDoc(doc(db, 'users', uid), { workspaces: newWorkspaces, activeWorkspaceId: id });
        }
      },

      switchWorkspace: async (id) => {
        set({ activeWorkspaceId: id });
        const uid = auth.currentUser?.uid;
        if (uid) {
          await updateDoc(doc(db, 'users', uid), { activeWorkspaceId: id });
        }
      },

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
      
      initializeUserSync: (uid) => {
        if (get().isInitialized) return;
        set({ isInitialized: true });

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
            if (data.workspaces) set({ workspaces: data.workspaces });
            if (data.activeWorkspaceId) set({ activeWorkspaceId: data.activeWorkspaceId });
            
            if (data.hasCompletedOnboarding !== undefined) {
              set({ hasCompletedOnboarding: data.hasCompletedOnboarding });
            } else {
              set({ hasCompletedOnboarding: true });
            }
          } else {
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
              requirePasswordForDelete: false,
              workspaces: get().workspaces,
              activeWorkspaceId: get().activeWorkspaceId
            });
          }
        });

        const txQuery = query(collection(db, 'users', uid, 'transactions'), orderBy('date', 'desc'));
        const unsubTx = onSnapshot(txQuery, (snapshot) => {
          const txs = snapshot.docs.map(d => ({ id: d.id, ...d.data() })).filter(t => typeof t.date === 'string');
          set({ transactions: txs });
          
          const cycle = get().budgetCycle;
          const now = new Date();
          
          const newBudgets = JSON.parse(JSON.stringify(get().budgets));
          Object.keys(newBudgets).forEach(k => newBudgets[k].spent = 0);
          
          const currentWorkspaceId = get().activeWorkspaceId;
          const workspaceTxs = txs.filter(t => (t.workspaceId || 'personal') === currentWorkspaceId);

          workspaceTxs.forEach(t => {
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
          set({ isInitialized: false });
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
        
        const newTx = { 
          ...tx, 
          settled: false, 
          createdAt: new Date().toISOString(),
          workspaceId: get().activeWorkspaceId
        };
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
          [category]: { ...currentBudgets[category], limit }
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

        await updateDoc(doc(db, 'users', uid, 'transactions', id), { settled: true });

        const counterTx = {
          amount: tx.amount,
          type: tx.type === 'Lend' ? 'Income' : 'Expense',
          category: 'Lend / Borrow',
          recipient: `Settlement: ${tx.recipient}`,
          method: tx.method,
          note: `Settled ${tx.type === 'Lend' ? 'Lent' : 'Borrowed'} money`,
          date: new Date().toISOString(),
          settled: true,
          createdAt: new Date().toISOString(),
          workspaceId: get().activeWorkspaceId
        };
        
        await addDoc(collection(db, 'users', uid, 'transactions'), counterTx);
      },

      getUniqueMerchants: () => {
        const { transactions, activeWorkspaceId } = get();
        const merchants = transactions
          .filter(t => (t.workspaceId || 'personal') === activeWorkspaceId)
          .map(t => t.recipient)
          .filter(Boolean);
        return [...new Set(merchants)];
      },

      getSmartInsights: () => {
        const { transactions, budgets, activeWorkspaceId } = get();
        const now = new Date();
        const lastMonth = subMonths(now, 1);

        const workspaceTxs = transactions.filter(t => (t.workspaceId || 'personal') === activeWorkspaceId);

        const thisMonthTx = workspaceTxs.filter(t => isSameMonth(parseISO(t.date), now));
        const lastMonthTx = workspaceTxs.filter(t => isSameMonth(parseISO(t.date), lastMonth));

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

        const pendingLent = workspaceTxs.filter(t => t.type === 'Lend' && !t.settled).reduce((acc, t) => acc + t.amount, 0);
        if (pendingLent > 0) {
          insights.push(`You have lent ₹${pendingLent.toLocaleString()} that hasn't been returned yet.`);
        }

        if (insights.length === 0) {
          insights.push("Everything looks stable! Keep tracking your transactions.");
        }

        return insights;
      }
    }),
    {
      name: 'finance-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        transactions: state.transactions,
        budgets: state.budgets,
        theme: state.theme,
        includeLendBorrow: state.includeLendBorrow,
        useGlobalBudget: state.useGlobalBudget,
        globalBudgetLimit: state.globalBudgetLimit,
        budgetCycle: state.budgetCycle,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        hasUnreadNotifications: state.hasUnreadNotifications,
        requirePasswordForDelete: state.requirePasswordForDelete,
        workspaces: state.workspaces,
        activeWorkspaceId: state.activeWorkspaceId
      })
    }
  )
);

export const useFilteredTransactions = () => {
  const transactions = useFinanceStore(state => state.transactions);
  const activeWorkspaceId = useFinanceStore(state => state.activeWorkspaceId);
  
  // Return memoized array to prevent infinite re-renders in Zustand/React 18
  return React.useMemo(() => {
    return transactions.filter(t => (t.workspaceId || 'personal') === activeWorkspaceId);
  }, [transactions, activeWorkspaceId]);
};
