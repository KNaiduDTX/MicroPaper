/**
 * Server Action: Validate Note Issuance Form Data
 * Light logic for form validation and data transformation
 */

import { NextRequest, NextResponse } from 'next/server';
import { noteIssuanceSchema, NoteIssuanceFormData } from '@/lib/validation/schemas';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate form data using Zod schema
    const validationResult = noteIssuanceSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Form validation failed',
            details: validationResult.error.errors.map(err => ({
              field: err.path.join('.'),
              issue: err.code,
              message: err.message,
            })),
          },
        },
        { status: 400 }
      );
    }
    
    // Transform data if needed (e.g., normalize wallet address)
    const validatedData: NoteIssuanceFormData = validationResult.data;
    const transformedData = {
      ...validatedData,
      walletAddress: validatedData.walletAddress.toLowerCase(),
    };
    
    // Return validated and transformed data
    return NextResponse.json({
      success: true,
      data: transformedData,
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

