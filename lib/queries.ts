/** Tüm yayımlanmış tur slug'ları (generateStaticParams / sitemap için) */
export const tourSlugsQuery = `*[_type == "tour" && defined(slug.current)]{ "slug": slug.current }`

export const tourBySlugQuery = `*[_type == "tour" && slug.current == $slug][0] {
  _id,
  title,
  "slug": slug.current,
  shortDescription,
  description,
  mainImage{
    asset,
    "url": asset->url,
    "metadata": asset->metadata {
      lqip,
      dimensions
    }
  },
  gallery[]{
    asset,
    "url": asset->url,
    "metadata": asset->metadata {
      lqip,
      dimensions
    }
  },
  tourVideo{
    enabled,
    type,
    youtubeUrl,
    vimeoUrl,
    caption,
    "fileUrl": file.asset->url,
    poster{
      asset,
      "url": asset->url,
      "metadata": asset->metadata {
        lqip,
        dimensions
      }
    }
  },
  rating,
  reviewCount,
  ratingLabel,
  reviewsUrl,
  quickFacts{
    durationText,
    availabilityText,
    meetingLocation,
    language,
    groupType,
    maxCapacity
  },
  highlights[]{
    icon,
    title,
    description
  },
  tourDetails[]{
    label,
    value,
    icon
  },
  itinerary[]{
    time,
    title,
    description,
    tag,
    image{
      asset,
      "url": asset->url,
      "metadata": asset->metadata {
        lqip,
        dimensions
      }
    }
  },
  included,
  notIncluded,
  faqs[]{
    question,
    answer
  },
  host{
    name,
    title,
    photo{
      asset,
      "url": asset->url,
      "metadata": asset->metadata {
        lqip,
        dimensions
      }
    },
    note
  },
  whyYouWillLove{
    title,
    text
  },
  whereSection{
    enabled,
    heading,
    meetingPointLabel,
    meetingPointAddress,
    mapEmbedUrl,
    openInMapsLabel
  },
  pickupPoints[]{
    name,
    address,
    description,
    isDefault
  },
  mealMenu{
    enabled,
    sectionTitle,
    description,
    options[]{ key, label, description }
  },
  _updatedAt,
  ticketClasses[]{
    key,
    label,
    description,
    badge,
    bullets,
    classImage{
      asset,
      "url": asset->url,
      "metadata": asset->metadata { lqip, dimensions }
    },
    pricesByAge[]{
      ageKey,
      ageLabel,
      minAge,
      maxAge,
      price
    }
  },
  bookingRules{ show, title, bullets },
  baseCapacity{ ecoCapacity, premiumCapacity, firstCapacity },
  availabilityOverrides[]{
    date,
    eco,
    premium,
    first,
    note
  },
  availability{
    enabled,
    defaultAvailable,
    dateRanges[]{ start, end, available },
    specificDates[]{
      date,
      enabled,
      defaultAvailable,
      available,
      priceOverrides{ adultPrice, childPrice, infantPrice },
      classPriceOverrides[]{ classKey, adultPrice, childPrice, infantPrice },
      classAvailability[]{ classKey, status }
    }
  },
  seasonRules[]{
    name,
    start,
    end,
    multiplier
  },
  deposit{
    enabled,
    type,
    value
  },
  extras[]{
    title,
    description,
    price,
    priceType,
    icon
  },
  bookingCard{
    fromText,
    ctaText,
    urgencyText,
    trustBadges
  },
  reviewsSection{
    enabled,
    reviewCount,
    ratingValue,
    ratingDots,
    sourceLabel,
    moreLinkText,
    moreLinkUrl,
    items[]{
      name,
      title,
      description,
      rating,
      avatar{
        asset,
        "url": asset->url,
        "metadata": asset->metadata {
          lqip,
          dimensions
        }
      }
    }
  }
}`

/** Tour capacity only – for GET /api/availability (by _id or slug). */
export const tourForAvailabilityQuery = `*[_type == "tour" && (_id == $tourId || slug.current == $tourId)][0] {
  _id,
  "slug": slug.current,
  baseCapacity{ ecoCapacity, premiumCapacity, firstCapacity },
  availabilityOverrides[]{ date, eco, premium, first, note }
}`

/** Admin: tüm turlar liste (dropdown + kapak eşlemesi). */
export const toursListForAdminQuery = `*[_type == "tour" && defined(slug.current)] | order(title asc) {
  _id,
  title,
  "slug": slug.current,
  mainImage{ asset }
}`

/** Admin: tur kapak görselleri – _id listesi ile. */
export const tourCoversByIdsQuery = `*[_type == "tour" && _id in $ids] {
  _id,
  mainImage{ asset }
}`

