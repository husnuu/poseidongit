/** Sanity GROQ — yat kiralama */

const imageProjection = `{
  asset,
  alt,
  "url": asset->url,
  "metadata": asset->metadata { lqip, dimensions }
}`

const yachtCore = `
  _id,
  name,
  "slug": slug.current,
  shortDescription,
  fullDescription,
  marina,
  departurePoint,
  yachtType,
  priceFrom,
  currency,
  mainImage${imageProjection},
  gallery[]${imageProjection},
  amenities,
  included,
  notIncluded,
  specifications,
  technicalSpecs[]{ label, value },
  badges,
  showHeroPopular,
  showHeroTopRated,
  valueProposition,
  trustRating,
  trustReviewsLabel,
  trustYearsExperience,
  trustFleetLine,
  blockedDates,
  blockedDatesDaily,
  blockedDatesOvernight,
  dailyRentalEnabled,
  overnightRentalEnabled,
  dailyDatePricing[]{ date, price },
  overnightNightPricing[]{ date, price },
  "overnightTotalPrice": coalesce(overnightTotalPrice, overnightPriceFrom),
  inquiryCard{
    title,
    ctaText,
    trustBadges,
    noteTitle,
    noteSubtitle,
    urgencyLine1,
    urgencyLine2,
    responseTimeLabel,
    popularityLabel
  },
  routeSuggestions,
  relatedTours[]->{
    title,
    "slug": slug.current
  },
  relatedYachts[]->{
    name,
    "slug": slug.current,
    "locationSlug": location->slug.current
  },
  termsAndNotes,
  cancellationPaymentPolicies,
  cancellationCheckPriceLabel,
  cancellationCheckPriceUrl,
  sailingLicenceRequired,
  petsPolicy,
  paymentMethodsAccepted,
  marinaInformation,
  faqs[]{ question, answer },
  isFeatured,
  isActive,
  seo{
    title,
    description,
    ogImage${imageProjection}
  },
  "locationTitle": location->title,
  "locationSlug": location->slug.current
`

/** Kart / liste için hafif alanlar */
export const yachtListProjection = `
  _id,
  name,
  "slug": slug.current,
  shortDescription,
  priceFrom,
  overnightNightPricing[]{ price },
  "overnightTotalPrice": coalesce(overnightTotalPrice, overnightPriceFrom),
  currency,
  dailyRentalEnabled,
  overnightRentalEnabled,
  isFeatured,
  yachtType,
  marina,
  departurePoint,
  "locationTitle": location->title,
  "locationSlug": location->slug.current,
  specifications{ length, cabins, capacity, buildYear },
  mainImage${imageProjection}
`

export const yachtRentalsAllQuery = `*[_type == "yachtRental" && isActive == true] | order(isFeatured desc, name asc) {
  ${yachtListProjection}
}`

export const yachtRentalsByLocationQuery = `*[_type == "yachtRental" && isActive == true && location->slug.current == $locationSlug] | order(isFeatured desc, name asc) {
  ${yachtListProjection}
}`

export const yachtRentalBySlugQuery = `*[_type == "yachtRental" && slug.current == $slug && isActive == true][0] {
  ${yachtCore}
}`

export const yachtRentalByLocationAndSlugQuery = `*[_type == "yachtRental" && slug.current == $yachtSlug && isActive == true && location->slug.current == $locationSlug][0] {
  ${yachtCore}
}`

export const yachtLocationBySlugQuery = `*[_type == "yachtLocation" && slug.current == $slug][0] {
  _id,
  title,
  "slug": slug.current,
  intro
}`

export const yachtRentalSlugsQuery = `*[_type == "yachtRental" && isActive == true && defined(slug.current)]{
  "slug": slug.current,
  "locationSlug": location->slug.current
}`

export const yachtLocationSlugsQuery = `*[_type == "yachtLocation" && defined(slug.current)]{
  "slug": slug.current
}`
