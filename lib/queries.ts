/** Tüm yayımlanmış tur slug'ları (generateStaticParams / sitemap için) */
export const tourSlugsQuery = `*[_type == "tour" && defined(slug.current)]{ "slug": slug.current }`

/** TR + EN + DE slug satırları (locale’li static params / sitemap) */
export const tourSlugRowsForLocalesQuery = `*[_type == "tour"]{
  "tSlug": slug.current,
  "enSlug": translations.en.slug.current,
  "deSlug": translations.de.slug.current,
  _updatedAt
}`

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
  reelsSection{
    enabled,
    sectionTitle,
    items[]{
      caption,
      "videoUrl": video.asset->url,
      poster{
        asset,
        "url": asset->url,
        "metadata": asset->metadata {
          lqip,
          dimensions
        }
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
    locationMapLink,
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
  foodMenu{
    enabled,
    sectionTitle,
    intro,
    items[]{
      title,
      excerpt,
      priceLabel,
      metaLine1,
      metaLine2,
      image{ asset, alt },
      detail[]
    }
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
    },
    dateRangePrices[]{
      label,
      start,
      end,
      pricesByAge[]{
        ageKey,
        ageLabel,
        minAge,
        maxAge,
        price
      }
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
  },
  translations
}`

export const tourByLocaleSlugQuery = `*[_type == "tour" && (
  ($locale == "tr" && slug.current == $slug) ||
  ($locale == "en" && (
    translations.en.slug.current == $slug ||
    (!defined(translations.en.slug.current) && slug.current == $slug)
  )) ||
  ($locale == "de" && (
    translations.de.slug.current == $slug ||
    (!defined(translations.de.slug.current) && slug.current == $slug)
  ))
)][0] {
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
  reelsSection{
    enabled,
    sectionTitle,
    items[]{
      caption,
      "videoUrl": video.asset->url,
      poster{
        asset,
        "url": asset->url,
        "metadata": asset->metadata {
          lqip,
          dimensions
        }
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
    locationMapLink,
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
  foodMenu{
    enabled,
    sectionTitle,
    intro,
    items[]{
      title,
      excerpt,
      priceLabel,
      metaLine1,
      metaLine2,
      image{ asset, alt },
      detail[]
    }
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
    },
    dateRangePrices[]{
      label,
      start,
      end,
      pricesByAge[]{
        ageKey,
        ageLabel,
        minAge,
        maxAge,
        price
      }
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
  },
  translations
}`

/** Tour capacity only – for GET /api/availability (by _id or any locale slug, same as booking tour resolution). */
export const tourForAvailabilityQuery = `*[_type == "tour" && (
  _id == $tourId ||
  slug.current == $tourId ||
  translations.en.slug.current == $tourId ||
  translations.de.slug.current == $tourId
)][0] {
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
    labelEn,
    labelDe,
    href
  },
  cta{
    text,
    textEn,
    textDe,
    href
  },
  announcementBar{
    enabled,
    text,
    textEn,
    textDe,
    icon,
    linkUrl
  },
  headerLanguages[]{
    code,
    label,
    comingSoon,
    comingSoonBadge{
      asset,
      "url": asset->url,
      "metadata": asset->metadata { lqip, dimensions }
    },
    flag{
      asset,
      "url": asset->url,
      "metadata": asset->metadata { lqip, dimensions }
    }
  },
  footerNav[]{
    label,
    labelEn,
    labelDe,
    href
  },
  legalNav[]{
    label,
    labelEn,
    labelDe,
    href
  },
  "cookiePolicyPath": select(
    defined(cookiePolicyPage->slug.current) => "/yasal/" + cookiePolicyPage->slug.current
  ),
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

/** TravelAgency JSON-LD: logo, favicon, isteğe bağlı özel görseller */
export const siteSettingsTravelAgencyImagesQuery = `*[_type == "siteSettings"][0]{
  logo{ asset },
  favicon{ asset },
  richResultsImages[]{ asset }
}`

/** Ana sayfa hero URL’leri (JSON-LD yedeği) */
export const homePageHeroImageUrlsQuery = `*[_type == "homePage"][0]{
  "heroImageUrl": heroImage.asset->url,
  "heroImageMobileUrl": heroImageMobile.asset->url
}`

/** Çerez bildirimi: yalnızca politikası URL’si (hafif sorgu) */
export const siteSettingsCookiePolicyQuery = `*[_type == "siteSettings"][0]{
  "cookiePolicyPath": select(
    defined(cookiePolicyPage->slug.current) => "/yasal/" + cookiePolicyPage->slug.current
  )
}`

/** Sabit WhatsApp butonu */
export const siteSettingsWhatsappQuery = `*[_type == "siteSettings"][0]{
  "whatsapp": contactInfo.whatsapp
}`

/** Footer logosunu header ile aynı kaynaktan (siteSettings) hizalamak için hafif sorgu */
export const siteSettingsLogoQuery = `*[_type == "siteSettings"][0]{
  siteName,
  logo{
    asset,
    alt,
    "url": asset->url
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
  readingTime,
  readTime,
  category,
  tags,
  translations,
  seo{ metaTitle, metaDescription }
}`

export const blogPageMetaQuery = `*[_type == "blogPage"][0]{
  seo{ metaTitle, metaDescription },
  pageTranslations
}`

export const blogPageQuery = `*[_type == "blogPage"][0] {
  seo{ metaTitle, metaDescription },
  heroTitle,
  heroHighlightTitlePart,
  heroDescription,
  heroImage{
    asset,
    "url": asset->url,
    "metadata": asset->metadata { lqip, dimensions },
    alt
  },
  pageTranslations
}`

export const blogBySlugQuery = `*[_type == "blog" && (
  slug.current == $slug ||
  translations.en.slug.current == $slug ||
  translations.de.slug.current == $slug
)][0] {
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
  authorName,
  "publishDate": coalesce(publishedAt, publishDate),
  readingTime,
  readTime,
  category,
  tags,
  translations,
  seo{ metaTitle, metaDescription, ogImage },
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
      mainImage{ asset, alt },
      translations
    }
  },
  popularYachtsSection{
    enabled,
    title,
    subtitle,
    ctaButton{ label, href },
    "items": items[]->{
      _id,
      name,
      "slug": slug.current,
      isActive,
      yachtType,
      isFeatured,
      badges,
      included,
      sailingLicenceRequired,
      priceFrom,
      "overnightTotalPrice": coalesce(overnightTotalPrice, overnightPriceFrom),
      currency,
      dailyRentalEnabled,
      overnightRentalEnabled,
      overnightNightPricing[]{ price },
      marina,
      "locationTitle": location->title,
      "locationSlug": location->slug.current,
      specifications{ length, cabins, capacity, buildYear },
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
      coverImage{ asset, alt },
      translations
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
  loyaltyBanner{
    enabled,
    "imageUrl": image.asset->url,
    "imageAlt": image.alt,
    href
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
  },
  pageTranslations
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
  locationMapLink,
  locationTitle,
  showPopularTours,
  popularToursTitle,
  "popularTours": popularTours[]->{
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
    mainImage{
      asset,
      "url": asset->url,
      "metadata": asset->metadata { lqip, dimensions },
      alt
    },
    translations
  },
  pageTranslations
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
  "priceFrom": ticketClasses[0].pricesByAge[0].price,
  translations
}`

export const toursPageQuery = `*[_type == "toursPage"][0] {
  "slug": slug.current,
  titleTop,
  titleBottom
}`

export const yachtRentalsPageQuery = `*[_type == "yachtRentalsPage"][0] {
  "slug": slug.current,
  titleTop,
  titleBottom,
  intro,
  emptyStateMessage,
  seo{
    title,
    description
  }
}`

/** Koylar sayfası: başlık ve açıklama (items ayrı veya covesList ile doldurulur) */
export const covesPageQuery = `*[_type == "covesPage"][0] {
  title,
  description,
  metaTitle,
  metaDescription,
  pageTranslations,
  "items": items[]->{
    _id,
    title,
    "slug": slug.current,
    description,
    image { asset, alt },
    order,
    locationTag,
    translations
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
  locationTag,
  translations
}`

export const footerQuery = `*[_type == "homePage"][0] {
  contactQuick{
    email,
    phone,
    whatsappNumber,
    address
  }
}`

/** Minimal contact fields for homepage help banner (matches footer CMS). */
export const siteFooterContactQuery = `*[_type == "siteFooter"][0]{
  contact {
    email,
    phone,
    chatValue,
    openingValue,
    openingValueEn,
    openingValueDe
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
    labelEn,
    labelDe,
    ratingValue,
    ratingMax,
    reviewCount
  },
  contact {
    email,
    phone,
    addressTitle,
    addressTitleEn,
    addressTitleDe,
    addressLines,
    chatTitle,
    chatTitleEn,
    chatTitleDe,
    chatValue,
    openingTitle,
    openingTitleEn,
    openingTitleDe,
    openingValue,
    openingValueEn,
    openingValueDe
  },
  explore {
    title,
    titleEn,
    titleDe,
    links[] {
      label,
      labelEn,
      labelDe,
      href,
      openInNewTab
    }
  },
  social {
    title,
    titleEn,
    titleDe,
    items[] {
      platform,
      href,
      enabled
    }
  },
  brag {
    enabled,
    title,
    titleEn,
    titleDe,
    badges[] {
      type,
      enabled,
      alt,
      altEn,
      altDe,
      href,
      image { asset, "url": asset->url },
      "imageUrl": image.asset->url
    }
  },
  legalLinks {
    items[] {
      label,
      labelEn,
      labelDe,
      href,
      enabled
    }
  },
  footerLegal {
    copyrightText,
    copyrightTextEn,
    copyrightTextDe,
    companyLine1,
    companyLine1En,
    companyLine1De,
    companyLine2,
    companyLine2En,
    companyLine2De,
    secure3dLabel,
    secure3dLabelEn,
    secure3dLabelDe,
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

export const aboutPageMetaQuery = `*[_type == "aboutPage"][0]{
  seo{ metaTitle, metaDescription },
  pageTranslations
}`

export const aboutPageQuery = `*[_type == "aboutPage"][0] {
  "slug": slug.current,
  seo{ metaTitle, metaDescription },
  pageTranslations,
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

/** Yasal sayfa slug ile (TR / EN / DE slug eşlemesi; çeviriler birleştirme için projeksiyonda) */
export const legalPageBySlugQuery = `*[_type == "legalPage" && (
  slug.current == $slug ||
  translations.en.slug.current == $slug ||
  translations.de.slug.current == $slug
)][0] {
  _id,
  title,
  "slug": slug.current,
  seoTitle,
  seoDescription,
  content,
  updatedAt,
  translations
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

/** Tekne menüsü — tüm ürünler */
export const menuItemsQuery = `*[_type == "menuItem"] | order(category asc, title asc) {
  _id,
  title,
  category,
  price,
  description,
  inStock,
  image{
    asset,
    "url": asset->url,
    "metadata": asset->metadata { lqip, dimensions },
    alt
  }
}`
