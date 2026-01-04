/**
 * Server Action: Validate Wallet Address
 * Light logic for wallet address validation and normalization
 */

import { NextRequest, NextResponse } from 'next/server';
import { walletAddressSchema } from '@/lib/validation/schemas';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress } = body;
    
    if (!walletAddress) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Wallet address is required',
          },
        },
        { status: 400 }
      );
    }
    
    // Validate wallet address using Zod schema
    const validationResult = walletAddressSchema.safeParse(walletAddress);
    
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid wallet address format',
            details: validationResult.error.errors.map(err => ({
              field: 'walletAddress',
              issue: err.code,
              message: err.message,
            })),
          },
        },
        { status: 400 }
      );
    }
    
    // Normalize wallet address (lowercase)
    const normalizedAddress = walletAddress.toLowerCase();
    
    return NextResponse.json({
      success: true,
      data: {
        original: walletAddress,
        normalized: normalizedAddress,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: 'SERVER_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
        },
      },
      { status: 500 }
    );
  }
}

