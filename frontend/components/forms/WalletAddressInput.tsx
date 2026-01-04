/**
 * Wallet address input with validation
 */

'use client';

import React from 'react';
import { Input } from '@/components/ui/Input';
import { walletAddressSchema } from '@/lib/validation/schemas';

interface WalletAddressInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  label?: string;
  required?: boolean;
}

export const WalletAddressInput: React.FC<WalletAddressInputProps> = ({
  value,
  onChange,
  error,
  label = 'Wallet Address',
  required = true,
}) => {
  const [localError, setLocalError] = React.useState<string | undefined>(error);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Validate on change
    if (newValue) {
      const result = walletAddressSchema.safeParse(newValue);
      if (!result.success) {
        setLocalError(result.error.issues[0]?.message || 'Invalid wallet address');
      } else {
        setLocalError(undefined);
      }
    } else {
      setLocalError(required ? 'Wallet address is required' : undefined);
    }
  };

  React.useEffect(() => {
    setLocalError(error);
  }, [error]);

  return (
    <Input
      label={label}
      type="text"
      value={value}
      onChange={handleChange}
      error={localError}
      placeholder="0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
      required={required}
      helperText="Enter a valid Ethereum wallet address (0x + 40 hex characters)"
    />
  );
};

