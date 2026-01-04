'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { WalletStatus } from '@/components/wallet/WalletStatus';
import { Card } from '@/components/ui/Card';

export default function WalletDetailPage() {
  const params = useParams();
  const address = params.address as string;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Wallet Details</h1>
          <p className="text-gray-600 mt-2">View wallet information and compliance status</p>
        </div>

        <div className="space-y-6">
          <WalletStatus walletAddress={address} />

          <Card title="Additional Information">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Wallet Address</p>
                <p className="text-sm font-mono text-gray-900 break-all mt-1">{address}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  This wallet detail page shows the verification status and compliance information.
                  Additional features like transaction history and associated notes can be added here.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

