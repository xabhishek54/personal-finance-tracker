# Personal Finance Tracker — Feature Specification

---

## Overview

A personal finance tracking application designed to help you log, categorize, and analyze your spending — with both manual and automated entry, monthly budgeting, insightful stats, Excel export, and a clean modern UI.

---

## 1. Transaction Management

### 1.1 Manual Entry

Users can manually log a transaction by filling in the following fields:

- **Amount** — Enter the money spent or received (supports ₹ INR)
- **Date** — Defaults to today; can be changed to a past date
- **Category** — Choose from a predefined list:
  - Food & Dining
  - Transport
  - Shopping
  - Entertainment
  - Health & Medical
  - Rent & Utilities
  - Education
  - Subscriptions
  - Lending / Given to Someone
  - Miscellaneous
- **Recipient / Merchant** — Free-text field (e.g., "Zomato", "Rahul", "Big Bazaar")
- **Transaction Type** — Toggle between:
  - Expense (money going out)
  - Income (money coming in)
  - Lend / Borrow (track money given or received from someone)
- **Payment Method** — Cash / UPI / Card / Net Banking
- **Note** — Optional short description

### 1.2 Auto Entry (Google Pay Integration)

> Note: Google Pay does not offer a public API for direct transaction access. The recommended approaches are:

- **SMS Parsing (Primary Method)** — Automatically read UPI/bank SMS notifications to extract transaction amount, merchant, and date. Works on Android with SMS read permission.
- **Google Pay Statement Import** — Users can download their Google Pay transaction history (as a CSV or PDF from Google Takeout) and import it into the app for bulk auto-entry.
- **Email Parsing (Secondary Method)** — Parse Gmail transaction confirmation emails from Google Pay using Gmail API (requires Google OAuth login).

All auto-imported transactions will be shown in a "Review Queue" where the user can confirm, edit category, or delete before saving.

---

## 2. Budget Management

### 2.1 Monthly Budget Setup

- Set an **overall monthly spending limit** (e.g., ₹15,000/month)
- Set **per-category budgets** (e.g., Food: ₹3,000 | Transport: ₹1,500)
- Budgets reset at the start of each calendar month
- Option to **carry over unused budget** to next month (toggle)

### 2.2 Budget Tracking

- Visual progress bar per category showing amount spent vs. budget
- Color indicators:
  - Green — Under 70% of budget used
  - Yellow — 70–90% used (approaching limit)
  - Red — Over 90% or exceeded
- **Alert / Warning** when a category reaches 80% of its budget
- **Overall budget summary card** at the top of the dashboard

---

## 3. Statistics & Analytics

### 3.1 Spending Overview

- **Monthly spending total** with a comparison to the previous month
  - Displayed as: "₹X this month — ↑12% higher than last month" or "↓8% lower"
- **Daily average spend** for the current month
- **Highest spending day** of the month

### 3.2 Category Breakdown

- Donut/pie chart showing spending distribution across categories
- Ranked list of categories from highest to lowest spend
- Highlight the top spending category with a badge

### 3.3 Trends

- **Line chart** showing monthly spending over the past 6 or 12 months
- **Bar chart** comparing income vs. expenses per month
- Filter by: This Week / This Month / Last 3 Months / Custom Range

### 3.4 Smart Insights (Auto-generated)

The app will generate simple text insights such as:

- "You spent 40% more on Food this month compared to last month."
- "Your Transport spending is within budget — great job!"
- "You have lent ₹2,500 this month that hasn't been returned yet."
- "Your total savings this month: ₹4,200."

---

## 4. Excel Export

### 4.1 Export Options

- Export transactions to a `.xlsx` file with the following sheet structure:

  **Sheet 1 — All Transactions**
  | Date | Category | Recipient | Amount | Type | Payment Method | Note |

  **Sheet 2 — Monthly Summary**
  | Month | Total Income | Total Expenses | Net Savings | Top Category |

  **Sheet 3 — Category Breakdown**
  | Category | Amount Spent | Budget Set | Remaining | % Used |

- Export filters:
  - By month (e.g., "Export May 2026")
  - By date range
  - All time

### 4.2 Auto-Formatting

- Header rows are bold and colored
- Amounts are formatted as currency (₹)
- Conditional color formatting applied to budget columns (green/yellow/red)

---

## 5. Design & Theme

### 5.1 Overall Aesthetic

- **Dark mode by default** with a toggle for light mode
- Modern, minimal card-based layout
- Accent color: Deep Indigo / Violet (#6C63FF) with white and dark-grey surfaces
- Rounded corners, subtle shadows, smooth transitions
- Mobile-first responsive design

### 5.2 Key UI Components

- **Dashboard** — Summary cards (Total Spent, Savings, Budget Status), quick-add button, recent transactions list
- **Transaction Log** — Searchable, filterable list with category icons and color tags
- **Budget Page** — Progress bars with category icons, edit budget inline
- **Analytics Page** — Charts with smooth animations, time range selector
- **Add Transaction Sheet** — Bottom sheet / modal with clean form, large tap targets

### 5.3 Branding Elements

- App name idea: **FinSight** / **SpendTrack** / **Rupee Radar**
- Custom category icons (emoji or outlined icon set like Lucide or Heroicons)
- Subtle gradient backgrounds on cards
- Micro-animations on chart load and budget updates

---

## 6. Data Storage

- All transactions stored locally in the device (offline-first)
- Optional **cloud sync** via Google Drive (backup/restore)
- Data persists across sessions
- Option to **clear all data** with a confirmation prompt

---

## 7. Additional Features (Nice to Have)

- **Recurring Transactions** — Mark subscriptions (Netflix, gym, etc.) as recurring and auto-log monthly
- **Lending Tracker** — Dedicated section to track money given to or borrowed from people
- **Search & Filter** — Search by merchant name, filter by category, date range, or type
- **Dark/Light Mode Toggle**
- **PIN / Biometric Lock** for app privacy
- **Widgets** (mobile) — Quick-glance spending summary on home screen

---

## 8. Tech Stack Suggestion

| Layer | Recommended Option |
|---|---|
| Frontend | React Native (mobile) or React.js (web) |
| Charts | Recharts / Victory Native |
| Excel Export | SheetJS (xlsx) |
| Local Storage | AsyncStorage / SQLite |
| Cloud Backup | Google Drive API |
| Gmail/GPay Parsing | Gmail API (OAuth 2.0) |
| SMS Parsing | Android SMS Permissions (React Native) |

---

*Document Version: 1.0 — Created June 2026*
