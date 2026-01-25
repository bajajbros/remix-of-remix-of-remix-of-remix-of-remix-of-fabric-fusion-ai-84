// Export utilities for CSV and data downloads

export interface ExportColumn<T> {
  header: string;
  accessor: keyof T | ((item: T) => string | number | null | undefined);
}

export function exportToCSV<T>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string
): void {
  if (data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Create CSV header
  const headers = columns.map(col => `"${col.header}"`).join(',');

  // Create CSV rows
  const rows = data.map(item => {
    return columns.map(col => {
      let value: unknown;
      if (typeof col.accessor === 'function') {
        value = col.accessor(item);
      } else {
        value = item[col.accessor];
      }
      
      // Handle null/undefined
      if (value === null || value === undefined) {
        return '""';
      }
      
      // Format dates
      if (value instanceof Date) {
        return `"${value.toISOString()}"`;
      }
      
      // Escape quotes and wrap in quotes
      const stringValue = String(value);
      return `"${stringValue.replace(/"/g, '""')}"`;
    }).join(',');
  });

  // Combine header and rows
  const csv = [headers, ...rows].join('\n');

  // Create blob and download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Common Indian GST rates
export const GST_RATES = [
  { value: 0, label: 'Exempt (0%)', description: 'Essential commodities, fresh produce' },
  { value: 5, label: '5% GST', description: 'Packaged food, footwear below ₹1000' },
  { value: 12, label: '12% GST', description: 'Apparel above ₹1000, processed food' },
  { value: 18, label: '18% GST', description: 'Standard rate - most textiles & services' },
  { value: 28, label: '28% GST', description: 'Luxury items, premium products' },
] as const;

export type GSTRate = typeof GST_RATES[number]['value'];

export function calculateGST(subtotal: number, gstRate: GSTRate): { tax: number; total: number } {
  const tax = (subtotal * gstRate) / 100;
  return { tax, total: subtotal + tax };
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return '-';
  }
}

export function formatCurrencyFull(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
