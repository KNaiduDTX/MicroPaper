/**
 * Compliance status hook
 */

import { useApi } from './useApi';
import { complianceApi } from '@/lib/api/compliance';
import { ComplianceStats, VerifiedWalletsResponse } from '@/types/compliance';

export function useCompliance() {
  const stats = useApi<ComplianceStats>(complianceApi.getStats);
  const verifiedWallets = useApi<VerifiedWalletsResponse>(complianceApi.getVerifiedWallets);

  return {
    stats,
    verifiedWallets,
    refreshStats: () => stats.execute(),
    refreshVerifiedWallets: () => verifiedWallets.execute(),
  };
}

