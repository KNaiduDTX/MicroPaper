/**
 * Wallet verification interface
 */

'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { WalletAddressInput } from '@/components/forms/WalletAddressInput';
import { useWallet } from '@/lib/hooks/useWallet';
import { WalletStatus } from './WalletStatus';

export const WalletVerification: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState('');
  const { verify, unverify, checkStatus } = useWallet();

  const handleVerify = async () => {
    if (!walletAddress) return;
    await verify.execute(walletAddress);
    // Refresh status after verification
    setTimeout(() => {
      checkStatus.execute(walletAddress);
    }, 500);
  };

  const handleUnverify = async () => {
    if (!walletAddress) return;
    await unverify.execute(walletAddress);
    // Refresh status after unverification
    setTimeout(() => {
      checkStatus.execute(walletAddress);
    }, 500);
  };

  return (
    <div className="space-y-6">
      <Card title="Verify/Unverify Wallet">
        <div className="space-y-4">
          <WalletAddressInput
            value={walletAddress}
            onChange={setWalletAddress}
            label="Wallet Address to Verify/Unverify"
          />

          {verify.error && (
            <Alert
              type="error"
              title="Verification Error"
              message={verify.error.error.message || 'Failed to verify wallet'}
              onClose={() => verify.reset()}
            />
          )}

          {unverify.error && (
            <Alert
              type="error"
              title="Unverification Error"
              message={unverify.error.error.message || 'Failed to unverify wallet'}
              onClose={() => unverify.reset()}
            />
          )}

          {verify.data && (
            <Alert
              type="success"
              message={verify.data.message || 'Wallet verified successfully'}
              onClose={() => verify.reset()}
            />
          )}

          {unverify.data && (
            <Alert
              type="success"
              message={unverify.data.message || 'Wallet unverified successfully'}
              onClose={() => unverify.reset()}
            />
          )}

          <div className="flex space-x-4">
            <Button
              variant="primary"
              onClick={handleVerify}
              isLoading={verify.loading}
              disabled={!walletAddress}
            >
              Verify Wallet
            </Button>
            <Button
              variant="danger"
              onClick={handleUnverify}
              isLoading={unverify.loading}
              disabled={!walletAddress}
            >
              Unverify Wallet
            </Button>
          </div>
        </div>
      </Card>

      {walletAddress && <WalletStatus walletAddress={walletAddress} />}
    </div>
  );
};

