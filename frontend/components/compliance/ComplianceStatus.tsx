/**
 * Check wallet compliance status
 */

'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { WalletAddressInput } from '@/components/forms/WalletAddressInput';
import { WalletStatus } from '@/components/wallet/WalletStatus';
import { useWallet } from '@/lib/hooks/useWallet';

export const ComplianceStatus: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState('');
  const { checkStatus } = useWallet();

  const handleCheck = () => {
    if (walletAddress) {
      checkStatus.execute(walletAddress);
    }
  };

  return (
    <div className="space-y-6">
      <Card title="Check Compliance Status">
        <div className="space-y-4">
          <WalletAddressInput
            value={walletAddress}
            onChange={setWalletAddress}
            label="Wallet Address"
          />
          <Button
            variant="primary"
            onClick={handleCheck}
            isLoading={checkStatus.loading}
            disabled={!walletAddress}
          >
            Check Status
          </Button>
        </div>
      </Card>

      {walletAddress && checkStatus.data && (
        <WalletStatus walletAddress={walletAddress} />
      )}
    </div>
  );
};

