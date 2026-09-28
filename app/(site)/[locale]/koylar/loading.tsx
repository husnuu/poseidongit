export default function KoylarLoading() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-[1400px] px-4 py-12 sm:py-16">
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <div className="h-9 w-64 animate-pulse rounded bg-neutral-200" />
          <div className="mt-4 h-5 w-full max-w-xl animate-pulse rounded bg-neutral-100" />
        </div>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 md:gap-8 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-[4/3] w-full animate-pulse rounded-2xl bg-neutral-200" />
          ))}
        </div>
      </div>
    </div>
  )
}
