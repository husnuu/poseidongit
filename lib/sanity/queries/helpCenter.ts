/** Yardım merkezi ana sayfa — tek belge ayarları + dil katmanı */
export const helpCenterPageQuery = `*[_type == "helpCenterPage"][0]{
  heroEyebrow,
  title,
  shortDescription,
  heroImage{
    asset,
    "url": asset->url,
    alt,
    "metadata": asset->metadata { lqip, dimensions }
  },
  seoTitle,
  seoDescription,
  pageTranslations
}`

const articleListProjection = `{
  _id,
  title,
  "slug": slug.current,
  shortDescription,
  order,
  translations
}`

/**
 * Kategoriler ve yayımlanmış makaleler.
 * `references(^._id)` — iç içe projeksiyonda `category._ref == ^._id` güvenilir eşleşmeyebiliyor.
 * Fetch tarafında `perspective: 'published'` ile taslak kopyalar elenir; burada yine `isPublished == true` ile sitede gizleme korunur.
 */
export const helpCategoriesWithArticlesQuery = `*[_type == "helpCategory"] | order(order asc) {
  _id,
  title,
  "slug": slug.current,
  shortDescription,
  iconName,
  isFeatured,
  order,
  translations,
  "articles": *[_type == "helpArticle" && references(^._id) && isPublished == true] | order(order asc) ${articleListProjection}
}`

export const helpArticleBySlugsQuery = `*[_type == "helpArticle" && isPublished == true && (
  (category->slug.current == $categorySlug && slug.current == $articleSlug) ||
  (category->translations.en.slug.current == $categorySlug && translations.en.slug.current == $articleSlug) ||
  (category->translations.de.slug.current == $categorySlug && translations.de.slug.current == $articleSlug)
)][0]{
  _id,
  title,
  "slug": slug.current,
  shortDescription,
  body,
  seoTitle,
  seoDescription,
  order,
  _updatedAt,
  translations,
  category->{
    title,
    "slug": slug.current,
    shortDescription,
    translations
  },
  audience->{ title, "slug": slug.current },
  relatedArticles[]->{
    _id,
    title,
    "slug": slug.current,
    translations,
    isPublished,
    "categorySlug": category->slug.current,
    "category": category->{
      "slug": slug.current,
      translations
    }
  }
}`

/** Kategori liste sayfası */
export const helpCategoryBySlugQuery = `*[_type == "helpCategory" && (
  slug.current == $categorySlug ||
  translations.en.slug.current == $categorySlug ||
  translations.de.slug.current == $categorySlug
)][0]{
  _id,
  title,
  "slug": slug.current,
  shortDescription,
  iconName,
  translations,
  audience->{ title, "slug": slug.current },
  "articles": *[_type == "helpArticle" && references(^._id) && isPublished == true] | order(order asc) ${articleListProjection}
}`

/**
 * Build / ISR: her yayımlanmış makale için TR / EN / DE rota çiftleri (çeviri slug’ları doluysa).
 */
export const helpArticleSlugsByLocaleQuery = `*[_type == "helpArticle" && isPublished == true && defined(slug.current) && defined(category->slug.current)]{
  "trCat": category->slug.current,
  "trArt": slug.current,
  "enCat": category->translations.en.slug.current,
  "enArt": translations.en.slug.current,
  "deCat": category->translations.de.slug.current,
  "deArt": translations.de.slug.current
}`
