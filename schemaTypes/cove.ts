import { defineArrayMember, defineField, defineType } from 'sanity'

/** Koy detay sayfasındaki aktivite rozetleri — değerler sabit anahtar; etiket
    ve ikon sitede dile göre üretilir (Sanity'de çeviri gerekmez). */
export const COVE_ACTIVITY_OPTIONS = [
  { title: 'Yüzme', value: 'swim' },
  { title: 'Şnorkel', value: 'snorkel' },
  { title: 'Tüplü dalış', value: 'dive' },
  { title: 'Fotoğraf', value: 'photo' },
  { title: 'Güneşlenme', value: 'sunbathe' },
  { title: 'Balık gözlemi', value: 'fish' },
  { title: 'Kayadan atlama', value: 'cliffjump' },
  { title: 'Doğa yürüyüşü', value: 'hike' },
]

export default defineType({
  name: 'cove',
  title: 'Koy',
  type: 'document',
  groups: [
    { name: 'general', title: 'Genel', default: true },
    { name: 'detail', title: 'Detay sayfası' },
    { name: 'seo', title: 'SEO' },
    { name: 'translations', title: 'Çeviriler' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Başlık',
      type: 'string',
      group: 'general',
      validation: (Rule) => Rule.required().error('Başlık zorunludur'),
    }),
    defineField({
      name: 'slug',
      title: 'URL (Slug)',
      type: 'slug',
      group: 'general',
      description: 'Koy sayfasının adresi: /koylar/<slug>',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required().error('Slug zorunludur'),
    }),
    defineField({
      name: 'description',
      title: 'Kısa açıklama',
      type: 'text',
      group: 'general',
      description: '2–4 cümle. Koylar listesindeki kartta ve koy sayfasının girişinde gösterilir.',
      rows: 4,
    }),
    defineField({
      name: 'image',
      title: 'Kapak görseli',
      type: 'image',
      group: 'general',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alternatif Metin',
        },
      ],
    }),
    defineField({
      name: 'order',
      title: 'Sıra',
      type: 'number',
      group: 'general',
      description: 'Liste sıralaması (küçük önce)',
    }),
    defineField({
      name: 'locationTag',
      title: 'Konum etiketi',
      type: 'string',
      group: 'general',
      description: 'Örn: "Çeşme / Eşek Adası"',
    }),

    // ── Detay sayfası ──────────────────────────────────────────────────────
    defineField({
      name: 'content',
      title: 'Detaylı içerik',
      type: 'array',
      group: 'detail',
      description:
        'Koy sayfasındaki uzun metin (tarihçe, deniz, neler yapılır…). SEO için 300+ kelime ve ara başlıklar (H2/H3) önerilir.',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'Başlık 2', value: 'h2' },
            { title: 'Başlık 3', value: 'h3' },
          ],
          lists: [
            { title: 'Madde', value: 'bullet' },
            { title: 'Numaralı', value: 'number' },
          ],
        }),
      ],
    }),
    defineField({
      name: 'gallery',
      title: 'Galeri',
      type: 'array',
      group: 'detail',
      description: 'Koy sayfasında kapak görselinin altında gösterilir (4–8 fotoğraf önerilir).',
      options: { layout: 'grid' },
      of: [
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
          fields: [{ name: 'alt', type: 'string', title: 'Alternatif Metin' }],
        }),
      ],
    }),
    defineField({
      name: 'highlights',
      title: 'Öne çıkanlar',
      type: 'array',
      group: 'detail',
      description: 'Kısa maddeler. Örn: "Turkuaz, sığ ve berrak su", "Rüzgardan korunaklı".',
      of: [defineArrayMember({ type: 'string' })],
    }),
    defineField({
      name: 'activities',
      title: 'Yapılabilecek aktiviteler',
      type: 'array',
      group: 'detail',
      of: [defineArrayMember({ type: 'string' })],
      options: { list: COVE_ACTIVITY_OPTIONS, layout: 'grid' },
    }),
    defineField({
      name: 'travelTime',
      title: 'Limandan ulaşım',
      type: 'string',
      group: 'detail',
      description: 'Örn: "Çeşme limanından tekneyle yaklaşık 40 dakika"',
    }),
    defineField({
      name: 'bestTime',
      title: 'En iyi ziyaret zamanı',
      type: 'string',
      group: 'detail',
      description: 'Örn: "Haziran – Eylül, öğleden önce"',
    }),
    defineField({
      name: 'location',
      title: 'Harita konumu',
      type: 'geopoint',
      group: 'detail',
      description: 'Enlem/boylam. Doldurulursa koy sayfasında harita gösterilir (Google Maps\'te koya sağ tıklayıp koordinatı kopyalayabilirsiniz).',
    }),
    defineField({
      name: 'faqs',
      title: 'Sık sorulan sorular',
      type: 'array',
      group: 'detail',
      description: 'Koy sayfasında SSS olarak gösterilir ve Google için yapılandırılmış veri (FAQPage) üretir.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'coveFaq',
          fields: [
            defineField({ name: 'question', title: 'Soru', type: 'string', validation: (Rule) => Rule.required() }),
            defineField({ name: 'answer', title: 'Cevap', type: 'text', rows: 3, validation: (Rule) => Rule.required() }),
          ],
          preview: { select: { title: 'question', subtitle: 'answer' } },
        }),
      ],
    }),
    defineField({
      name: 'relatedTours',
      title: 'Bu koya uğrayan turlar',
      type: 'array',
      group: 'detail',
      description: 'Koy sayfasının altında tur kartları olarak gösterilir.',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'tour' }] })],
    }),

    // ── SEO ────────────────────────────────────────────────────────────────
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      group: 'seo',
      description: 'Boş bırakılırsa başlık ve kısa açıklama kullanılır.',
      fields: [
        defineField({
          name: 'metaTitle',
          title: 'Meta başlık',
          type: 'string',
          description: '50–60 karakter önerilir. Örn: "Eşek Adası Çeşme — Tekne Turu ile Koylar"',
          validation: (Rule) => Rule.max(70).warning('70 karakteri geçmemesi önerilir'),
        }),
        defineField({
          name: 'metaDescription',
          title: 'Meta açıklama',
          type: 'text',
          rows: 3,
          description: '150–160 karakter önerilir.',
          validation: (Rule) => Rule.max(170).warning('160 karakter civarı önerilir'),
        }),
        defineField({
          name: 'ogImage',
          title: 'Paylaşım görseli (OG)',
          type: 'image',
          description: 'Sosyal medyada paylaşıldığında görünen görsel. Boşsa kapak görseli kullanılır.',
          options: { hotspot: true },
        }),
      ],
    }),

    defineField({
      name: 'translations',
      title: 'Çeviriler — English / Deutsch / Русский',
      type: 'object',
      group: 'translations',
      description:
        'Boş bırakılan alanlar sitede otomatik çevrilir; elle girilen çeviri her zaman önceliklidir. Görseller Türkçe kayıttan gelir.',
      fields: [
        defineField({ name: 'en', title: 'English', type: 'coveTranslation' }),
        defineField({ name: 'de', title: 'Deutsch', type: 'coveTranslation' }),
        defineField({ name: 'ru', title: 'Русский', type: 'coveTranslation' }),
      ],
    }),
  ],
  preview: {
    select: { title: 'title', order: 'order', media: 'image' },
    prepare({ title, order, media }) {
      return {
        title: title ?? 'Koy',
        subtitle: order != null ? `Sıra: ${order}` : undefined,
        media,
      }
    },
  },
})
