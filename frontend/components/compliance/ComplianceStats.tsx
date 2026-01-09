/**
 * Display compliance statistics
 */

'use client';

import React, { useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Alert } from '@/components/ui/Alert';
import { useCompliance } from '@/lib/hooks/useCompliance';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const ComplianceStats: React.FC = () => {
  const { stats, refreshStats } = useCompliance();

  useEffect(() => {
    refreshStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (stats.loading) {
    return (
      <Card title="Compliance Statistics">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </div>
      </Card>
    );
  }

  const getErrorMessage = (error: any): string => {
    if (!error) return 'An unexpected error occurred';
    
    const errorCode = error.error?.code;
    const errorMessage = error.error?.message || 'Failed to load compliance statistics';
    
    switch (errorCode) {
      case 'NETWORK_ERROR':
        return 'Unable to connect to the server. Please check your internet connection and try again.';
      case 'UNAUTHORIZED':
        return 'Authentication failed. Please refresh the page.';
      default:
        return errorMessage || 'An error occurred while loading statistics. Please try again.';
    }
  };

  if (stats.error) {
    return (
      <Card title="Compliance Statistics">
        <Alert
          type="error"
          title="Error Loading Statistics"
          message={getErrorMessage(stats.error)}
        />
        <Button
          variant="outline"
          onClick={() => refreshStats()}
          className="mt-4"
          disabled={stats.loading}
        >
          {stats.loading ? 'Loading...' : 'Retry'}
        </Button>
      </Card>
    );
  }

  const data = stats.data;

  return (
    <Card
      title="Compliance Statistics"
      headerActions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => refreshStats()}
          isLoading={stats.loading}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm font-medium text-blue-600">Total Wallets</p>
          <p className="text-2xl font-bold text-blue-900 mt-1">
            {data?.totalWallets || 0}
          </p>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm font-medium text-green-600">Verified Wallets</p>
          <p className="text-2xl font-bold text-green-900 mt-1">
            {data?.verifiedWallets || 0}
          </p>
        </div>

        <div className="bg-red-50 rounded-lg p-4">
          <p className="text-sm font-medium text-red-600">Unverified Wallets</p>
          <p className="text-2xl font-bold text-red-900 mt-1">
            {data?.unverifiedWallets || 0}
          </p>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <p className="text-sm font-medium text-purple-600">Verification Rate</p>
          <p className="text-2xl font-bold text-purple-900 mt-1">
            {data?.verificationRate || '0%'}
          </p>
        </div>
      </div>
    </Card>
  );
};

