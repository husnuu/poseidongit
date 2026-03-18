import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'faqPage',
  title: 'Sık Sorulanlar Sayfası',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Sayfa Başlığı (Internal)',
      type: 'string',
      description: 'İç kullanım için (örn: Sık Sorulanlar)',
      initialValue: 'Sık Sorulanlar',
      readOnly: true,
    }),
    defineField({
      name: 'seo',
      title: 'SEO Ayarları',
      type: 'object',
      fields: [
        defineField({
          name: 'metaTitle',
          title: 'Meta Başlık',
          type: 'string',
        }),
        defineField({
          name: 'metaDescription',
          title: 'Meta Açıklama',
          type: 'text',
          rows: 3,
        }),
      ],
    }),
    defineField({
      name: 'cover',
      title: 'Kapak Bölümü',
      type: 'object',
      description: 'Sayfanın üstündeki kapak: görsel, başlık ve sayfa ile ilgili kısa metin',
      fields: [
        defineField({
          name: 'image',
          title: 'Kapak Fotoğrafı',
          type: 'image',
          description: 'Başlığın arkasında görünecek arka plan görseli',
          options: { hotspot: true },
          fields: [
            defineField({
              name: 'alt',
              title: 'Alternatif Metin',
              type: 'string',
            }),
          ],
        }),
        defineField({
          name: 'heading',
          title: 'Kapak Başlığı',
          type: 'string',
          description: 'Sayfa üstünde görünecek ana başlık',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'description',
          title: 'Sayfa Açıklaması',
          type: 'text',
          rows: 4,
          description: 'Kapak altında, FAQ bölümünden önce görünecek kısa metin',
        }),
      ],
    }),
    defineField({
      name: 'sections',
      title: 'FAQ Bölümleri',
      type: 'array',
      description: 'Ara başlıklar ve her birinin altındaki sorular. Birden çok bölüm ekleyebilirsiniz.',
      of: [
        {
          type: 'object',
          name: 'faqSection',
          title: 'Bölüm',
          fields: [
            defineField({
              name: 'sectionTitle',
              title: 'Ara Başlık',
              type: 'string',
              description: 'Bu bölümün başlığı (örn: Rezervasyon, Ödeme, İptal)',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'items',
              title: 'Sorular',
              type: 'array',
              of: [
                {
                  type: 'object',
                  name: 'faqItem',
                  title: 'Soru / Cevap',
                  fields: [
                    defineField({
                      name: 'question',
                      title: 'Soru',
                      type: 'string',
                      validation: (Rule) => Rule.required(),
                    }),
                    defineField({
                      name: 'answer',
                      title: 'Cevap',
                      type: 'text',
                      rows: 4,
                      validation: (Rule) => Rule.required(),
                    }),
                  ],
                  preview: {
                    select: { question: 'question' },
                    prepare({ question }) {
                      return {
                        title: question || 'Soru',
                        subtitle: 'Soru / Cevap',
                      }
                    },
                  },
                },
              ],
            }),
          ],
          preview: {
            select: { sectionTitle: 'sectionTitle' },
            prepare({ sectionTitle }) {
              return {
                title: sectionTitle || 'Bölüm',
                subtitle: 'FAQ bölümü',
              }
            },
          },
        },
      ],
    }),
  ],
  preview: {
    select: { title: 'title' },
    prepare() {
      return {
        title: 'Sık Sorulanlar',
        subtitle: '/sik-sorulanlar',
        media: () => '❓',
      }
    },
  },
})
