import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'coveTranslation',
  title: 'Koy çevirisi (tek dil)',
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
      options: { maxLength: 96 },
    }),
    defineField({
      name: 'description',
      title: 'Açıklama',
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
  ],
})
