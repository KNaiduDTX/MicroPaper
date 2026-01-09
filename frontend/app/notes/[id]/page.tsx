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

export default function NoteDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const noteId = params?.id as string;
  const { fetchNotes, loading, error } = useNotes();
  const { showToast } = useToast();
  const [note, setNote] = useState<NoteIssuance | null>(null);

  useEffect(() => {
    if (noteId) {
      loadNote();
    }
  }, [noteId]);

  const loadNote = async () => {
    try {
      const notes = await fetchNotes({ limit: 1000 });
      if (notes && Array.isArray(notes)) {
        const foundNote = notes.find((n) => n.id.toString() === noteId);
        if (foundNote) {
          setNote(foundNote);
        }
      }
    } catch (err) {
      console.error('Error loading note:', err);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      // Handle malformed dates with both +00:00 and Z
      let cleanDateString = dateString;
      if (dateString.includes('+00:00Z')) {
        cleanDateString = dateString.replace('+00:00Z', 'Z');
      } else if (dateString.includes('+00:00') && !dateString.endsWith('Z')) {
        cleanDateString = dateString.replace('+00:00', '') + 'Z';
      }
      
      const date = new Date(cleanDateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', dateString);
        return {
          date: dateString,
          time: '',
          full: dateString,
        };
      }
      
      return {
        date: date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          timeZone: 'UTC',
        }),
        time: date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'UTC',
        }),
        full: date.toLocaleString('en-US', { timeZone: 'UTC' }),
      };
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return {
        date: dateString,
        time: '',
        full: dateString,
      };
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
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

  const getDaysUntilMaturity = (maturityDate: string) => {
    try {
      // Handle malformed dates with both +00:00 and Z
      let cleanDateString = maturityDate;
      if (maturityDate.includes('+00:00Z')) {
        cleanDateString = maturityDate.replace('+00:00Z', 'Z');
      } else if (maturityDate.includes('+00:00') && !maturityDate.endsWith('Z')) {
        cleanDateString = maturityDate.replace('+00:00', '') + 'Z';
      }
      
      const maturity = new Date(cleanDateString);
      const now = new Date();
      
      // Check if dates are valid
      if (isNaN(maturity.getTime())) {
        console.warn('Invalid maturity date:', maturityDate);
        return null;
      }
      
      // Calculate difference in milliseconds
      const diff = maturity.getTime() - now.getTime();
      
      // Convert to days (round down for negative, round up for positive)
      const days = diff >= 0 
        ? Math.ceil(diff / (1000 * 60 * 60 * 24))
        : Math.floor(diff / (1000 * 60 * 60 * 24));
      
      return days;
    } catch (error) {
      console.error('Error calculating days until maturity:', maturityDate, error);
      return null;
    }
  };

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

  const maturityInfo = formatDate(note.maturity_date);
  const issuedInfo = formatDate(note.issued_at);
  const createdInfo = formatDate(note.created_at);
  const daysUntilMaturity = getDaysUntilMaturity(note.maturity_date);

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
        </div>
      </div>
    </div>
  );
}
