/**
 * Table utility functions for data manipulation, sorting, and property access
 */

// Types for sorting configuration
export type SortDirection = "asc" | "desc" | null;

export type SortConfig = {
  key: string;
  direction: SortDirection;
};

export type ColumnConfig = {
  key: string;
  sortKey?: string; // For nested properties like 'user.name'
  sortable?: boolean;
};

/**
 * Gets a nested property value from an object using dot notation
 * @param obj - The object to extract the value from
 * @param path - The dot-separated path to the property (e.g., 'user.profile.name')
 * @returns The value at the specified path, or undefined if not found
 * 
 * @example
 * const user = { profile: { name: 'John' } };
 * getNestedValue(user, 'profile.name'); // Returns 'John'
 */
export function getNestedValue(obj: unknown, path: string): unknown {
  return path.split('.').reduce((current, key) => {
    if (current != null && typeof current === 'object') {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

/**
 * Compares two values for sorting purposes, handling different data types appropriately
 * @param aValue - First value to compare
 * @param bValue - Second value to compare
 * @returns Negative number if a < b, positive if a > b, 0 if equal
 */
export function compareValues(aValue: unknown, bValue: unknown): number {
  // Handle null/undefined values
  if (aValue == null && bValue == null) return 0;
  if (aValue == null) return 1;
  if (bValue == null) return -1;
  
  // Handle different data types
  if (typeof aValue === 'string' && typeof bValue === 'string') {
    return aValue.toLowerCase().localeCompare(bValue.toLowerCase());
  } else if (typeof aValue === 'number' && typeof bValue === 'number') {
    return aValue - bValue;
  } else if (aValue instanceof Date && bValue instanceof Date) {
    return aValue.getTime() - bValue.getTime();
  } else {
    // Fallback to string comparison
    return String(aValue).localeCompare(String(bValue));
  }
}

/**
 * Sorts an array of data based on the provided sort configuration
 * @param data - Array of data to sort
 * @param sortConfig - Sort configuration with key and direction
 * @param columns - Column configurations to determine sort keys
 * @returns New sorted array (original array is not mutated)
 * 
 * @example
 * const users = [{ name: 'John' }, { name: 'Alice' }];
 * const sorted = sortData(users, { key: 'name', direction: 'asc' }, columns);
 */
export function sortData<T>(
  data: T[], 
  sortConfig: SortConfig | null, 
  columns: ColumnConfig[]
): T[] {
  if (!sortConfig || !sortConfig.direction) {
    return data;
  }

  const column = columns.find(col => col.key === sortConfig.key);
  const sortKey = column?.sortKey || sortConfig.key;

  return [...data].sort((a, b) => {
    const aValue = getNestedValue(a, sortKey);
    const bValue = getNestedValue(b, sortKey);
    
    const comparison = compareValues(aValue, bValue);
    return sortConfig.direction === 'desc' ? -comparison : comparison;
  });
}

/**
 * Determines if a value is sortable (not null/undefined)
 * @param value - Value to check
 * @returns true if the value can be sorted
 */
export function isSortableValue(value: unknown): boolean {
  return value != null;
}

/**
 * Gets the display value for a table cell, handling null/undefined gracefully
 * @param value - The value to display
 * @param fallback - Fallback value if the main value is null/undefined
 * @returns String representation of the value or fallback
 */
export function getDisplayValue(value: unknown, fallback: string = '—'): string {
  if (value == null) {
    return fallback;
  }
  return String(value);
}

/**
 * Creates a sort configuration object
 * @param key - The key to sort by
 * @param direction - The sort direction
 * @returns Sort configuration object
 */
export function createSortConfig(key: string, direction: SortDirection): SortConfig | null {
  return direction ? { key, direction } : null;
}

/**
 * Cycles through sort directions: asc -> desc -> null -> asc
 * @param currentDirection - Current sort direction
 * @returns Next sort direction in the cycle
 */
export function getNextSortDirection(currentDirection: SortDirection): SortDirection {
  if (currentDirection === 'asc') return 'desc';
  if (currentDirection === 'desc') return null;
  return 'asc';
}
