"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchIcon } from "lucide-react";

interface Column<T> {
  key: keyof T & string;
  label: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  onRowClick?: (item: T) => void;
  pageSize?: number;
  showStatusFilter?: boolean;
  statusOptions?: { value: string; label: string }[];
  filters?: {
    key: keyof T & string;
    label: string;
    options?: { value: string; label: string }[];
  }[];
  direction?: "rtl" | "ltr";
  labels?: {
    all: string;
    results: (
      from: number,
      to: number,
      filtered: number,
      total: number,
    ) => string;
    page: (current: number, total: number) => string;
    rowsPerPage: string;
    noResults: string;
    previous: string;
    next: string;
    status: string;
  };
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  searchPlaceholder = "Search...",
  onRowClick,
  pageSize = 20,
  showStatusFilter = false,
  statusOptions = [],
  filters = [],
  direction = "ltr",
  labels = {
    all: "All",
    results: (from, to, filtered, total) =>
      filtered === total
        ? `Showing ${from}-${to} of ${total} results`
        : `Showing ${from}-${to} of ${filtered} results (filtered from ${total} total)`,
    page: (current, total) => `Page ${current} of ${total}`,
    rowsPerPage: "Rows per page",
    noResults: "No results found",
    previous: "Previous",
    next: "Next",
    status: "Status",
  },
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [sortKey, setSortKey] = React.useState<(keyof T & string) | null>(null);
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">(
    "asc",
  );
  const [filterValues, setFilterValues] = React.useState<
    Record<string, string>
  >({});
  const pageSizeState = pageSize;

  // Filter data based on search and status
  const filteredData = React.useMemo(() => {
    let filtered = data;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((item) =>
        Object.values(item).some(
          (value) =>
            value &&
            value.toString().toLowerCase().includes(searchQuery.toLowerCase()),
        ),
      );
    }

    // Apply status filter
    if (showStatusFilter && statusFilter !== "all") {
      filtered = filtered.filter(
        (item) => (item as Record<string, unknown>).status === statusFilter,
      );
    }

    // Apply additional filters
    if (filters.length > 0) {
      filters.forEach((filter) => {
        const filterValue = filterValues[filter.key];
        if (!filterValue || filterValue === "all") return;
        filtered = filtered.filter(
          (item) => String(item[filter.key] ?? "") === filterValue,
        );
      });
    }

    // Apply sorting
    if (sortKey) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
        }
        const aText = String(aVal ?? "");
        const bText = String(bVal ?? "");
        if (aText < bText) return sortDirection === "asc" ? -1 : 1;
        if (aText > bText) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [
    data,
    searchQuery,
    statusFilter,
    sortKey,
    sortDirection,
    showStatusFilter,
    filters,
    filterValues,
  ]);

  // Pagination
  const paginatedData = filteredData.slice(
    0,
    pageSizeState,
  );
  const rangeStart =
    filteredData.length === 0 ? 0 : 1;
  const rangeEnd = Math.min(pageSizeState, filteredData.length);

  const handleSort = (key: keyof T & string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  return (
    <div className="space-y-3">
      {/* Search and Filters */}
      <div className="flex flex-wrap items-end gap-1.5">
        <div className="relative w-full sm:w-auto flex-auto">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {showStatusFilter && statusOptions.length > 0 && (
          <div className="w-full sm:max-w-35 sm:w-auto space-y-1">
            <div className="text-xs font-medium text-muted-foreground">
              {labels.status}
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger
                className={`min-w-30 ${
                  direction === "rtl" ? "text-right flex-row-reverse" : ""
                }`}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                dir={direction}
                className={direction === "rtl" ? "text-right" : ""}
              >
                <SelectItem value="all">{labels.all}</SelectItem>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {filters.length > 0 &&
          filters.map((filter) => {
            const options =
              filter.options ??
              Array.from(
                new Set(
                  data
                    .map((item) => item[filter.key])
                    .filter((value) => value !== null && value !== undefined)
                    .map((value) => String(value)),
                ),
              )
                .sort((a, b) => a.localeCompare(b))
                .map((value) => ({ value, label: value }));

            return (
              <div
                key={filter.key}
                className="w-full sm:max-w-37.5 sm:w-auto space-y-1"
              >
                <div className="text-xs font-medium text-muted-foreground">
                  {filter.label}
                </div>
                <Select
                  value={filterValues[filter.key] ?? "all"}
                  onValueChange={(value) =>
                    setFilterValues((prev) => ({
                      ...prev,
                      [filter.key]: value,
                    }))
                  }
                >
                  <SelectTrigger
                    className={`min-w-35 ${
                      direction === "rtl" ? "text-right flex-row-reverse" : ""
                    }`}
                  >
                    <SelectValue placeholder={filter.label} />
                  </SelectTrigger>
                  <SelectContent
                    dir={direction}
                    className={direction === "rtl" ? "text-right" : ""}
                  >
                    <SelectItem value="all">{labels.all}</SelectItem>
                    {options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          })}
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        {labels.results(rangeStart, rangeEnd, filteredData.length, data.length)}
      </div>

      {/* Table */}
      <div className="border rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={
                    column.sortable ? "cursor-pointer select-none" : ""
                  }
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    {column.sortable && sortKey === column.key && (
                      <span className="text-xs">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center py-12 text-muted-foreground"
                >
                  {labels.noResults}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((item, index) => (
                <TableRow
                  key={getRowKey(item, index)}
                  className={`odd:bg-muted/30 even:bg-transparent ${
                    onRowClick ? "cursor-pointer hover:bg-muted/40" : ""
                  }`}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {column.render
                        ? column.render(item)
                        : formatCellValue(item[column.key])}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination removed: fixed first page only */}
    </div>
  );
}

function formatCellValue(value: unknown) {
  if (value === null || value === undefined) {
    return "-";
  }
  return String(value);
}

function getRowKey<T extends Record<string, unknown>>(item: T, index: number) {
  const possibleId = item._id;
  if (typeof possibleId === "string") {
    return possibleId;
  }
  return `row-${index}`;
}
