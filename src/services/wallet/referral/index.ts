// Export from comprehensive referral service
export {
  getUserReferralCode,
  applyReferralCode,
  getReferralStats,
  getReferralTransactions,
} from './referralService';

// Simple code generator function
export const generateReferralCode = (userId?: string): string => {
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return userId ? `REF-${userId.substring(0, 4)}-${random}` : `REF-${random}`;
};
