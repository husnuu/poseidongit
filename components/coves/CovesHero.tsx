interface CovesHeroProps {
  title: string
  description?: string | null
}

/** Tipografi artık globals.css'teki .pageSectionHeading / .pageSectionLead
    tek kaynağından geliyor — hakkımızda ve diğer sayfalarla aynı. */
export default function CovesHero({ title, description }: CovesHeroProps) {
  const titleUpper = (title || '').toUpperCase().trim()

  return (
    <header className="mb-10 text-center md:mb-14">
      {titleUpper && <h1 className="pageSectionHeading">{titleUpper}</h1>}
      {description?.trim() && <p className="pageSectionLead">{description}</p>}
    </header>
  )
}
