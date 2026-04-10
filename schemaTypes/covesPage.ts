import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'covesPage',
  title: 'Koylar Sayfası',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Başlık',
      type: 'string',
      description: 'Sayfa H1 başlığı (örn: "Koylar")',
      initialValue: 'Koylar',
      validation: (Rule) => Rule.required().error('Başlık zorunludur'),
    }),
    defineField({
      name: 'description',
      title: 'Açıklama',
      type: 'text',
      description: 'Başlığın altındaki kısa paragraf',
      rows: 3,
    }),
    defineField({
      name: 'metaTitle',
      title: 'Meta başlık (SEO)',
      type: 'string',
      description: 'Tarayıcı sekmesi ve arama sonuçları',
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta açıklama (SEO)',
      type: 'text',
      description: 'Arama sonuçlarında görünen kısa açıklama',
    }),
    defineField({
      name: 'items',
      title: 'Koylar',
      type: 'array',
      description: 'Sayfada listelenecek koylar (sıralama: her koyun "Sıra" alanına göre)',
      of: [
        {
          type: 'reference',
          to: [{ type: 'cove' }],
        },
      ],
    }),
    defineField({
      name: 'pageTranslations',
      title: 'Çeviriler — English / Deutsch',
      type: 'object',
      description: 'Sayfa başlığı ve açıklama. Koy kartları: her koy belgesindeki çeviriler kullanılır.',
      fields: [
        defineField({ name: 'en', title: 'English', type: 'covesPageLocaleOverlay' }),
        defineField({ name: 'de', title: 'Deutsch', type: 'covesPageLocaleOverlay' }),
      ],
    }),
  ],
  preview: {
    select: { title: 'title' },
    prepare({ title }) {
      return {
        title: title ?? 'Koylar Sayfası',
        subtitle: '/koylar',
      }
    },
  },
})
