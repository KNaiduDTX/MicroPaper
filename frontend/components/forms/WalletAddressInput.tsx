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
  const [isValidating, setIsValidating] = React.useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsValidating(true);

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
    
    setTimeout(() => setIsValidating(false), 300);
  };

  React.useEffect(() => {
    setLocalError(error);
  }, [error]);

  const characterCount = value.length;
  const expectedLength = 42; // 0x + 40 hex characters
  const isValid = !localError && characterCount === expectedLength;
  const isTooShort = characterCount > 0 && characterCount < expectedLength;
  const isTooLong = characterCount > expectedLength;

  return (
    <div>
      <Input
        label={label}
        type="text"
        value={value}
        onChange={handleChange}
        error={localError}
        placeholder="0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
        required={required}
        helperText="Enter a valid Ethereum wallet address (0x + 40 hex characters)"
        className={isValid ? 'border-green-500' : isTooLong ? 'border-red-500' : ''}
      />
      <div className="mt-1 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {isValidating && (
            <span className="text-blue-600 animate-pulse">Validating...</span>
          )}
          {isValid && !isValidating && (
            <span className="text-green-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
              Valid address
            </span>
          )}
          {isTooShort && !localError && (
            <span className="text-gray-500">
              {expectedLength - characterCount} characters remaining
            </span>
          )}
          {isTooLong && (
            <span className="text-red-600">Address too long</span>
          )}
        </div>
        <span className={`text-gray-500 ${isTooLong ? 'text-red-600' : ''}`}>
          {characterCount}/{expectedLength}
        </span>
      </div>
    </div>
  );
};

