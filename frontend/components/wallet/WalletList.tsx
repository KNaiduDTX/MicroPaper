/**
 * Enhanced list of verified wallets with context and actions
 */

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { Table, TableColumn } from '@/components/ui/Table';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { EmptyWalletsState } from '@/components/ui/EmptyState';
import { complianceApi } from '@/lib/api/compliance';
import { useApi } from '@/lib/hooks/useApi';
import { useNotes } from '@/lib/hooks/useNotes';
import { formatWalletAddress, formatCurrency } from '@/lib/utils/dataFormatting';
import { CheckCircle2, ExternalLink, Copy } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { useToast } from '@/components/ui/Toast';

interface WalletWithStats {
  address: string;
  noteCount: number;
  totalAmount: number;
  isVerified: boolean;
}

export const WalletList: React.FC = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const verifiedWallets = useApi(complianceApi.getVerifiedWallets);
  const { fetchNotes } = useNotes();
  const [walletsWithStats, setWalletsWithStats] = useState<WalletWithStats[]>([]);

  useEffect(() => {
    verifiedWallets.execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (verifiedWallets.data?.verifiedWallets) {
      loadWalletStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verifiedWallets.data]);

  const loadWalletStats = async () => {
    try {
      const notes = await fetchNotes({ limit: 1000 });
      if (notes && Array.isArray(notes)) {
        const walletMap = new Map<string, { count: number; amount: number }>();
        
        notes.forEach((note) => {
          const existing = walletMap.get(note.wallet_address) || { count: 0, amount: 0 };
          walletMap.set(note.wallet_address, {
            count: existing.count + 1,
            amount: existing.amount + note.amount,
          });
        });

        const wallets = (verifiedWallets.data?.verifiedWallets || []).map((address) => ({
          address,
          noteCount: walletMap.get(address)?.count || 0,
          totalAmount: walletMap.get(address)?.amount || 0,
          isVerified: true,
        }));

        setWalletsWithStats(wallets);
      }
    } catch (error) {
      console.error('Error loading wallet stats:', error);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast({
      type: 'success',
      title: 'Copied!',
      message: `${label} copied to clipboard`,
      duration: 2000,
    });
  };

  if (verifiedWallets.loading) {
    return (
      <Card title="Verified Wallets">
        <div className="py-8">
          <SkeletonTable rows={5} columns={4} />
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

  const columns: TableColumn<WalletWithStats>[] = [
    {
      key: 'address',
      header: 'Wallet Address',
      sortable: true,
      sortFn: (a, b) => a.address.localeCompare(b.address),
      render: (item: WalletWithStats) => (
        <div className="flex items-center gap-2 group">
          <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
          <Tooltip content={item.address}>
            <span className="font-mono text-sm text-gray-900">
              {formatWalletAddress(item.address, 8, 6)}
            </span>
          </Tooltip>
          <button
            onClick={(e) => {
              e.stopPropagation();
              copyToClipboard(item.address, 'Wallet address');
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600"
          >
            <Copy className="h-3 w-3" />
          </button>
        </div>
      ),
    },
    {
      key: 'noteCount',
      header: 'Notes',
      sortable: true,
      sortFn: (a, b) => a.noteCount - b.noteCount,
      align: 'right',
      render: (item: WalletWithStats) => (
        <span className="font-semibold">{item.noteCount}</span>
      ),
    },
    {
      key: 'totalAmount',
      header: 'Total Amount',
      sortable: true,
      sortFn: (a, b) => a.totalAmount - b.totalAmount,
      align: 'right',
      render: (item: WalletWithStats) => (
        <span className="font-semibold">{formatCurrency(item.totalAmount)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item: WalletWithStats) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/wallet/${item.address}`);
          }}
          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          View <ExternalLink className="h-3 w-3" />
        </button>
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
      {walletsWithStats.length === 0 ? (
        <EmptyWalletsState />
      ) : (
        <Table
          columns={columns}
          data={walletsWithStats}
          onRowClick={(wallet) => router.push(`/wallet/${wallet.address}`)}
          stickyHeader
        />
      )}
    </Card>
  );
};

