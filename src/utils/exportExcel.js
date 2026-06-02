import * as XLSX from 'xlsx';
import { format, parseISO } from 'date-fns';

export function exportTransactionsToExcel(transactions, budgets) {
  // Sheet 1: All Transactions
  const txData = transactions.map(tx => ({
    Date: format(parseISO(tx.date), 'yyyy-MM-dd'),
    Category: tx.category,
    Recipient: tx.recipient,
    Amount: tx.amount,
    Type: tx.type,
    'Payment Method': tx.method,
    Note: tx.note || ''
  }));
  const wsAll = XLSX.utils.json_to_sheet(txData);

  // Sheet 2: Monthly Summary
  const monthlyDataMap = {};
  transactions.forEach(tx => {
    const month = format(parseISO(tx.date), 'yyyy-MM');
    if (!monthlyDataMap[month]) {
      monthlyDataMap[month] = { Income: 0, Expense: 0 };
    }
    if (tx.type === 'Income') monthlyDataMap[month].Income += tx.amount;
    if (tx.type === 'Expense') monthlyDataMap[month].Expense += tx.amount;
  });

  const summaryData = Object.entries(monthlyDataMap).map(([month, data]) => ({
    Month: month,
    'Total Income': data.Income,
    'Total Expenses': data.Expense,
    'Net Savings': data.Income - data.Expense
  }));
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);

  // Sheet 3: Category Breakdown
  const catData = Object.entries(budgets).map(([category, b]) => ({
    Category: category,
    'Amount Spent': b.spent,
    'Budget Set': b.limit,
    'Remaining': Math.max(b.limit - b.spent, 0),
    '% Used': b.limit > 0 ? `${Math.round((b.spent / b.limit) * 100)}%` : '0%'
  }));
  const wsCat = XLSX.utils.json_to_sheet(catData);

  // Build Workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsAll, 'All Transactions');
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Monthly Summary');
  XLSX.utils.book_append_sheet(wb, wsCat, 'Category Breakdown');

  // Download
  XLSX.writeFile(wb, `Finance_Export_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
}
