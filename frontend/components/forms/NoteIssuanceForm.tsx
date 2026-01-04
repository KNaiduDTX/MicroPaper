/**
 * Complete note issuance form
 */

'use client';

import React, { useState } from 'react';
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
import { NoteIssuanceResponse } from '@/types/note';

interface NoteIssuanceFormProps {
  onSuccess?: (response: NoteIssuanceResponse) => void;
}

export const NoteIssuanceForm: React.FC<NoteIssuanceFormProps> = ({ onSuccess }) => {
  const { issue, loading, error, data, reset } = useNoteIssuance();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
    setSuccessMessage(null);
    reset();

    try {
      const response = await issue(data);
      if (response) {
        setSuccessMessage(
          `Note issued successfully! ISIN: ${response.isin}`
        );
        if (onSuccess) {
          onSuccess(response);
        }
      }
    } catch (err) {
      // Error is handled by the hook
      console.error('Error issuing note:', err);
    }
  };

  return (
    <Card title="Issue Traditional Note">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {successMessage && (
          <Alert type="success" message={successMessage} onClose={() => setSuccessMessage(null)} />
        )}

        {error && (
          <Alert
            type="error"
            title="Error"
            message={error.error.message || 'Failed to issue note'}
            onClose={() => reset()}
          />
        )}

        {data && (
          <Alert
            type="success"
            title="Success"
            message={`Note issued with ISIN: ${data.isin}`}
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
              setSuccessMessage(null);
            }}
            disabled={loading}
          >
            Reset
          </Button>
          <Button type="submit" variant="primary" isLoading={loading}>
            Issue Note
          </Button>
        </div>
      </form>
    </Card>
  );
};

