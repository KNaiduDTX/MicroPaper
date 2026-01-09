/**
 * Export utilities for CSV and other formats
 */

export interface ExportableData {
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Convert data array to CSV format
 */
export function convertToCSV(data: ExportableData[]): string {
  if (data.length === 0) {
    return '';
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV header row
  const headerRow = headers.map(header => escapeCSVField(header)).join(',');
  
  // Create CSV data rows
  const dataRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      return escapeCSVField(value);
    }).join(',');
  });
  
  // Combine header and data rows
  return [headerRow, ...dataRows].join('\n');
}

/**
 * Escape CSV field value
 */
function escapeCSVField(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  const stringValue = String(value);
  
  // If value contains comma, newline, or quote, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
}

/**
 * Download data as CSV file
 */
export function downloadCSV(data: ExportableData[], filename: string): void {
  const csv = convertToCSV(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Format date for CSV export
 */
export function formatDateForExport(dateString: string): string {
  try {
    let cleanDateString = dateString;
    if (dateString.includes('+00:00Z')) {
      cleanDateString = dateString.replace('+00:00Z', 'Z');
    } else if (dateString.includes('+00:00') && !dateString.endsWith('Z')) {
      cleanDateString = dateString.replace('+00:00', '') + 'Z';
    }
    
    const date = new Date(cleanDateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }
    
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    });
  } catch {
    return dateString;
  }
}
