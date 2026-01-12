/**
 * Charts for compliance data visualization
 */

'use client';

import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '@/components/ui/Card';

interface ComplianceChartProps {
  data?: {
    totalWallets?: number;
    verifiedWallets?: number;
    unverifiedWallets?: number;
    verificationRate?: string;
  };
  loading?: boolean;
}

export const ComplianceChart: React.FC<ComplianceChartProps> = ({ data, loading = false }) => {
  if (loading || !data) {
    return (
      <Card>
        <div className="h-64 flex items-center justify-center">
          <div className="text-gray-400">Loading compliance data...</div>
        </div>
      </Card>
    );
  }

  const chartData = [
    {
      name: 'Total',
      verified: data.verifiedWallets || 0,
      unverified: data.unverifiedWallets || 0,
    },
  ];

  const verificationRate = parseFloat(data.verificationRate?.replace('%', '') || '0');

  return (
    <div className="space-y-6">
      <Card title="Wallet Verification Status">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="verified" stackId="a" fill="#10b981" name="Verified" />
            <Bar dataKey="unverified" stackId="a" fill="#ef4444" name="Unverified" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Verification Rate">
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl font-bold text-blue-600 mb-2">
              {data.verificationRate || '0%'}
            </div>
            <div className="text-gray-600">
              {data.verifiedWallets || 0} of {data.totalWallets || 0} wallets verified
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
