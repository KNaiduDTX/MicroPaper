/**
 * Application footer
 */

import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center text-sm text-gray-600">
          <p>&copy; {new Date().getFullYear()} MicroPaper. All rights reserved.</p>
          <p className="mt-2">Mock Custodian API - MVP Development</p>
        </div>
      </div>
    </footer>
  );
};

