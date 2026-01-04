'use client';

import React from 'react';
import { NoteIssuanceForm } from '@/components/forms/NoteIssuanceForm';

export default function IssueNotePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Issue Traditional Note</h1>
          <p className="text-gray-600 mt-2">
            Issue a traditional note for a verified wallet address. The note will be linked to a tokenized note on the blockchain.
          </p>
        </div>

        <NoteIssuanceForm
          onSuccess={(response) => {
            console.log('Note issued successfully:', response);
          }}
        />
      </div>
    </div>
  );
}

