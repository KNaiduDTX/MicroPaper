/**
 * Complete note issuance form
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { noteIssuanceSchema, NoteIssuanceFormData } from '@/lib/validation/schemas';
import { WalletAddressInput } from './WalletAddressInput';
import { AmountInput } from './AmountInput';
import { DatePicker } from './DatePicker';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { useNoteIssuance } from '@/lib/hooks/useNoteIssuance';
import { useToast } from '@/components/ui/Toast';
import { NoteIssuanceResponse } from '@/types/note';

interface NoteIssuanceFormProps {
  onSuccess?: (response: NoteIssuanceResponse) => void;
}

export const NoteIssuanceForm: React.FC<NoteIssuanceFormProps> = ({ onSuccess }) => {
  const router = useRouter();
  const { issue, loading, error, data, reset } = useNoteIssuance();
  const { showToast } = useToast();

  const {
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<NoteIssuanceFormData>({
    resolver: zodResolver(noteIssuanceSchema),
  });

  const walletAddress = watch('walletAddress') || '';
  const amount = watch('amount') || '';
  const maturityDate = watch('maturityDate') || '';

  const onSubmit = async (data: NoteIssuanceFormData) => {
    reset();

    try {
      const response = await issue(data);
      if (response) {
        showToast({
          type: 'success',
          title: 'Note Issued Successfully',
          message: `Note issued with ISIN: ${response.isin}. Amount: $${data.amount.toLocaleString()}`,
          duration: 5000,
        });
        
        if (onSuccess) {
          onSuccess(response);
        }
        
        // Reset form after success
        setTimeout(() => {
          router.push('/notes');
        }, 2000);
      }
    } catch (err) {
      // Error is handled by the hook and will be displayed below
      console.error('Error issuing note:', err);
    }
  };

  const getErrorMessage = (error: any): string => {
    if (!error) return 'An unexpected error occurred';
    
    const errorCode = error.error?.code;
    const errorMessage = error.error?.message || 'Failed to issue note';
    
    // Provide user-friendly error messages
    switch (errorCode) {
      case 'NETWORK_ERROR':
        return 'Unable to connect to the server. Please check your internet connection and try again.';
      case 'VALIDATION_ERROR':
        return errorMessage || 'Please check your input and try again.';
      case 'UNAUTHORIZED':
        return 'Authentication failed. Please refresh the page and try again.';
      case 'CONFLICT':
        return 'A note with this ISIN already exists. Please try again.';
      default:
        return errorMessage || 'An error occurred while issuing the note. Please try again.';
    }
  };

  return (
    <Card title="Issue Traditional Note">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <Alert
            type="error"
            title="Error Issuing Note"
            message={getErrorMessage(error)}
            onClose={() => reset()}
          />
        )}

        <WalletAddressInput
          value={walletAddress}
          onChange={(value) => setValue('walletAddress', value, { shouldValidate: true })}
          error={errors.walletAddress?.message}
        />

        <AmountInput
          value={amount}
          onChange={(value) => setValue('amount', value as number, { shouldValidate: true })}
          error={errors.amount?.message}
        />

        <DatePicker
          value={maturityDate}
          onChange={(value) => setValue('maturityDate', value, { shouldValidate: true })}
          error={errors.maturityDate?.message}
        />

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              reset();
            }}
            disabled={loading}
          >
            Reset
          </Button>
          <Button type="submit" variant="primary" isLoading={loading} disabled={loading}>
            {loading ? 'Issuing Note...' : 'Issue Note'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

