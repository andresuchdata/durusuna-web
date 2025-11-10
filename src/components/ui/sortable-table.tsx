"use client";

import * as React from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { 
  getNestedValue, 
  sortData, 
  getDisplayValue,
  getNextSortDirection,
  createSortConfig,
  type SortDirection, 
  type SortConfig 
} from "@/lib/tableUtils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

// Component-specific types
export type ColumnConfig<T = unknown> = {
  key: string;
  header: string | React.ReactNode;
  sortable?: boolean;
  sortKey?: string; // For nested properties like 'user.name'
  render?: (item: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  width?: string;
  minWidth?: string;
  sticky?: boolean; // For sticky columns
};

type SortableTableProps<T = unknown> = {
  data: T[];
  columns: ColumnConfig<T>[];
  loading?: boolean;
  emptyMessage?: string | React.ReactNode;
  defaultSort?: SortConfig;
  onSortChange?: (sort: SortConfig | null) => void;
  className?: string;
  containerClassName?: string;
  enableClientSideSort?: boolean; // Default: true for client-side, false for server-side
  stickyHeader?: boolean;
  renderActions?: (item: T, index: number) => React.ReactNode;
  actionsHeader?: string | React.ReactNode;
  actionsClassName?: string;
  rowClassName?: string | ((item: T, index: number) => string);
  onRowClick?: (item: T, index: number) => void;
  tableKey?: string; // For React key optimization
};


export function SortableTable<T = unknown>({
  data,
  columns,
  loading = false,
  emptyMessage = "No data found",
  defaultSort,
  onSortChange,
  className,
  containerClassName,
  enableClientSideSort = true,
  stickyHeader = false,
  renderActions,
  actionsHeader,
  actionsClassName,
  rowClassName,
  onRowClick,
  tableKey,
}: SortableTableProps<T>) {
  const [sortConfig, setSortConfig] = React.useState<SortConfig | null>(defaultSort || null);
  const [hasHorizontalScroll, setHasHorizontalScroll] = React.useState(false);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Check for horizontal scroll
  React.useEffect(() => {
    const checkScroll = () => {
      if (scrollContainerRef.current) {
        const hasScroll = scrollContainerRef.current.scrollWidth > scrollContainerRef.current.clientWidth;
        setHasHorizontalScroll(hasScroll);
      }
    };

    checkScroll();
    const resizeObserver = new ResizeObserver(checkScroll);
    if (scrollContainerRef.current) {
      resizeObserver.observe(scrollContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [data]);

  // Handle sort click
  const handleSort = React.useCallback((columnKey: string) => {
    const column = columns.find(col => col.key === columnKey);
    if (!column?.sortable) return;

    let newDirection: SortDirection = 'asc';
    
    if (sortConfig?.key === columnKey) {
      newDirection = getNextSortDirection(sortConfig.direction);
    }

    const newSortConfig = createSortConfig(columnKey, newDirection);
    setSortConfig(newSortConfig);
    onSortChange?.(newSortConfig);
  }, [sortConfig, columns, onSortChange]);

  // Get sorted data (client-side only)
  const sortedData = React.useMemo(() => {
    if (enableClientSideSort) {
      return sortData(data, sortConfig, columns);
    }
    return data;
  }, [data, sortConfig, columns, enableClientSideSort]);

  // Render sort icon
  const renderSortIcon = (columnKey: string) => {
    const column = columns.find(col => col.key === columnKey);
    if (!column?.sortable) return null;

    if (sortConfig?.key !== columnKey) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
    }

    return sortConfig.direction === 'asc' ? 
      <ArrowUp className="ml-2 h-4 w-4" /> : 
      <ArrowDown className="ml-2 h-4 w-4" />;
  };

  // Calculate total columns
  const totalColumns = columns.length + (renderActions ? 1 : 0);
  const hasActions = !!renderActions;
  const hasStickyColumns = columns.some(col => col.sticky);

  return (
    <div className={cn("rounded-xl border bg-card shadow-sm overflow-hidden", containerClassName)}>
      <div className="overflow-x-auto" ref={scrollContainerRef}>
        <Table className={className} key={tableKey}>
          <TableHeader className={stickyHeader ? "sticky top-0 z-20 bg-white" : ""}>
            <TableRow className="border-b bg-muted/30">
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(
                    "font-semibold text-foreground",
                    column.headerClassName,
                    column.sticky && "sticky left-0 z-10 bg-white",
                    column.sticky && hasHorizontalScroll && "border-r",
                    column.minWidth && `min-w-[${column.minWidth}]`,
                    column.width && `w-[${column.width}]`
                  )}
                  style={{
                    minWidth: column.minWidth,
                    width: column.width,
                  }}
                >
                  {column.sortable ? (
                    <Button
                      variant="ghost"
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                      onClick={() => handleSort(column.key)}
                    >
                      <span className="flex items-center">
                        {column.header}
                        {renderSortIcon(column.key)}
                      </span>
                    </Button>
                  ) : (
                    column.header
                  )}
                </TableHead>
              ))}
              {hasActions && (
                <TableHead className={cn("text-right font-semibold text-foreground", actionsClassName)}>
                  {actionsHeader}
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={totalColumns}>
                  <div className="flex flex-col gap-3 py-8">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="animate-pulse flex space-x-4">
                        <div className="rounded-full bg-slate-200 h-10 w-10"></div>
                        <div className="flex-1 space-y-2 py-1">
                          <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ) : sortedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={totalColumns}>
                  <div className="py-12 text-center">
                    {typeof emptyMessage === 'string' ? (
                      <>
                        <p className="text-sm font-medium text-muted-foreground">{emptyMessage}</p>
                        <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters</p>
                      </>
                    ) : (
                      emptyMessage
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((item, index) => {
                const computedRowClassName = typeof rowClassName === 'function' 
                  ? rowClassName(item, index) 
                  : rowClassName;
                
                return (
                  <TableRow
                    key={`row-${index}`}
                    className={cn(
                      "hover:bg-muted/50 transition-colors border-b",
                      onRowClick && "cursor-pointer",
                      computedRowClassName
                    )}
                    onClick={() => onRowClick?.(item, index)}
                  >
                    {columns.map((column) => (
                      <TableCell
                        key={`${column.key}-${index}`}
                        className={cn(
                          "py-4",
                          column.className,
                          column.sticky && "sticky left-0 z-10 bg-white",
                          column.sticky && hasHorizontalScroll && "border-r",
                          column.minWidth && `min-w-[${column.minWidth}] whitespace-nowrap`
                        )}
                        style={{
                          minWidth: column.minWidth,
                          width: column.width,
                        }}
                      >
                        {column.render 
                          ? column.render(item, index)
                          : getDisplayValue(getNestedValue(item, column.key))
                        }
                      </TableCell>
                    ))}
                    {hasActions && (
                      <TableCell className={cn("text-right py-4", actionsClassName)}>
                        {renderActions(item, index)}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

