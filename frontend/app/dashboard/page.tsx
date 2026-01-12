'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { ComplianceStats } from '@/components/compliance/ComplianceStats';
import { WalletList } from '@/components/wallet/WalletList';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { NotesChart } from '@/components/dashboard/NotesChart';
import { ComplianceChart } from '@/components/dashboard/ComplianceChart';
import { FileText, Shield, TrendingUp } from 'lucide-react';
import { useNotes } from '@/lib/hooks/useNotes';
import { useCompliance } from '@/lib/hooks/useCompliance';

export default function DashboardPage() {
  const { fetchNotes, loading: notesLoading } = useNotes();
  const { stats: complianceStats } = useCompliance();
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const result = await fetchNotes({ limit: 1000 });
      if (result && Array.isArray(result)) {
        setNotes(result);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Overview of your MicroPaper system</p>
        </div>

        <div className="mb-8">
          <DashboardStats />
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

        {/* Charts Section */}
        <div className="mb-8">
          <NotesChart notes={notes} loading={notesLoading} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ComplianceStats />
          <ComplianceChart
            data={complianceStats.data}
            loading={complianceStats.loading}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <WalletList />
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}

