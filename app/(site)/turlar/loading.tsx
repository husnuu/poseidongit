export default function TurlarLoading() {
  return (
    <div className="min-h-screen bg-white">
      <section className="w-full py-14 md:py-20">
        <div className="mx-auto max-w-[1200px] px-4">
          <div className="mb-12 h-16 w-64 bg-zinc-200 rounded animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200">
                <div className="aspect-[4/3] bg-zinc-200 animate-pulse" />
                <div className="p-6 space-y-3">
                  <div className="h-6 w-4/5 bg-zinc-200 rounded animate-pulse" />
                  <div className="h-4 w-full bg-zinc-100 rounded animate-pulse" />
                  <div className="h-4 w-2/3 bg-zinc-100 rounded animate-pulse" />
                  <div className="h-8 w-24 bg-zinc-200 rounded mt-4 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
