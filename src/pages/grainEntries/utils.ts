// Utility functions for grain entries

export const calculateBasis = (cashPrice: number | null, futures: number | null): number | null => {
  if (cashPrice === null || futures === null) return null;
  return cashPrice - futures;
};

export const formatPrice = (price: number | null): string => {
  if (price === null) return '-';
  return `$${price.toFixed(2)}`;
};

export const formatBasis = (basis: number | null): string => {
  if (basis === null) return '-';
  const sign = basis >= 0 ? '+' : '';
  return `${sign}$${basis.toFixed(2)}`;
};

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];