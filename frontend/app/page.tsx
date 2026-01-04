'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { custodianApi, complianceApi } from '@/lib/api';
import { HealthCheckResponse } from '@/types/api';
import { FileText, Shield, TrendingUp, CheckCircle } from 'lucide-react';

export default function Home() {
  const [custodianHealth, setCustodianHealth] = useState<HealthCheckResponse | null>(null);
  const [complianceHealth, setComplianceHealth] = useState<HealthCheckResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const [custodian, compliance] = await Promise.all([
          custodianApi.getHealth(),
          complianceApi.getHealth(),
        ]);
        setCustodianHealth(custodian);
        setComplianceHealth(compliance);
      } catch (error) {
        console.error('Health check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            MicroPaper Mock Custodian API
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Simulates traditional note issuance for dual-format commercial paper.
            Manage wallet verification, issue notes, and monitor compliance.
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Custodian Service</h3>
                {loading ? (
                  <LoadingSpinner size="sm" className="mt-2" />
                ) : (
                  <p className={`text-sm mt-1 ${custodianHealth?.status === 'healthy' ? 'text-green-600' : 'text-red-600'}`}>
                    {custodianHealth?.status === 'healthy' ? '✓ Healthy' : '✗ Unhealthy'}
                  </p>
                )}
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Compliance Service</h3>
                {loading ? (
                  <LoadingSpinner size="sm" className="mt-2" />
                ) : (
                  <p className={`text-sm mt-1 ${complianceHealth?.status === 'healthy' ? 'text-green-600' : 'text-red-600'}`}>
                    {complianceHealth?.status === 'healthy' ? '✓ Healthy' : '✗ Unhealthy'}
                  </p>
                )}
              </div>
              <Shield className="h-8 w-8 text-green-600" />
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card>
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Issue Note</h3>
              <p className="text-sm text-gray-600 mb-4">
                Issue a traditional note for a verified wallet address
              </p>
              <Link href="/notes/issue">
                <Button variant="primary" className="w-full">
                  Issue Note
                </Button>
              </Link>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <Shield className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Compliance</h3>
              <p className="text-sm text-gray-600 mb-4">
                Manage wallet verification and compliance status
              </p>
              <Link href="/compliance">
                <Button variant="secondary" className="w-full">
                  Manage Compliance
                </Button>
              </Link>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Dashboard</h3>
              <p className="text-sm text-gray-600 mb-4">
                View statistics and recent activity
              </p>
              <Link href="/dashboard">
                <Button variant="outline" className="w-full">
                  View Dashboard
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Features */}
        <Card title="Features">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Custodian API</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Issue traditional notes</li>
                <li>• ISIN generation (ISO 6166 compliant)</li>
                <li>• Amount validation (multiples of $10,000)</li>
                <li>• Maturity date validation (1-270 days)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Compliance API</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Wallet verification status</li>
                <li>• Manual verification/unverification</li>
                <li>• Compliance statistics</li>
                <li>• Verified wallets list</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
