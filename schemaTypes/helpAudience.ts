import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'helpAudience',
  title: 'Yardım — Segment (Kitle)',
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
    }),
    defineField({
      name: 'iconName',
      title: 'İkon adı',
      type: 'string',
      description:
        'Lucide ikon adı (örn: compass, anchor, ship, users, calendar, map-pin). Bilinmeyen adda varsayılan ikon kullanılır.',
    }),
    defineField({
      name: 'order',
      title: 'Sıra',
      type: 'number',
      initialValue: 0,
    }),
    defineField({
      name: 'featuredCategories',
      title: 'Öne çıkan kategoriler',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'helpCategory' }] }],
      description: 'Segment kartında vurgulanan veya bu kitleye filtrelenen kategoriler',
    }),
  ],
  orderings: [
    { title: 'Sıra', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] },
  ],
  preview: {
    select: { title: 'title', order: 'order' },
    prepare({ title, order }) {
      return {
        title: title || 'Segment',
        subtitle: typeof order === 'number' ? `Sıra: ${order}` : undefined,
      }
    },
  },
})
