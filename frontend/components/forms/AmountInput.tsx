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

  return (
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
    />
  );
};

