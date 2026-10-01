/**
 * Utility to export finance transactions to a clean CSV file.
 */
import { formatDate } from './formatters';

export const exportToCSV = (transactions = [], filename = 'finance_transactions_export.csv') => {
  if (!transactions || transactions.length === 0) {
    alert('No transactions available to export.');
    return;
  }

  const headers = ['ID', 'Date', 'Type', 'Category', 'Recipient / Title', 'Amount (INR)', 'Payment Method', 'Note', 'Settled'];

  const rows = transactions.map((t) => [
    `"${t.id || ''}"`,
    `"${formatDate(t.date)}"`,
    `"${t.type || 'Expense'}"`,
    `"${t.category || ''}"`,
    `"${(t.recipient || '').replace(/"/g, '""')}"`,
    t.amount || 0,
    `"${t.method || 'Cash'}"`,
    `"${(t.note || '').replace(/"/g, '""')}"`,
    t.settled ? 'Yes' : 'No',
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
