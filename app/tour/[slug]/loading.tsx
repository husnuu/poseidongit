export default function TourLoading() {
  return (
    <div className="min-h-screen bg-white animate-pulse">
      {/* Hero / gallery alanı */}
      <div className="w-full aspect-[4/3] max-h-[480px] bg-zinc-200" />
      <div className="container mx-auto px-4 py-16 max-w-[1360px]">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
          <main className="flex-1 min-w-0 space-y-6">
            <div className="h-10 w-3/4 bg-zinc-200 rounded" />
            <div className="h-5 w-full max-w-xl bg-zinc-100 rounded" />
            <div className="h-5 w-2/3 bg-zinc-100 rounded" />
            <div className="flex gap-4 mt-6">
              <div className="h-8 w-24 bg-zinc-100 rounded" />
              <div className="h-8 w-28 bg-zinc-100 rounded" />
            </div>
            <div className="mt-10 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-zinc-100 rounded-xl" />
              ))}
            </div>
          </main>
          <aside className="lg:w-[360px] shrink-0">
            <div className="sticky top-24 rounded-2xl border border-zinc-200 bg-zinc-50 p-6 space-y-4">
              <div className="h-8 w-32 bg-zinc-200 rounded" />
              <div className="h-6 w-24 bg-zinc-100 rounded" />
              <div className="h-12 w-full bg-zinc-200 rounded-xl mt-6" />
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
