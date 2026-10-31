import { defineArrayMember, defineField, defineType } from 'sanity'
import { translationSlugOptions } from './translationSlugOptions'

export default defineType({
  name: 'coveTranslation',
  title: 'Koy çevirisi (tek dil)',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({
      name: 'title',
      title: 'Başlık',
      type: 'string',
    }),
    defineField({
      name: 'slug',
      title: 'URL slug (bu dil)',
      type: 'slug',
      description: 'Boşsa Türkçe slug kullanılır.',
      options: translationSlugOptions,
    }),
    defineField({
      name: 'description',
      title: 'Kısa açıklama',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'imageAlt',
      title: 'Görsel alt metni',
      type: 'string',
    }),
    defineField({
      name: 'locationTag',
      title: 'Konum etiketi',
      type: 'string',
    }),
    defineField({
      name: 'content',
      title: 'Detaylı içerik',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'Başlık 2', value: 'h2' },
            { title: 'Başlık 3', value: 'h3' },
          ],
          lists: [
            { title: 'Madde', value: 'bullet' },
            { title: 'Numaralı', value: 'number' },
          ],
        }),
      ],
    }),
    defineField({
      name: 'highlights',
      title: 'Öne çıkanlar',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
    }),
    defineField({ name: 'travelTime', title: 'Limandan ulaşım', type: 'string' }),
    defineField({ name: 'bestTime', title: 'En iyi ziyaret zamanı', type: 'string' }),
    defineField({
      name: 'faqs',
      title: 'Sık sorulan sorular',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'coveFaqTranslation',
          fields: [
            defineField({ name: 'question', title: 'Soru', type: 'string' }),
            defineField({ name: 'answer', title: 'Cevap', type: 'text', rows: 3 }),
          ],
          preview: { select: { title: 'question', subtitle: 'answer' } },
        }),
      ],
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      fields: [
        defineField({ name: 'metaTitle', title: 'Meta başlık', type: 'string' }),
        defineField({ name: 'metaDescription', title: 'Meta açıklama', type: 'text', rows: 3 }),
      ],
    }),
  ],
})
