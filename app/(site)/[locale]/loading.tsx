/**
 * Locale altındaki sayfalar yüklenirken hero şablonuyla uyumlu iskelet (View Source / streaming).
 */
export default function LocaleRouteLoading() {
  return (
    <div className="min-h-screen bg-white">
      <section className="hero-skeleton" aria-hidden>
        <div className="hero-skeleton__shimmer" />
        <div className="hero-skeleton__badge" />
        <div className="hero-skeleton__content">
          <div className="hero-skeleton__eyebrow" />
          <div className="hero-skeleton__title-line" />
          <div className="hero-skeleton__title-line hero-skeleton__title-line--short" />
          <div className="hero-skeleton__sub" />
          <div className="hero-skeleton__sub hero-skeleton__sub--2" />
          <div className="hero-skeleton__ctas">
            <div className="hero-skeleton__cta" />
            <div className="hero-skeleton__cta hero-skeleton__cta--secondary" />
          </div>
        </div>
      </section>
      <div className="mx-auto max-w-[1200px] px-4 py-12">
        <div className="mb-8 h-10 max-w-md rounded-lg bg-zinc-200/90" />
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="overflow-hidden rounded-2xl border border-black/5 bg-zinc-100 shadow-sm"
            >
              <div className="aspect-[4/3] w-full animate-pulse bg-zinc-200/80" />
              <div className="space-y-3 p-6">
                <div className="h-6 w-4/5 rounded bg-zinc-200/90" />
                <div className="h-4 w-full rounded bg-zinc-200/70" />
                <div className="h-4 w-11/12 rounded bg-zinc-200/70" />
                <div className="h-11 w-full rounded-xl bg-zinc-300/80" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
