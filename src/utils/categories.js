/**
 * Centralized Category Configuration & Helper Utilities
 */
import {
  Utensils,
  ShoppingBag,
  Car,
  Home,
  Film,
  HeartPulse,
  GraduationCap,
  Plane,
  HelpCircle,
  Briefcase,
  DollarSign,
  TrendingUp,
  Gift,
  RotateCcw,
  HandCoins,
  Receipt,
  PiggyBank,
  Wallet
} from 'lucide-react';

export const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Shopping',
  'Transport',
  'Rent & Utilities',
  'Entertainment',
  'Health & Fitness',
  'Education',
  'Travel',
  'Miscellaneous',
];

export const INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Investments',
  'Gifts & Bonuses',
  'Refunds',
  'Other Income',
];

export const LEND_BORROW_CATEGORIES = [
  'Personal Loan',
  'Split Bill',
  'Advance',
  'Other',
];

export const getCategoriesForType = (type) => {
  switch (type) {
    case 'Income':
      return INCOME_CATEGORIES;
    case 'Lend':
    case 'Borrow':
      return LEND_BORROW_CATEGORIES;
    case 'Expense':
    default:
      return EXPENSE_CATEGORIES;
  }
};

export const getCategoryIcon = (category) => {
  switch (category) {
    case 'Food & Dining':
      return Utensils;
    case 'Shopping':
      return ShoppingBag;
    case 'Transport':
      return Car;
    case 'Rent & Utilities':
      return Home;
    case 'Entertainment':
      return Film;
    case 'Health & Fitness':
      return HeartPulse;
    case 'Education':
      return GraduationCap;
    case 'Travel':
      return Plane;
    case 'Salary':
      return Briefcase;
    case 'Freelance':
      return DollarSign;
    case 'Investments':
      return TrendingUp;
    case 'Gifts & Bonuses':
      return Gift;
    case 'Refunds':
      return RotateCcw;
    case 'Personal Loan':
    case 'Split Bill':
    case 'Advance':
    case 'Lend / Borrow':
      return HandCoins;
    default:
      return Wallet;
  }
};
