/**
 * Empty state component
 */

import React from 'react';
import { Button } from './Button';
import { FileX, Inbox, Search, Plus } from 'lucide-react';

export interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  icon,
  action,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      <div className="text-gray-400 mb-4">
        {icon || <FileX className="h-16 w-16" />}
      </div>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      )}
      {message && (
        <p className="text-sm text-gray-600 text-center max-w-md mb-6">{message}</p>
      )}
      {action && (
        <Button variant={action.variant || 'primary'} onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
};

// Pre-built empty states for common use cases
export const EmptyNotesState: React.FC<{ onIssueNote?: () => void }> = ({ onIssueNote }) => {
  return (
    <EmptyState
      icon={<Inbox className="h-16 w-16" />}
      title="No Notes Found"
      message="You haven't issued any notes yet. Issue your first note to get started with MicroPaper."
      action={
        onIssueNote
          ? {
              label: 'Issue Your First Note',
              onClick: onIssueNote,
              variant: 'primary',
            }
          : undefined
      }
    />
  );
};

export const EmptySearchState: React.FC<{ onClearSearch?: () => void }> = ({ onClearSearch }) => {
  return (
    <EmptyState
      icon={<Search className="h-16 w-16" />}
      title="No Results Found"
      message="We couldn't find any notes matching your search criteria. Try adjusting your filters."
      action={
        onClearSearch
          ? {
              label: 'Clear Filters',
              onClick: onClearSearch,
              variant: 'outline',
            }
          : undefined
      }
    />
  );
};

export const EmptyWalletsState: React.FC = () => {
  return (
    <EmptyState
      icon={<Inbox className="h-16 w-16" />}
      title="No Verified Wallets"
      message="There are no verified wallets yet. Verify a wallet to get started."
    />
  );
};
