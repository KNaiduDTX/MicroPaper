/**
 * Enhanced stat card with trend indicators and sparklines
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card } from './Card';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  iconColor?: string;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  onClick?: () => void;
  sparkline?: number[];
  subtitle?: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  iconColor = 'text-blue-600',
  trend,
  onClick,
  sparkline,
  subtitle,
  className = '',
}) => {
  const trendColor = trend
    ? trend.isPositive !== false
      ? 'text-green-600'
      : 'text-red-600'
    : '';

  const TrendIcon = trend && trend.isPositive !== false ? '↑' : '↓';

  return (
    <Card
      className={`${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1 min-w-0">
          {Icon && (
            <div className={`${iconColor} mr-4 flex-shrink-0`}>
              <Icon className="h-10 w-10" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-600 truncate">{title}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-2xl font-bold text-gray-900 truncate">{value}</p>
              {trend && (
                <span className={`text-xs font-medium ${trendColor} flex items-center gap-1`}>
                  <span>{TrendIcon}</span>
                  <span>{Math.abs(trend.value)}%</span>
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
            {trend && (
              <p className="text-xs text-gray-500 mt-1">{trend.label}</p>
            )}
          </div>
        </div>
        {sparkline && sparkline.length > 0 && (
          <div className="ml-4 flex-shrink-0">
            <svg width="60" height="30" className="text-gray-300">
              <polyline
                points={sparkline
                  .map((val, i) => {
                    const x = (i / (sparkline.length - 1)) * 60;
                    const y = 30 - (val / Math.max(...sparkline)) * 25;
                    return `${x},${y}`;
                  })
                  .join(' ')}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-blue-500"
              />
            </svg>
          </div>
        )}
      </div>
    </Card>
  );
};
