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
      name: 'favicon',
      title: 'Favicon',
      type: 'image',
      description: 'Tarayıcı sekmesi ikonu (favicon). Önerilen: 32×32 veya 48×48 px, PNG/ICO.',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'richResultsImages',
      title: 'Zengin sonuç (JSON-LD) görselleri',
      type: 'array',
      description:
        'Google TravelAgency şemasındaki "image" listesi. Buraya yükleyin; boşsa ana sayfa hero + aşağıdaki public/ yedekleri kullanılır.',
      of: [
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({
              name: 'alt',
              type: 'string',
              title: 'Alternatif metin',
            }),
          ],
        },
      ],
      validation: (Rule) => Rule.max(4),
    }),
    defineField({
      name: 'tagline',
      title: 'Kısa Slogan',
      type: 'string',
      description: 'Site sloganı (footer\'da gösterilir)',
    }),

    // SEO (varsayılan – tüm sayfalarda kullanılır, sayfa kendi SEO’sunu tanımlamazsa)
    defineField({
      name: 'seo',
      title: 'SEO (Varsayılan)',
      type: 'object',
      description: 'Site genelinde varsayılan sayfa başlığı ve meta açıklaması. Ana sayfa ve diğer sayfalarda kendi SEO alanı yoksa bunlar kullanılır.',
      fields: [
        defineField({
          name: 'metaTitle',
          title: 'Varsayılan Sayfa Başlığı',
          type: 'string',
          description: 'Örn: Tekne Turu | Çeşme Adalar ve Koylar. Anahtar kelimeleri doğal kullanın; tıklanabilir ve açıklayıcı olsun (≈50–60 karakter).',
          validation: (Rule) => Rule.max(70).warning('Google genelde ilk ~60 karakteri gösterir'),
        }),
        defineField({
          name: 'metaDescription',
          title: 'Varsayılan Meta Açıklaması',
          type: 'text',
          rows: 3,
          description: 'Arama sonuçlarında görünecek kısa açıklama. Anahtar kelimeleri doğal kullanın (≈150–160 karakter).',
          validation: (Rule) => Rule.max(165).warning('Google genelde ~160 karaktere kadar gösterir'),
        }),
      ],
    }),

    // B) Header
    defineField({
      name: 'headerNav',
      title: 'Header Menü',
      type: 'array',
      description:
        'Üst menü satırları. Türkçe etiket varsayılandır; English / Deutsch alanları doluysa /en ve /de sitede o dilde görünür, boşsa Türkçe metin kullanılır.',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'label',
              title: 'Menü yazısı (Türkçe)',
              type: 'string',
              description: 'Varsayılan metin (Türkçe site ve çevirisi girilmemiş diller için).',
              validation: (Rule) => Rule.required().error('Türkçe etiket zorunludur'),
            }),
            defineField({
              name: 'labelEn',
              title: 'Menü yazısı (English)',
              type: 'string',
              description: '/en/… adresinde header’da gösterilir. Boşsa Türkçe etiket kullanılır.',
            }),
            defineField({
              name: 'labelDe',
              title: 'Menü yazısı (Deutsch)',
              type: 'string',
              description: '/de/… adresinde header’da gösterilir. Boşsa Türkçe etiket kullanılır.',
            }),
            defineField({
              name: 'href',
              title: 'Link',
              type: 'string',
              description: 'İç sayfa yolu (örn: /turlar, /blog, /contact). /en veya /de yazmayın; site dile göre otomatik ekler.',
              validation: (Rule) => Rule.required().error('Link zorunludur'),
            }),
          ],
          preview: {
            select: {
              label: 'label',
              href: 'href',
              labelEn: 'labelEn',
              labelDe: 'labelDe',
            },
            prepare({label, href, labelEn, labelDe}) {
              const bits: string[] = [typeof href === 'string' ? href : '']
              if (labelEn?.trim()) bits.push(`EN: ${labelEn.trim()}`)
              if (labelDe?.trim()) bits.push(`DE: ${labelDe.trim()}`)
              return {
                title: label || 'Menü',
                subtitle: bits.filter(Boolean).join(' · '),
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
          title: 'Buton Metni (Türkçe)',
          type: 'string',
          description: 'CTA butonunun görünen metni',
        }),
        defineField({
          name: 'textEn',
          title: 'Buton metni (English)',
          type: 'string',
        }),
        defineField({
          name: 'textDe',
          title: 'Buton metni (Deutsch)',
          type: 'string',
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
      name: 'announcementBar',
      title: 'Üst duyuru çubuğu',
      type: 'object',
      description:
        'Header’ın üzerinde tam genişlikte lacivert şerit (isteğe bağlı). Kampanya, önemli haber veya uyarı için. Metin (English) ve Metin (Deutsch) doldurulursa /en ve /de sitede o dilde gösterilir; boşsa Türkçe metne düşülür.',
      fields: [
        defineField({
          name: 'enabled',
          title: 'Göster',
          type: 'boolean',
          description: 'Açıkken şerit tüm dillerde header üstünde görünür (metin, aşağıdaki alanlara göre seçilir).',
          initialValue: false,
        }),
        defineField({
          name: 'text',
          title: 'Metin (Türkçe)',
          type: 'string',
          description: 'Ana site (TR) ve yabancı metin boşsa yedek olarak kullanılır. Beyaz renkte, kısa tutun.',
          validation: (Rule) =>
            Rule.custom((text, context) => {
              const parent = context.parent as { enabled?: boolean }
              if (parent?.enabled && (!text || !String(text).trim())) {
                return 'Duyuru açıkken metin girilmelidir'
              }
              return true
            }),
        }),
        defineField({
          name: 'textEn',
          title: 'Metin (English)',
          type: 'string',
          description: '/en/… adreslerinde gösterilir. Boş bırakılırsa Türkçe metin kullanılır.',
        }),
        defineField({
          name: 'textDe',
          title: 'Metin (Deutsch)',
          type: 'string',
          description: '/de/… adreslerinde gösterilir. Boş bırakılırsa Türkçe metin kullanılır.',
        }),
        defineField({
          name: 'icon',
          title: 'İkon',
          type: 'string',
          description: 'Şeridin solunda gösterilecek ikon',
          options: {
            list: [
              { title: 'Yok', value: 'none' },
              { title: 'Megafon', value: 'megaphone' },
              { title: 'Bilgi', value: 'info' },
              { title: 'Zil', value: 'bell' },
              { title: 'Yıldız / parıltı', value: 'sparkles' },
              { title: 'Etiket', value: 'tag' },
              { title: 'İndirim / yüzde', value: 'percent' },
              { title: 'Çapa', value: 'anchor' },
              { title: 'Takvim', value: 'calendar' },
              { title: 'Gemi', value: 'ship' },
              { title: 'Yıldız', value: 'star' },
            ],
            layout: 'dropdown',
          },
          initialValue: 'megaphone',
        }),
        defineField({
          name: 'linkUrl',
          title: 'İsteğe bağlı link',
          type: 'string',
          description:
            'Doldurursanız şerit tıklanabilir olur (örn. /turlar veya https://...). Boş bırakırsanız sadece metin gösterilir.',
        }),
      ],
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
            defineField({
              name: 'comingSoon',
              title: 'Yakında (dil henüz yayında değil)',
              type: 'boolean',
              description:
                'Açıkken bu dil menüde görünür ama seçilemez; yayına aldığınızda kapatın.',
              initialValue: false,
            }),
            defineField({
              name: 'comingSoonBadge',
              title: 'Yakında rozeti (görsel)',
              type: 'image',
              description:
                'Örn. “Yakında” şeritli PNG/SVG. Boş bırakırsanız kısa metin gösterilir.',
              options: { hotspot: true },
              hidden: ({ parent }) => !parent?.comingSoon,
            }),
          ],
          preview: {
            select: { code: 'code', label: 'label', comingSoon: 'comingSoon' },
            prepare({ code, label, comingSoon }) {
              return {
                title: label || code,
                subtitle: comingSoon ? `${code} · Yakında` : code,
              }
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
              title: 'Etiket (Türkçe)',
              type: 'string',
              validation: (Rule) => Rule.required().error('Etiket zorunludur'),
            }),
            defineField({
              name: 'labelEn',
              title: 'Etiket (English)',
              type: 'string',
            }),
            defineField({
              name: 'labelDe',
              title: 'Etiket (Deutsch)',
              type: 'string',
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
              title: 'Etiket (Türkçe)',
              type: 'string',
              validation: (Rule) => Rule.required().error('Etiket zorunludur'),
            }),
            defineField({
              name: 'labelEn',
              title: 'Etiket (English)',
              type: 'string',
            }),
            defineField({
              name: 'labelDe',
              title: 'Etiket (Deutsch)',
              type: 'string',
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
      name: 'cookiePolicyPage',
      title: 'Çerez politikası sayfası',
      type: 'reference',
      to: [{type: 'legalPage'}],
      description:
        'Çerez bildirimindeki "Çerez politikamızı okuyun" linki. Yasal Sayfa seçin (örn. Çerez Politikası). Boş bırakılırsa site varsayılanı veya NEXT_PUBLIC_COOKIE_POLICY_PATH kullanılır.',
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
          description:
            'Ülke kodu ile numara (örn: +90 555 123 4567). Sağ alttaki sabit WhatsApp butonu ve wa.me bağlantısı bu numarayı kullanır.',
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


