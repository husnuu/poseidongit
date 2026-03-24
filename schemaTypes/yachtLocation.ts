import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'yachtLocation',
  title: 'Yat Kiralama — Lokasyon',
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
      title: 'URL (slug)',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'intro',
      title: 'Liste sayfası giriş metni',
      type: 'text',
      rows: 3,
      description: 'Bu bölgedeki yatlar listesinin üstünde gösterilir (isteğe bağlı).',
    }),
  ],
  preview: {
    select: { title: 'title', slug: 'slug.current' },
    prepare({ title, slug }) {
      return { title: title ?? 'Lokasyon', subtitle: slug ? `/${slug}` : undefined }
    },
  },
})
