import { defineField, defineType } from 'sanity'

const YACHT_TYPES = [
  { title: 'Gulet', value: 'gulet' },
  { title: 'Motoryat', value: 'motoryacht' },
  { title: 'Yelkenli', value: 'sailing' },
  { title: 'Katamaran', value: 'catamaran' },
  { title: 'Diğer', value: 'other' },
] as const

export default defineType({
  name: 'yachtRental',
  title: 'Yat Kiralama',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Yat adı',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'URL (slug)',
      type: 'slug',
      options: { source: 'name', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'location',
      title: 'Lokasyon',
      type: 'reference',
      to: [{ type: 'yachtLocation' }],
      description: 'URL: /yat-kiralama/[lokasyon]/[yat-slug] için kullanılır. Tek segment URL ile de yayınlanır.',
    }),
    defineField({
      name: 'marina',
      title: 'Marina / bağlama yeri',
      type: 'string',
    }),
    defineField({
      name: 'departurePoint',
      title: 'Kalkış noktası',
      type: 'string',
    }),
    defineField({
      name: 'yachtType',
      title: 'Yat tipi',
      type: 'string',
      options: { list: [...YACHT_TYPES] },
    }),
    defineField({
      name: 'shortDescription',
      title: 'Kısa özet',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'fullDescription',
      title: 'Detaylı açıklama',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'priceFrom',
      title: 'Günlük başlangıç fiyatı',
      type: 'number',
      validation: (Rule) => Rule.positive().integer(),
    }),
    defineField({
      name: 'currency',
      title: 'Para birimi',
      type: 'string',
      initialValue: 'TRY',
    }),
    defineField({
      name: 'mainImage',
      title: 'Kapak görseli',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          type: 'string',
          title: 'Alt metin',
        }),
      ],
    }),
    defineField({
      name: 'gallery',
      title: 'Galeri',
      type: 'array',
      of: [
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({ name: 'alt', type: 'string', title: 'Alt metin' }),
          ],
        },
      ],
    }),
    defineField({
      name: 'amenities',
      title: 'Olanaklar',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'included',
      title: 'Dahil olanlar',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'notIncluded',
      title: 'Dahil olmayanlar',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'specifications',
      title: 'Teknik özet',
      type: 'object',
      fields: [
        defineField({ name: 'buildYear', title: 'Yapım yılı', type: 'number' }),
        defineField({ name: 'capacity', title: 'Kapasite (kişi)', type: 'number' }),
        defineField({ name: 'cabins', title: 'Kabin', type: 'number' }),
        defineField({ name: 'wc', title: 'WC / banyo', type: 'string' }),
        defineField({ name: 'length', title: 'Uzunluk', type: 'string' }),
        defineField({ name: 'crew', title: 'Mürettebat', type: 'string' }),
        defineField({ name: 'engine', title: 'Motor', type: 'string' }),
      ],
    }),
    defineField({
      name: 'technicalSpecs',
      title: 'Ek teknik satırlar',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'label', type: 'string', title: 'Etiket' }),
            defineField({ name: 'value', type: 'string', title: 'Değer' }),
          ],
        },
      ],
    }),
    defineField({
      name: 'badges',
      title: 'Rozetler',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Örn: Günlük charter, Kaptanlı, Lüks, Popüler seçim',
    }),
    defineField({
      name: 'showHeroPopular',
      title: 'Hero: “En popüler” rozeti (galeri üstü)',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'showHeroTopRated',
      title: 'Hero: “En çok beğenilen” rozeti',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'valueProposition',
      title: 'Değer önerisi (başlık altı, kısa satırlar)',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Boşsa varsayılan 4 satır kullanılır.',
    }),
    defineField({
      name: 'trustRating',
      title: 'Güven şeridi: puan (örn. 4.9)',
      type: 'number',
    }),
    defineField({
      name: 'trustReviewsLabel',
      title: 'Güven: değerlendirme metni',
      type: 'string',
      description: 'Örn: 120+ misafir yorumu',
    }),
    defineField({
      name: 'trustYearsExperience',
      title: 'Güven: deneyim (yıl)',
      type: 'number',
    }),
    defineField({
      name: 'trustFleetLine',
      title: 'Güven: ek / filo satırı',
      type: 'string',
      description: 'Örn: Özenle seçilmiş charter filosu',
    }),
    defineField({
      name: 'blockedDates',
      title: 'Müsait olmayan tarihler',
      type: 'array',
      of: [{ type: 'date' }],
      description: 'Takvimde seçilemez. Boşsa tüm gelecek tarihler tercih olarak seçilebilir.',
    }),
    defineField({
      name: 'inquiryCard',
      title: 'Müsaitlik kartı metinleri',
      type: 'object',
      fields: [
        defineField({ name: 'title', type: 'string', title: 'Kart başlığı' }),
        defineField({ name: 'ctaText', type: 'string', title: 'Buton metni' }),
        defineField({
          name: 'trustBadges',
          title: 'Madde işaretli kısa liste',
          type: 'array',
          of: [{ type: 'string' }],
        }),
        defineField({ name: 'noteTitle', type: 'string', title: 'Alt kutu — başlık' }),
        defineField({ name: 'noteSubtitle', type: 'string', title: 'Alt kutu — alt satır' }),
        defineField({
          name: 'urgencyLine1',
          type: 'string',
          title: 'Aciliyet — satır 1',
          description: 'Boşsa: Son günlerde talep edildi',
        }),
        defineField({
          name: 'urgencyLine2',
          type: 'string',
          title: 'Aciliyet — satır 2',
          description: 'Boşsa: Sınırlı müsaitlik',
        }),
        defineField({
          name: 'responseTimeLabel',
          type: 'string',
          title: 'Güven — dönüş süresi',
          description: 'Boşsa: Ortalama dönüş: 30 dk',
        }),
        defineField({
          name: 'popularityLabel',
          type: 'string',
          title: 'Güven — popülerlik',
          description: 'Boşsa: Yoğun talep gören tarihler',
        }),
      ],
    }),
    defineField({
      name: 'routeSuggestions',
      title: 'Rota önerileri',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'relatedTours',
      title: 'Önerilen turlar',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'tour' }] }],
    }),
    defineField({
      name: 'relatedYachts',
      title: 'Benzer yatlar',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'yachtRental' }] }],
    }),
    defineField({
      name: 'termsAndNotes',
      title: 'Şartlar / notlar',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'cancellationPaymentPolicies',
      title: 'İptal / ödeme politikaları (metin)',
      type: 'array',
      of: [{ type: 'block' }],
      description: 'Boşsa bu blok sayfada gösterilmez.',
    }),
    defineField({
      name: 'cancellationCheckPriceLabel',
      title: 'Politika — link metni (örn. Fiyatı kontrol edin)',
      type: 'string',
    }),
    defineField({
      name: 'cancellationCheckPriceUrl',
      title: 'Politika — link URL',
      type: 'url',
    }),
    defineField({
      name: 'sailingLicenceRequired',
      title: 'Yelken ehliyeti / belge gereksinimi',
      type: 'string',
      description: 'Örn: Standart yelken ehliyeti gerekir',
    }),
    defineField({
      name: 'petsPolicy',
      title: 'Evcil hayvan politikası',
      type: 'string',
    }),
    defineField({
      name: 'paymentMethodsAccepted',
      title: 'Kabul edilen ödeme yöntemleri',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'marinaInformation',
      title: 'Marina hakkında bilgi',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'faqs',
      title: 'Sık sorulan sorular',
      type: 'array',
      of: [
        {
          type: 'object',
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
              type: 'array',
              of: [{ type: 'block' }],
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {
            select: { title: 'question' },
            prepare({ title }) {
              return { title: title || 'Soru' }
            },
          },
        },
      ],
    }),
    defineField({
      name: 'isFeatured',
      title: 'Öne çıkan',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'isActive',
      title: 'Yayında',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      fields: [
        defineField({ name: 'title', type: 'string', title: 'Meta başlık' }),
        defineField({ name: 'description', type: 'text', title: 'Meta açıklama', rows: 3 }),
        defineField({ name: 'ogImage', type: 'image', title: 'OG görseli' }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'name',
      media: 'mainImage',
      loc: 'location.title',
      active: 'isActive',
    },
    prepare({ title, media, loc, active }) {
      return {
        title: title ?? 'Yat',
        subtitle: [loc, active === false ? 'Taslak/kapalı' : null].filter(Boolean).join(' · '),
        media,
      }
    },
  },
})
