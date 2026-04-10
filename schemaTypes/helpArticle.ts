import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'helpArticle',
  title: 'Yardım — Makale',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Başlık',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'shortDescription',
      title: 'Kısa açıklama',
      type: 'text',
      rows: 3,
      description: 'Liste ve arama için özet',
    }),
    defineField({
      name: 'category',
      title: 'Kategori',
      type: 'reference',
      to: [{ type: 'helpCategory' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'audience',
      title: 'Segment (opsiyonel)',
      type: 'reference',
      to: [{ type: 'helpAudience' }],
    }),
    defineField({
      name: 'body',
      title: 'İçerik',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'order',
      title: 'Sıra',
      type: 'number',
      initialValue: 0,
    }),
    defineField({
      name: 'seoTitle',
      title: 'SEO başlık',
      type: 'string',
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO açıklama',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'isPublished',
      title: 'Yayında',
      type: 'boolean',
      initialValue: false,
      description:
        'Web sitesinde görünmesi için açık olmalı. Ayrıca belgeyi kaydettikten sonra üstten Yayınla (Publish) ile yayımlayın; yalnız taslak kalan makaleler sitede listelenmez.',
    }),
    defineField({
      name: 'relatedArticles',
      title: 'İlgili makaleler',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'helpArticle' }] }],
      validation: (Rule) =>
        Rule.custom((items) => {
          if (!items || !Array.isArray(items)) return true
          if (items.length > 8) return 'En fazla 8 ilgili makale önerilir'
          return true
        }),
    }),
    defineField({
      name: 'translations',
      title: 'Çeviriler — English / Deutsch',
      type: 'object',
      fields: [
        defineField({ name: 'en', title: 'English', type: 'helpArticleTranslation' }),
        defineField({ name: 'de', title: 'Deutsch', type: 'helpArticleTranslation' }),
      ],
    }),
  ],
  orderings: [
    { title: 'Sıra', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] },
  ],
  preview: {
    select: {
      title: 'title',
      published: 'isPublished',
      category: 'category.title',
    },
    prepare({ title, published, category }) {
      return {
        title: title || 'Makale',
        subtitle: [published ? 'Yayında' : 'Taslak', category].filter(Boolean).join(' · '),
      }
    },
  },
})
