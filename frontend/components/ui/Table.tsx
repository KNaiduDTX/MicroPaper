/**
 * Enhanced data table component with sorting, column visibility, and better UX
 */

import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Eye, EyeOff, MoreVertical } from 'lucide-react';

export type SortDirection = 'asc' | 'desc' | null;

export interface TableColumn<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  accessor?: (item: T) => string | number;
  sortable?: boolean;
  sortFn?: (a: T, b: T) => number;
  defaultVisible?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  emptyMessage?: string;
  className?: string;
  onRowClick?: (item: T) => void;
  selectable?: boolean;
  selectedRows?: Set<number>;
  onSelectionChange?: (selected: Set<number>) => void;
  rowKey?: (item: T, index: number) => string | number;
  stickyHeader?: boolean;
}

export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  emptyMessage,
  className = '',
  onRowClick,
  selectable = false,
  selectedRows,
  onSelectionChange,
  rowKey,
  stickyHeader = false,
}: TableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(columns.filter(col => col.defaultVisible !== false).map(col => col.key))
  );
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  // Filter visible columns
  const visibleColumnsList = useMemo(() => {
    return columns.filter(col => visibleColumns.has(col.key));
  }, [columns, visibleColumns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return data;

    const column = columns.find(col => col.key === sortColumn);
    if (!column || !column.sortable) return data;

    const sorted = [...data].sort((a, b) => {
      if (column.sortFn) {
        return column.sortFn(a, b);
      }

      const aVal = column.accessor ? column.accessor(a) : a[sortColumn];
      const bVal = column.accessor ? column.accessor(b) : b[sortColumn];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [data, sortColumn, sortDirection, columns]);

  const handleSort = (columnKey: string) => {
    const column = columns.find(col => col.key === columnKey);
    if (!column || !column.sortable) return;

    if (sortColumn === columnKey) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const toggleColumnVisibility = (columnKey: string) => {
    const newVisible = new Set(visibleColumns);
    if (newVisible.has(columnKey)) {
      newVisible.delete(columnKey);
    } else {
      newVisible.add(columnKey);
    }
    setVisibleColumns(newVisible);
  };

  const handleRowClick = (item: T, index: number) => {
    if (onRowClick) {
      onRowClick(item);
    }
  };

  const handleSelectRow = (index: number, event: React.MouseEvent) => {
    if (!selectable || !onSelectionChange) return;
    
    event.stopPropagation();
    const newSelected = new Set(selectedRows || []);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    onSelectionChange(newSelected);
  };

  // Don't render empty message here - let parent component handle it with EmptyState
  if (data.length === 0) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Column visibility menu */}
      {columns.length > 3 && (
        <div className="relative mb-2 flex justify-end">
          <div className="relative">
            <button
              onClick={() => setShowColumnMenu(!showColumnMenu)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Eye className="h-4 w-4" />
              Columns
            </button>
            {showColumnMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowColumnMenu(false)}
                />
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-20 py-1">
                  {columns.map((column) => (
                    <label
                      key={column.key}
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={visibleColumns.has(column.key)}
                        onChange={() => toggleColumnVisibility(column.key)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{column.header}</span>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className={`bg-gray-50 ${stickyHeader ? 'sticky top-0 z-10' : ''}`}>
            <tr>
              {selectable && (
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedRows?.size === data.length && data.length > 0}
                    onChange={(e) => {
                      if (onSelectionChange) {
                        if (e.target.checked) {
                          onSelectionChange(new Set(data.map((_, i) => i)));
                        } else {
                          onSelectionChange(new Set());
                        }
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
              )}
              {visibleColumnsList.map((column) => {
                const isSorted = sortColumn === column.key;
                const canSort = column.sortable !== false;
                
                return (
                  <th
                    key={column.key}
                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                      column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : ''
                    }`}
                    style={column.width ? { width: column.width } : undefined}
                  >
                    {canSort ? (
                      <button
                        onClick={() => handleSort(column.key)}
                        className="flex items-center gap-1 hover:text-gray-700 transition-colors group"
                      >
                        <span>{column.header}</span>
                        <span className="flex flex-col">
                          <ChevronUp
                            className={`h-3 w-3 ${
                              isSorted && sortDirection === 'asc'
                                ? 'text-blue-600'
                                : 'text-gray-400 group-hover:text-gray-600'
                            }`}
                          />
                          <ChevronDown
                            className={`h-3 w-3 -mt-1 ${
                              isSorted && sortDirection === 'desc'
                                ? 'text-blue-600'
                                : 'text-gray-400 group-hover:text-gray-600'
                            }`}
                          />
                        </span>
                      </button>
                    ) : (
                      <span>{column.header}</span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.map((item, index) => {
              const key = rowKey ? rowKey(item, index) : index;
              const isSelected = selectedRows?.has(index) || false;
              
              return (
                <tr
                  key={key}
                  className={`${
                    onRowClick ? 'cursor-pointer' : ''
                  } ${
                    isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                  } transition-colors`}
                  onClick={() => handleRowClick(item, index)}
                >
                  {selectable && (
                    <td
                      className="px-6 py-4 whitespace-nowrap"
                      onClick={(e) => handleSelectRow(index, e)}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                  )}
                  {visibleColumnsList.map((column) => (
                    <td
                      key={column.key}
                      className={`px-6 py-4 text-sm text-gray-900 ${
                        column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : ''
                      } ${
                        column.width ? '' : 'whitespace-nowrap'
                      }`}
                    >
                      {column.render
                        ? column.render(item)
                        : column.accessor
                        ? column.accessor(item)
                        : String(item[column.key] ?? '')}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

