"use client"

import { useState, useMemo } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorState } from "@/components/ui/error-state"
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Inbox,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

export interface Column<T> {
  key: string
  header: string
  cell: (row: T) => React.ReactNode
  sortable?: boolean
  sortFn?: (a: T, b: T) => number
  className?: string
  headerClassName?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  searchable?: boolean
  searchPlaceholder?: string
  searchFn?: (row: T, query: string) => boolean
  pageSize?: number
  emptyTitle?: string
  emptyDescription?: string
  emptyIcon?: LucideIcon
  toolbar?: React.ReactNode
  className?: string
}

type SortDirection = "asc" | "desc" | null

export function DataTable<T extends { id?: string }>({
  columns,
  data,
  loading = false,
  error = null,
  onRetry,
  searchable = true,
  searchPlaceholder = "Search...",
  searchFn,
  pageSize = 10,
  emptyTitle = "No data found",
  emptyDescription = "There are no records to display.",
  emptyIcon,
  toolbar,
  className,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)

  // Filter
  const filtered = useMemo(() => {
    if (!search || !searchFn) return data
    return data.filter((row) => searchFn(row, search.toLowerCase()))
  }, [data, search, searchFn])

  // Sort
  const sorted = useMemo(() => {
    if (!sortKey || !sortDirection) return filtered
    const col = columns.find((c) => c.key === sortKey)
    if (!col?.sortFn) return filtered
    const sorted = [...filtered].sort(col.sortFn)
    return sortDirection === "desc" ? sorted.reverse() : sorted
  }, [filtered, sortKey, sortDirection, columns])

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const paginatedData = sorted.slice(page * pageSize, (page + 1) * pageSize)

  // Reset page on search change
  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(0)
  }

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === "asc") setSortDirection("desc")
      else if (sortDirection === "desc") {
        setSortKey(null)
        setSortDirection(null)
      }
    } else {
      setSortKey(key)
      setSortDirection("asc")
    }
    setPage(0)
  }

  const IconComponent = emptyIcon || Inbox

  if (error) {
    return (
      <div className={cn("flex bg-card flex-col border border-border/60 rounded-2xl shadow-sm overflow-hidden", className)}>
        <ErrorState message={error} onRetry={onRetry} />
      </div>
    )
  }

  return (
    <div className={cn("flex bg-card flex-col border border-border/60 rounded-2xl shadow-sm overflow-hidden", className)}>
      {/* Toolbar */}
      {(searchable || toolbar) && (
        <div className="p-4 border-b border-border/40 bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {searchable && searchFn && (
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 w-full bg-background/50 border-input/60 rounded-xl h-9"
                aria-label="Search table"
              />
            </div>
          )}
          {toolbar && <div className="flex items-center gap-2 sm:ml-auto">{toolbar}</div>}
        </div>
      )}

      {/* Table */}
      <div className="relative w-full overflow-auto">
        {loading ? (
          <TableSkeleton columns={columns.length} />
        ) : sorted.length === 0 ? (
          <EmptyState
            icon={IconComponent}
            title={search ? "No results found" : emptyTitle}
            description={search ? `No records match "${search}". Try a different search.` : emptyDescription}
          />
        ) : (
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-border/40">
                {columns.map((col) => (
                  <TableHead
                    key={col.key}
                    className={cn(
                      "font-semibold text-foreground",
                      col.sortable && "cursor-pointer select-none hover:bg-muted/50 transition-colors",
                      col.headerClassName
                    )}
                    onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  >
                    <div className="flex items-center gap-1.5">
                      {col.header}
                      {col.sortable && (
                        <span className="text-muted-foreground">
                          {sortKey === col.key ? (
                            sortDirection === "asc" ? (
                              <ArrowUp className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />
                          )}
                        </span>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((row, idx) => (
                <TableRow
                  key={(row as Record<string, unknown>).id as string ?? idx}
                  className="group hover:bg-muted/20 transition-colors border-border/40"
                >
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.className}>
                      {col.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {!loading && sorted.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 bg-muted/10">
          <p className="text-xs text-muted-foreground">
            Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, sorted.length)} of{" "}
            {sorted.length} {search && `(filtered from ${data.length})`}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={() => setPage(0)}
              disabled={page === 0}
              aria-label="First page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs font-medium text-muted-foreground px-2">
              {page + 1} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={() => setPage(totalPages - 1)}
              disabled={page >= totalPages - 1}
              aria-label="Last page"
            >
              <ChevronsRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
