import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'siteSettings',
  title: 'Site Ayarları',
  type: 'document',
  fields: [
    // A) Genel
    defineField({
      name: 'siteName',
      title: 'Site Adı',
      type: 'string',
      description: 'Sitenin ana adı (header ve footer\'da gösterilir)',
      validation: (Rule) => Rule.required().error('Site adı zorunludur'),
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      description: 'Site logosu (header ve footer\'da kullanılır)',
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
      name: 'tagline',
      title: 'Kısa Slogan',
      type: 'string',
      description: 'Site sloganı (footer\'da gösterilir)',
    }),

    // B) Header
    defineField({
      name: 'headerNav',
      title: 'Header Menü',
      type: 'array',
      description: 'Header navigasyon menü öğeleri',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'label',
              title: 'Etiket',
              type: 'string',
              description: 'Menü öğesinin görünen metni',
              validation: (Rule) => Rule.required().error('Etiket zorunludur'),
            }),
            defineField({
              name: 'href',
              title: 'Link',
              type: 'string',
              description: 'Menü öğesinin linki (örn: /turlar, /hakkimizda)',
              validation: (Rule) => Rule.required().error('Link zorunludur'),
            }),
          ],
          preview: {
            select: {
              label: 'label',
              href: 'href',
            },
            prepare({label, href}) {
              return {
                title: label,
                subtitle: href,
              }
            },
          },
        },
      ],
    }),
    defineField({
      name: 'cta',
      title: 'Header CTA',
      type: 'object',
      description: 'Header\'daki çağrı butonu',
      fields: [
        defineField({
          name: 'text',
          title: 'Buton Metni',
          type: 'string',
          description: 'CTA butonunun görünen metni',
        }),
        defineField({
          name: 'href',
          title: 'Buton Linki',
          type: 'string',
          description: 'CTA butonunun yönlendireceği link',
        }),
      ],
    }),
    defineField({
      name: 'languages',
      title: 'Diller (eski)',
      type: 'array',
      description: 'Eski alan – artık "Header Dilleri / Bayraklar" kullanılıyor. Bu alan sadece mevcut veri uyumluluğu için tutuluyor.',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Türkçe', value: 'tr' },
          { title: 'English', value: 'en' },
          { title: 'Deutsch', value: 'de' },
        ],
      },
      hidden: true,
    }),
    defineField({
      name: 'headerLanguages',
      title: 'Header Dilleri / Bayraklar',
      type: 'array',
      description: 'Header\'da gösterilecek diller. Her biri için kod, etiket ve bayrak görseli yükleyin.',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'code',
              title: 'Dil Kodu',
              type: 'string',
              description: 'Örn: tr, en, de',
              validation: (Rule) => Rule.required().error('Dil kodu zorunludur'),
              options: {
                list: [
                  { title: 'Türkçe (tr)', value: 'tr' },
                  { title: 'English (en)', value: 'en' },
                  { title: 'Deutsch (de)', value: 'de' },
                ],
              },
            }),
            defineField({
              name: 'label',
              title: 'Görünen Ad',
              type: 'string',
              description: 'Dropdown\'da görünecek ad (örn: Türkçe, English)',
              validation: (Rule) => Rule.required().error('Etiket zorunludur'),
            }),
            defineField({
              name: 'flag',
              title: 'Bayrak Görseli',
              type: 'image',
              description: 'Küçük kare bayrak ikonu (örn. 40x40 px). Yüklemezseniz emoji kullanılır.',
              options: { hotspot: true },
            }),
          ],
          preview: {
            select: { code: 'code', label: 'label' },
            prepare({ code, label }) {
              return { title: label || code, subtitle: code }
            },
          },
        },
      ],
      initialValue: [
        { code: 'tr', label: 'Türkçe' },
        { code: 'en', label: 'English' },
        { code: 'de', label: 'Deutsch' },
      ],
    }),

    // C) Footer
    defineField({
      name: 'footerNav',
      title: 'Footer Menü',
      type: 'array',
      description: 'Footer navigasyon menü öğeleri',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'label',
              title: 'Etiket',
              type: 'string',
              validation: (Rule) => Rule.required().error('Etiket zorunludur'),
            }),
            defineField({
              name: 'href',
              title: 'Link',
              type: 'string',
              validation: (Rule) => Rule.required().error('Link zorunludur'),
            }),
          ],
          preview: {
            select: {
              label: 'label',
              href: 'href',
            },
            prepare({label, href}) {
              return {
                title: label,
                subtitle: href,
              }
            },
          },
        },
      ],
    }),
    defineField({
      name: 'legalNav',
      title: 'Yasal Linkler',
      type: 'array',
      description: 'Footer\'daki yasal sayfa linkleri (Gizlilik Politikası, Kullanım Şartları, vb.)',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'label',
              title: 'Etiket',
              type: 'string',
              validation: (Rule) => Rule.required().error('Etiket zorunludur'),
            }),
            defineField({
              name: 'href',
              title: 'Link',
              type: 'string',
              validation: (Rule) => Rule.required().error('Link zorunludur'),
            }),
          ],
          preview: {
            select: {
              label: 'label',
              href: 'href',
            },
            prepare({label, href}) {
              return {
                title: label,
                subtitle: href,
              }
            },
          },
        },
      ],
    }),
    defineField({
      name: 'contactInfo',
      title: 'İletişim Bilgileri',
      type: 'object',
      description: 'Footer\'da gösterilecek iletişim bilgileri',
      fields: [
        defineField({
          name: 'phone',
          title: 'Telefon',
          type: 'string',
          description: 'Telefon numarası',
        }),
        defineField({
          name: 'whatsapp',
          title: 'WhatsApp',
          type: 'string',
          description: 'WhatsApp numarası (örn: +90 555 123 4567)',
        }),
        defineField({
          name: 'email',
          title: 'E-posta',
          type: 'string',
          description: 'E-posta adresi',
          validation: (Rule) => Rule.email().error('Geçerli bir e-posta adresi giriniz'),
        }),
        defineField({
          name: 'address',
          title: 'Adres',
          type: 'text',
          description: 'Fiziksel adres',
          rows: 2,
        }),
      ],
    }),
    defineField({
      name: 'socialLinks',
      title: 'Sosyal Medya',
      type: 'array',
      description: 'Sosyal medya hesapları (footer\'da gösterilir)',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'platform',
              title: 'Platform',
              type: 'string',
              description: 'Sosyal medya platformu',
              options: {
                list: [
                  {title: 'Instagram', value: 'Instagram'},
                  {title: 'TikTok', value: 'TikTok'},
                  {title: 'YouTube', value: 'YouTube'},
                  {title: 'Facebook', value: 'Facebook'},
                  {title: 'X (Twitter)', value: 'X'},
                ],
              },
              validation: (Rule) => Rule.required().error('Platform seçimi zorunludur'),
            }),
            defineField({
              name: 'href',
              title: 'Link',
              type: 'url',
              description: 'Sosyal medya hesabı linki',
              validation: (Rule) => Rule.required().error('Link zorunludur'),
            }),
          ],
          preview: {
            select: {
              platform: 'platform',
              href: 'href',
            },
            prepare({platform, href}) {
              return {
                title: platform,
                subtitle: href,
              }
            },
          },
        },
      ],
    }),
  ],
  preview: {
    select: {
      siteName: 'siteName',
      media: 'logo',
    },
    prepare({siteName, media}) {
      return {
        title: siteName || 'Site Ayarları',
        media: media,
      }
    },
  },
})


