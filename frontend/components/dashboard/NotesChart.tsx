/**
 * Charts for notes data visualization
 */

'use client';

import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '@/components/ui/Card';
import { NoteIssuance } from '@/lib/api/custodian';
import { formatCurrency, formatDate } from '@/lib/utils/dataFormatting';

interface NotesChartProps {
  notes: NoteIssuance[];
  loading?: boolean;
}

const COLORS = {
  issued: '#10b981', // green
  redeemed: '#3b82f6', // blue
  expired: '#6b7280', // gray
};

export const NotesChart: React.FC<NotesChartProps> = ({ notes, loading = false }) => {
  // Prepare data for line chart (notes issued over time)
  const timeSeriesData = useMemo(() => {
    const grouped = notes.reduce((acc, note) => {
      const date = formatDate(note.issued_at, 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = { date, count: 0, amount: 0 };
      }
      acc[date].count += 1;
      acc[date].amount += note.amount;
      return acc;
    }, {} as Record<string, { date: string; count: number; amount: number }>);

    return Object.values(grouped)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((item) => ({
        date: formatDate(item.date, 'MMM dd'),
        count: item.count,
        amount: item.amount,
      }));
  }, [notes]);

  // Prepare data for status distribution pie chart
  const statusDistribution = useMemo(() => {
    const grouped = notes.reduce((acc, note) => {
      const status = note.status.toLowerCase();
      if (!acc[status]) {
        acc[status] = 0;
      }
      acc[status] += 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  }, [notes]);

  // Prepare data for amount distribution by status
  const amountByStatus = useMemo(() => {
    const grouped = notes.reduce((acc, note) => {
      const status = note.status.toLowerCase();
      if (!acc[status]) {
        acc[status] = 0;
      }
      acc[status] += note.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      amount: value,
    }));
  }, [notes]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="h-64 flex items-center justify-center">
            <div className="text-gray-400">Loading chart...</div>
          </div>
        </Card>
        <Card>
          <div className="h-64 flex items-center justify-center">
            <div className="text-gray-400">Loading chart...</div>
          </div>
        </Card>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <Card>
        <div className="h-64 flex items-center justify-center text-gray-400">
          No data available for charts
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notes Issued Over Time */}
        <Card title="Notes Issued Over Time">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Notes Count"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Status Distribution */}
        <Card title="Status Distribution">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusDistribution.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      COLORS[entry.name.toLowerCase() as keyof typeof COLORS] || '#8884d8'
                    }
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Amount Distribution by Status */}
      <Card title="Total Amount by Status">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={amountByStatus}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis
              tickFormatter={(value) => {
                if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
                if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
                return `$${value}`;
              }}
            />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              labelStyle={{ color: '#000' }}
            />
            <Legend />
            <Bar
              dataKey="amount"
              fill="#3b82f6"
              name="Total Amount"
              radius={[8, 8, 0, 0]}
            >
              {amountByStatus.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    COLORS[entry.name.toLowerCase() as keyof typeof COLORS] || '#3b82f6'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};
