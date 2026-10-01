/**
 * Centralized formatting utilities for dates, currency, and greetings.
 */

/**
 * Format currency using Indian Numbering System (en-IN).
 * Ensures proper sign placement (e.g. -₹160 instead of ₹-160).
 */
export const formatCurrency = (amount, options = {}) => {
  const { showSymbol = true, compact = false } = options;
  const numericVal = Number(amount) || 0;
  const isNegative = numericVal < 0;
  const absVal = Math.abs(numericVal);

  if (compact && absVal >= 100000) {
    const lakh = absVal / 100000;
    const formattedLakh = lakh % 1 === 0 ? lakh.toString() : lakh.toFixed(1);
    return `${isNegative ? '-' : ''}${showSymbol ? '₹' : ''}${formattedLakh}L`;
  }

  if (compact && absVal >= 1000) {
    const k = absVal / 1000;
    const formattedK = k % 1 === 0 ? k.toString() : k.toFixed(1);
    return `${isNegative ? '-' : ''}${showSymbol ? '₹' : ''}${formattedK}k`;
  }

  const formattedStr = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(absVal);

  const prefix = isNegative ? '-₹' : '₹';
  return showSymbol ? `${prefix}${formattedStr}` : `${isNegative ? '-' : ''}${formattedStr}`;
};

/**
 * Unified Date Formatter: "1 Oct 2026"
 */
export const formatDate = (dateInput) => {
  if (!dateInput) return '';
  const dateObj = new Date(dateInput);
  if (isNaN(dateObj.getTime())) return '';

  const day = dateObj.getDate();
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  const month = months[dateObj.getMonth()];
  const year = dateObj.getFullYear();

  return `${day} ${month} ${year}`;
};

/**
 * Unified Date + Time Formatter: "1 Oct 2026, 9:15 AM"
 */
export const formatDateTime = (dateInput) => {
  if (!dateInput) return '';
  const dateObj = new Date(dateInput);
  if (isNaN(dateObj.getTime())) return '';

  const datePart = formatDate(dateObj);
  const timePart = dateObj.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return `${datePart}, ${timePart}`;
};

/**
 * Unified Time Formatter: "9:15 AM"
 */
export const formatTime = (dateInput) => {
  if (!dateInput) return '';
  const dateObj = new Date(dateInput);
  if (isNaN(dateObj.getTime())) return '';

  return dateObj.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Returns greeting based strictly on current local hour.
 */
export const getGreeting = (date = new Date()) => {
  const hours = date.getHours();
  if (hours < 12) return 'Good Morning';
  if (hours < 17) return 'Good Afternoon';
  return 'Good Evening';
};

/**
 * Returns friendly relative time string (e.g. "2 min ago", "Just now", "1 hr ago").
 */
export const formatRelativeTime = (dateInput) => {
  if (!dateInput) return 'Never';
  const dateObj = new Date(dateInput);
  if (isNaN(dateObj.getTime())) return 'Never';

  const diffMs = Date.now() - dateObj.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);

  if (diffSec < 45) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHour < 24) return `${diffHour} hr ago`;
  return formatDate(dateObj);
};