/** Admin: tek tur – başlık + bilet sınıfları (manuel rezervasyon formu). */
export const tourClassesForAdminQuery = `*[_type == "tour" && (_id == $tourId || slug.current == $tourId)][0] {
  _id,
  title,
  ticketClasses[]{ key, label },
  mealMenu{
    enabled,
    sectionTitle,
    description,
    options[]{ key, label }
  }
}`

/** Tour kapak görseli, toplanma, süre, galeri, kapora, dahil/dahil değil – voucher için. */
export const tourImageAndPickupQuery = `*[_type == "tour" && (_id == $tourId || slug.current == $tourId)][0] {
  mainImage{ asset },
  "gallery": gallery[0...3][].asset,
  "durationLabel": quickFacts.durationText,
  "meetingPoint": coalesce(whereSection.meetingPointAddress, quickFacts.meetingLocation),
  quickFacts{ meetingLocation, startTime, returnTime, durationText },
  whereSection{ meetingPointAddress },
  deposit{ enabled, type, value },
  included,
  notIncluded
}`

export const siteSettingsQuery = `*[_type == "siteSettings"][0] {
  siteName,
  tagline,
  seo{
    metaTitle,
    metaDescription
  },
  logo{
    asset,
    "url": asset->url,
    "metadata": asset->metadata {
      lqip,
      dimensions
    }
  },
  favicon{
    asset
  },
  headerNav[]{
    label,
    href
  },
  cta{
    text,
    href
  },
  announcementBar{
    enabled,
    text,
    icon,
    linkUrl
  },
  headerLanguages[]{
    code,
    label,
    flag{
      asset,
      "url": asset->url,
      "metadata": asset->metadata { lqip, dimensions }
    }
  },
  footerNav[]{
    label,
    href
  },
  legalNav[]{
    label,
    href
  },
  contactInfo{
    phone,
    whatsapp,
    email,
    address
  },
  socialLinks[]{
    platform,
    href
  }
}`

export const blogsListQuery = `*[_type == "blog"] | order(publishedAt desc) {
  _id,
  title,
  "slug": slug.current,
  excerpt,
  coverImage{
    asset,
    "url": asset->url,
    "metadata": asset->metadata { lqip, dimensions },
    alt
  },
  "author": coalesce(authorName, author),
  "publishDate": coalesce(publishedAt, publishDate),
  "readTime": select(readingTime != null => string(readingTime) + " dk", readTime),
  category,
  tags
}`

export const blogPageQuery = `*[_type == "blogPage"][0] {
  heroTitle,
  heroHighlightTitlePart,
  heroDescription,
  heroImage{
    asset,
    "url": asset->url,
    "metadata": asset->metadata { lqip, dimensions },
    alt
  }
}`

export const blogBySlugQuery = `*[_type == "blog" && slug.current == $slug][0] {
  _id,
  title,
  "slug": slug.current,
  excerpt,
  content,
  coverImage{
    asset,
    "url": asset->url,
    "metadata": asset->metadata { lqip, dimensions },
    alt
  },
  "author": coalesce(authorName, author),
  "publishDate": coalesce(publishedAt, publishDate),
  "readTime": select(readingTime != null => string(readingTime) + " dk", readTime),
  category,
  tags,
  _updatedAt
}`

export const homePageHeroQuery = `*[_type == "homePage"][0] {
  seo{
    metaTitle,
    metaDescription
  },
  hero{
    eyebrow,
    topBadgeText,
    heading,
    subheading,
    heroBadgeEnabled,
    primaryCta{ label, href },
    secondaryCta{ label, href },
    "heroImageUrl": heroImage.asset->url,
    "heroImageAlt": heroImage.alt,
    "heroImageMobileUrl": heroImageMobile.asset->url
  },
  featureBar[0...4]{
    icon,
    title,
    description
  },
  popularToursSection{
    enabled,
    title,
    subtitle,
    "items": items[]->{
      _id,
      title,
      "slug": slug.current,
      shortDescription,
      "durationLabel": quickFacts.durationText,
      "departureLabel": quickFacts.meetingLocation,
      "priceFrom": ticketClasses[0].pricesByAge[0].price,
      rating,
      reviewCount,
      reviewsUrl,
      isPopular,
      mainImage{ asset, alt }
    }
  },
  aboutTeaser{
    enabled,
    heading,
    body,
    "imageUrl": image.asset->url,
    "imageAlt": image.alt,
    primaryCta{ label, href },
    secondaryCta{ label, href }
  },
  blogSection{
    enabled,
    heading,
    subtitle,
    "posts": posts[]->{
      _id,
      title,
      "slug": slug.current,
      excerpt,
      "publishDate": coalesce(publishedAt, publishDate),
      coverImage{ asset, alt }
    },
    ctaButton{ label, href }
  },
  routeSection{
    enabled,
    heading,
    description,
    ctaButton{ label, href },
    locations[0...4]{
      name,
      location,
      image{ asset, alt }
    }
  },
  instagramSection{
    enabled,
    heading,
    description,
    instagramUrl,
    ctaText,
    "posts": posts[0...4][]{
      "imageUrl": image.asset->url,
      "imageAlt": coalesce(alt, image.alt),
      postUrl
    }
  }
}`

