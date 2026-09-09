export function formatPrice(price: number | null, priceType: string, currency = 'NGN'): string {
  if (priceType === 'ON_REQUEST' || price === null) return 'Price on request';
  if (priceType === 'FREE' || price === 0) return 'Free';
  const symbol = currency === 'NGN' ? '₦' : currency;
  return `${symbol}${price.toLocaleString('en-NG')}`;
}

export function formatCondition(condition: string): string {
  switch (condition) {
    case 'NEW': return 'Brand New';
    case 'USED': return 'Used';
    case 'REFURBISHED': return 'Refurbished';
    default: return condition;
  }
}

export function timeAgo(iso: string): string {
  const diffMs = Math.max(0, Date.now() - new Date(iso).getTime());
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'U';
}
