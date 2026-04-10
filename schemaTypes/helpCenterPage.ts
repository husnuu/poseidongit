import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'helpCenterPage',
  title: 'Yardım Merkezi — Sayfa',
  type: 'document',
  description: 'Ana yardım merkezi sayfası: hero başlığı, kısa metin ve SEO. Tek belge oluşturun.',
  fields: [
    defineField({
      name: 'heroEyebrow',
      title: 'Hero üst etiket',
      type: 'string',
      description: 'Başlığın üstünde küçük satır (örn: Yardım merkezi, Rehber)',
    }),
    defineField({
      name: 'title',
      title: 'Sayfa başlığı (Hero)',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'shortDescription',
      title: 'Kısa açıklama',
      type: 'text',
      rows: 3,
      description: 'Hero’da başlığın altında görünen giriş metni',
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero arka plan görseli',
      type: 'image',
      description: 'Opsiyonel. Yüklerseniz hero üzerinde koyu bir katmanla gösterilir.',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alternatif metin',
          type: 'string',
        }),
      ],
    }),
    defineField({
      name: 'seoTitle',
      title: 'SEO başlık',
      type: 'string',
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO açıklama',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'pageTranslations',
      title: 'Çeviriler — English / Deutsch',
      type: 'object',
      fields: [
        defineField({ name: 'en', title: 'English', type: 'helpCenterPageLocaleOverlay' }),
        defineField({ name: 'de', title: 'Deutsch', type: 'helpCenterPageLocaleOverlay' }),
      ],
    }),
  ],
  preview: {
    select: { title: 'title' },
    prepare({ title }) {
      return {
        title: title || 'Yardım Merkezi',
        subtitle: '/yardim-merkezi',
      }
    },
  },
})
