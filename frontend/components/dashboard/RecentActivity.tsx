/**
 * Recent activity feed component
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Skeleton } from '@/components/ui/Skeleton';
import { useNotes } from '@/lib/hooks/useNotes';
import { NoteIssuance } from '@/lib/api/custodian';
import { useRouter } from 'next/navigation';
import { FileText, Clock, ExternalLink } from 'lucide-react';
import { formatDateForExport } from '@/lib/utils/export';

export const RecentActivity: React.FC = () => {
  const router = useRouter();
  const { fetchNotes, loading } = useNotes();
  const [recentNotes, setRecentNotes] = useState<NoteIssuance[]>([]);

  useEffect(() => {
    loadRecentActivity();
  }, []);

  const loadRecentActivity = async () => {
    try {
      const notes = await fetchNotes({ limit: 10 });
      if (notes && Array.isArray(notes)) {
        // Sort by issued_at (most recent first) and take top 5
        const sorted = [...notes]
          .sort((a, b) => {
            const dateA = new Date(a.issued_at).getTime();
            const dateB = new Date(b.issued_at).getTime();
            return dateB - dateA;
          })
          .slice(0, 5);
        setRecentNotes(sorted);
      }
    } catch (error) {
      console.error('Error loading recent activity:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      let cleanDateString = dateString;
      if (dateString.includes('+00:00Z')) {
        cleanDateString = dateString.replace('+00:00Z', 'Z');
      } else if (dateString.includes('+00:00') && !dateString.endsWith('Z')) {
        cleanDateString = dateString.replace('+00:00', '') + 'Z';
      }

      const date = new Date(cleanDateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      
      return formatDateForExport(dateString);
    } catch {
      return dateString;
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

  const getStatusColor = (status: string) => {
    const colors = {
      issued: 'text-green-600',
      redeemed: 'text-blue-600',
      expired: 'text-gray-600',
    };
    return colors[status.toLowerCase() as keyof typeof colors] || 'text-gray-600';
  };

  if (loading) {
    return (
      <Card title="Recent Activity">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton variant="circular" width={40} height={40} />
              <div className="flex-1">
                <Skeleton variant="text" width="60%" height={16} className="mb-2" />
                <Skeleton variant="text" width="40%" height={14} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (recentNotes.length === 0) {
    return (
      <Card title="Recent Activity">
        <div className="text-center py-8 text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-sm">No recent activity</p>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Recent Activity">
      <div className="space-y-4">
        {recentNotes.map((note) => (
          <div
            key={note.id}
            className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => router.push(`/notes/${note.id}`)}
          >
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  Note {note.isin} issued
                </p>
                <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span className={getStatusColor(note.status)}>
                  {note.status.toUpperCase()}
                </span>
                <span>•</span>
                <span>{formatCurrency(note.amount)}</span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatTimeAgo(note.issued_at)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={() => router.push('/notes')}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          View all notes →
        </button>
      </div>
    </Card>
  );
};