// Taslak veya yayımlanmış Contact Page (singleton: _id contactPage / drafts.contactPage)
export const contactPageQuery = `coalesce(
  *[_id == "drafts.contactPage"][0],
  *[_id == "contactPage"][0]
) {
  title,
  metaTitle,
  metaDescription,
  intro,
  form{
    submitLabel,
    successMessage
  },
  contactCards[]{
    type,
    label,
    value,
    href,
    highlight
  },
  officeAddress,
  businessHours,
  email,
  phone,
  whatsapp,
  instagramUrl,
  youtubeUrl,
  youtubeLabel,
  instagramLabel,
  mapEmbedUrl,
  locationTitle,
  showPopularTours,
  popularToursTitle,
  "popularTours": popularTours[]->{
    _id,
    title,
    "slug": slug.current,
    shortDescription,
    durationLabel,
    departureLabel,
    priceFrom,
    rating,
    reviewCount,
    reviewsUrl,
    isPopular,
    mainImage{
      asset,
      "url": asset->url,
      "metadata": asset->metadata { lqip, dimensions },
      alt
    }
  }
}`

export const toursListQuery = `*[_type == "tour"] | order(title asc) {
  _id,
  title,
  "slug": slug.current,
  shortDescription,
  rating,
  reviewCount,
  reviewsUrl,
  isPopular,
  mainImage{
    asset,
    alt
  },
  "departureLabel": quickFacts.meetingLocation,
  "durationLabel": quickFacts.durationText,
  "priceFrom": ticketClasses[0].pricesByAge[0].price
}`

export const toursPageQuery = `*[_type == "toursPage"][0] {
  "slug": slug.current,
  titleTop,
  titleBottom
}`

/** Koylar sayfası: başlık ve açıklama (items ayrı veya covesList ile doldurulur) */
export const covesPageQuery = `*[_type == "covesPage"][0] {
  title,
  description,
  metaTitle,
  metaDescription,
  "items": items[]->{
    _id,
    title,
    "slug": slug.current,
    description,
    image { asset, alt },
    order,
    locationTag
  }
}`

/** Tüm koylar, sıra ve başlığa göre (sayfa items boşsa bunu kullan) */
export const covesListQuery = `*[_type == "cove"] | order(coalesce(order, 999) asc, title asc) {
  _id,
  title,
  "slug": slug.current,
  description,
  image { asset, alt },
  order,
  locationTag
}`

export const footerQuery = `*[_type == "homePage"][0] {
  contactQuick{
    email,
    phone,
    whatsappNumber,
    address
  }
}`

export const siteFooterQuery = `*[_type == "siteFooter"][0] {
  brandName,
  logo {
    asset,
    "url": asset->url,
    alt
  },
  topRated {
    enabled,
    label,
    ratingValue,
    ratingMax,
    reviewCount
  },
  contact {
    email,
    phone,
    addressTitle,
    addressLines,
    chatTitle,
    chatValue,
    openingTitle,
    openingValue
  },
  explore {
    title,
    links[] {
      label,
      href,
      openInNewTab
    }
  },
  social {
    title,
    items[] {
      platform,
      href,
      enabled
    }
  },
  brag {
    title,
    badges[] {
      type,
      enabled,
      alt,
      href,
      image { asset, "url": asset->url },
      "imageUrl": image.asset->url
    }
  },
  legalLinks {
    items[] {
      label,
      href,
      enabled
    }
  },
  footerLegal {
    copyrightText,
    companyLine1,
    companyLine2,
    secure3dLabel,
    paymentLogos[] {
      asset,
      alt
    }
  },
  craftedBy {
    name,
    linkedInUrl
  }
}`

export const aboutPageQuery = `*[_type == "aboutPage"][0] {
  "slug": slug.current,
  titleTop,
  titleBottom,
  intro,
  sectionTitle,
  sectionSubtitle,
  sectionBody,
  timelineTitle,
  timelineDescription,
  boats[] {
    year,
    name,
    description,
    order,
    isActive,
    image { asset, alt }
  }
}`

/** Yasal sayfa slug ile (Gizlilik Politikası, Kullanım Şartları vb.) */
export const legalPageBySlugQuery = `*[_type == "legalPage" && slug.current == $slug][0] {
  _id,
  title,
  "slug": slug.current,
  seoTitle,
  seoDescription,
  content,
  updatedAt
}`

/** Sık Sorulanlar sayfası (singleton) */
export const faqPageQuery = `*[_type == "faqPage"][0] {
  seo {
    metaTitle,
    metaDescription
  },
  cover {
    heading,
    description,
    image { asset, alt }
  },
  sections[] {
    sectionTitle,
    items[] {
      question,
      answer
    }
  }
}`
