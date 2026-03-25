import { Skeleton } from "@/components/ui/skeleton"

interface TableSkeletonProps {
  columns?: number
  rows?: number
}

export function TableSkeleton({ columns = 5, rows = 6 }: TableSkeletonProps) {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3 bg-muted/30 border-b border-border/40">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`h-${i}`} className="h-4 flex-1 rounded" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={`r-${rowIndex}`}
          className="flex items-center gap-4 px-4 py-4 border-b border-border/20"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={`c-${rowIndex}-${colIndex}`}
              className={`h-4 flex-1 rounded ${colIndex === 0 ? "max-w-[200px]" : ""}`}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
