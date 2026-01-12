/**
 * Amount input (multiples of $10,000)
 */

'use client';

import React from 'react';
import { Input } from '@/components/ui/Input';
import { amountSchema } from '@/lib/validation/schemas';

interface AmountInputProps {
  value: number | '';
  onChange: (value: number | '') => void;
  error?: string;
  label?: string;
  required?: boolean;
}

export const AmountInput: React.FC<AmountInputProps> = ({
  value,
  onChange,
  error,
  label = 'Amount (USD)',
  required = true,
}) => {
  const [localError, setLocalError] = React.useState<string | undefined>(error);
  const [displayValue, setDisplayValue] = React.useState<string>(
    value === '' ? '' : value.toString()
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setDisplayValue(inputValue);

    if (inputValue === '') {
      onChange('');
      setLocalError(required ? 'Amount is required' : undefined);
      return;
    }

    const numValue = parseInt(inputValue, 10);
    if (isNaN(numValue)) {
      setLocalError('Amount must be a number');
      return;
    }

    onChange(numValue);

    // Validate
    const result = amountSchema.safeParse(numValue);
    if (!result.success) {
      setLocalError(result.error.issues[0]?.message || 'Invalid amount');
    } else {
      setLocalError(undefined);
    }
  };

  React.useEffect(() => {
    setLocalError(error);
  }, [error]);

  React.useEffect(() => {
    if (value === '') {
      setDisplayValue('');
    } else if (value.toString() !== displayValue) {
      setDisplayValue(value.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const isValidAmount = typeof value === 'number' && value >= 10000 && value % 10000 === 0;
  const formattedAmount = typeof value === 'number' ? formatCurrency(value) : '';

  return (
    <div>
      <Input
        label={label}
        type="number"
        value={displayValue}
        onChange={handleChange}
        error={localError}
        placeholder="100000"
        required={required}
        min={10000}
        step={10000}
        helperText="Amount must be a multiple of $10,000 (minimum $10,000)"
        className={isValidAmount && !localError ? 'border-green-500' : ''}
      />
      {isValidAmount && !localError && value && (
        <div className="mt-1 text-xs text-green-600 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
          Valid amount: {formattedAmount}
        </div>
      )}
      {typeof value === 'number' && value > 0 && value < 10000 && (
        <div className="mt-1 text-xs text-amber-600">
          Minimum amount is $10,000
        </div>
      )}
      {typeof value === 'number' && value > 0 && value % 10000 !== 0 && (
        <div className="mt-1 text-xs text-amber-600">
          Amount must be a multiple of $10,000
        </div>
      )}
    </div>
  );
};

