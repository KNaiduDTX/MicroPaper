/**
 * Maturity date picker (1-270 days)
 */

'use client';

import React from 'react';
import { Input } from '@/components/ui/Input';
import { maturityDateSchema } from '@/lib/validation/schemas';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  label?: string;
  required?: boolean;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  error,
  label = 'Maturity Date',
  required = true,
}) => {
  const [localError, setLocalError] = React.useState<string | undefined>(error);

  // Calculate min and max dates
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const minDate = new Date(today);
  minDate.setDate(today.getDate() + 1); // Tomorrow
  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + 270); // 270 days from today

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Validate
    if (newValue) {
      const result = maturityDateSchema.safeParse(newValue);
      if (!result.success) {
        setLocalError(result.error.issues[0]?.message || 'Invalid maturity date');
      } else {
        setLocalError(undefined);
      }
    } else {
      setLocalError(required ? 'Maturity date is required' : undefined);
    }
  };

  React.useEffect(() => {
    setLocalError(error);
  }, [error]);

  // Format dates for input
  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <Input
      label={label}
      type="date"
      value={value}
      onChange={handleChange}
      error={localError}
      required={required}
      min={formatDateForInput(minDate)}
      max={formatDateForInput(maxDate)}
      helperText="Maturity date must be between 1 and 270 days from today"
    />
  );
};

