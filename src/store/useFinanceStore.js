import * as React from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { subMonths, isSameMonth, parseISO, subHours } from 'date-fns';
import { supabase, getSupabaseConfig } from '../supabase';
import { generateDemoData } from '../utils/mockData';

const defaultSettings = {
  budgets: {
    'Food & Dining': { limit: 5000, spent: 0 },
    Transport: { limit: 2000, spent: 0 },
    Shopping: { limit: 4000, spent: 0 },
    Entertainment: { limit: 3000, spent: 0 },
    'Rent & Utilities': { limit: 15000, spent: 0 },
  },
  useGlobalBudget: false,
  globalBudgetLimit: 50000,
  budgetCycle: '1 month',
  includeLendBorrow: false,
};

// Recalculate spent budgets for all workspaces based on transactions
const recalculateBudgets = (transactions, workspaceSettings) => {
  const newWorkspaceSettings = JSON.parse(JSON.stringify(workspaceSettings || {}));
  const now = new Date();

  Object.keys(newWorkspaceSettings).forEach((wId) => {
    const wSettings = newWorkspaceSettings[wId];
    if (!wSettings.budgets) return;

    Object.keys(wSettings.budgets).forEach((k) => (wSettings.budgets[k].spent = 0));
    const cycle = wSettings.budgetCycle || '1 month';

    const workspaceTxs = transactions.filter((t) => (t.workspaceId || 'personal') === wId);

    workspaceTxs.forEach((t) => {
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

  return newWorkspaceSettings;
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
      pinPlatforms: { app: true, mobileWeb: true, desktopWeb: true },

      workspaces: [{ id: 'personal', name: 'Personal' }],
      activeWorkspaceId: 'personal',

      workspaceSettings: {
        personal: JSON.parse(JSON.stringify(defaultSettings)),
      },

      // Sync & Offline State
      autoSyncEnabled: true,
      lastSyncedAt: null,
      isSyncing: false,
      syncError: null,
      pendingSyncCount: 0,

      setAutoSyncEnabled: (enabled) => {
        set({ autoSyncEnabled: enabled });
      },

      loadDemoData: () => {
        const demoState = generateDemoData();
        const updatedWorkspaceSettings = recalculateBudgets(
          demoState.transactions,
          demoState.workspaceSettings
        );
        set({
          transactions: demoState.transactions,
          workspaces: demoState.workspaces,
          activeWorkspaceId: demoState.activeWorkspaceId,
          workspaceSettings: updatedWorkspaceSettings,
          theme: demoState.theme,
          hasCompletedOnboarding: true,
          pendingSyncCount: demoState.transactions.length,
        });
        get().triggerAutoSync();
      },

      triggerAutoSync: () => {
        const state = get();
        if (state.autoSyncEnabled && navigator.onLine) {
          setTimeout(() => {
            get().syncWithSupabase();
          }, 800);
        }
      },

      addWorkspace: async (name) => {
        const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const newWorkspaces = [...get().workspaces, { id, name }];
        const newSettings = {
          ...get().workspaceSettings,
          [id]: JSON.parse(JSON.stringify(defaultSettings)),
        };

        set((state) => ({
          workspaces: newWorkspaces,
          activeWorkspaceId: id,
          workspaceSettings: newSettings,
          pendingSyncCount: state.pendingSyncCount + 1,
        }));

        get().triggerAutoSync();
      },

      renameWorkspace: async (id, newName) => {
        const newWorkspaces = get().workspaces.map((w) =>
          w.id === id ? { ...w, name: newName } : w
        );
        set((state) => ({ workspaces: newWorkspaces, pendingSyncCount: state.pendingSyncCount + 1 }));
        get().triggerAutoSync();
      },

      deleteWorkspace: async (id) => {
        const { workspaces, workspaceSettings, transactions, activeWorkspaceId } = get();
        if (workspaces.length <= 1) return;

        const newWorkspaces = workspaces.filter((w) => w.id !== id);
        const newSettings = { ...workspaceSettings };
        delete newSettings[id];

        const newActiveId = activeWorkspaceId === id ? newWorkspaces[0].id : activeWorkspaceId;
        const newTransactions = transactions.filter((t) => (t.workspaceId || 'personal') !== id);

        set((state) => ({
          workspaces: newWorkspaces,
          workspaceSettings: newSettings,
          activeWorkspaceId: newActiveId,
          transactions: newTransactions,
          pendingSyncCount: state.pendingSyncCount + 1,
        }));

        get().triggerAutoSync();
      },

      switchWorkspace: (id) => {
        set({ activeWorkspaceId: id });
        get().triggerAutoSync();
      },

      completeOnboarding: () => {
        set((state) => ({ hasCompletedOnboarding: true, pendingSyncCount: state.pendingSyncCount + 1 }));
        get().triggerAutoSync();
      },

      toggleTheme: () => {
        const newTheme = get().theme === 'dark' ? 'light' : 'dark';
        set((state) => ({ theme: newTheme, pendingSyncCount: state.pendingSyncCount + 1 }));
        get().triggerAutoSync();
      },

      setPinPlatforms: (platforms) => {
        set((state) => ({ pinPlatforms: platforms, pendingSyncCount: state.pendingSyncCount + 1 }));
        get().triggerAutoSync();
      },

      setIncludeLendBorrow: (val) => {
        const { activeWorkspaceId, workspaceSettings } = get();
        const newSettings = {
          ...workspaceSettings,
          [activeWorkspaceId]: { ...workspaceSettings[activeWorkspaceId], includeLendBorrow: val },
        };
        set((state) => ({ workspaceSettings: newSettings, pendingSyncCount: state.pendingSyncCount + 1 }));
        get().triggerAutoSync();
      },

      setBudgetCycle: (cycle) => {
        const { activeWorkspaceId, workspaceSettings, transactions } = get();
        const newSettings = {
          ...workspaceSettings,
          [activeWorkspaceId]: { ...workspaceSettings[activeWorkspaceId], budgetCycle: cycle },
        };
        const updatedWorkspaceSettings = recalculateBudgets(transactions, newSettings);
        set((state) => ({ workspaceSettings: updatedWorkspaceSettings, pendingSyncCount: state.pendingSyncCount + 1 }));
        get().triggerAutoSync();
      },

      setGlobalBudgetOptions: (useGlobal, limit) => {
        const { activeWorkspaceId, workspaceSettings } = get();
        const newSettings = {
          ...workspaceSettings,
          [activeWorkspaceId]: {
            ...workspaceSettings[activeWorkspaceId],
            useGlobalBudget: useGlobal,
            globalBudgetLimit: limit,
          },
        };
        set((state) => ({ workspaceSettings: newSettings, pendingSyncCount: state.pendingSyncCount + 1 }));
        get().triggerAutoSync();
      },

      updateWorkspaceSettings: (partialSettings) => {
        const { activeWorkspaceId, workspaceSettings, transactions } = get();
        const activeSettings = workspaceSettings[activeWorkspaceId] || defaultSettings;
        const newSettings = {
          ...workspaceSettings,
          [activeWorkspaceId]: {
            ...activeSettings,
            ...partialSettings,
          },
        };
        const updatedWorkspaceSettings = recalculateBudgets(transactions, newSettings);
        set((state) => ({ workspaceSettings: updatedWorkspaceSettings, pendingSyncCount: state.pendingSyncCount + 1 }));
        get().triggerAutoSync();
      },

      updateBudget: (category, limit) => {
        const { activeWorkspaceId, workspaceSettings } = get();
        const activeSettings = workspaceSettings[activeWorkspaceId] || defaultSettings;
        const newSettings = {
          ...workspaceSettings,
          [activeWorkspaceId]: {
            ...activeSettings,
            budgets: {
              ...activeSettings.budgets,
              [category]: { ...(activeSettings.budgets?.[category] || { spent: 0 }), limit },
            },
          },
        };
        set((state) => ({ workspaceSettings: newSettings, pendingSyncCount: state.pendingSyncCount + 1 }));
        get().triggerAutoSync();
      },

      initializeUserSync: async (userId) => {
        set({ isInitialized: true });
        // Sync with Supabase to load any existing user data
        await get().syncWithSupabase();
      },

      markNotificationsRead: () => {
        set((state) => ({ hasUnreadNotifications: false, pendingSyncCount: state.pendingSyncCount + 1 }));
        get().triggerAutoSync();
      },

      setRequirePasswordForDelete: (requirePw) => {
        set((state) => ({
          requirePasswordForDelete: requirePw,
          isDeleteModeUnlocked: requirePw ? false : state.isDeleteModeUnlocked,
          pendingSyncCount: state.pendingSyncCount + 1,
        }));
        get().triggerAutoSync();
      },

      setDeleteModeUnlocked: (unlocked) => {
        set({ isDeleteModeUnlocked: unlocked });
      },

      addTransaction: (tx) => {
        const id = tx.id || `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const nowIso = new Date().toISOString();
        const newTx = {
          id,
          ...tx,
          settled: tx.settled ?? false,
          settledAmount: tx.settledAmount ?? (tx.settled ? Number(tx.amount || 0) : 0),
          settlements: Array.isArray(tx.settlements) ? tx.settlements : [],
          createdAt: tx.createdAt || nowIso,
          updatedAt: nowIso,
          workspaceId: tx.workspaceId || get().activeWorkspaceId || 'personal',
        };

        const updatedTransactions = [newTx, ...get().transactions];
        const updatedSettings = recalculateBudgets(updatedTransactions, get().workspaceSettings);

        set((state) => ({
          transactions: updatedTransactions,
          workspaceSettings: updatedSettings,
          pendingSyncCount: state.pendingSyncCount + 1,
        }));

        get().triggerAutoSync();
      },

      updateTransaction: (id, updatedTx) => {
        const nowIso = new Date().toISOString();
        const updatedTransactions = get().transactions.map((t) =>
          t.id === id ? { ...t, ...updatedTx, updatedAt: nowIso } : t
        );
        const updatedSettings = recalculateBudgets(updatedTransactions, get().workspaceSettings);

        set((state) => ({
          transactions: updatedTransactions,
          workspaceSettings: updatedSettings,
          pendingSyncCount: state.pendingSyncCount + 1,
        }));

        get().triggerAutoSync();
      },

      deleteTransaction: (id) => {
        const updatedTransactions = get().transactions.filter((t) => t.id !== id);
        const updatedSettings = recalculateBudgets(updatedTransactions, get().workspaceSettings);

        set((state) => ({
          transactions: updatedTransactions,
          workspaceSettings: updatedSettings,
          pendingSyncCount: state.pendingSyncCount + 1,
        }));

        if (navigator.onLine) {
          supabase.auth.getUser().then(({ data }) => {
            if (data?.user?.id) {
              supabase.from('transactions').delete().eq('id', id).eq('user_id', data.user.id).then();
            }
          });
        }

        get().triggerAutoSync();
      },

      clearLocalData: async (clearType) => {
        const now = new Date();
        let remaining = [];
        let deletedIds = [];

        if (clearType === 'all') {
          deletedIds = get().transactions.map((t) => t.id);
          remaining = [];
        } else if (clearType === '24h') {
          const cutoff = subHours(now, 24);
          get().transactions.forEach((t) => {
            if (parseISO(t.date) >= cutoff) deletedIds.push(t.id);
            else remaining.push(t);
          });
        } else if (clearType === 'month') {
          const cutoff = subMonths(now, 1);
          get().transactions.forEach((t) => {
            if (parseISO(t.date) >= cutoff) deletedIds.push(t.id);
            else remaining.push(t);
          });
        }

        const updatedSettings = recalculateBudgets(remaining, get().workspaceSettings);
        set((state) => ({
          transactions: remaining,
          workspaceSettings: updatedSettings,
          pendingSyncCount: state.pendingSyncCount + deletedIds.length,
        }));

        if (navigator.onLine && deletedIds.length > 0) {
          const { data } = await supabase.auth.getUser();
          if (data?.user?.id) {
            await supabase.from('transactions').delete().in('id', deletedIds).eq('user_id', data.user.id);
          }
        }

        get().triggerAutoSync();
      },

      moveTransactionsToWorkspace: (txIds, newWorkspaceId) => {
        const nowIso = new Date().toISOString();
        const updatedTransactions = get().transactions.map((t) =>
          txIds.includes(t.id) ? { ...t, workspaceId: newWorkspaceId, updatedAt: nowIso } : t
        );
        const updatedSettings = recalculateBudgets(updatedTransactions, get().workspaceSettings);

        set((state) => ({
          transactions: updatedTransactions,
          workspaceSettings: updatedSettings,
          pendingSyncCount: state.pendingSyncCount + txIds.length,
        }));

        get().triggerAutoSync();
      },

      markAsSettled: (id) => {
        const tx = get().transactions.find((t) => t.id === id);
        if (!tx || tx.settled) return;

        const totalAmount = Number(tx.amount || 0);
        const currentSettled = Number(tx.settledAmount || 0);
        const remainingToSettle = Math.max(0, totalAmount - currentSettled);

        get().updateTransaction(id, {
          settled: true,
          settledAmount: totalAmount,
        });

        if (remainingToSettle > 0) {
          const counterTx = {
            amount: remainingToSettle,
            type: tx.type === 'Lend' ? 'Income' : 'Expense',
            category: 'Lend / Borrow',
            recipient: `Settlement: ${tx.recipient || ''}`,
            method: tx.method || 'Cash',
            note: `Full settlement for ${tx.type === 'Lend' ? 'Lent' : 'Borrowed'} money`,
            date: new Date().toISOString(),
            settled: true,
            workspaceId: get().activeWorkspaceId,
          };

          get().addTransaction(counterTx);
        }
      },

      settlePartialAmount: (id, partialAmount, note) => {
        const tx = get().transactions.find((t) => t.id === id);
        if (!tx || tx.settled) return;

        const pay = Math.max(0, Number(partialAmount));
        if (pay <= 0) return;

        const totalAmount = Number(tx.amount || 0);
        const currentSettled = Number(tx.settledAmount || 0);
        const newSettledAmount = Math.min(totalAmount, currentSettled + pay);
        const isFullySettled = newSettledAmount >= totalAmount;

        const currentSettlements = Array.isArray(tx.settlements) ? tx.settlements : [];
        const newSettlement = {
          id: `set_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          amount: pay,
          date: new Date().toISOString(),
          note: note || '',
        };

        get().updateTransaction(id, {
          settledAmount: newSettledAmount,
          settled: isFullySettled,
          settlements: [...currentSettlements, newSettlement],
        });

        const counterTx = {
          amount: pay,
          type: tx.type === 'Lend' ? 'Income' : 'Expense',
          category: 'Lend / Borrow',
          recipient: `Partial Settlement: ${tx.recipient || 'Unknown'}`,
          method: tx.method || 'Cash',
          note: note ? `Partial Settlement: ${note}` : `Partial settlement for ${tx.type === 'Lend' ? 'Lent' : 'Borrowed'} money`,
          date: new Date().toISOString(),
          settled: true,
          workspaceId: get().activeWorkspaceId,
        };

        get().addTransaction(counterTx);
      },

      getUniqueMerchants: () => {
        const { transactions, activeWorkspaceId } = get();
        const merchants = transactions
          .filter((t) => (t.workspaceId || 'personal') === activeWorkspaceId)
          .map((t) => t.recipient)
          .filter(Boolean);
        return [...new Set(merchants)];
      },

      getSmartInsights: () => {
        const { transactions, workspaceSettings, activeWorkspaceId } = get();
        const settings = workspaceSettings[activeWorkspaceId] || defaultSettings;
        const { budgets } = settings;

        const now = new Date();
        const lastMonth = subMonths(now, 1);

        const workspaceTxs = transactions.filter(
          (t) => (t.workspaceId || 'personal') === activeWorkspaceId
        );

        const thisMonthTx = workspaceTxs.filter((t) => isSameMonth(parseISO(t.date), now));
        const lastMonthTx = workspaceTxs.filter((t) => isSameMonth(parseISO(t.date), lastMonth));

        const thisMonthExpense = thisMonthTx
          .filter((t) => t.type === 'Expense')
          .reduce((acc, t) => acc + Number(t.amount || 0), 0);
        const lastMonthExpense = lastMonthTx
          .filter((t) => t.type === 'Expense')
          .reduce((acc, t) => acc + Number(t.amount || 0), 0);

        const insights = [];

        if (lastMonthExpense > 0) {
          const diff = ((thisMonthExpense - lastMonthExpense) / lastMonthExpense) * 100;
          if (diff > 0) {
            insights.push(
              `You have spent ${diff.toFixed(1)}% more this month compared to last month.`
            );
          } else {
            insights.push(
              `Great job! You have spent ${Math.abs(diff).toFixed(1)}% less this month.`
            );
          }
        }

        const exceededBudgets = Object.entries(budgets || {}).filter(
          ([_, b]) => b.spent >= b.limit * 0.9 && b.limit > 0
        );
        if (exceededBudgets.length > 0) {
          insights.push(
            `Watch out! You are near or over your budget limit for: ${exceededBudgets.map((e) => e[0]).join(', ')}.`
          );
        }

        const pendingLent = workspaceTxs
          .filter((t) => t.type === 'Lend' && !t.settled)
          .reduce((acc, t) => acc + Number(t.amount || 0), 0);
        if (pendingLent > 0) {
          insights.push(
            `You have lent ₹${pendingLent.toLocaleString()} that hasn't been returned yet.`
          );
        }

        if (insights.length === 0) {
          insights.push('Everything looks stable! Keep tracking your transactions.');
        }

        return insights;
      },

      // --- SUPABASE SYNC LOGIC ---
      syncWithSupabase: async (isManual = false) => {
        if (!isManual && !get().autoSyncEnabled) {
          // Automatic background sync is disabled by user setting
          return;
        }

        if (!navigator.onLine) {
          set({ syncError: 'Offline mode active. Changes saved locally.' });
          return;
        }

        const { isConfigured } = getSupabaseConfig();
        if (!isConfigured) {
          set({ syncError: 'Supabase credentials not configured. Operating in local mode.' });
          return;
        }

        try {
          set({ isSyncing: true, syncError: null });

          const { data: authData, error: authErr } = await supabase.auth.getUser();
          if (authErr || !authData?.user) {
            set({ isSyncing: false });
            return;
          }

          const userId = authData.user.id;
          const localTxs = get().transactions;

          // 1. Sync User Settings
          const settingsPayload = {
            user_id: userId,
            theme: get().theme,
            has_completed_onboarding: get().hasCompletedOnboarding,
            has_unread_notifications: get().hasUnreadNotifications,
            require_password_for_delete: get().requirePasswordForDelete,
            pin_platforms: get().pinPlatforms,
            workspaces: get().workspaces,
            active_workspace_id: get().activeWorkspaceId,
            workspace_settings: get().workspaceSettings,
            updated_at: new Date().toISOString(),
          };

          const { data: remoteSettings } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

          if (!remoteSettings) {
            await supabase.from('user_settings').upsert(settingsPayload);
          } else {
            // First push local workspace settings to remote so local budget caps (e.g. 1500) persist to Supabase
            await supabase.from('user_settings').upsert(settingsPayload);

            if (remoteSettings.workspaces && get().pendingSyncCount === 0) set({ workspaces: remoteSettings.workspaces });
            if (remoteSettings.active_workspace_id && get().pendingSyncCount === 0) set({ activeWorkspaceId: remoteSettings.active_workspace_id });
            if (remoteSettings.theme) set({ theme: remoteSettings.theme });
            if (remoteSettings.pin_platforms) set({ pinPlatforms: remoteSettings.pin_platforms });
          }

          // 2. Sync Transactions
          if (localTxs.length > 0) {
            const rowsToUpsert = localTxs.map((t) => ({
              id: t.id,
              user_id: userId,
              workspace_id: t.workspaceId || 'personal',
              amount: t.amount,
              type: t.type,
              category: t.category,
              recipient: t.recipient || '',
              method: t.method,
              note: t.note || '',
              date: t.date,
              settled: Boolean(t.settled),
              settled_amount: Number(t.settledAmount || (t.settled ? t.amount : 0)),
              settlements: Array.isArray(t.settlements) ? t.settlements : [],
              created_at: t.createdAt || new Date().toISOString(),
              updated_at: t.updatedAt || new Date().toISOString(),
            }));

            for (let i = 0; i < rowsToUpsert.length; i += 100) {
              const batch = rowsToUpsert.slice(i, i + 100);
              await supabase.from('transactions').upsert(batch, { onConflict: 'id' });
            }
          }

          // 3. Fetch Remote Transactions from Supabase
          const { data: dbTxs, error: dbErr } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false });

          if (!dbErr && dbTxs && dbTxs.length > 0) {
            const formattedRemoteTxs = dbTxs.map((d) => ({
              id: d.id,
              amount: Number(d.amount),
              type: d.type,
              category: d.category,
              recipient: d.recipient,
              method: d.method,
              note: d.note,
              date: d.date,
              settled: Boolean(d.settled),
              settledAmount: d.settled_amount !== undefined && d.settled_amount !== null ? Number(d.settled_amount) : (d.settled ? Number(d.amount) : 0),
              settlements: Array.isArray(d.settlements) ? d.settlements : [],
              workspaceId: d.workspace_id || 'personal',
              createdAt: d.created_at,
              updatedAt: d.updated_at,
            }));

            const map = new Map();
            [...localTxs, ...formattedRemoteTxs].forEach((item) => {
              const existing = map.get(item.id);
              if (!existing) {
                map.set(item.id, item);
              } else {
                const existingTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
                const itemTime = new Date(item.updatedAt || item.createdAt || 0).getTime();
                if (itemTime >= existingTime) {
                  map.set(item.id, item);
                }
              }
            });

            const mergedTxs = Array.from(map.values()).sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            );

            const updatedWorkspaceSettings = recalculateBudgets(mergedTxs, get().workspaceSettings);
            set({
              transactions: mergedTxs,
              workspaceSettings: updatedWorkspaceSettings,
            });
          }

          set({
            lastSyncedAt: new Date().toISOString(),
            pendingSyncCount: 0,
            isSyncing: false,
            syncError: null,
          });
        } catch (err) {
          console.error('Supabase sync error:', err);
          set({
            isSyncing: false,
            syncError: err.message || 'Sync failed. Will retry when online.',
          });
        }
      },
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
        workspaceSettings: state.workspaceSettings,
        pinPlatforms: state.pinPlatforms,
        autoSyncEnabled: state.autoSyncEnabled,
        lastSyncedAt: state.lastSyncedAt,
      }),
    }
  )
);

export const useFilteredTransactions = () => {
  const transactions = useFinanceStore((state) => state.transactions);
  const activeWorkspaceId = useFinanceStore((state) => state.activeWorkspaceId);

  return React.useMemo(() => {
    return transactions.filter((t) => (t.workspaceId || 'personal') === activeWorkspaceId);
  }, [transactions, activeWorkspaceId]);
};

export const useWorkspaceSettings = () => {
  const workspaceSettings = useFinanceStore((state) => state.workspaceSettings);
  const activeWorkspaceId = useFinanceStore((state) => state.activeWorkspaceId);

  return React.useMemo(() => {
    return workspaceSettings[activeWorkspaceId] || defaultSettings;
  }, [workspaceSettings, activeWorkspaceId]);
};
