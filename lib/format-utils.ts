/**
 * Format a number as Indonesian Rupiah
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a date as Indonesian format
 */
export function formatDate(date: string | Date): string {
  if (!date) return '-';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Format a date with time as Indonesian format
 */
export function formatDateTime(date: string | Date): string {
  if (!date) return '-';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format a transaction type for display
 */
export function formatTransactionType(type: string): string {
  switch (type) {
    case 'masuk':
      return 'Masuk';
    case 'keluar':
      return 'Keluar';
    default:
      return type;
  }
}

/**
 * Format a transaction category for display
 */
export function formatTransactionCategory(category: string): string {
  switch (category) {
    case 'setoran':
      return 'Setoran';
    case 'penarikan':
      return 'Penarikan';
    case 'transfer':
      return 'Transfer';
    case 'pembayaran':
      return 'Pembayaran';
    default:
      return category;
  }
}

/**
 * Get color for transaction type
 */
export function getTransactionColor(type: string): string {
  switch (type) {
    case 'masuk':
      return '#2ec27e'; // Green
    case 'keluar':
      return '#e01b24'; // Red
    default:
      return '#3584e4'; // Blue
  }
}
