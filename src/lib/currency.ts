/**
 * Formats a number as Indian Rupee (INR) currency
 * 
 * @param value The number value to format
 * @param options Additional formatting options
 * @returns A formatted currency string
 */
export function formatCurrency(value: number, options?: Intl.NumberFormatOptions): string {
  const defaultOptions: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    ...options
  };
  
  return new Intl.NumberFormat('en-IN', defaultOptions).format(value);
}

/**
 * Formats a number with Indian number system (lakhs, crores)
 * 
 * @param value The number value to format
 * @returns A formatted string with Indian number system
 */
export function formatIndianNumber(value: number): string {
  return new Intl.NumberFormat('en-IN').format(value);
}

/**
 * Converts a number to a compact format for display (K for thousands, L for lakhs, Cr for crores)
 * 
 * @param value The number value to convert
 * @returns A string with compact representation
 */
export function formatCompactIndian(value: number): string {
  if (value >= 10000000) {
    return `${(value / 10000000).toFixed(2)} Cr`;
  } else if (value >= 100000) {
    return `${(value / 100000).toFixed(2)} L`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(2)} K`;
  }
  return value.toFixed(2);
}