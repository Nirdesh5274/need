// Currency formatting utility
export const formatCurrency = (amount, includeSymbol = true) => {
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0);
  
  return includeSymbol ? `₹${formatted}` : formatted;
};

// Format weight/quantity with unit
export const formatQuantity = (quantity, unit = 'pcs') => {
  if (unit === 'kg' || unit === 'g' || unit === 'l' || unit === 'ml') {
    return `${parseFloat(quantity).toFixed(3)} ${unit}`;
  }
  return `${parseFloat(quantity).toFixed(2)} ${unit}`;
};

// Parse number input
export const parseNumber = (value) => {
  return parseFloat(value) || 0;
};

// Format number for display
export const formatNumber = (value, decimals = 2) => {
  return parseFloat(value || 0).toFixed(decimals);
};
