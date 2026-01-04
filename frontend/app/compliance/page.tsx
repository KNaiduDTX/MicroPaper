'use client';

import React from 'react';
import { ComplianceStatus } from '@/components/compliance/ComplianceStatus';
import { ComplianceStats } from '@/components/compliance/ComplianceStats';
import { ComplianceActions } from '@/components/compliance/ComplianceActions';
import { WalletList } from '@/components/wallet/WalletList';

export default function CompliancePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Compliance Management</h1>
          <p className="text-gray-600 mt-2">
            Manage wallet verification status and compliance registry
          </p>
        </div>

        <div className="space-y-6">
          <ComplianceStats />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ComplianceStatus />
            <ComplianceActions />
          </div>

          <WalletList />
        </div>
      </div>
    </div>
  );
}

