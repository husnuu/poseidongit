import { defineField, defineType } from 'sanity'

const boatPatch = defineField({
  name: 'boats',
  title: 'Tekneler (sıra ile; görseller TR kaydından)',
  type: 'array',
  of: [
    {
      type: 'object',
      fields: [
        defineField({ name: 'name', title: 'Tekne adı', type: 'string' }),
        defineField({ name: 'description', title: 'Açıklama', type: 'text', rows: 4 }),
        defineField({ name: 'imageAlt', title: 'Görsel alt metni', type: 'string' }),
      ],
      preview: {
        select: { title: 'name' },
        prepare({ title }: { title?: string }) {
          return { title: title || 'Tekne' }
        },
      },
    },
  ],
})

export default defineType({
  name: 'aboutPageLocaleOverlay',
  title: 'Hakkımızda (bu dil)',
  type: 'object',
  fields: [
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      fields: [
        defineField({ name: 'metaTitle', title: 'Meta başlık', type: 'string' }),
        defineField({ name: 'metaDescription', title: 'Meta açıklama', type: 'text', rows: 3 }),
      ],
    }),
    defineField({ name: 'titleTop', title: 'Üst başlık (hero)', type: 'string' }),
    defineField({ name: 'titleBottom', title: 'Alt başlık (accent)', type: 'string' }),
    defineField({
      name: 'intro',
      title: 'Giriş metni',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({ name: 'sectionTitle', title: 'Bölüm başlığı', type: 'string' }),
    defineField({ name: 'sectionSubtitle', title: 'Bölüm alt başlığı', type: 'string' }),
    defineField({
      name: 'sectionBody',
      title: 'Bölüm içeriği',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({ name: 'timelineTitle', title: 'Timeline başlığı', type: 'string' }),
    defineField({ name: 'timelineDescription', title: 'Timeline açıklaması', type: 'text', rows: 3 }),
    boatPatch,
  ],
})
