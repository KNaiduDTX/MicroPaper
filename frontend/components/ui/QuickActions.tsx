/**
 * Quick Actions Menu - Floating Action Button
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, FileText, Shield, TrendingUp } from 'lucide-react';
import { Tooltip } from './Tooltip';

interface QuickAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

interface QuickActionsProps {
  actions?: QuickAction[];
  className?: string;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ actions, className = '' }) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const defaultActions: QuickAction[] = [
    {
      label: 'Issue Note',
      icon: <FileText className="h-5 w-5" />,
      onClick: () => {
        router.push('/notes/issue');
        setIsOpen(false);
      },
      variant: 'primary',
    },
    {
      label: 'Compliance',
      icon: <Shield className="h-5 w-5" />,
      onClick: () => {
        router.push('/compliance');
        setIsOpen(false);
      },
    },
    {
      label: 'Dashboard',
      icon: <TrendingUp className="h-5 w-5" />,
      onClick: () => {
        router.push('/dashboard');
        setIsOpen(false);
      },
    },
  ];

  const actionsToShow = actions || defaultActions;

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      {/* Action Buttons */}
      <div
        className={`flex flex-col-reverse gap-3 mb-3 transition-all duration-300 ${
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        {actionsToShow.map((action, index) => (
          <Tooltip key={index} content={action.label} position="left">
            <button
              onClick={action.onClick}
              className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 ${
                action.variant === 'primary'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
              aria-label={action.label}
            >
              {action.icon}
            </button>
          </Tooltip>
        ))}
      </div>

      {/* Main FAB Button */}
      <Tooltip content={isOpen ? 'Close menu' : 'Quick actions'} position="left">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center hover:bg-blue-700 transition-all hover:scale-110"
          aria-label="Quick actions"
          aria-expanded={isOpen}
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Plus className="h-6 w-6" />
          )}
        </button>
      </Tooltip>
    </div>
  );
};
