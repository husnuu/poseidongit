export default function KoylarLoading() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="h-12 w-64 bg-neutral-200 rounded animate-pulse" />
        <div className="mt-4 h-5 max-w-2xl bg-neutral-100 rounded animate-pulse" />
        <div className="mt-2 h-5 max-w-xl bg-neutral-100 rounded animate-pulse" />
        <div className="mt-10 space-y-12">
          {[1, 2, 3].map((i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-0">
              <div className="h-[260px] md:h-[340px] bg-neutral-200 animate-pulse" />
              <div className="h-[260px] md:h-[340px] bg-neutral-100 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
