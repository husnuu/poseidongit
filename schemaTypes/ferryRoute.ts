import { defineField, defineType } from 'sanity'

/** Feribot hattı sayfası (örn. Çeşme ↔ Sakız) — boattripturkey.com/tr/kas-meis-feribot-bileti
 * referans alınarak: galeri, süre/güzergah, rezervasyon kutusu, "Yolculuk Hakkında",
 * video, "Bilmeniz Gerekenler", Dahil/Dahil Değil, SSS. */
export default defineType({
  name: 'ferryRoute',
  title: 'Feribot Hattı',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Başlık',
      type: 'string',
      description: 'Örn: "Çeşme ↔ Sakız Feribot Bileti"',
      validation: (Rule) => Rule.required().error('Başlık zorunludur'),
    }),
    defineField({
      name: 'cardDescription',
      title: 'Kart Açıklaması (kısa)',
      type: 'text',
      rows: 2,
      description: 'Feribot biletleri listeleme sayfasındaki kartta gösterilen kısa açıklama (1-2 cümle).',
    }),
    defineField({
      name: 'slug',
      title: 'URL (Slug)',
      type: 'slug',
      description: 'Sayfa adresi: /feribot/[slug]',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required().error('Slug zorunludur'),
    }),
    defineField({
      name: 'order',
      title: 'Sıra',
      type: 'number',
      description: 'Feribot hatları listelenirse sıralama (küçük önce)',
    }),
    defineField({
      name: 'isActive',
      title: 'Yayında mı?',
      type: 'boolean',
      initialValue: true,
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

    // Galeri (PhotoGrid: ana görsel + grid)
    defineField({
      name: 'mainImage',
      title: 'Ana Görsel',
      type: 'image',
      options: { hotspot: true },
      fields: [{ name: 'alt', type: 'string', title: 'Alternatif Metin' }],
      validation: (Rule) => Rule.required().error('Ana görsel zorunludur'),
    }),
    defineField({
      name: 'gallery',
      title: 'Galeri (ana görselin yanındaki 4 kare)',
      type: 'array',
      of: [
        {
          type: 'image',
          options: { hotspot: true },
          fields: [{ name: 'alt', type: 'string', title: 'Alternatif Metin' }],
        },
      ],
    }),

    // Üst bilgi satırı
    defineField({
      name: 'durationLabel',
      title: 'Süre etiketi',
      type: 'string',
      description: 'Örn: "45 Dakikalık Deniz Yolculuğu"',
    }),
    defineField({
      name: 'routeLabel',
      title: 'Güzergah etiketi (başlık altı)',
      type: 'string',
      description: 'Örn: "Çeşme Limanı ↔ Sakız (Chios) Limanı"',
    }),
    defineField({
      name: 'departurePort',
      title: 'Gidiş limanı',
      type: 'string',
      description: 'Örn: "Çeşme Limanı" — rezervasyon sihirbazında kullanılır',
    }),
    defineField({
      name: 'arrivalPort',
      title: 'Varış limanı',
      type: 'string',
      description: 'Örn: "Sakız (Chios) Limanı" — rezervasyon sihirbazında kullanılır',
    }),
    defineField({
      name: 'currency',
      title: 'Para birimi sembolü',
      type: 'string',
      description: 'Örn: "€" veya "₺"',
      initialValue: '€',
    }),

    // Yaş grubuna ve yön/sefer tipine göre fiyatlandırma
    defineField({
      name: 'ageTiers',
      title: 'Yaş grupları ve fiyatlar',
      type: 'array',
      description: 'Rezervasyon sihirbazındaki yolcu sayıcısı ve fiyat hesaplaması bunlardan gelir.',
      validation: (Rule) => Rule.min(1).error('En az bir yaş grubu tanımlanmalı'),
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'key',
              title: 'Anahtar (benzersiz)',
              type: 'string',
              description: 'Örn: "adult", "child", "infant"',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'label',
              title: 'Etiket',
              type: 'string',
              description: 'Örn: "Yetişkin", "Çocuk (6-12 Yaş)", "Bebek (0-6 Yaş)"',
              validation: (Rule) => Rule.required(),
            }),
            defineField({ name: 'minAge', title: 'Min. yaş', type: 'number' }),
            defineField({
              name: 'maxAge',
              title: 'Maks. yaş (boş = üst sınır yok)',
              type: 'number',
            }),
            defineField({
              name: 'roundTripPrice',
              title: 'Gidiş-Dönüş fiyatı',
              type: 'number',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'oneWayDeparturePrice',
              title: 'Tek Yön — Gidiş fiyatı',
              description: 'Örn: Çeşme → Sakız tek yön',
              type: 'number',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'oneWayReturnPrice',
              title: 'Tek Yön — Dönüş fiyatı',
              description: 'Örn: Sakız → Çeşme tek yön (farklı olabilir)',
              type: 'number',
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {
            select: { title: 'label', rt: 'roundTripPrice' },
            prepare({ title, rt }) {
              return { title: title ?? 'Yaş grubu', subtitle: rt != null ? `Gidiş-Dönüş: ${rt}` : undefined }
            },
          },
        },
      ],
    }),

    defineField({
      name: 'cashNote',
      title: 'Nakit ödeme notu',
      type: 'string',
      description: 'Örn: "Ayrıca o gün nakit ödenir"',
    }),
    defineField({
      name: 'extraFees',
      title: 'Ek ücretler (liman vergisi vb.)',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'label', title: 'Etiket', type: 'string', description: 'Örn: "Türkiye liman vergisi"' }),
            defineField({ name: 'amount', title: 'Tutar', type: 'string', description: 'Örn: "200 ₺"' }),
          ],
          preview: { select: { title: 'label', subtitle: 'amount' } },
        },
      ],
    }),
    defineField({
      name: 'bookingBullets',
      title: 'Rezervasyon kutusu madde listesi',
      type: 'array',
      description: 'Örn: "Feribot bileti, Çeşme ↔ Sakız", "Modern yolcu feribotu"',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'ctaButtonLabel',
      title: 'Buton yazısı',
      type: 'string',
      initialValue: 'Bilet Al',
    }),
    defineField({
      name: 'whatsappMessage',
      title: 'WhatsApp ön-dolgu mesajı',
      type: 'text',
      rows: 2,
      description: '"Bilet Al" butonuna basınca WhatsApp\'a bu mesajla gidilir (boşsa otomatik bir mesaj kullanılır)',
    }),

    // Yolculuk hakkında
    defineField({
      name: 'aboutTitle',
      title: 'Açıklama başlığı',
      type: 'string',
      initialValue: 'Yolculuk Hakkında',
    }),
    defineField({
      name: 'aboutBody',
      title: 'Açıklama metni',
      type: 'array',
      of: [{ type: 'block' }],
    }),

    // Video (opsiyonel)
    defineField({
      name: 'video',
      title: 'Video',
      type: 'object',
      fields: [
        defineField({ name: 'enabled', title: 'Video Aktif mi?', type: 'boolean', initialValue: false }),
        defineField({
          name: 'type',
          title: 'Video Türü',
          type: 'string',
          options: { list: [{ title: 'YouTube', value: 'youtube' }, { title: 'Vimeo', value: 'vimeo' }] },
          initialValue: 'youtube',
          hidden: ({ parent }) => !parent?.enabled,
        }),
        defineField({
          name: 'youtubeUrl',
          title: 'YouTube Linki',
          type: 'url',
          hidden: ({ parent }) => !parent?.enabled || parent?.type !== 'youtube',
        }),
        defineField({
          name: 'vimeoUrl',
          title: 'Vimeo Linki',
          type: 'url',
          hidden: ({ parent }) => !parent?.enabled || parent?.type !== 'vimeo',
        }),
        defineField({
          name: 'caption',
          title: 'Video Başlığı / Açıklaması',
          type: 'string',
          hidden: ({ parent }) => !parent?.enabled,
        }),
      ],
    }),

    // Bilmeniz gerekenler
    defineField({
      name: 'knowBeforeYouGoTitle',
      title: '"Bilmeniz Gerekenler" başlığı',
      type: 'string',
      initialValue: 'Bilmeniz Gerekenler',
    }),
    defineField({
      name: 'knowBeforeYouGo',
      title: 'Bilmeniz gerekenler kartları',
      type: 'array',
      description: 'Örn: "Gidiş" / "Dönüş" / "Pasaport" kartları',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'title', title: 'Başlık', type: 'string' }),
            defineField({ name: 'body', title: 'Metin', type: 'text', rows: 3 }),
          ],
          preview: { select: { title: 'title', subtitle: 'body' } },
        },
      ],
    }),

    // Dahil / Dahil değil
    defineField({
      name: 'included',
      title: 'Fiyata Dahil Olanlar',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'notIncluded',
      title: 'Fiyata Dahil Olmayanlar',
      type: 'array',
      of: [{ type: 'string' }],
    }),

    // SSS
    defineField({
      name: 'faqs',
      title: 'Sık Sorulan Sorular',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'question', title: 'Soru', type: 'string', validation: (Rule) => Rule.required() }),
            defineField({ name: 'answer', title: 'Cevap', type: 'text', rows: 3, validation: (Rule) => Rule.required() }),
          ],
          preview: { select: { title: 'question' } },
        },
      ],
    }),

    defineField({
      name: 'translations',
      title: 'Çeviriler — English / Deutsch',
      type: 'object',
      description: 'Metinler; görseller ve fiyat Türkçe kayıttan gelir.',
      fields: [
        defineField({ name: 'en', title: 'English', type: 'ferryRouteTranslation' }),
        defineField({ name: 'de', title: 'Deutsch', type: 'ferryRouteTranslation' }),
      ],
    }),
  ],
  preview: {
    select: { title: 'title', route: 'routeLabel', media: 'mainImage' },
    prepare({ title, route, media }) {
      return {
        title: title ?? 'Feribot Hattı',
        subtitle: route,
        media,
      }
    },
  },
})
