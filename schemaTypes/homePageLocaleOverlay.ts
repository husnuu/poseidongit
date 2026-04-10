import { defineField, defineType } from 'sanity'

/** Ana sayfa metinleri — görseller ve referanslar (tur/yat/blog) Türkçe kayıtta kalır */
export default defineType({
  name: 'homePageLocaleOverlay',
  title: 'Ana sayfa (bu dil)',
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
    defineField({
      name: 'searchForm',
      title: 'Arama formu etiketleri',
      type: 'object',
      fields: [
        defineField({ name: 'dailyLabel', type: 'string', title: 'Günlük' }),
        defineField({ name: 'overnightLabel', type: 'string', title: 'Konaklamalı' }),
        defineField({ name: 'dateLabelDaily', type: 'string', title: 'Tarih etiketi' }),
        defineField({ name: 'guestLabel', type: 'string', title: 'Misafir etiketi' }),
      ],
    }),
    defineField({
      name: 'hero',
      title: 'Hero',
      type: 'object',
      fields: [
        defineField({ name: 'eyebrow', type: 'string', title: 'Üst satır' }),
        defineField({ name: 'topBadgeText', type: 'string', title: 'Rozet metni' }),
        defineField({ name: 'heading', type: 'string', title: 'Ana başlık' }),
        defineField({ name: 'subheading', type: 'text', title: 'Alt metin', rows: 3 }),
        defineField({
          name: 'heroImageAlt',
          type: 'string',
          title: 'Hero görseli alt metni',
          description: 'Desktop (ve tek alt alanında mobil)',
        }),
        defineField({
          name: 'primaryCta',
          title: 'Birincil CTA',
          type: 'object',
          fields: [
            defineField({ name: 'label', type: 'string' }),
            defineField({ name: 'href', type: 'string' }),
          ],
        }),
        defineField({
          name: 'secondaryCta',
          title: 'İkincil CTA',
          type: 'object',
          fields: [
            defineField({ name: 'label', type: 'string' }),
            defineField({ name: 'href', type: 'string' }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'featureBar',
      title: 'Özellik çubuğu (sıra ile eşleşir)',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'icon', type: 'string', title: 'İkon (isteğe bağlı)' }),
            defineField({ name: 'title', type: 'string', title: 'Başlık' }),
            defineField({ name: 'description', type: 'string', title: 'Açıklama' }),
          ],
        },
      ],
    }),
    defineField({
      name: 'popularToursSection',
      title: 'Popüler turlar — başlıklar',
      type: 'object',
      fields: [
        defineField({ name: 'title', type: 'string', title: 'Başlık' }),
        defineField({ name: 'subtitle', type: 'string', title: 'Üst satır' }),
      ],
    }),
    defineField({
      name: 'popularYachtsSection',
      title: 'Popüler yatlar — başlık & CTA',
      type: 'object',
      fields: [
        defineField({ name: 'title', type: 'string', title: 'Başlık' }),
        defineField({ name: 'subtitle', type: 'string', title: 'Üst satır' }),
        defineField({
          name: 'ctaButton',
          title: 'Alt link',
          type: 'object',
          fields: [
            defineField({ name: 'label', type: 'string', title: 'Buton metni' }),
            defineField({
              name: 'href',
              type: 'string',
              title: 'Link',
              description: 'Örn. /yat-kiralama',
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'aboutTeaser',
      title: 'Hakkımızda önizleme',
      type: 'object',
      fields: [
        defineField({ name: 'heading', type: 'string', title: 'Başlık' }),
        defineField({
          name: 'body',
          title: 'İçerik',
          type: 'array',
          of: [{ type: 'block' }],
        }),
        defineField({
          name: 'primaryCta',
          title: 'Birincil buton',
          type: 'object',
          fields: [
            defineField({ name: 'label', type: 'string' }),
            defineField({ name: 'href', type: 'string' }),
          ],
        }),
        defineField({
          name: 'secondaryCta',
          title: 'İkincil buton',
          type: 'object',
          fields: [
            defineField({ name: 'label', type: 'string' }),
            defineField({ name: 'href', type: 'string' }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'blogSection',
      title: 'Blog bölümü',
      type: 'object',
      fields: [
        defineField({ name: 'heading', type: 'string', title: 'Başlık' }),
        defineField({ name: 'subtitle', type: 'string', title: 'Alt başlık' }),
        defineField({
          name: 'ctaButton',
          title: 'Tüm yazılar butonu',
          type: 'object',
          fields: [
            defineField({ name: 'label', type: 'string' }),
            defineField({ name: 'href', type: 'string' }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'routeSection',
      title: 'Rota bölümü',
      type: 'object',
      fields: [
        defineField({ name: 'heading', type: 'string', title: 'Başlık' }),
        defineField({ name: 'description', type: 'text', title: 'Açıklama', rows: 3 }),
        defineField({
          name: 'ctaButton',
          title: 'CTA',
          type: 'object',
          fields: [
            defineField({ name: 'label', type: 'string' }),
            defineField({ name: 'href', type: 'string' }),
          ],
        }),
        defineField({
          name: 'locations',
          title: 'Lokasyonlar (sıra ile; görseller TR’den)',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                defineField({ name: 'name', type: 'string', title: 'Ad' }),
                defineField({ name: 'location', type: 'string', title: 'Konum satırı' }),
              ],
            },
          ],
        }),
      ],
    }),
    defineField({
      name: 'instagramSection',
      title: 'Instagram',
      type: 'object',
      fields: [
        defineField({ name: 'heading', type: 'string', title: 'Başlık' }),
        defineField({ name: 'description', type: 'text', title: 'Açıklama', rows: 3 }),
        defineField({ name: 'ctaText', type: 'string', title: 'CTA metni' }),
      ],
    }),
    defineField({
      name: 'ctaBand',
      title: 'CTA bandı',
      type: 'object',
      fields: [
        defineField({ name: 'heading', type: 'string', title: 'Başlık' }),
        defineField({ name: 'subheading', type: 'text', title: 'Alt başlık', rows: 2 }),
        defineField({
          name: 'ctaPrimary',
          title: 'Birincil CTA',
          type: 'object',
          fields: [
            defineField({ name: 'label', type: 'string' }),
            defineField({ name: 'href', type: 'string' }),
          ],
        }),
        defineField({
          name: 'ctaSecondary',
          title: 'İkincil CTA',
          type: 'object',
          fields: [
            defineField({ name: 'label', type: 'string' }),
            defineField({ name: 'href', type: 'string' }),
          ],
        }),
      ],
    }),
  ],
})
