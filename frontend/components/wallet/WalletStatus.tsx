/**
 * Display wallet verification status
 */

'use client';

import React, { useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Alert } from '@/components/ui/Alert';
import { useWallet } from '@/lib/hooks/useWallet';
import { CheckCircle2, XCircle } from 'lucide-react';

interface WalletStatusProps {
  walletAddress: string;
}

export const WalletStatus: React.FC<WalletStatusProps> = ({ walletAddress }) => {
  const { checkStatus } = useWallet();

  useEffect(() => {
    if (walletAddress) {
      checkStatus.execute(walletAddress);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletAddress]);

  if (checkStatus.loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </div>
      </Card>
    );
  }

  if (checkStatus.error) {
    return (
      <Card>
        <Alert
          type="error"
          title="Error"
          message={checkStatus.error.error.message || 'Failed to check wallet status'}
        />
      </Card>
    );
  }

  const isVerified = checkStatus.data?.isVerified ?? false;

  return (
    <Card>
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Wallet Address</h3>
          <p className="text-sm font-mono text-gray-900 break-all">{walletAddress}</p>
        </div>

        <div className="flex items-center space-x-3">
          {isVerified ? (
            <>
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              <div>
                <p className="text-sm font-medium text-green-700">Verified</p>
                <p className="text-xs text-gray-500">This wallet is verified for compliance</p>
              </div>
            </>
          ) : (
            <>
              <XCircle className="h-6 w-6 text-red-500" />
              <div>
                <p className="text-sm font-medium text-red-700">Not Verified</p>
                <p className="text-xs text-gray-500">This wallet is not verified</p>
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};

