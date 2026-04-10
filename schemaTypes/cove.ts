import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'cove',
  title: 'Koy',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Başlık',
      type: 'string',
      validation: (Rule) => Rule.required().error('Başlık zorunludur'),
    }),
    defineField({
      name: 'slug',
      title: 'URL (Slug)',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required().error('Slug zorunludur'),
    }),
    defineField({
      name: 'description',
      title: 'Açıklama',
      type: 'text',
      description: '2–4 cümle kısa açıklama',
      rows: 4,
    }),
    defineField({
      name: 'image',
      title: 'Görsel',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alternatif Metin',
        },
      ],
    }),
    defineField({
      name: 'order',
      title: 'Sıra',
      type: 'number',
      description: 'Liste sıralaması (küçük önce)',
    }),
    defineField({
      name: 'locationTag',
      title: 'Konum etiketi',
      type: 'string',
      description: 'Örn: "Çeşme / Eşek Adası"',
    }),
    defineField({
      name: 'translations',
      title: 'Çeviriler — English / Deutsch',
      type: 'object',
      description: 'Koy başlığı, açıklama ve slug; görseller Türkçe kayıttan gelir.',
      fields: [
        defineField({ name: 'en', title: 'English', type: 'coveTranslation' }),
        defineField({ name: 'de', title: 'Deutsch', type: 'coveTranslation' }),
      ],
    }),
  ],
  preview: {
    select: { title: 'title', order: 'order' },
    prepare({ title, order }) {
      return {
        title: title ?? 'Koy',
        subtitle: order != null ? `Sıra: ${order}` : undefined,
      }
    },
  },
})
