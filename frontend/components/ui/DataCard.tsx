/**
 * Reusable data card component for displaying key metrics
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';

export interface DataCardProps {
  title: string;
  icon?: LucideIcon;
  iconColor?: string;
  children: React.ReactNode;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'outline' | 'danger';
  }>;
  footer?: React.ReactNode;
  className?: string;
}

export const DataCard: React.FC<DataCardProps> = ({
  title,
  icon: Icon,
  iconColor = 'text-blue-600',
  children,
  actions,
  footer,
  className = '',
}) => {
  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          {Icon && <Icon className={`h-5 w-5 ${iconColor}`} />}
          <span>{title}</span>
        </div>
      }
      headerActions={
        actions && actions.length > 0 ? (
          <div className="flex gap-2">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'outline'}
                size="sm"
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            ))}
          </div>
        ) : undefined
      }
      footer={footer}
      className={className}
    >
      {children}
    </Card>
  );
};
