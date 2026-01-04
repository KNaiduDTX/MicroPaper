/**
 * List of verified wallets
 */

'use client';

import React, { useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Alert } from '@/components/ui/Alert';
import { Table } from '@/components/ui/Table';
import { complianceApi } from '@/lib/api/compliance';
import { useApi } from '@/lib/hooks/useApi';

export const WalletList: React.FC = () => {
  const verifiedWallets = useApi(complianceApi.getVerifiedWallets);

  useEffect(() => {
    verifiedWallets.execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (verifiedWallets.loading) {
    return (
      <Card title="Verified Wallets">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </div>
      </Card>
    );
  }

  if (verifiedWallets.error) {
    return (
      <Card title="Verified Wallets">
        <Alert
          type="error"
          title="Error"
          message={verifiedWallets.error.error.message || 'Failed to load verified wallets'}
        />
      </Card>
    );
  }

  const wallets = (verifiedWallets.data?.verifiedWallets || []).map((address) => ({
    address,
  }));

  const columns = [
    {
      key: 'address',
      header: 'Wallet Address',
      render: (item: { address: string }) => (
        <span className="font-mono text-sm">{item.address}</span>
      ),
    },
  ];

  return (
    <Card title="Verified Wallets">
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Total verified wallets: <strong>{verifiedWallets.data?.count || 0}</strong>
        </p>
      </div>
      <Table
        columns={columns}
        data={wallets}
        emptyMessage="No verified wallets found"
      />
    </Card>
  );
};

