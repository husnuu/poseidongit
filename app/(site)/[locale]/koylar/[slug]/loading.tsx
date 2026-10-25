export default function CoveDetailLoading() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-[1200px] px-4 pt-8 md:pt-10">
        <div className="h-4 w-56 animate-pulse rounded bg-neutral-100" />
        <div className="mt-7 h-11 w-80 max-w-full animate-pulse rounded bg-neutral-200" />
        <div className="mt-4 h-5 w-full max-w-2xl animate-pulse rounded bg-neutral-100" />
        <div className="mt-10 aspect-[4/3] w-full animate-pulse rounded-3xl bg-neutral-200 md:aspect-auto md:h-[480px]" />
      </div>
    </div>
  )
}
