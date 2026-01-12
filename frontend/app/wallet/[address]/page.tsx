'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { WalletStatus } from '@/components/wallet/WalletStatus';
import { Card } from '@/components/ui/Card';
import { Table, TableColumn } from '@/components/ui/Table';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { StatCard } from '@/components/ui/StatCard';
import { useNotes } from '@/lib/hooks/useNotes';
import { NoteIssuance } from '@/lib/api/custodian';
import { formatCurrency, formatDate, formatDaysUntilMaturity, getDaysUntil } from '@/lib/utils/dataFormatting';
import { FileText, DollarSign, TrendingUp, ExternalLink } from 'lucide-react';

export default function WalletDetailPage() {
  const params = useParams();
  const router = useRouter();
  const address = params.address as string;
  const { fetchNotes, loading } = useNotes();
  const [notes, setNotes] = useState<NoteIssuance[]>([]);

  useEffect(() => {
    loadNotes();
  }, [address]);

  const loadNotes = async () => {
    try {
      const result = await fetchNotes({ wallet_address: address });
      if (result && Array.isArray(result)) {
        setNotes(result);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  const stats = useMemo(() => {
    const totalNotes = notes.length;
    const totalAmount = notes.reduce((sum, note) => sum + note.amount, 0);
    const averageAmount = totalNotes > 0 ? totalAmount / totalNotes : 0;
    const issuedCount = notes.filter((n) => n.status.toLowerCase() === 'issued').length;
    const redeemedCount = notes.filter((n) => n.status.toLowerCase() === 'redeemed').length;
    const expiredCount = notes.filter((n) => n.status.toLowerCase() === 'expired').length;

    return {
      totalNotes,
      totalAmount,
      averageAmount,
      issuedCount,
      redeemedCount,
      expiredCount,
    };
  }, [notes]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      issued: 'bg-green-100 text-green-800 border-green-200',
      redeemed: 'bg-blue-100 text-blue-800 border-blue-200',
      expired: 'bg-gray-100 text-gray-800 border-gray-200',
      default: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    };

    const style = statusConfig[status.toLowerCase() as keyof typeof statusConfig] || statusConfig.default;

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${style}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const columns: TableColumn<NoteIssuance>[] = [
    {
      key: 'isin',
      header: 'ISIN',
      sortable: true,
      sortFn: (a, b) => a.isin.localeCompare(b.isin),
      render: (note: NoteIssuance) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/notes/${note.id}`);
          }}
          className="text-blue-600 hover:text-blue-800 font-mono text-sm hover:underline"
        >
          {note.isin}
        </button>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      sortFn: (a, b) => a.amount - b.amount,
      align: 'right',
      render: (note: NoteIssuance) => (
        <span className="font-semibold">{formatCurrency(note.amount)}</span>
      ),
    },
    {
      key: 'maturity_date',
      header: 'Maturity Date',
      sortable: true,
      sortFn: (a, b) => {
        const dateA = new Date(a.maturity_date).getTime();
        const dateB = new Date(b.maturity_date).getTime();
        return dateA - dateB;
      },
      render: (note: NoteIssuance) => formatDate(note.maturity_date),
    },
    {
      key: 'days_until_maturity',
      header: 'Days Until Maturity',
      sortable: true,
      sortFn: (a, b) => {
        const daysA = getDaysUntil(a.maturity_date) ?? 0;
        const daysB = getDaysUntil(b.maturity_date) ?? 0;
        return daysA - daysB;
      },
      render: (note: NoteIssuance) => {
        const days = getDaysUntil(note.maturity_date);
        if (days === null) return <span className="text-gray-400">N/A</span>;
        
        const className = days < 0 
          ? 'text-red-600 font-medium'
          : days <= 7
          ? 'text-orange-600 font-medium'
          : 'text-gray-600';
        
        return <span className={className}>{formatDaysUntilMaturity(note.maturity_date)}</span>;
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      sortFn: (a, b) => a.status.localeCompare(b.status),
      render: (note: NoteIssuance) => getStatusBadge(note.status),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (note: NoteIssuance) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/notes/${note.id}`);
          }}
          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          View <ExternalLink className="h-3 w-3" />
        </button>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Wallet Details</h1>
          <p className="text-gray-600 mt-2">View wallet information and compliance status</p>
        </div>

        <div className="space-y-6">
          <WalletStatus walletAddress={address} />

          {/* Wallet Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Total Notes"
              value={stats.totalNotes}
              icon={FileText}
              iconColor="text-blue-600"
            />
            <StatCard
              title="Total Amount"
              value={formatCurrency(stats.totalAmount)}
              icon={DollarSign}
              iconColor="text-green-600"
            />
            <StatCard
              title="Average Amount"
              value={formatCurrency(stats.averageAmount)}
              icon={TrendingUp}
              iconColor="text-purple-600"
              subtitle={`${stats.issuedCount} issued, ${stats.redeemedCount} redeemed`}
            />
          </div>

          {/* Associated Notes */}
          <Card title="Associated Notes">
            {loading ? (
              <div className="py-8 flex items-center justify-center">
                <LoadingSpinner />
              </div>
            ) : notes.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                <p>No notes associated with this wallet</p>
              </div>
            ) : (
              <Table
                columns={columns}
                data={notes}
                onRowClick={(note) => router.push(`/notes/${note.id}`)}
                stickyHeader
              />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

