import { subDays, subHours, formatISO } from 'date-fns';

export const DEMO_USER = {
  uid: 'demo_user_account_999',
  email: 'demo@financetracker.com',
  displayName: 'Demo User',
};

export const DEMO_PIN = '1234';

export const generateDemoData = () => {
  const now = new Date();

  const transactions = [
    // Income
    {
      id: 'tx_demo_1',
      amount: 120000,
      type: 'Income',
      category: 'Salary',
      recipient: 'TechCorp Pvt Ltd',
      method: 'Bank Transfer',
      note: 'Monthly Salary Credit',
      date: formatISO(subDays(now, 2)),
      settled: true,
      workspaceId: 'personal',
      createdAt: formatISO(subDays(now, 2)),
    },
    {
      id: 'tx_demo_2',
      amount: 35000,
      type: 'Income',
      category: 'Freelance',
      recipient: 'Acme Studio',
      method: 'UPI',
      note: 'UI Design Project Payment',
      date: formatISO(subDays(now, 5)),
      settled: true,
      workspaceId: 'business',
      createdAt: formatISO(subDays(now, 5)),
    },
    {
      id: 'tx_demo_3',
      amount: 4500,
      type: 'Income',
      category: 'Investments',
      recipient: 'Zerodha Broking',
      method: 'Bank Transfer',
      note: 'Quarterly Stock Dividends',
      date: formatISO(subDays(now, 10)),
      settled: true,
      workspaceId: 'personal',
      createdAt: formatISO(subDays(now, 10)),
    },

    // Expenses - Personal
    {
      id: 'tx_demo_4',
      amount: 4250,
      type: 'Expense',
      category: 'Food & Dining',
      recipient: 'Whole Foods Market',
      method: 'Credit Card',
      note: 'Weekly Organic Groceries',
      date: formatISO(subHours(now, 4)),
      settled: true,
      workspaceId: 'personal',
      createdAt: formatISO(subHours(now, 4)),
    },
    {
      id: 'tx_demo_5',
      amount: 1120,
      type: 'Expense',
      category: 'Food & Dining',
      recipient: 'Swiggy Gourmet',
      method: 'UPI',
      note: 'Dinner with Friends',
      date: formatISO(subDays(now, 1)),
      settled: true,
      workspaceId: 'personal',
      createdAt: formatISO(subDays(now, 1)),
    },
    {
      id: 'tx_demo_6',
      amount: 2850,
      type: 'Expense',
      category: 'Rent & Utilities',
      recipient: 'State Electricity Board',
      method: 'UPI',
      note: 'Electricity Bill',
      date: formatISO(subDays(now, 3)),
      settled: true,
      workspaceId: 'personal',
      createdAt: formatISO(subDays(now, 3)),
    },
    {
      id: 'tx_demo_7',
      amount: 12490,
      type: 'Expense',
      category: 'Shopping',
      recipient: 'Amazon India',
      method: 'Credit Card',
      note: 'Noise-Cancelling Headphones',
      date: formatISO(subDays(now, 4)),
      settled: true,
      workspaceId: 'personal',
      createdAt: formatISO(subDays(now, 4)),
    },
    {
      id: 'tx_demo_8',
      amount: 680,
      type: 'Expense',
      category: 'Transport',
      recipient: 'Uber Cabs',
      method: 'UPI',
      note: 'Airport Drop',
      date: formatISO(subDays(now, 6)),
      settled: true,
      workspaceId: 'personal',
      createdAt: formatISO(subDays(now, 6)),
    },
    {
      id: 'tx_demo_9',
      amount: 2500,
      type: 'Expense',
      category: 'Entertainment',
      recipient: 'Cult.fit Fitness Club',
      method: 'Debit Card',
      note: 'Monthly Gym Membership',
      date: formatISO(subDays(now, 8)),
      settled: true,
      workspaceId: 'personal',
      createdAt: formatISO(subDays(now, 8)),
    },

    // Expenses - Business
    {
      id: 'tx_demo_10',
      amount: 4999,
      type: 'Expense',
      category: 'Shopping',
      recipient: 'Vercel Pro',
      method: 'Credit Card',
      note: 'Cloud Hosting Subscription',
      date: formatISO(subDays(now, 2)),
      settled: true,
      workspaceId: 'business',
      createdAt: formatISO(subDays(now, 2)),
    },
    {
      id: 'tx_demo_11',
      amount: 18500,
      type: 'Expense',
      category: 'Transport',
      recipient: 'IndiGo Airlines',
      method: 'Credit Card',
      note: 'Client Meeting Travel',
      date: formatISO(subDays(now, 7)),
      settled: true,
      workspaceId: 'business',
      createdAt: formatISO(subDays(now, 7)),
    },

    // Expenses - Trip
    {
      id: 'tx_demo_12',
      amount: 42000,
      type: 'Expense',
      category: 'Entertainment',
      recipient: 'Airbnb Paris',
      method: 'Credit Card',
      note: 'Apartment Booking',
      date: formatISO(subDays(now, 12)),
      settled: true,
      workspaceId: 'trip',
      createdAt: formatISO(subDays(now, 12)),
    },
    {
      id: 'tx_demo_13',
      amount: 8500,
      type: 'Expense',
      category: 'Food & Dining',
      recipient: 'Le Bistro Paris',
      method: 'Cash',
      note: 'Fine Dining Dinner',
      date: formatISO(subDays(now, 14)),
      settled: true,
      workspaceId: 'trip',
      createdAt: formatISO(subDays(now, 14)),
    },

    // Lend / Borrow
    {
      id: 'tx_demo_14',
      amount: 5000,
      type: 'Lend',
      category: 'Lend / Borrow',
      recipient: 'Alex Smith',
      method: 'UPI',
      note: 'Lent money for concert tickets',
      date: formatISO(subDays(now, 3)),
      settled: false,
      workspaceId: 'personal',
      createdAt: formatISO(subDays(now, 3)),
    },
    {
      id: 'tx_demo_15',
      amount: 3000,
      type: 'Borrow',
      category: 'Lend / Borrow',
      recipient: 'Sarah Jenkins',
      method: 'UPI',
      note: 'Borrowed for dinner bill split',
      date: formatISO(subDays(now, 9)),
      settled: true,
      workspaceId: 'personal',
      createdAt: formatISO(subDays(now, 9)),
    },
  ];

  const workspaces = [
    { id: 'personal', name: 'Personal' },
    { id: 'business', name: 'Business & Freelance' },
    { id: 'trip', name: 'Europe Vacation ✈️' },
  ];

  const workspaceSettings = {
    personal: {
      budgets: {
        'Food & Dining': { limit: 12000, spent: 5370 },
        Transport: { limit: 5000, spent: 680 },
        Shopping: { limit: 15000, spent: 12490 },
        Entertainment: { limit: 6000, spent: 2500 },
        'Rent & Utilities': { limit: 20000, spent: 2850 },
      },
      useGlobalBudget: false,
      globalBudgetLimit: 50000,
      budgetCycle: '1 month',
      includeLendBorrow: false,
    },
    business: {
      budgets: {
        'Food & Dining': { limit: 10000, spent: 0 },
        Transport: { limit: 25000, spent: 18500 },
        Shopping: { limit: 20000, spent: 4999 },
        Entertainment: { limit: 5000, spent: 0 },
        'Rent & Utilities': { limit: 10000, spent: 0 },
      },
      useGlobalBudget: false,
      globalBudgetLimit: 60000,
      budgetCycle: '1 month',
      includeLendBorrow: false,
    },
    trip: {
      budgets: {
        'Food & Dining': { limit: 25000, spent: 8500 },
        Transport: { limit: 50000, spent: 0 },
        Shopping: { limit: 30000, spent: 0 },
        Entertainment: { limit: 50000, spent: 42000 },
        'Rent & Utilities': { limit: 0, spent: 0 },
      },
      useGlobalBudget: false,
      globalBudgetLimit: 150000,
      budgetCycle: 'never',
      includeLendBorrow: false,
    },
  };

  return {
    transactions,
    workspaces,
    activeWorkspaceId: 'personal',
    workspaceSettings,
    theme: 'dark',
    hasCompletedOnboarding: true,
    hasUnreadNotifications: false,
    requirePasswordForDelete: false,
    pinPlatforms: { app: true, mobileWeb: true, desktopWeb: true },
    autoSyncEnabled: true,
    lastSyncedAt: new Date().toISOString(),
    pendingSyncCount: 0,
  };
};

export const loadDemoAccountData = () => {
  const demoState = generateDemoData();

  // Save to localStorage under Zustand store key
  const storeData = {
    state: demoState,
    version: 0,
  };
  localStorage.setItem('finance-storage', JSON.stringify(storeData));

  // Save user profile & PIN
  localStorage.setItem('finance_user', JSON.stringify(DEMO_USER));
  localStorage.setItem('finance_user_pin', DEMO_PIN);
};
