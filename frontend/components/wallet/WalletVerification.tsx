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
import { useToast } from '@/components/ui/Toast';
import { WalletStatus } from './WalletStatus';

export const WalletVerification: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState('');
  const { verify, unverify, checkStatus } = useWallet();
  const { showToast } = useToast();

  const getErrorMessage = (error: any): string => {
    if (!error) return 'An unexpected error occurred';
    
    const errorCode = error.error?.code;
    const errorMessage = error.error?.message || 'Operation failed';
    
    switch (errorCode) {
      case 'NETWORK_ERROR':
        return 'Unable to connect to the server. Please check your internet connection.';
      case 'UNAUTHORIZED':
        return 'Authentication failed. Please refresh the page.';
      case 'VALIDATION_ERROR':
        return errorMessage || 'Invalid wallet address format.';
      default:
        return errorMessage || 'An error occurred. Please try again.';
    }
  };

  const handleVerify = async () => {
    if (!walletAddress) return;
    try {
      const result = await verify.execute(walletAddress);
      if (result) {
        showToast({
          type: 'success',
          title: 'Wallet Verified',
          message: result.message || `Wallet ${walletAddress.slice(0, 10)}... has been verified.`,
        });
        // Refresh status after verification
        setTimeout(() => {
          checkStatus.execute(walletAddress);
        }, 500);
      }
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Verification Failed',
        message: getErrorMessage(verify.error),
      });
    }
  };

  const handleUnverify = async () => {
    if (!walletAddress) return;
    try {
      const result = await unverify.execute(walletAddress);
      if (result) {
        showToast({
          type: 'success',
          title: 'Wallet Unverified',
          message: result.message || `Wallet ${walletAddress.slice(0, 10)}... has been unverified.`,
        });
        // Refresh status after unverification
        setTimeout(() => {
          checkStatus.execute(walletAddress);
        }, 500);
      }
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Unverification Failed',
        message: getErrorMessage(unverify.error),
      });
    }
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
              message={getErrorMessage(verify.error)}
              onClose={() => verify.reset()}
            />
          )}

          {unverify.error && (
            <Alert
              type="error"
              title="Unverification Error"
              message={getErrorMessage(unverify.error)}
              onClose={() => unverify.reset()}
            />
          )}

          <div className="flex space-x-4">
            <Button
              variant="primary"
              onClick={handleVerify}
              isLoading={verify.loading}
              disabled={!walletAddress || verify.loading}
            >
              {verify.loading ? 'Verifying...' : 'Verify Wallet'}
            </Button>
            <Button
              variant="danger"
              onClick={handleUnverify}
              isLoading={unverify.loading}
              disabled={!walletAddress || unverify.loading}
            >
              {unverify.loading ? 'Unverifying...' : 'Unverify Wallet'}
            </Button>
          </div>
        </div>
      </Card>

      {walletAddress && <WalletStatus walletAddress={walletAddress} />}
    </div>
  );
};

