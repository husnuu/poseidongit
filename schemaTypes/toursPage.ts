import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'toursPage',
  title: 'Turlar Sayfası',
  type: 'document',
  fields: [
    defineField({
      name: 'slug',
      title: 'URL (Slug)',
      type: 'slug',
      description: 'Sayfa URL\'si (örn: /turlar)',
      options: {
        source: 'titleTop',
        maxLength: 96,
      },
      initialValue: {current: 'turlar'},
    }),
    defineField({
      name: 'titleTop',
      title: 'Başlık üst satır',
      type: 'string',
      description: 'Sayfa başlığının üst kısmı (örn: "EN POPÜLER")',
    }),
    defineField({
      name: 'titleBottom',
      title: 'Başlık alt satır (vurgulu)',
      type: 'string',
      description: 'Sayfa başlığının alt kısmı, lacivert gösterilir (örn: "TURLAR")',
    }),
  ],
  preview: {
    select: {titleTop: 'titleTop', titleBottom: 'titleBottom'},
    prepare({titleTop, titleBottom}) {
      return {
        title: 'Turlar Sayfası',
        subtitle: [titleTop, titleBottom].filter(Boolean).join(' ') || '/turlar',
      }
    },
  },
})
