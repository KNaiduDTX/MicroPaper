'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useNotes } from '@/lib/hooks/useNotes';
import { NoteIssuance } from '@/lib/api/custodian';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { EmptyNotesState, EmptySearchState } from '@/components/ui/EmptyState';
import { Tooltip } from '@/components/ui/Tooltip';
import { Search, Plus, ExternalLink, Filter, Download, Copy } from 'lucide-react';
import { downloadCSV, formatDateForExport } from '@/lib/utils/export';
import { useToast } from '@/components/ui/Toast';
import { TableColumn } from '@/components/ui/Table';
import {
  formatCurrency,
  formatDate,
  formatWalletAddress,
  formatDaysUntilMaturity,
  getDaysUntil,
} from '@/lib/utils/dataFormatting';

type NoteStatus = 'all' | 'issued' | 'redeemed' | 'expired';

export default function NotesListPage() {
  const router = useRouter();
  const { fetchNotes, loading, error, data } = useNotes();
  const { showToast } = useToast();
  const [walletFilter, setWalletFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<NoteStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [notes, setNotes] = useState<NoteIssuance[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const params = walletFilter ? { wallet_address: walletFilter } : undefined;
      const result = await fetchNotes(params);
      if (result) {
        // Ensure result is an array
        setNotes(Array.isArray(result) ? result : []);
      } else {
        setNotes([]);
      }
    } catch (err) {
      console.error('Error loading notes:', err);
      setNotes([]);
    }
  };

  const handleFilter = () => {
    setCurrentPage(1); // Reset to first page when filtering
    loadNotes();
  };

  const handleClearFilter = () => {
    setWalletFilter('');
    setStatusFilter('all');
    setSearchQuery('');
    setCurrentPage(1);
    loadNotes();
  };

  // Filter and search notes
  const filteredNotes = useMemo(() => {
    let result = notes;

    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter((note) => note.status.toLowerCase() === statusFilter.toLowerCase());
    }

    // Search by ISIN, wallet address, or amount
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((note) => {
        return (
          note.isin.toLowerCase().includes(query) ||
          note.wallet_address.toLowerCase().includes(query) ||
          note.amount.toString().includes(query)
        );
      });
    }

    return result;
  }, [notes, statusFilter, searchQuery]);

  // Paginate filtered notes
  const paginatedNotes = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredNotes.slice(startIndex, endIndex);
  }, [filteredNotes, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredNotes.length / pageSize);

  const handleExport = () => {
    try {
      const exportData = filteredNotes.map((note) => ({
        ISIN: note.isin,
        'Wallet Address': note.wallet_address,
        Amount: note.amount,
        Status: note.status,
        'Maturity Date': formatDateForExport(note.maturity_date),
        'Issued At': formatDateForExport(note.issued_at),
        'Created At': formatDateForExport(note.created_at),
      }));

      const filename = `micropaper-notes-${new Date().toISOString().split('T')[0]}.csv`;
      downloadCSV(exportData, filename);
      
      showToast({
        type: 'success',
        title: 'Export Successful',
        message: `Exported ${exportData.length} notes to CSV`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Export error:', error);
      showToast({
        type: 'error',
        title: 'Export Failed',
        message: 'Failed to export notes. Please try again.',
      });
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      issued: {
        style: 'bg-green-100 text-green-800 border-green-200',
        icon: '✓',
      },
      redeemed: {
        style: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: '✓',
      },
      expired: {
        style: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: '✗',
      },
      default: {
        style: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: '?',
      },
    };

    const config = statusConfig[status.toLowerCase() as keyof typeof statusConfig] || statusConfig.default;

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${config.style} flex items-center gap-1 w-fit`}>
        <span>{config.icon}</span>
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
      key: 'wallet_address',
      header: 'Wallet Address',
      sortable: true,
      sortFn: (a, b) => a.wallet_address.localeCompare(b.wallet_address),
      render: (note: NoteIssuance) => (
        <div className="flex items-center gap-2 group">
          <Tooltip content={note.wallet_address}>
            <span className="font-mono text-xs text-gray-600">
              {formatWalletAddress(note.wallet_address, 8, 6)}
            </span>
          </Tooltip>
          <button
            onClick={(e) => {
              e.stopPropagation();
              copyToClipboard(note.wallet_address, 'Wallet address');
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600"
          >
            <Copy className="h-3 w-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/wallet/${note.wallet_address}`);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 hover:text-blue-800"
          >
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>
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
      key: 'issued_at',
      header: 'Issued',
      sortable: true,
      sortFn: (a, b) => {
        const dateA = new Date(a.issued_at).getTime();
        const dateB = new Date(b.issued_at).getTime();
        return dateA - dateB;
      },
      render: (note: NoteIssuance) => formatDate(note.issued_at),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notes</h1>
            <p className="text-gray-600 mt-2">
              View and manage all issued traditional notes
            </p>
          </div>
          <div className="flex items-center gap-2">
            {filteredNotes.length > 0 && (
              <Tooltip content="Export all filtered notes to CSV">
                <Button
                  onClick={handleExport}
                  variant="outline"
                  className="flex items-center gap-2"
                  disabled={loading}
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </Tooltip>
            )}
            <Tooltip content="Issue a new traditional note">
              <Button
                onClick={() => router.push('/notes/issue')}
                variant="primary"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Issue New Note
              </Button>
            </Tooltip>
          </div>
        </div>

        <Card>
          <div className="mb-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Notes
              </label>
              <Input
                type="text"
                placeholder="Search by ISIN, wallet address, or amount..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Wallet Address
                </label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="0x..."
                    value={walletFilter}
                    onChange={(e) => setWalletFilter(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleFilter()}
                    className="flex-1"
                  />
                  <Tooltip content="Search by wallet address">
                    <Button
                      onClick={handleFilter}
                      variant="outline"
                      disabled={loading}
                      className="flex items-center gap-2"
                    >
                      <Search className="h-4 w-4" />
                      Search
                    </Button>
                  </Tooltip>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Status
                </label>
                <div className="flex gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value as NoteStatus);
                      setCurrentPage(1);
                    }}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="issued">Issued</option>
                    <option value="redeemed">Redeemed</option>
                    <option value="expired">Expired</option>
                  </select>
                  <Tooltip content="Filter notes by status">
                    <div className="flex items-center px-3 border border-gray-300 rounded-md bg-gray-50">
                      <Filter className="h-4 w-4 text-gray-600" />
                    </div>
                  </Tooltip>
                </div>
              </div>
            </div>
            {(walletFilter || statusFilter !== 'all' || searchQuery) && (
              <div className="mt-4">
                <Button onClick={handleClearFilter} variant="outline" size="sm" disabled={loading}>
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>

          {error && (
            <Alert
              type="error"
              title="Error Loading Notes"
              message={
                error.error.message ||
                'Failed to load notes. Please check your connection and try again.'
              }
            />
          )}

          {loading && (
            <div className="py-8">
              <SkeletonTable rows={5} columns={7} />
            </div>
          )}

          {!loading && !error && (
            <div>
              {filteredNotes.length === 0 ? (
                notes.length === 0 ? (
                  <EmptyNotesState
                    onIssueNote={() => router.push('/notes/issue')}
                  />
                ) : (
                  <EmptySearchState onClearSearch={handleClearFilter} />
                )
              ) : (
                <>
                  <Table
                    columns={columns}
                    data={paginatedNotes}
                    onRowClick={(note) => router.push(`/notes/${note.id}`)}
                    stickyHeader
                  />
                  {totalPages > 1 && (
                    <div className="mt-6">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        pageSize={pageSize}
                        totalItems={filteredNotes.length}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={(size) => {
                          setPageSize(size);
                          setCurrentPage(1);
                        }}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
