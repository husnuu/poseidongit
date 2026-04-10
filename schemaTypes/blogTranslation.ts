import { defineField, defineType } from 'sanity'

/** EN/DE overlay: ayrı slug ile /en/blog/… ve /de/blog/… */
export default defineType({
  name: 'blogTranslation',
  title: 'Blog yazısı çevirisi (tek dil)',
  type: 'object',
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
      description: 'Örn. İngilizce yazı adresi: /en/blog/your-post-slug',
      options: { maxLength: 96 },
    }),
    defineField({
      name: 'excerpt',
      title: 'Kısa özet',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'content',
      title: 'İçerik',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'authorName',
      title: 'Yazar adı',
      type: 'string',
    }),
    defineField({
      name: 'category',
      title: 'Kategori',
      type: 'string',
    }),
    defineField({
      name: 'tags',
      title: 'Etiketler',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'readingTime',
      title: 'Okuma süresi (dakika)',
      type: 'number',
    }),
    defineField({
      name: 'coverAlt',
      title: 'Kapak görseli alt metni',
      type: 'string',
      description: 'Boşsa Türkçe kayıttaki alt metin kullanılır.',
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
