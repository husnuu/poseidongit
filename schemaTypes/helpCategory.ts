import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'helpCategory',
  title: 'Yardım — Kategori',
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
      rows: 2,
      description: 'Kart üstü etiket / alt başlık için kullanılabilir',
    }),
    defineField({
      name: 'audience',
      title: 'İlgili segment (opsiyonel)',
      type: 'reference',
      to: [{ type: 'helpAudience' }],
    }),
    defineField({
      name: 'iconName',
      title: 'İkon adı (opsiyonel)',
      type: 'string',
      description: 'Lucide ikon adı (örn: utensils, shield, baby)',
    }),
    defineField({
      name: 'order',
      title: 'Sıra',
      type: 'number',
      initialValue: 0,
    }),
    defineField({
      name: 'isFeatured',
      title: 'Öne çıkan',
      type: 'boolean',
      initialValue: false,
      description: 'İleride öne çıkan bloklar için kullanılabilir',
    }),
    defineField({
      name: 'translations',
      title: 'Çeviriler — English / Deutsch',
      type: 'object',
      fields: [
        defineField({ name: 'en', title: 'English', type: 'helpCategoryTranslation' }),
        defineField({ name: 'de', title: 'Deutsch', type: 'helpCategoryTranslation' }),
      ],
    }),
  ],
  orderings: [
    { title: 'Sıra', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] },
  ],
  preview: {
    select: { title: 'title', isFeatured: 'isFeatured' },
    prepare({ title, isFeatured }) {
      return {
        title: title || 'Kategori',
        subtitle: isFeatured ? 'Öne çıkan' : 'Kategori',
      }
    },
  },
})
