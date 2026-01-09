/**
 * Enhanced recent activity feed component with pagination and filters
 */

'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { useNotes } from '@/lib/hooks/useNotes';
import { NoteIssuance } from '@/lib/api/custodian';
import { useRouter } from 'next/navigation';
import { FileText, Clock, ExternalLink, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { formatTimeAgo, formatCurrency } from '@/lib/utils/dataFormatting';

type ActivityFilter = 'all' | 'issued' | 'redeemed' | 'expired';

export const RecentActivity: React.FC = () => {
  const router = useRouter();
  const { fetchNotes, loading } = useNotes();
  const [allNotes, setAllNotes] = useState<NoteIssuance[]>([]);
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const [page, setPage] = useState(1);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const itemsPerPage = 5;

  useEffect(() => {
    loadRecentActivity();
  }, []);

  const loadRecentActivity = async () => {
    try {
      const notes = await fetchNotes({ limit: 100 });
      if (notes && Array.isArray(notes)) {
        // Sort by issued_at (most recent first)
        const sorted = [...notes].sort((a, b) => {
          const dateA = new Date(a.issued_at).getTime();
          const dateB = new Date(b.issued_at).getTime();
          return dateB - dateA;
        });
        setAllNotes(sorted);
      }
    } catch (error) {
      console.error('Error loading recent activity:', error);
    }
  };

  const filteredNotes = useMemo(() => {
    if (filter === 'all') return allNotes;
    return allNotes.filter((note) => note.status.toLowerCase() === filter.toLowerCase());
  }, [allNotes, filter]);

  const paginatedNotes = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    return filteredNotes.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredNotes, page]);

  const totalPages = Math.ceil(filteredNotes.length / itemsPerPage);

  const toggleExpand = (noteId: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(noteId)) {
      newExpanded.delete(noteId);
    } else {
      newExpanded.add(noteId);
    }
    setExpandedItems(newExpanded);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      issued: 'text-green-600 bg-green-50',
      redeemed: 'text-blue-600 bg-blue-50',
      expired: 'text-gray-600 bg-gray-50',
    };
    return colors[status.toLowerCase() as keyof typeof colors] || 'text-gray-600 bg-gray-50';
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

  if (allNotes.length === 0) {
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
    <Card
      title="Recent Activity"
      headerActions={
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value as ActivityFilter);
              setPage(1);
            }}
            className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="issued">Issued</option>
            <option value="redeemed">Redeemed</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      }
    >
      <div className="space-y-4">
        {paginatedNotes.map((note) => {
          const isExpanded = expandedItems.has(note.id);
          
          return (
            <div
              key={note.id}
              className="border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
            >
              <div
                className="flex items-start gap-4 p-3 cursor-pointer"
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
                      Note {note.isin}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(note.status)}`}>
                        {note.status.toUpperCase()}
                      </span>
                      <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="font-semibold">{formatCurrency(note.amount)}</span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatTimeAgo(note.issued_at)}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(note.id);
                  }}
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              </div>
              {isExpanded && (
                <div className="px-3 pb-3 pt-0 border-t border-gray-200 bg-gray-50">
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mt-2">
                    <div>
                      <span className="font-medium">Maturity:</span>{' '}
                      {new Date(note.maturity_date).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">Issued:</span>{' '}
                      {new Date(note.issued_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {totalPages > 1 && (
        <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {((page - 1) * itemsPerPage) + 1} - {Math.min(page * itemsPerPage, filteredNotes.length)} of {filteredNotes.length}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
      
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
