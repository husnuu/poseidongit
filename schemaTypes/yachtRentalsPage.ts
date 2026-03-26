import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'yachtRentalsPage',
  title: 'Yat Kiralama Sayfası',
  type: 'document',
  fields: [
    defineField({
      name: 'slug',
      title: 'URL (Slug)',
      type: 'slug',
      description: 'Ana liste sayfası (örn: /yat-kiralama)',
      options: {
        source: 'titleTop',
        maxLength: 96,
      },
      initialValue: { current: 'yat-kiralama' },
    }),
    defineField({
      name: 'titleTop',
      title: 'Başlık üst satır',
      type: 'string',
      description: 'Örn: "ÖZEL"',
    }),
    defineField({
      name: 'titleBottom',
      title: 'Başlık alt satır (vurgulu)',
      type: 'string',
      description: 'Örn: "YAT KİRALAMA"',
    }),
    defineField({
      name: 'intro',
      title: 'Giriş metni',
      type: 'text',
      rows: 5,
      description: 'Başlığın altında gösterilen açıklama paragrafı.',
    }),
    defineField({
      name: 'emptyStateMessage',
      title: 'Liste boşken mesajı',
      type: 'text',
      rows: 2,
      description: 'Hiç yat yokken gösterilir.',
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      fields: [
        defineField({
          name: 'title',
          title: 'Sayfa başlığı (title)',
          type: 'string',
        }),
        defineField({
          name: 'description',
          title: 'Meta açıklama',
          type: 'text',
          rows: 3,
        }),
      ],
    }),
  ],
  preview: {
    select: { titleTop: 'titleTop', titleBottom: 'titleBottom' },
    prepare({ titleTop, titleBottom }) {
      return {
        title: 'Yat Kiralama Sayfası',
        subtitle: [titleTop, titleBottom].filter(Boolean).join(' ') || '/yat-kiralama',
      }
    },
  },
})
