'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { ComplianceStats } from '@/components/compliance/ComplianceStats';
import { WalletList } from '@/components/wallet/WalletList';
import { FileText, Shield, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Overview of your MicroPaper system</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <div className="flex items-center">
              <FileText className="h-10 w-10 text-blue-600 mr-4" />
              <div>
                <p className="text-sm text-gray-600">Custodian Service</p>
                <p className="text-2xl font-bold text-gray-900">Active</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <Shield className="h-10 w-10 text-green-600 mr-4" />
              <div>
                <p className="text-sm text-gray-600">Compliance Service</p>
                <p className="text-2xl font-bold text-gray-900">Active</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <TrendingUp className="h-10 w-10 text-purple-600 mr-4" />
              <div>
                <p className="text-sm text-gray-600">System Status</p>
                <p className="text-2xl font-bold text-gray-900">Operational</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ComplianceStats />
          <WalletList />
        </div>
      </div>
    </div>
  );
}

