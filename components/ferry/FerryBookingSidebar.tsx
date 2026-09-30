'use client'

import { useState } from 'react'
import FerryBookingCard, { type FerryExtraFee } from '@/components/FerryBookingCard'
import FerryBookingWizard from '@/components/ferry/FerryBookingWizard'
import FerryMobileStickyBar from '@/components/ferry/FerryMobileStickyBar'
import { adultFromFare, type FerryAgeTier } from '@/components/ferry/ferryTypes'
import type { SiteLocale } from '@/lib/i18n/config'

interface FerryBookingSidebarProps {
  title: string
  ferryTitle: string
  ageTiers: FerryAgeTier[]
  currency: string
  numberLocale: string
  departurePort: string
  arrivalPort: string
  cashNote?: string | null
  extraFees?: FerryExtraFee[] | null
  bulletItems?: string[] | null
  importantNotes: string[]
  /** "Bilmeniz Gerekenler" gibi CMS başlığı — rezervasyon modalındaki notlar bölümünde kullanılır. */
  notesTitle?: string
  ctaLabel: string
  waBaseHref: string | null
  locale: SiteLocale
}

/** Tur sayfalarındaki gibi: masaüstünde sticky kart, mobilde alt sabit şerit — ikisi de aynı rezervasyon modalını paylaşır. */
export default function FerryBookingSidebar({
  title,
  ferryTitle,
  ageTiers,
  currency,
  numberLocale,
  departurePort,
  arrivalPort,
  cashNote,
  extraFees,
  bulletItems,
  importantNotes,
  notesTitle,
  ctaLabel,
  waBaseHref,
  locale,
}: FerryBookingSidebarProps) {
  const [wizardOpen, setWizardOpen] = useState(false)
  const fromPrice = adultFromFare(ageTiers)

  return (
    <>
      <aside className="hidden lg:block lg:flex-shrink-0 lg:w-[360px]">
        <div className="lg:sticky lg:top-24">
          <FerryBookingCard
            title={title}
            ageTiers={ageTiers}
            currency={currency}
            numberLocale={numberLocale}
            cashNote={cashNote}
            extraFees={extraFees}
            bulletItems={bulletItems}
            ctaLabel={ctaLabel}
            onReserve={() => setWizardOpen(true)}
          />
        </div>
      </aside>

      <FerryMobileStickyBar
        fromPrice={fromPrice}
        currency={currency}
        numberLocale={numberLocale}
        ctaLabel={ctaLabel}
        onReserve={() => setWizardOpen(true)}
        isModalOpen={wizardOpen}
      />

      <FerryBookingWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        ferryTitle={ferryTitle}
        departurePort={departurePort}
        arrivalPort={arrivalPort}
        currency={currency}
        ageTiers={ageTiers}
        importantNotes={importantNotes}
        notesTitle={notesTitle}
        cashNote={cashNote}
        extraFees={extraFees}
        waBaseHref={waBaseHref}
        locale={locale}
        numberLocale={numberLocale}
      />
    </>
  )
}
