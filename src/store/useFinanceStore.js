import * as React from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { subMonths, isSameMonth, parseISO } from 'date-fns';
import { db, auth } from '../firebase';
import { collection, doc, setDoc, addDoc, onSnapshot, query, orderBy, updateDoc, getDoc, deleteDoc, writeBatch } from 'firebase/firestore';

const defaultSettings = {
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
  includeLendBorrow: false,
};

export const useFinanceStore = create(
  persist(
    (set, get) => ({
      transactions: [],
      
      theme: 'dark',
      hasCompletedOnboarding: true,
      hasUnreadNotifications: true,
      requirePasswordForDelete: false,
      isDeleteModeUnlocked: false,
      isInitialized: false,
      
      workspaces: [{ id: 'personal', name: 'Personal' }],
      activeWorkspaceId: 'personal',
      
      workspaceSettings: {
        'personal': JSON.parse(JSON.stringify(defaultSettings))
      },

      addWorkspace: async (name) => {
        const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const newWorkspaces = [...get().workspaces, { id, name }];
        const newSettings = { ...get().workspaceSettings, [id]: JSON.parse(JSON.stringify(defaultSettings)) };
        
        set({ workspaces: newWorkspaces, activeWorkspaceId: id, workspaceSettings: newSettings });
        
        const uid = auth.currentUser?.uid;
        if (uid) {
          await updateDoc(doc(db, 'users', uid), { 
            workspaces: newWorkspaces, 
            activeWorkspaceId: id,
            workspaceSettings: newSettings
          });
        }
      },

      renameWorkspace: async (id, newName) => {
        const newWorkspaces = get().workspaces.map(w => w.id === id ? { ...w, name: newName } : w);
        set({ workspaces: newWorkspaces });
        const uid = auth.currentUser?.uid;
        if (uid) {
          await updateDoc(doc(db, 'users', uid), { workspaces: newWorkspaces });
        }
      },

      deleteWorkspace: async (id) => {
        const { workspaces, workspaceSettings, transactions, activeWorkspaceId } = get();
        if (workspaces.length <= 1) return; // Cannot delete last workspace

        const newWorkspaces = workspaces.filter(w => w.id !== id);
        const newSettings = { ...workspaceSettings };
        delete newSettings[id];
        
        const newActiveId = activeWorkspaceId === id ? newWorkspaces[0].id : activeWorkspaceId;
        
        set({ workspaces: newWorkspaces, workspaceSettings: newSettings, activeWorkspaceId: newActiveId });
        
        const uid = auth.currentUser?.uid;
        if (uid) {
          // Delete transactions from firestore
          const txsToDelete = transactions.filter(t => (t.workspaceId || 'personal') === id);
          if (txsToDelete.length > 0) {
            const batch = writeBatch(db);
            txsToDelete.forEach(tx => {
              batch.delete(doc(db, 'users', uid, 'transactions', tx.id));
            });
            await batch.commit();
          }

          await updateDoc(doc(db, 'users', uid), { 
            workspaces: newWorkspaces,
            workspaceSettings: newSettings,
            activeWorkspaceId: newActiveId
          });
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

      setIncludeLendBorrow: async (val) => {
        const { activeWorkspaceId, workspaceSettings } = get();
        const newSettings = {
          ...workspaceSettings,
          [activeWorkspaceId]: { ...workspaceSettings[activeWorkspaceId], includeLendBorrow: val }
        };
        set({ workspaceSettings: newSettings });
        const uid = auth.currentUser?.uid;
        if (uid) {
          await updateDoc(doc(db, 'users', uid), { workspaceSettings: newSettings });
        }
      },

      setBudgetCycle: async (cycle) => {
        const { activeWorkspaceId, workspaceSettings } = get();
        const newSettings = {
          ...workspaceSettings,
          [activeWorkspaceId]: { ...workspaceSettings[activeWorkspaceId], budgetCycle: cycle }
        };
        set({ workspaceSettings: newSettings });
        const uid = auth.currentUser?.uid;
        if (uid) {
          await updateDoc(doc(db, 'users', uid), { workspaceSettings: newSettings });
        }
      },

      setGlobalBudgetOptions: async (useGlobal, limit) => {
        const { activeWorkspaceId, workspaceSettings } = get();
        const newSettings = {
          ...workspaceSettings,
          [activeWorkspaceId]: { 
            ...workspaceSettings[activeWorkspaceId], 
            useGlobalBudget: useGlobal, 
            globalBudgetLimit: limit 
          }
        };
        set({ workspaceSettings: newSettings });
        const uid = auth.currentUser?.uid;
        if (uid) {
          await updateDoc(doc(db, 'users', uid), { workspaceSettings: newSettings });
        }
      },

      updateBudget: async (category, limit) => {
        const { activeWorkspaceId, workspaceSettings } = get();
        const activeSettings = workspaceSettings[activeWorkspaceId];
        const newSettings = {
          ...workspaceSettings,
          [activeWorkspaceId]: {
            ...activeSettings,
            budgets: {
              ...activeSettings.budgets,
              [category]: { ...activeSettings.budgets[category], limit }
            }
          }
        };
        set({ workspaceSettings: newSettings });
        const uid = auth.currentUser?.uid;
        if (uid) {
          await updateDoc(doc(db, 'users', uid), { workspaceSettings: newSettings });
        }
      },
      
      initializeUserSync: (uid) => {
        if (get().isInitialized) return;
        set({ isInitialized: true });

        const userDocRef = doc(db, 'users', uid);
        const unsubUser = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.theme) set({ theme: data.theme });
            if (data.hasUnreadNotifications !== undefined) set({ hasUnreadNotifications: data.hasUnreadNotifications });
            if (data.requirePasswordForDelete !== undefined) set({ requirePasswordForDelete: data.requirePasswordForDelete });
            if (data.workspaces) set({ workspaces: data.workspaces });
            if (data.activeWorkspaceId) set({ activeWorkspaceId: data.activeWorkspaceId });
            
            if (data.workspaceSettings) {
              set({ workspaceSettings: data.workspaceSettings });
            } else if (data.budgets) {
              // Migration from v1 to v2 (per-workspace settings)
              set({
                workspaceSettings: {
                  'personal': {
                    budgets: data.budgets,
                    useGlobalBudget: data.useGlobalBudget ?? false,
                    globalBudgetLimit: data.globalBudgetLimit ?? 50000,
                    budgetCycle: data.budgetCycle ?? '1 month',
                    includeLendBorrow: data.includeLendBorrow ?? false
                  }
                }
              });
            }
            
            if (data.hasCompletedOnboarding !== undefined) {
              set({ hasCompletedOnboarding: data.hasCompletedOnboarding });
            } else {
              set({ hasCompletedOnboarding: true });
            }
          } else {
            set({ hasCompletedOnboarding: false, hasUnreadNotifications: true, requirePasswordForDelete: false });
            setDoc(userDocRef, {
              theme: get().theme,
              hasCompletedOnboarding: false,
              hasUnreadNotifications: true,
              requirePasswordForDelete: false,
              workspaces: get().workspaces,
              activeWorkspaceId: get().activeWorkspaceId,
              workspaceSettings: get().workspaceSettings
            });
          }
        });

        const txQuery = query(collection(db, 'users', uid, 'transactions'), orderBy('date', 'desc'));
        const unsubTx = onSnapshot(txQuery, (snapshot) => {
          const txs = snapshot.docs.map(d => ({ id: d.id, ...d.data() })).filter(t => typeof t.date === 'string');
          set({ transactions: txs });
          
          const { workspaceSettings } = get();
          const newWorkspaceSettings = JSON.parse(JSON.stringify(workspaceSettings));
          const now = new Date();

          // Recalculate spent budgets for all workspaces
          Object.keys(newWorkspaceSettings).forEach(wId => {
            const wSettings = newWorkspaceSettings[wId];
            if (!wSettings.budgets) return;
            
            Object.keys(wSettings.budgets).forEach(k => wSettings.budgets[k].spent = 0);
            const cycle = wSettings.budgetCycle || '1 month';
            
            const workspaceTxs = txs.filter(t => (t.workspaceId || 'personal') === wId);
            
            workspaceTxs.forEach(t => {
              if (t.type === 'Expense' && wSettings.budgets[t.category]) {
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
                  wSettings.budgets[t.category].spent += Number(t.amount);
                }
              }
            });
          });

          set({ workspaceSettings: newWorkspaceSettings });
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

      deleteTransaction: async (id) => {
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        await deleteDoc(doc(db, 'users', uid, 'transactions', id));
      },

      moveTransactionsToWorkspace: async (txIds, newWorkspaceId) => {
        const uid = auth.currentUser?.uid;
        if (!uid || !txIds.length) return;
        
        const batch = writeBatch(db);
        txIds.forEach(id => {
          batch.update(doc(db, 'users', uid, 'transactions', id), { workspaceId: newWorkspaceId });
        });
        await batch.commit();
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
        const { transactions, workspaceSettings, activeWorkspaceId } = get();
        const settings = workspaceSettings[activeWorkspaceId] || defaultSettings;
        const { budgets } = settings;
        
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
        theme: state.theme,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        hasUnreadNotifications: state.hasUnreadNotifications,
        requirePasswordForDelete: state.requirePasswordForDelete,
        workspaces: state.workspaces,
        activeWorkspaceId: state.activeWorkspaceId,
        workspaceSettings: state.workspaceSettings
      })
    }
  )
);

export const useFilteredTransactions = () => {
  const transactions = useFinanceStore(state => state.transactions);
  const activeWorkspaceId = useFinanceStore(state => state.activeWorkspaceId);
  
  return React.useMemo(() => {
    return transactions.filter(t => (t.workspaceId || 'personal') === activeWorkspaceId);
  }, [transactions, activeWorkspaceId]);
};

export const useWorkspaceSettings = () => {
  const workspaceSettings = useFinanceStore(state => state.workspaceSettings);
  const activeWorkspaceId = useFinanceStore(state => state.activeWorkspaceId);
  
  return React.useMemo(() => {
    return workspaceSettings[activeWorkspaceId] || defaultSettings;
  }, [workspaceSettings, activeWorkspaceId]);
};
