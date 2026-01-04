/**
 * Wallet verification hook
 */

import { useApi } from './useApi';
import { complianceApi } from '@/lib/api/compliance';
import { ComplianceStatus } from '@/types/compliance';
import { WalletVerificationResponse } from '@/types/wallet';

export function useWallet() {
  const checkStatus = useApi<ComplianceStatus, [string]>(complianceApi.checkStatus);
  const verify = useApi<WalletVerificationResponse, [string]>(complianceApi.verifyWallet);
  const unverify = useApi<WalletVerificationResponse, [string]>(complianceApi.unverifyWallet);

  return {
    checkStatus,
    verify,
    unverify,
  };
}

