export function PageLoading() {
  return (
    <div className="animate-fade-in">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-8 w-48 bg-border/50 rounded-[var(--radius-sm)] animate-pulse" />
        <div className="h-4 w-72 bg-border/30 rounded-[var(--radius-sm)] animate-pulse mt-2" />
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-bg-card rounded-[var(--radius-md)] border border-border p-5 space-y-3"
          >
            <div className="h-4 w-3/4 bg-border/50 rounded animate-pulse" />
            <div className="h-3 w-full bg-border/30 rounded animate-pulse" />
            <div className="h-3 w-2/3 bg-border/30 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
