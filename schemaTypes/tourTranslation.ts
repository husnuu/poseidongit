import { defineField, defineType } from 'sanity'

/** EN/DE overlay for a tour: same URL slug per locale is stored under translations.{en|de}.slug */
export default defineType({
  name: 'tourTranslation',
  title: 'Tur çevirisi (tek dil)',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Başlık',
      type: 'string',
    }),
    defineField({
      name: 'slug',
      title: 'URL slug',
      type: 'slug',
      description: 'Bu dildeki tur adresi: /en/tour/… veya /de/tour/…',
      options: { maxLength: 96 },
    }),
    defineField({
      name: 'shortDescription',
      title: 'Kısa açıklama',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'description',
      title: 'Detaylı açıklama',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'ratingLabel',
      title: 'Puan etiketi',
      type: 'string',
    }),
    defineField({
      name: 'quickFacts',
      title: 'Hızlı bilgiler',
      type: 'object',
      fields: [
        defineField({ name: 'durationText', title: 'Süre', type: 'string' }),
        defineField({ name: 'availabilityText', title: 'Uygunluk', type: 'string' }),
        defineField({ name: 'meetingLocation', title: 'Buluşma', type: 'string' }),
        defineField({ name: 'startTime', title: 'Başlangıç saati', type: 'string' }),
        defineField({ name: 'returnTime', title: 'Dönüş saati', type: 'string' }),
        defineField({ name: 'language', title: 'Tur dili (metin)', type: 'string' }),
        defineField({ name: 'groupType', title: 'Grup tipi', type: 'string' }),
      ],
    }),
    defineField({
      name: 'highlights',
      title: 'Öne çıkanlar',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'icon', title: 'İkon', type: 'string' }),
            defineField({ name: 'title', title: 'Başlık', type: 'string' }),
            defineField({ name: 'description', title: 'Açıklama', type: 'text', rows: 2 }),
          ],
        },
      ],
    }),
    defineField({
      name: 'tourDetails',
      title: 'Tur detayları',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'label', type: 'string', title: 'Etiket' }),
            defineField({ name: 'value', type: 'string', title: 'Değer' }),
            defineField({ name: 'icon', type: 'string', title: 'İkon' }),
          ],
        },
      ],
    }),
    defineField({
      name: 'itinerary',
      title: 'Program (metin)',
      description: 'Görseller Türkçe kayıttan gelir; aynı sırayla metinleri çevirin.',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'time', type: 'string', title: 'Saat' }),
            defineField({ name: 'title', type: 'string', title: 'Başlık' }),
            defineField({ name: 'description', type: 'text', title: 'Açıklama', rows: 2 }),
            defineField({ name: 'tag', type: 'string', title: 'Etiket' }),
          ],
        },
      ],
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
      name: 'faqs',
      title: 'SSS',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'question', type: 'string', title: 'Soru' }),
            defineField({ name: 'answer', type: 'text', title: 'Cevap', rows: 3 }),
          ],
        },
      ],
    }),
    defineField({
      name: 'host',
      title: 'Ev sahibi',
      type: 'object',
      fields: [
        defineField({ name: 'name', type: 'string', title: 'Ad' }),
        defineField({ name: 'title', type: 'string', title: 'Ünvan' }),
        defineField({ name: 'note', type: 'text', title: 'Not', rows: 2 }),
      ],
    }),
    defineField({
      name: 'whyYouWillLove',
      title: 'Neden seveceksiniz',
      type: 'object',
      fields: [
        defineField({ name: 'title', type: 'string', title: 'Başlık' }),
        defineField({ name: 'text', type: 'text', title: 'Metin', rows: 3 }),
      ],
    }),
    defineField({
      name: 'whereSection',
      title: 'Nerede bölümü',
      type: 'object',
      fields: [
        defineField({ name: 'heading', type: 'string', title: 'Bölüm başlığı' }),
        defineField({ name: 'meetingPointLabel', type: 'string', title: 'Toplanma etiketi' }),
        defineField({ name: 'meetingPointAddress', type: 'text', title: 'Adres metni', rows: 3 }),
        defineField({ name: 'openInMapsLabel', type: 'string', title: 'Harita butonu' }),
      ],
    }),
    defineField({
      name: 'mealMenu',
      title: 'Rezervasyon yemek menüsü (metinler)',
      type: 'object',
      fields: [
        defineField({ name: 'sectionTitle', type: 'string', title: 'Başlık' }),
        defineField({ name: 'description', type: 'text', title: 'Açıklama', rows: 2 }),
        defineField({
          name: 'options',
          type: 'array',
          title: 'Seçenekler (aynı key ile eşleşir)',
          of: [
            {
              type: 'object',
              fields: [
                defineField({ name: 'key', type: 'string', title: 'Anahtar (TR ile aynı)' }),
                defineField({ name: 'label', type: 'string', title: 'Görünen ad' }),
                defineField({ name: 'description', type: 'text', rows: 2, title: 'Alt açıklama' }),
              ],
            },
          ],
        }),
      ],
    }),
    defineField({
      name: 'foodMenu',
      title: 'Sayfa yemek menüsü',
      type: 'object',
      fields: [
        defineField({ name: 'sectionTitle', type: 'string', title: 'Başlık' }),
        defineField({ name: 'intro', type: 'text', title: 'Giriş', rows: 2 }),
        defineField({
          name: 'items',
          type: 'array',
          title: 'Öğeler (sıra ile eşleşir; görseller TR’den)',
          of: [
            {
              type: 'object',
              fields: [
                defineField({ name: 'title', type: 'string', title: 'Başlık' }),
                defineField({ name: 'excerpt', type: 'text', rows: 2, title: 'Özet' }),
                defineField({ name: 'priceLabel', type: 'string', title: 'Fiyat etiketi' }),
                defineField({ name: 'metaLine1', type: 'string', title: 'Meta 1' }),
                defineField({ name: 'metaLine2', type: 'string', title: 'Meta 2' }),
              ],
            },
          ],
        }),
      ],
    }),
    defineField({
      name: 'bookingCard',
      title: 'Rezervasyon kartı',
      type: 'object',
      fields: [
        defineField({ name: 'fromText', type: 'string', title: '“Başlangıç” metni' }),
        defineField({ name: 'ctaText', type: 'string', title: 'CTA' }),
        defineField({ name: 'urgencyText', type: 'string', title: 'Aciliyet' }),
        defineField({ name: 'trustBadges', type: 'array', of: [{ type: 'string' }], title: 'Güven rozetleri' }),
      ],
    }),
    defineField({
      name: 'reviewsSection',
      title: 'Yorumlar bölümü',
      type: 'object',
      fields: [
        defineField({ name: 'sourceLabel', type: 'string', title: 'Kaynak etiketi' }),
        defineField({ name: 'moreLinkText', type: 'string', title: '“Daha fazla” metni' }),
        defineField({
          name: 'items',
          type: 'array',
          title: 'Yorumlar (sıra ile eşleşir)',
          of: [
            {
              type: 'object',
              fields: [
                defineField({ name: 'name', type: 'string', title: 'Ad' }),
                defineField({ name: 'title', type: 'string', title: 'Başlık' }),
                defineField({ name: 'description', type: 'text', title: 'Metin', rows: 2 }),
              ],
            },
          ],
        }),
      ],
    }),
    defineField({
      name: 'bookingRules',
      title: 'Rezervasyon kuralları',
      type: 'object',
      fields: [
        defineField({ name: 'title', type: 'string', title: 'Başlık' }),
        defineField({ name: 'bullets', type: 'array', of: [{ type: 'string' }], title: 'Maddeler' }),
      ],
    }),
    defineField({
      name: 'extras',
      title: 'Ekstralar',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'title', type: 'string', title: 'Başlık' }),
            defineField({ name: 'description', type: 'text', rows: 2, title: 'Açıklama' }),
          ],
        },
      ],
    }),
  ],
})
