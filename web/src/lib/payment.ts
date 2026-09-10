export const PAYMENT_CONFIG = {
  bankName: 'Opay',
  accountNumber: '08165339230',
  adminEmail: 'jsmarttech4@gmail.com',
  countdownSeconds: 5 * 60,
  approvalEtaMinutes: 5,
} as const;

const TIER_PRICE: Record<string, string> = {
  FEATURED: '₦1,000',
  TOP_AD: '₦2,500',
  VIP: '₦5,000',
};

export function priceForTier(tier: string): string {
  return TIER_PRICE[tier] ?? '';
}
