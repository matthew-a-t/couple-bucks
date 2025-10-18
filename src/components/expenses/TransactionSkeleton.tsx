export const TransactionSkeleton = () => {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center justify-between p-4 bg-white border border-border rounded-xl animate-pulse"
        >
          <div className="flex-1 space-y-2">
            {/* Category skeleton */}
            <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-24 bg-[length:200%_100%] animate-shimmer" />
            {/* Description skeleton */}
            <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-32 bg-[length:200%_100%] animate-shimmer" />
          </div>
          {/* Amount skeleton */}
          <div className="h-5 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-16 bg-[length:200%_100%] animate-shimmer" />
        </div>
      ))}
    </div>
  )
}
