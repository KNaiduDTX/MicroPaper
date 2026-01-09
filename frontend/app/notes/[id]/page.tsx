'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useNotes } from '@/lib/hooks/useNotes';
import { NoteIssuance } from '@/lib/api/custodian';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { useToast } from '@/components/ui/Toast';
import { ArrowLeft, Copy, ExternalLink, Printer } from 'lucide-react';
import {
  formatDate,
  formatDateTime,
  formatCurrency,
  formatDaysUntilMaturity,
  getDaysUntil,
} from '@/lib/utils/dataFormatting';
import { Table, TableColumn } from '@/components/ui/Table';

export default function NoteDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const noteId = params?.id as string;
  const { fetchNotes, loading, error } = useNotes();
  const { showToast } = useToast();
  const [note, setNote] = useState<NoteIssuance | null>(null);
  const [allNotes, setAllNotes] = useState<NoteIssuance[]>([]);

  useEffect(() => {
    if (noteId) {
      loadNote();
    }
  }, [noteId]);

  const loadNote = async () => {
    try {
      const notes = await fetchNotes({ limit: 1000 });
      if (notes && Array.isArray(notes)) {
        setAllNotes(notes);
        const foundNote = notes.find((n) => n.id.toString() === noteId);
        if (foundNote) {
          setNote(foundNote);
        }
      }
    } catch (err) {
      console.error('Error loading note:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      issued: 'bg-green-100 text-green-800 border-green-200',
      redeemed: 'bg-blue-100 text-blue-800 border-blue-200',
      expired: 'bg-gray-100 text-gray-800 border-gray-200',
      default: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    };

    const style = statusStyles[status as keyof typeof statusStyles] || statusStyles.default;

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${style}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const copyToClipboard = (text: string, label: string = 'Text') => {
    navigator.clipboard.writeText(text);
    showToast({
      type: 'success',
      title: 'Copied!',
      message: `${label} copied to clipboard`,
      duration: 2000,
    });
  };

  // Get related notes (notes from same wallet)
  const relatedNotes = allNotes.filter(
    (n) => n.wallet_address === note?.wallet_address && n.id.toString() !== noteId
  ).slice(0, 5);

  const relatedNotesColumns: TableColumn<NoteIssuance>[] = [
    {
      key: 'isin',
      header: 'ISIN',
      render: (n: NoteIssuance) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/notes/${n.id}`);
          }}
          className="text-blue-600 hover:text-blue-800 font-mono text-sm hover:underline"
        >
          {n.isin}
        </button>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (n: NoteIssuance) => (
        <span className="font-semibold">{formatCurrency(n.amount)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (n: NoteIssuance) => getStatusBadge(n.status),
    },
    {
      key: 'maturity_date',
      header: 'Maturity',
      render: (n: NoteIssuance) => formatDate(n.maturity_date),
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Alert
            type="error"
            title="Error Loading Note"
            message={
              error.error.message ||
              'Failed to load note details. Please check your connection and try again.'
            }
          />
          <Button onClick={() => router.push('/notes')} variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Notes
          </Button>
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Alert
            type="warning"
            title="Note Not Found"
            message="The note you're looking for doesn't exist or has been removed."
          />
          <Button onClick={() => router.push('/notes')} variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Notes
          </Button>
        </div>
      </div>
    );
  }

  const maturityInfo = formatDateTime(note.maturity_date, 'MMMM dd, yyyy', 'hh:mm a');
  const issuedInfo = formatDateTime(note.issued_at, 'MMMM dd, yyyy', 'hh:mm a');
  const createdInfo = formatDateTime(note.created_at, 'MMMM dd, yyyy', 'hh:mm a');
  const daysUntilMaturity = getDaysUntil(note.maturity_date);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="no-print">
          <Breadcrumb
            items={[
              { label: 'Notes', href: '/notes' },
              { label: note.isin },
            ]}
            className="mb-6"
          />
        </div>

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Note Details</h1>
            <p className="text-gray-600 mt-2">View detailed information about this note</p>
          </div>
          <Tooltip content="Print this note">
            <Button
              onClick={() => window.print()}
              variant="outline"
              className="no-print flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </Tooltip>
        </div>

        <div className="space-y-6">
          <Card title="Note Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">ISIN</label>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-semibold text-gray-900">
                    {note.isin}
                  </span>
                  <Tooltip content="Copy ISIN to clipboard">
                    <button
                      onClick={() => copyToClipboard(note.isin, 'ISIN')}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </Tooltip>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                <div>{getStatusBadge(note.status)}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Amount</label>
                <span className="text-2xl font-bold text-gray-900">{formatCurrency(note.amount)}</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Days Until Maturity
                </label>
                <span className="text-xl font-semibold text-gray-900">
                  {daysUntilMaturity !== null
                    ? daysUntilMaturity > 0
                      ? `${daysUntilMaturity} days`
                      : daysUntilMaturity === 0
                      ? 'Matures today'
                      : `Expired ${Math.abs(daysUntilMaturity)} days ago`
                    : 'N/A'}
                </span>
              </div>
            </div>
          </Card>

          <Card title="Wallet Information">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Wallet Address
              </label>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-gray-900">{note.wallet_address}</span>
                <Tooltip content="Copy wallet address to clipboard">
                  <button
                    onClick={() => copyToClipboard(note.wallet_address, 'Wallet address')}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </Tooltip>
                <Tooltip content="View wallet details">
                  <button
                    onClick={() => router.push(`/wallet/${note.wallet_address}`)}
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    View Wallet <ExternalLink className="h-3 w-3" />
                  </button>
                </Tooltip>
              </div>
            </div>
          </Card>

          <Card title="Dates">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Maturity Date
                </label>
                <div className="text-gray-900">
                  <div className="font-semibold">{maturityInfo.date}</div>
                  <div className="text-sm text-gray-600">{maturityInfo.time}</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Issued At</label>
                <div className="text-gray-900">
                  <div className="font-semibold">{issuedInfo.date}</div>
                  <div className="text-sm text-gray-600">{issuedInfo.time}</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Created At</label>
                <div className="text-gray-900">
                  <div className="font-semibold">{createdInfo.date}</div>
                  <div className="text-sm text-gray-600">{createdInfo.time}</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Related Notes */}
          {relatedNotes.length > 0 && (
            <Card title="Related Notes (Same Wallet)">
              <p className="text-sm text-gray-600 mb-4">
                {relatedNotes.length} other note{relatedNotes.length !== 1 ? 's' : ''} from this wallet
              </p>
              <Table
                columns={relatedNotesColumns}
                data={relatedNotes}
                onRowClick={(n) => router.push(`/notes/${n.id}`)}
              />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
