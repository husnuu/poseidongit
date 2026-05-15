import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'homePage',
  title: 'Ana Sayfa',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Başlık (Internal)',
      type: 'string',
      description: 'İç kullanım için başlık',
      initialValue: 'Homepage',
      readOnly: true,
    }),
    defineField({
      name: 'seo',
      title: 'SEO Ayarları',
      type: 'object',
      description:
        'Google başlık/açıklama, sosyal paylaşım (Open Graph / Twitter) ve isteğe bağlı anahtar kelimeler. OG görsel önerisi: 1200×630 px.',
      fields: [
        defineField({
          name: 'metaTitle',
          title: 'Meta başlık',
          type: 'string',
          description: 'Arama sonuçlarında görünen başlık. Ana anahtar kelimeleri doğal kullanın (Google çoğunlukla ilk ~60 karakteri gösterir).',
          validation: (Rule) => Rule.max(70).warning('Uzun başlıklar sonuç sayfasında kesilebilir'),
        }),
        defineField({
          name: 'metaDescription',
          title: 'Meta açıklama',
          type: 'text',
          rows: 3,
          description: 'Arama snippet’i; fayda + hafif CTA (yaklaşık 150–160 karakter).',
          validation: (Rule) => Rule.max(165).warning('Çok uzun açıklamalar kısaltılabilir'),
        }),
        defineField({
          name: 'metaKeywords',
          title: 'Anahtar kelimeler (opsiyonel)',
          type: 'text',
          rows: 2,
          description: 'Virgülle ayırın. Google artık çoğu sitede bunu dikkate almaz; yine de iç yönetim ve bazı araçlar için faydalı olabilir.',
        }),
        defineField({
          name: 'ogTitle',
          title: 'OG / sosyal başlık (opsiyonel)',
          type: 'string',
          description: 'Facebook, LinkedIn vb. için farklı başlık. Boşsa meta başlık kullanılır.',
          validation: (Rule) => Rule.max(85).warning('Çok uzun başlıklar paylaşımda kesilebilir'),
        }),
        defineField({
          name: 'ogDescription',
          title: 'OG / sosyal açıklama (opsiyonel)',
          type: 'text',
          rows: 2,
          description: 'Boşsa meta açıklama kullanılır.',
          validation: (Rule) => Rule.max(200).warning('İdeal: ~110 karakter (Twitter özetları için)'),
        }),
        defineField({
          name: 'ogImage',
          title: 'OG görsel',
          type: 'image',
          description: 'Boşsa ana sayfa hero (desktop) görseli paylaşımda yedek olarak kullanılır.',
          options: {
            hotspot: true,
          },
          fields: [
            defineField({
              name: 'alt',
              title: 'Alternatif metin',
              type: 'string',
              description: 'Paylaşılan görsel için kısa açıklama (erişilebilirlik / SEO).',
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'searchForm',
      title: 'Arama formu etiketleri',
      type: 'object',
      description: 'Ana sayfa veya hero ile kullanılan arama alanlarının metinleri.',
      fields: [
        defineField({
          name: 'dailyLabel',
          title: 'Günlük sekme / mod etiketi',
          type: 'string',
          initialValue: 'Günlük',
        }),
        defineField({
          name: 'overnightLabel',
          title: 'Konaklamalı sekme / mod etiketi',
          type: 'string',
          initialValue: 'Konaklamalı',
        }),
        defineField({
          name: 'dateLabelDaily',
          title: 'Günlük tarih alanı etiketi',
          type: 'string',
          initialValue: 'Tarih',
        }),
        defineField({
          name: 'guestLabel',
          title: 'Misafir alanı etiketi',
          type: 'string',
          initialValue: 'Misafir',
        }),
      ],
    }),
    defineField({
      name: 'hero',
      title: 'Hero Bölümü',
      type: 'object',
      fields: [
        defineField({
          name: 'eyebrow',
          title: 'Üst Yazı (Eyebrow)',
          type: 'string',
          description: 'Küçük üst yazı',
        }),
        defineField({
          name: 'topBadgeText',
          title: 'Başlık Üstü Badge Metni',
          type: 'string',
          description:
            'Ana başlığın hemen üstünde küçük pill olarak görünür. Örn: "Çeşme’nin En Çok Tercih Edilen Tekne Turu"',
          validation: (Rule) => Rule.max(90),
        }),
        defineField({
          name: 'heading',
          title: 'Ana Başlık',
          type: 'string',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'subheading',
          title: 'Alt Başlık / Açıklama',
          type: 'text',
          rows: 3,
        }),
        defineField({
          name: 'primaryCta',
          title: 'Birincil CTA',
          type: 'object',
          fields: [
            defineField({
              name: 'label',
              title: 'Buton Metni',
              type: 'string',
            }),
            defineField({
              name: 'href',
              title: 'Link',
              type: 'string',
            }),
          ],
        }),
        defineField({
          name: 'secondaryCta',
          title: 'İkincil CTA',
          type: 'object',
          fields: [
            defineField({
              name: 'label',
              title: 'Buton Metni',
              type: 'string',
            }),
            defineField({
              name: 'href',
              title: 'Link',
              type: 'string',
            }),
          ],
        }),
        defineField({
          name: 'heroImage',
          title: 'Hero Görsel (Desktop)',
          type: 'image',
          options: {
            hotspot: true,
          },
          fields: [
            defineField({
              name: 'alt',
              title: 'Alternatif Metin',
              type: 'string',
            }),
          ],
        }),
        defineField({
          name: 'heroImageMobile',
          title: 'Hero Görsel (Mobil)',
          type: 'image',
          description: 'Mobil cihazlarda gösterilecek görsel (opsiyonel, yoksa desktop görseli kullanılır)',
          options: {
            hotspot: true,
          },
          fields: [
            defineField({
              name: 'alt',
              title: 'Alternatif Metin',
              type: 'string',
            }),
          ],
        }),
        defineField({
          name: 'heroBadgeEnabled',
          title: 'Hero Rozet Aktif',
          type: 'boolean',
          description: 'Hero görselinde rozet göster',
          initialValue: false,
        }),
      ],
    }),
    defineField({
      name: 'featureBar',
      title: 'Özellik Çubuğu',
      type: 'array',
      description: 'Ana sayfada gösterilecek özellikler',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'icon',
              title: 'İkon',
              type: 'string',
              options: {
                list: [
                  { title: 'Bolt (Şimşek)', value: 'bolt' },
                  { title: 'Star (Yıldız)', value: 'star' },
                  { title: 'Shield (Kalkan)', value: 'shield' },
                  { title: 'Thumbs Up (Beğeni)', value: 'thumbsUp' },
                  { title: 'Anchor (Çapa)', value: 'anchor' },
                  { title: 'Clock (Saat)', value: 'clock' },
                  { title: 'Map Pin (Konum)', value: 'mapPin' },
                  { title: 'Phone (Telefon)', value: 'phone' },
                ],
              },
            }),
            defineField({
              name: 'title',
              title: 'Başlık',
              type: 'string',
            }),
            defineField({
              name: 'description',
              title: 'Açıklama',
              type: 'string',
            }),
          ],
        },
      ],
    }),
    defineField({
      name: 'popularToursSection',
      title: 'Popüler Turlar Bölümü',
      type: 'object',
      fields: [
        defineField({
          name: 'enabled',
          title: 'Aktif',
          type: 'boolean',
          initialValue: true,
        }),
        defineField({
          name: 'title',
          title: 'Başlık',
          type: 'string',
        }),
        defineField({
          name: 'subtitle',
          title: 'Alt Başlık',
          type: 'string',
        }),
        defineField({
          name: 'items',
          title: 'Turlar',
          type: 'array',
          of: [
            {
              type: 'reference',
              to: [{ type: 'tour' }],
            },
          ],
        }),
      ],
    }),
    defineField({
      name: 'classesSection',
      title: 'Bilet Sınıfları Bölümü (Eco / Premium / First)',
      type: 'object',
      description:
        'Ana sayfada üçlü toggle ile sınıf önizlemesi. Her sınıfa açıklama, özellikler ve birden çok görsel ekleyebilirsiniz.',
      fields: [
        defineField({
          name: 'enabled',
          title: 'Aktif',
          type: 'boolean',
          initialValue: true,
        }),
        defineField({
          name: 'heading',
          title: 'Başlık',
          type: 'string',
          initialValue: 'BİLET SINIFLARI',
        }),
        defineField({
          name: 'subtitle',
          title: 'Alt başlık',
          type: 'string',
          initialValue: 'Size en uygun deneyimi seçin',
        }),
        defineField({
          name: 'items',
          title: 'Sınıflar',
          type: 'array',
          description: 'Eco, Premium ve First için içerikleri girin. Sıra göründüğü gibi kullanılır.',
          validation: (Rule) => Rule.max(3).error('En fazla 3 sınıf eklenebilir'),
          of: [
            {
              type: 'object',
              fields: [
                defineField({
                  name: 'key',
                  title: 'Sınıf',
                  type: 'string',
                  options: {
                    list: [
                      { title: 'Eco', value: 'eco' },
                      { title: 'Premium', value: 'premium' },
                      { title: 'First', value: 'first' },
                    ],
                    layout: 'radio',
                    direction: 'horizontal',
                  },
                  validation: (Rule) => Rule.required().error('Sınıf seçimi zorunludur'),
                }),
                defineField({
                  name: 'label',
                  title: 'Etiket (toggle’da görünür)',
                  type: 'string',
                  description: 'Örn: Eco / Premium / First',
                  validation: (Rule) => Rule.required().error('Etiket zorunludur'),
                }),
                defineField({
                  name: 'description',
                  title: 'Açıklama',
                  type: 'text',
                  rows: 4,
                  description: 'Sınıfı anlatan kısa metin',
                }),
                defineField({
                  name: 'bullets',
                  title: 'Sunulanlar (özellikler)',
                  type: 'array',
                  of: [{ type: 'string' }],
                }),
                defineField({
                  name: 'classImages',
                  title: 'Görseller (galeri)',
                  type: 'array',
                  description: 'Birden çok foto ekleyin; kullanıcı sol/sağ oklarla gezer.',
                  of: [
                    {
                      type: 'image',
                      options: { hotspot: true },
                      fields: [
                        { name: 'alt', type: 'string', title: 'Alternatif metin' },
                        { name: 'caption', type: 'string', title: 'Görsel altı küçük etiket (opsiyonel)' },
                      ],
                    },
                  ],
                }),
              ],
              preview: {
                select: { title: 'label', subtitle: 'key', media: 'classImages.0' },
                prepare({ title, subtitle, media }) {
                  return {
                    title: title || 'Sınıf',
                    subtitle: subtitle ? subtitle.toUpperCase() : '',
                    media,
                  }
                },
              },
            },
          ],
        }),
      ],
    }),
    defineField({
      name: 'popularYachtsSection',
      title: 'En popüler tekneler (yat kiralama)',
      type: 'object',
      fields: [
        defineField({
          name: 'enabled',
          title: 'Aktif',
          type: 'boolean',
          initialValue: true,
        }),
        defineField({
          name: 'title',
          title: 'Başlık',
          type: 'string',
          initialValue: 'En popüler tekneler',
        }),
        defineField({
          name: 'subtitle',
          title: 'Üst satır (küçük)',
          type: 'string',
          description: 'İsteğe bağlı; başlığın üstünde ince satır olarak görünür.',
        }),
        defineField({
          name: 'items',
          title: 'Yatlar',
          type: 'array',
          description:
            'Ana sayfada gösterilecek yatları sırayla seçin (yalnızca yayındaki kayıtlar sitede listelenir).',
          validation: (Rule) => Rule.max(8).error('En fazla 8 yat seçebilirsiniz'),
          of: [
            {
              type: 'reference',
              to: [{ type: 'yachtRental' }],
            },
          ],
        }),
        defineField({
          name: 'ctaButton',
          title: 'Bölüm altı link',
          type: 'object',
          fields: [
            defineField({
              name: 'label',
              title: 'Buton metni',
              type: 'string',
              initialValue: 'Tüm tekneleri gör',
            }),
            defineField({
              name: 'href',
              title: 'Link',
              type: 'string',
              initialValue: '/yat-kiralama',
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'aboutTeaser',
      title: 'Hakkımızda Önizleme',
      type: 'object',
      fields: [
        defineField({
          name: 'enabled',
          title: 'Aktif',
          type: 'boolean',
          initialValue: true,
        }),
        defineField({
          name: 'heading',
          title: 'Başlık',
          type: 'string',
        }),
        defineField({
          name: 'body',
          title: 'İçerik',
          type: 'array',
          of: [{ type: 'block' }],
        }),
        defineField({
          name: 'image',
          title: 'Görsel',
          type: 'image',
          options: {
            hotspot: true,
          },
          fields: [
            defineField({
              name: 'alt',
              title: 'Alternatif Metin',
              type: 'string',
            }),
          ],
        }),
        defineField({
          name: 'primaryCta',
          title: 'Birincil Buton',
          type: 'object',
          fields: [
            defineField({
              name: 'label',
              title: 'Buton Metni',
              type: 'string',
            }),
            defineField({
              name: 'href',
              title: 'Link',
              type: 'string',
            }),
          ],
        }),
        defineField({
          name: 'secondaryCta',
          title: 'İkincil Buton',
          type: 'object',
          fields: [
            defineField({
              name: 'label',
              title: 'Buton Metni',
              type: 'string',
            }),
            defineField({
              name: 'href',
              title: 'Link',
              type: 'string',
            }),
          ],
        }),
        // Legacy field - deprecated, use primaryCta instead
        defineField({
          name: 'cta',
          title: 'CTA (Eski - Kullanmayın)',
          type: 'object',
          description: 'Bu alan artık kullanılmıyor. Lütfen "Birincil Buton" ve "İkincil Buton" alanlarını kullanın.',
          hidden: true, // Hide from UI but keep for backward compatibility
          fields: [
            defineField({
              name: 'label',
              title: 'Buton Metni',
              type: 'string',
            }),
            defineField({
              name: 'href',
              title: 'Link',
              type: 'string',
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'blogSection',
      title: 'Blog Bölümü',
      type: 'object',
      fields: [
        defineField({
          name: 'enabled',
          title: 'Aktif',
          type: 'boolean',
          initialValue: true,
        }),
        defineField({
          name: 'heading',
          title: 'Başlık',
          type: 'string',
        }),
        defineField({
          name: 'subtitle',
          title: 'Alt Başlık',
          type: 'string',
        }),
        defineField({
          name: 'posts',
          title: 'Blog Yazıları',
          type: 'array',
          of: [
            {
              type: 'reference',
              to: [{ type: 'blog' }],
            },
          ],
        }),
        defineField({
          name: 'ctaButton',
          title: 'Tüm Yazıları Gör Butonu',
          type: 'object',
          description: 'Blog bölümü altındaki "Tüm Yazıları Gör" butonu ayarları',
          fields: [
            defineField({
              name: 'label',
              title: 'Buton Metni',
              type: 'string',
              description: 'Örn: "TÜM YAZILARI GÖR"',
              initialValue: 'TÜM YAZILARI GÖR',
            }),
            defineField({
              name: 'href',
              title: 'Link (URL)',
              type: 'string',
              description: 'Butona tıklandığında gidilecek URL (örn: /blog)',
              initialValue: '/blog',
              validation: (Rule) => Rule.required().error('Link zorunludur'),
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'ctaBand',
      title: 'CTA Bandı',
      type: 'object',
      fields: [
        defineField({
          name: 'enabled',
          title: 'Aktif',
          type: 'boolean',
          initialValue: true,
        }),
        defineField({
          name: 'heading',
          title: 'Başlık',
          type: 'string',
        }),
        defineField({
          name: 'subheading',
          title: 'Alt Başlık',
          type: 'text',
          rows: 2,
        }),
        defineField({
          name: 'ctaPrimary',
          title: 'Birincil CTA',
          type: 'object',
          fields: [
            defineField({
              name: 'label',
              title: 'Buton Metni',
              type: 'string',
            }),
            defineField({
              name: 'href',
              title: 'Link',
              type: 'string',
            }),
          ],
        }),
        defineField({
          name: 'ctaSecondary',
          title: 'İkincil CTA',
          type: 'object',
          fields: [
            defineField({
              name: 'label',
              title: 'Buton Metni',
              type: 'string',
            }),
            defineField({
              name: 'href',
              title: 'Link',
              type: 'string',
            }),
          ],
        }),
        defineField({
          name: 'background',
          title: 'Arka Plan',
          type: 'string',
          options: {
            list: [
              { title: 'Açık', value: 'light' },
              { title: 'Marka Rengi (Lacivert)', value: 'brand' },
              { title: 'Koyu', value: 'dark' },
            ],
          },
          initialValue: 'brand',
        }),
      ],
    }),
    defineField({
      name: 'instagramSection',
      title: 'Instagram Bölümü',
      type: 'object',
      fields: [
        defineField({
          name: 'enabled',
          title: 'Aktif',
          type: 'boolean',
          initialValue: true,
        }),
        defineField({
          name: 'heading',
          title: 'Başlık',
          type: 'string',
          description: 'Örn: #cesmeposeidon',
          validation: (Rule) => Rule.required().error('Başlık zorunludur'),
        }),
        defineField({
          name: 'description',
          title: 'Açıklama',
          type: 'text',
          description: 'Instagram bölümü açıklama metni',
          rows: 3,
        }),
        defineField({
          name: 'instagramUrl',
          title: 'Instagram URL',
          type: 'url',
          description: 'Instagram profil linki (örn: https://instagram.com/cesmeposeidon)',
          validation: (Rule) => Rule.required().error('Instagram URL zorunludur'),
        }),
        defineField({
          name: 'ctaText',
          title: 'CTA Metni',
          type: 'string',
          description: 'Örn: "Bizi takip et"',
          initialValue: 'Bizi takip et',
        }),
        defineField({
          name: 'autoFetch',
          title: 'Instagram\'dan Otomatik Çek',
          type: 'boolean',
          description: 'Aktif edilirse, Instagram API\'den son 4 post otomatik çekilir. Manuel post eklemeye gerek kalmaz.',
          initialValue: false,
        }),
        defineField({
          name: 'posts',
          title: 'Instagram Postları',
          type: 'array',
          description: 'Maksimum 4 Instagram post görseli',
          validation: (Rule) => Rule.max(4).error('Maksimum 4 post eklenebilir'),
          of: [
            {
              type: 'object',
              fields: [
                defineField({
                  name: 'image',
                  title: 'Görsel',
                  type: 'image',
                  description: 'Instagram post görseli',
                  options: {
                    hotspot: true,
                  },
                  validation: (Rule) => Rule.required().error('Görsel zorunludur'),
                  fields: [
                    {
                      name: 'alt',
                      type: 'string',
                      title: 'Alternatif Metin',
                    },
                  ],
                }),
                defineField({
                  name: 'postUrl',
                  title: 'Post URL',
                  type: 'url',
                  description: 'Instagram post linki',
                  validation: (Rule) => Rule.required().error('Post URL zorunludur'),
                }),
                defineField({
                  name: 'alt',
                  title: 'Alternatif Metin',
                  type: 'string',
                  description: 'Görsel için alternatif metin (image alt field\'ından öncelikli)',
                }),
              ],
              preview: {
                select: {
                  media: 'image',
                  alt: 'alt',
                },
                prepare({ media, alt }) {
                  return {
                    title: alt || 'Instagram Post',
                    media: media,
                  }
                },
              },
            },
          ],
        }),
      ],
    }),
    defineField({
      name: 'routeSection',
      title: 'Rotamız Bölümü',
      type: 'object',
      fields: [
        defineField({
          name: 'enabled',
          title: 'Aktif',
          type: 'boolean',
          initialValue: true,
        }),
        defineField({
          name: 'heading',
          title: 'Başlık',
          type: 'string',
          description: 'Örn: "Rotamız" veya "Keşfedin Çeşme\'nin En Güzel Koyları"',
          validation: (Rule) => Rule.required().error('Başlık zorunludur'),
        }),
        defineField({
          name: 'description',
          title: 'Açıklama',
          type: 'text',
          description: 'Bölüm açıklama metni',
          rows: 3,
        }),
        defineField({
          name: 'ctaButton',
          title: 'CTA Butonu',
          type: 'object',
          fields: [
            defineField({
              name: 'label',
              title: 'Buton Metni',
              type: 'string',
              description: 'Örn: "Daha fazla koy gör"',
              initialValue: 'Daha fazla koy gör',
            }),
            defineField({
              name: 'href',
              title: 'Link (URL)',
              type: 'string',
              description: 'Butona tıklandığında gidilecek URL',
              initialValue: '/turlar',
            }),
          ],
        }),
        defineField({
          name: 'locations',
          title: 'Koylar / Lokasyonlar',
          type: 'array',
          description: 'Maksimum 4 koy/lokasyon ekleyin',
          validation: (Rule) => Rule.max(4).error('Maksimum 4 lokasyon eklenebilir'),
          of: [
            {
              type: 'object',
              fields: [
                defineField({
                  name: 'name',
                  title: 'Koy/Lokasyon Adı',
                  type: 'string',
                  description: 'Örn: "Mavi Koy", "Saklı Koy"',
                  validation: (Rule) => Rule.required().error('Ad zorunludur'),
                }),
                defineField({
                  name: 'location',
                  title: 'Konum',
                  type: 'string',
                  description: 'Örn: "Çeşme", "Alaçatı"',
                  validation: (Rule) => Rule.required().error('Konum zorunludur'),
                }),
                defineField({
                  name: 'image',
                  title: 'Görsel',
                  type: 'image',
                  description: 'Koy/lokasyon görseli',
                  options: {
                    hotspot: true,
                  },
                  validation: (Rule) => Rule.required().error('Görsel zorunludur'),
                  fields: [
                    {
                      name: 'alt',
                      type: 'string',
                      title: 'Alternatif Metin',
                    },
                  ],
                }),
              ],
              preview: {
                select: {
                  title: 'name',
                  subtitle: 'location',
                  media: 'image',
                },
              },
            },
          ],
        }),
      ],
    }),
    defineField({
      name: 'loyaltyBanner',
      title: 'Sadakat Programı Görseli',
      type: 'object',
      description: 'Hakkımızda bölümünün altında tam genişlikte gösterilen görsel',
      fields: [
        defineField({
          name: 'enabled',
          title: 'Aktif',
          type: 'boolean',
          initialValue: true,
        }),
        defineField({
          name: 'image',
          title: 'Görsel',
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({
              name: 'alt',
              title: 'Alternatif Metin',
              type: 'string',
              description: 'Örn: "Poseidon Sadakat Programı"',
            }),
          ],
        }),
        defineField({
          name: 'href',
          title: 'Tıklanınca gidilecek link (opsiyonel)',
          type: 'string',
          description: 'Örn: /sadakat-programi — görsele link eklemek istersen',
        }),
      ],
    }),
    defineField({
      name: 'pageTranslations',
      title: 'Çeviriler — English / Deutsch',
      type: 'object',
      description:
        'Ana sayfa metinleri. Tur, yat ve blog kartları aynı referanslarla kalır; tur/yat içerikleri kendi belgelerindeki çevirilerle gelir. Linkleri /turlar gibi yazın (önek site ekler).',
      fields: [
        defineField({
          name: 'en',
          title: 'English',
          type: 'homePageLocaleOverlay',
        }),
        defineField({
          name: 'de',
          title: 'Deutsch',
          type: 'homePageLocaleOverlay',
        }),
      ],
    }),
    defineField({
      name: 'contactQuick',
      title: 'Hızlı İletişim',
      type: 'object',
      fields: [
        defineField({
          name: 'enabled',
          title: 'Aktif',
          type: 'boolean',
          initialValue: true,
        }),
        defineField({
          name: 'phone',
          title: 'Telefon',
          type: 'string',
        }),
        defineField({
          name: 'whatsappNumber',
          title: 'WhatsApp Numarası',
          type: 'string',
        }),
        defineField({
          name: 'email',
          title: 'E-posta',
          type: 'string',
        }),
        defineField({
          name: 'address',
          title: 'Adres',
          type: 'text',
          rows: 2,
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'hero.heading',
      subtitle: 'title',
    },
    prepare({ title, subtitle }) {
      return {
        title: title || 'Ana Sayfa',
        subtitle: subtitle || 'Homepage',
      }
    },
  },
})

