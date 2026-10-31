import { defineField, defineType } from 'sanity'
import { translationSlugOptions } from './translationSlugOptions'

/** Feribot hattı için EN/DE çeviri overlay'i — görseller ve fiyat Türkçe kayıttan gelir. */
export default defineType({
  name: 'ferryRouteTranslation',
  title: 'Feribot hattı çevirisi (tek dil)',
  type: 'object',
  fields: [
    defineField({ name: 'title', title: 'Başlık', type: 'string' }),
    defineField({ name: 'cardDescription', title: 'Kart Açıklaması (kısa)', type: 'text', rows: 2 }),
    defineField({
      name: 'slug',
      title: 'URL slug',
      type: 'slug',
      description: 'Bu dildeki adres: /feribot/…',
      options: translationSlugOptions,
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      fields: [
        defineField({ name: 'metaTitle', title: 'Meta başlık', type: 'string' }),
        defineField({ name: 'metaDescription', title: 'Meta açıklama', type: 'text', rows: 3 }),
      ],
    }),
    defineField({ name: 'durationLabel', title: 'Süre etiketi', type: 'string' }),
    defineField({ name: 'routeLabel', title: 'Güzergah etiketi', type: 'string' }),
    defineField({ name: 'departurePort', title: 'Gidiş limanı', type: 'string' }),
    defineField({ name: 'arrivalPort', title: 'Varış limanı', type: 'string' }),
    defineField({
      name: 'ageTiers',
      title: 'Yaş grubu etiketleri (fiyat değil, sadece metin)',
      type: 'array',
      description: '"key" Türkçe kayıttaki ile eşleşmeli; fiyatlar her zaman Türkçe kayıttan gelir.',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'key', title: 'Anahtar', type: 'string' }),
            defineField({ name: 'label', title: 'Etiket', type: 'string' }),
          ],
        },
      ],
    }),
    defineField({ name: 'cashNote', title: 'Nakit ödeme notu', type: 'string' }),
    defineField({
      name: 'extraFees',
      title: 'Ek ücretler',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'label', title: 'Etiket', type: 'string' }),
            defineField({ name: 'amount', title: 'Tutar', type: 'string' }),
          ],
        },
      ],
    }),
    defineField({
      name: 'bookingBullets',
      title: 'Rezervasyon kutusu madde listesi',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({ name: 'ctaButtonLabel', title: 'Buton yazısı', type: 'string' }),
    defineField({ name: 'aboutTitle', title: 'Açıklama başlığı', type: 'string' }),
    defineField({
      name: 'aboutBody',
      title: 'Açıklama metni',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'knowBeforeYouGoTitle',
      title: '"Bilmeniz Gerekenler" başlığı',
      type: 'string',
    }),
    defineField({
      name: 'knowBeforeYouGo',
      title: 'Bilmeniz gerekenler kartları',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'title', title: 'Başlık', type: 'string' }),
            defineField({ name: 'body', title: 'Metin', type: 'text', rows: 3 }),
          ],
        },
      ],
    }),
    defineField({
      name: 'included',
      title: 'Fiyata dahil olanlar',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'notIncluded',
      title: 'Fiyata dahil olmayanlar',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'faqs',
      title: 'Sık sorulan sorular',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'question', title: 'Soru', type: 'string' }),
            defineField({ name: 'answer', title: 'Cevap', type: 'text', rows: 3 }),
          ],
        },
      ],
    }),
    defineField({ name: 'videoCaption', title: 'Video altyazısı', type: 'string' }),
  ],
})
