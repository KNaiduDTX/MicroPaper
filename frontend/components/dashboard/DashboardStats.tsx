/**
 * Real-time dashboard statistics
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useNotes } from '@/lib/hooks/useNotes';
import { NoteIssuance } from '@/lib/api/custodian';
import { FileText, DollarSign, TrendingUp, Calendar } from 'lucide-react';

export const DashboardStats: React.FC = () => {
  const { fetchNotes, loading } = useNotes();
  const [stats, setStats] = useState({
    totalNotes: 0,
    totalAmount: 0,
    issuedCount: 0,
    redeemedCount: 0,
    expiredCount: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const notes = await fetchNotes({ limit: 1000 });
      if (notes && Array.isArray(notes)) {
        const totalNotes = notes.length;
        const totalAmount = notes.reduce((sum, note) => sum + note.amount, 0);
        const issuedCount = notes.filter((n) => n.status.toLowerCase() === 'issued').length;
        const redeemedCount = notes.filter((n) => n.status.toLowerCase() === 'redeemed').length;
        const expiredCount = notes.filter((n) => n.status.toLowerCase() === 'expired').length;

        setStats({
          totalNotes,
          totalAmount,
          issuedCount,
          redeemedCount,
          expiredCount,
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
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

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="sm" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <div className="flex items-center">
          <FileText className="h-10 w-10 text-blue-600 mr-4" />
          <div>
            <p className="text-sm text-gray-600">Total Notes</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalNotes}</p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center">
          <DollarSign className="h-10 w-10 text-green-600 mr-4" />
          <div>
            <p className="text-sm text-gray-600">Total Amount</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalAmount)}</p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center">
          <TrendingUp className="h-10 w-10 text-purple-600 mr-4" />
          <div>
            <p className="text-sm text-gray-600">Issued</p>
            <p className="text-2xl font-bold text-gray-900">{stats.issuedCount}</p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center">
          <Calendar className="h-10 w-10 text-orange-600 mr-4" />
          <div>
            <p className="text-sm text-gray-600">Active Status</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.redeemedCount + stats.expiredCount > 0
                ? `${stats.issuedCount} Active`
                : stats.issuedCount}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
